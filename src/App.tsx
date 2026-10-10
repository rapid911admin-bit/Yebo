import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Users,
  MessageSquare,
  Plus,
  Shield,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  Edit,
  Eye,
  Trash2,
  Share2,
  Database,
  LogIn,
  LogOut,
  ScanFace,
  Sparkles,
  Check,
  Copy,
  Clock,
  QrCode,
  KeyRound,
  Info,
  Phone,
  MessageCircle,
  Upload,
  UserCheck,
  UserX,
  UserPlus,
  Link,
  Unlink,
  AlertCircle,
  Building2,
  ShieldCheck,
  ArrowLeft,
  Search,
  Filter,
  Globe,
  MapPin,
  Mail,
  FolderPlus,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Menu,
  X,
  BookOpen,
  HelpCircle,
  Printer,
} from 'lucide-react';

import { BusinessCard, Company, LeadInquiry, User } from './types';
import { INITIAL_COMPANIES, INITIAL_CARDS, INITIAL_USERS, INITIAL_LEADS } from './data/defaultCards';
import { CardView } from './components/CardView';
import { CardEditor } from './components/CardEditor';
import { AdminMembers } from './components/AdminMembers';
import { LeadsManager } from './components/LeadsManager';
import { AuthModal } from './components/AuthModal';
import { AdminLoginView } from './components/AdminLoginView';
import { AllocateCardModal } from './components/AllocateCardModal';
import { IssueEmployeeCardModal } from './components/IssueEmployeeCardModal';
import { CompanyModal } from './components/CompanyModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { ThemeToggle } from './components/ThemeToggle';
import { PrintBusinessCardsModal } from './components/PrintBusinessCardsModal';
import { useTheme } from './context/ThemeContext';
import {
  dbFetchCards,
  dbSaveCard,
  dbDeleteCard,
  dbIncrementCardMetric,
  dbFetchUsers,
  dbSaveUser,
  dbDeleteUser,
  dbFetchLeads,
  dbSaveLead,
  dbUpdateLeadStatus,
  dbDeleteLead,
  seedCentralDatabaseIfNeeded,
  dbFetchCardBySlugOrId,
  subscribeToCentralDatabase,
  dbFetchCompanies,
  dbSaveCompanies,
} from './lib/neon';
import {
  idbSet,
  idbGet,
  idbDelete,
  safeLocalStorageSet,
  safeLocalStorageGet,
  cleanupBloatedLocalStorage,
  restoreCardMediaAssets,
  deduplicateById,
} from './utils/storage';

// Run storage cleanup immediately on module evaluation
cleanupBloatedLocalStorage();

function getDeletedUserIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem('yebo_deleted_user_ids') || '[]');
  } catch {
    return [];
  }
}

function getDeletedCardIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem('yebo_deleted_card_ids') || '[]');
  } catch {
    return [];
  }
}

function markCardAsDeleted(cardId: string): void {
  try {
    const current = getDeletedCardIds();
    if (!current.includes(cardId)) {
      localStorage.setItem('yebo_deleted_card_ids', JSON.stringify([...current, cardId]));
    }
  } catch (e) {
    console.warn('Failed to mark card as deleted:', e);
  }
}

function unmarkCardAsDeleted(cardId: string): void {
  try {
    const current = getDeletedCardIds();
    localStorage.setItem('yebo_deleted_card_ids', JSON.stringify(current.filter((id) => id !== cardId)));
  } catch (e) {
    console.warn('Failed to unmark card from deleted list:', e);
  }
}

export default function App() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Persistence state for companies
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = safeLocalStorageGet('yebocompanies_data');
      return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_COMPANIES;
    } catch {
      return INITIAL_COMPANIES;
    }
  });

  // Persistence state for cards (filtered against deletedCardIds)
  const [cards, setCards] = useState<BusinessCard[]>(() => {
    try {
      const deletedIds = getDeletedCardIds();
      const saved = safeLocalStorageGet('yebocards_data');
      const list = saved ? (deduplicateById(JSON.parse(saved)) as BusinessCard[]) : INITIAL_CARDS;
      return list.filter((c) => !deletedIds.includes(c.id));
    } catch {
      return INITIAL_CARDS.filter((c) => !getDeletedCardIds().includes(c.id));
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const deletedIds = getDeletedUserIds();
      const saved = safeLocalStorageGet('yebousers_data');
      const list = saved ? (deduplicateById(JSON.parse(saved)) as User[]) : INITIAL_USERS;
      return list.filter((u) => !deletedIds.includes(u.id));
    } catch {
      return INITIAL_USERS.filter((u) => !getDeletedUserIds().includes(u.id));
    }
  });

  const [leads, setLeads] = useState<LeadInquiry[]>(() => {
    try {
      const saved = safeLocalStorageGet('yeboleads_data');
      return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  // Track whether initial high-capacity storage hydration has completed
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // Current logged in administrator (must be logged in before accessing the system)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedSession = localStorage.getItem('yebo_admin_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.role === 'admin') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
    return null;
  });

  // Active view: 'dashboard' | 'editor' | 'members' | 'leads' | 'preview_standalone'
  const [activeView, setActiveView] = useState<'dashboard' | 'editor' | 'members' | 'leads' | 'preview_standalone'>(() => {
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const cardMatch = path.match(/\/card\/([a-zA-Z0-9_-]+)/);
      const paramSlug = searchParams.get('card') || searchParams.get('slug');
      const hashMatch = hash.match(/#\/?card\/([a-zA-Z0-9_-]+)/);
      if (cardMatch || paramSlug || hashMatch) {
        return 'preview_standalone';
      }
    } catch {
      // ignore
    }
    return 'dashboard';
  });
  
  // Navigation inside company hierarchy:
  // selectedCompanyId === null -> Main Home Page (Company Directory only)
  // selectedCompanyId !== null -> Inside a Company Workspace (Cards, Details, Editing)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Selected card for preview or editing inside a company
  const [selectedCardId, setSelectedCardId] = useState<string>(() => {
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const cardMatch = path.match(/\/card\/([a-zA-Z0-9_.-]+)/);
      const paramSlug = searchParams.get('card') || searchParams.get('slug') || searchParams.get('id');
      const hashMatch = hash.match(/#\/?card\/([a-zA-Z0-9_.-]+)/);
      const targetSlug = cardMatch?.[1] || paramSlug || hashMatch?.[1];
      if (targetSlug) {
        const norm = targetSlug.toLowerCase().trim();
        const cleanNorm = norm.replace(/[^a-z0-9]/g, '');
        const saved = safeLocalStorageGet('yebocards_data');
        const list: BusinessCard[] = saved ? JSON.parse(saved) : INITIAL_CARDS;
        const found = list.find(
          (c) =>
            c.id === targetSlug ||
            c.slug.toLowerCase().trim() === norm ||
            c.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNorm
        );
        if (found) return found.id;
        const initFound = INITIAL_CARDS.find(
          (c) =>
            c.id === targetSlug ||
            c.slug.toLowerCase().trim() === norm ||
            c.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNorm
        );
        if (initFound) return initFound.id;
        return targetSlug;
      }
    } catch {
      // ignore
    }
    return INITIAL_CARDS[0]?.id || '';
  });
  const [editingCard, setEditingCard] = useState<BusinessCard | null>(null);

  // Company Workspace tab: 'allocated' | 'employees' | 'template' | 'cards'
  const [companyWorkspaceTab, setCompanyWorkspaceTab] = useState<'allocated' | 'employees' | 'template' | 'cards'>('allocated');
  const [showLinkEmployeeModal, setShowLinkEmployeeModal] = useState<boolean>(false);
  const [linkEmployeeSearch, setLinkEmployeeSearch] = useState<string>('');

  // Modals & form states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIssueEmployeeModal, setShowIssueEmployeeModal] = useState(false);
  const [issueCardTargetUser, setIssueCardTargetUser] = useState<User | null>(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateModalMode, setAllocateModalMode] = useState<'single' | 'bulk'>('single');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [cardToAllocate, setCardToAllocate] = useState<BusinessCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<BusinessCard | null>(null);
  const [showOnboardingWizardModal, setShowOnboardingWizardModal] = useState<boolean>(false);
  const [showHelpGuideModal, setShowHelpGuideModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [cardToPrint, setCardToPrint] = useState<BusinessCard | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [dbOnline, setDbOnline] = useState<boolean>(true);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Search & Filter state for companies home page
  const [searchCompanyQuery, setSearchCompanyQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const lastSyncTimestampRef = useRef<number>(0);

  // Master Central Database Synchronization (Non-destructive local-first merge)
  const syncCentralDatabase = useCallback(async (isManual = false) => {
    const now = Date.now();
    if (!isManual && now - lastSyncTimestampRef.current < 8000) {
      return; // Skip rapid duplicates within 8s to stay super fast
    }
    lastSyncTimestampRef.current = now;
    setIsSyncingDb(true);
    try {
      // Fetch all entities from Central DB in parallel for maximum speed
      const [realCompanies, realCards, realUsers, realLeads] = await Promise.all([
        dbFetchCompanies(),
        dbFetchCards(),
        dbFetchUsers(),
        dbFetchLeads(),
      ]);

      // 1. Merge companies safely
      if (realCompanies && realCompanies.length > 0) {
        setCompanies((prevLocal) => {
          const merged = new Map<string, Company>();
          for (const c of realCompanies) merged.set(c.id, c);
          for (const l of prevLocal) {
            const remote = merged.get(l.id);
            if (!remote) {
              merged.set(l.id, l);
              dbSaveCompanies([l]).catch(console.warn);
            } else {
              const localTime = new Date(l.updatedAt || l.createdAt || 0).getTime();
              const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();
              if (localTime > remoteTime) {
                merged.set(l.id, l);
                dbSaveCompanies([l]).catch(console.warn);
              }
            }
          }
          const result = deduplicateById(Array.from(merged.values()));
          const prevKey = prevLocal.map((c) => `${c.id}_${c.updatedAt || ''}`).join('|');
          const nextKey = result.map((c) => `${c.id}_${c.updatedAt || ''}`).join('|');
          if (prevKey === nextKey && prevLocal.length === result.length) {
            return prevLocal;
          }
          safeLocalStorageSet('yebocompanies_data', JSON.stringify(result));
          return result;
        });
      }

      // 2. Merge cards safely
      if (realCards) {
        const deletedCardIds = getDeletedCardIds();
        const activeRealCards = realCards.filter(
          (c) => !deletedCardIds.includes(c.id) && c.slug !== 'system-companies-registry'
        );
        setCards((prevLocal) => {
          const merged = new Map<string, BusinessCard>();
          for (const c of activeRealCards) merged.set(c.id, c);
          for (const l of prevLocal) {
            if (deletedCardIds.includes(l.id)) continue;
            const remote = merged.get(l.id);
            if (!remote) {
              merged.set(l.id, l);
              dbSaveCard(l).catch(console.warn);
            } else {
              const localTime = new Date(l.updatedAt || l.createdAt || 0).getTime();
              const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();
              if (localTime >= remoteTime - 1000) {
                merged.set(l.id, l);
                dbSaveCard(l).catch(console.warn);
              } else {
                const safeMerged: BusinessCard = {
                  ...l,
                  ...remote,
                  logoUrl: remote.logoUrl || l.logoUrl || '',
                  banners: remote.banners && remote.banners.length > 0 ? remote.banners : l.banners,
                  galleryImages: remote.galleryImages && remote.galleryImages.length > 0 ? remote.galleryImages : l.galleryImages,
                  aboutText: remote.aboutText || l.aboutText,
                  services: remote.services && remote.services.length > 0 ? remote.services : l.services,
                  updatedAt: remote.updatedAt || l.updatedAt || new Date().toISOString(),
                };
                merged.set(l.id, safeMerged);
              }
            }
          }
          const result = deduplicateById(Array.from(merged.values()));
          const prevKey = prevLocal.map((c) => `${c.id}_${c.updatedAt || ''}`).join('|');
          const nextKey = result.map((c) => `${c.id}_${c.updatedAt || ''}`).join('|');
          if (prevKey === nextKey && prevLocal.length === result.length) {
            return prevLocal;
          }
          safeLocalStorageSet('yebocards_data', JSON.stringify(result));
          return result;
        });
      }

      // 3. Merge users safely
      if (realUsers && realUsers.length > 0) {
        const deletedIds = getDeletedUserIds();
        const activeRealUsers = realUsers.filter((u) => !deletedIds.includes(u.id));
        setUsers((prevLocal) => {
          const merged = new Map<string, User>();
          for (const u of activeRealUsers) merged.set(u.id, u);
          for (const l of prevLocal) {
            if (deletedIds.includes(l.id)) continue;
            const remote = merged.get(l.id);
            if (!remote) {
              merged.set(l.id, l);
              dbSaveUser(l).catch(console.warn);
            } else {
              const localTime = new Date(l.updatedAt || l.createdAt || 0).getTime();
              const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();
              if (localTime >= remoteTime - 2000) {
                const mergedUser: User = {
                  ...remote,
                  ...l,
                  name: l.name || remote.name,
                  email: l.email || remote.email,
                  designation: l.designation !== undefined ? l.designation : remote.designation,
                  phone: l.phone !== undefined ? l.phone : remote.phone,
                  avatarUrl: l.avatarUrl !== undefined ? l.avatarUrl : remote.avatarUrl,
                  companyId: l.companyId !== undefined ? l.companyId : remote.companyId,
                  assignedCardId: l.assignedCardId,
                  bio: l.bio || remote.bio,
                  updatedAt: l.updatedAt || remote.updatedAt || new Date().toISOString(),
                };
                merged.set(l.id, mergedUser);
                dbSaveUser(mergedUser).catch(console.warn);
              } else {
                const safeMerged: User = {
                  ...remote,
                  avatarUrl: remote.avatarUrl || l.avatarUrl,
                  phone: remote.phone || l.phone,
                  designation: remote.designation || l.designation,
                  assignedCardId: remote.assignedCardId !== undefined ? remote.assignedCardId : l.assignedCardId,
                  companyId: remote.companyId || l.companyId,
                  bio: remote.bio || l.bio,
                };
                merged.set(l.id, safeMerged);
              }
            }
          }
          const mergedUsers = deduplicateById(Array.from(merged.values()));
          setCurrentUser((prev) => {
            if (!prev) return null;
            const freshSelf = mergedUsers.find(
              (u) => (u.id === prev.id || u.email.toLowerCase() === prev.email.toLowerCase()) && u.role === 'admin'
            );
            return freshSelf || prev;
          });
          const prevKey = prevLocal.map((u) => `${u.id}_${u.updatedAt || ''}`).join('|');
          const nextKey = mergedUsers.map((u) => `${u.id}_${u.updatedAt || ''}`).join('|');
          if (prevKey === nextKey && prevLocal.length === mergedUsers.length) {
            return prevLocal;
          }
          safeLocalStorageSet('yebousers_data', JSON.stringify(mergedUsers));
          return mergedUsers;
        });
      }

      // 4. Merge leads safely
      if (realLeads) {
        setLeads((prevLocal) => {
          const map = new Map<string, LeadInquiry>();
          for (const r of realLeads) map.set(r.id, r);
          for (const l of prevLocal) {
            if (!map.has(l.id)) {
              map.set(l.id, l);
              dbSaveLead(l).catch(console.warn);
            }
          }
          const sorted = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          if (sorted.length === prevLocal.length) {
            return prevLocal;
          }
          return sorted;
        });
      }

      setDbOnline(true);
      setLastSyncTime(new Date());
      if (isManual) {
        setToastMessage('Database live & synced with Central DB!');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.warn('Central DB sync notice:', err);
      setDbOnline(false);
    } finally {
      setIsSyncingDb(false);
    }
  }, []);

  // Direct card URL routing detection (e.g. /card/:slug, ?card=slug, #card/slug)
  const cardsRef = useRef<BusinessCard[]>(cards);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    const detectUrlCard = async () => {
      try {
        const path = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        const cardMatch = path.match(/\/card\/([a-zA-Z0-9_.-]+)/);
        const paramSlug = searchParams.get('card') || searchParams.get('slug') || searchParams.get('id');
        const hashMatch = hash.match(/#\/?card\/([a-zA-Z0-9_.-]+)/);

        const targetSlug = cardMatch?.[1] || paramSlug || hashMatch?.[1];

        if (targetSlug) {
          const norm = targetSlug.toLowerCase().trim();
          const cleanNorm = norm.replace(/[^a-z0-9]/g, '');
          const found = cardsRef.current.find(
            (c: BusinessCard) =>
              c.slug.toLowerCase().trim() === norm ||
              c.id === targetSlug ||
              c.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNorm
          );

          if (found) {
            setSelectedCardId(found.id);
            if (found.companyId) {
              setSelectedCompanyId(found.companyId);
            }
            setActiveView('preview_standalone');
          } else {
            // Direct query from Central DB in case card was created on another device
            const remoteCard = await dbFetchCardBySlugOrId(targetSlug);
            const deletedCardIds = getDeletedCardIds();
            if (remoteCard && !deletedCardIds.includes(remoteCard.id)) {
              setCards((prev) => {
                const exists = prev.some((c) => c.id === remoteCard.id);
                return exists ? prev : [remoteCard, ...prev];
              });
              setSelectedCardId(remoteCard.id);
              if (remoteCard.companyId) {
                setSelectedCompanyId(remoteCard.companyId);
              }
              setActiveView('preview_standalone');
            }
          }
        }
      } catch (e) {
        console.error('URL card detection notice:', e);
      }
    };

    detectUrlCard();
    window.addEventListener('popstate', detectUrlCard);
    window.addEventListener('hashchange', detectUrlCard);
    return () => {
      window.removeEventListener('popstate', detectUrlCard);
      window.removeEventListener('hashchange', detectUrlCard);
    };
  }, []);

  // Initial load, real-time subscription & heartbeat sync
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        await seedCentralDatabaseIfNeeded();
        if (isMounted) {
          await syncCentralDatabase(false);
        }
      } catch (err) {
        console.warn('Initial seed error:', err);
      }
    }

    init();

    // 1. Real-time live subscription to Central Database changes
    const unsubscribe = subscribeToCentralDatabase({
      onCardsChange: () => {
        syncCentralDatabase(false);
      },
      onUsersChange: () => {
        syncCentralDatabase(false);
      },
      onLeadsChange: () => {
        syncCentralDatabase(false);
      },
      onStatusChange: (isLive) => {
        setDbOnline(isLive);
      },
    });

    // 2. Periodic live background sync (every 60 seconds - optimized for low egress)
    const interval = setInterval(() => {
      syncCentralDatabase(false);
    }, 60000);

    // 3. Tab visibility sync
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncCentralDatabase(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncCentralDatabase]);

  // Load high-capacity IndexedDB cache on initial mount
  useEffect(() => {
    let isMounted = true;
    async function loadFromIndexedDb() {
      try {
        const [savedCards, savedCompanies, savedUsers, savedLeads] = await Promise.all([
          idbGet<BusinessCard[]>('cards', 'all_cards'),
          idbGet<Company[]>('companies', 'all_companies'),
          idbGet<User[]>('users', 'all_users'),
          idbGet<LeadInquiry[]>('leads', 'all_leads'),
        ]);

        if (isMounted) {
          if (savedCards && savedCards.length > 0) {
            const deletedCardIds = getDeletedCardIds();
            const activeSavedCards = savedCards.filter((c) => !deletedCardIds.includes(c.id));
            setCards((prev) => deduplicateById(restoreCardMediaAssets(activeSavedCards, prev)));
          }
          if (savedCompanies && savedCompanies.length > 0) setCompanies(deduplicateById(savedCompanies));
          if (savedUsers && savedUsers.length > 0) setUsers(deduplicateById(savedUsers));
          if (savedLeads && savedLeads.length > 0) setLeads(deduplicateById(savedLeads));
          setIsInitialLoadDone(true);
        }
      } catch {
        if (isMounted) setIsInitialLoadDone(true);
      }
    }
    loadFromIndexedDb();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to high-capacity IndexedDB & safe localStorage (only after initial load has verified existing state)
  useEffect(() => {
    if (!isInitialLoadDone) return;
    idbSet('companies', 'all_companies', companies);
    safeLocalStorageSet('yebocompanies_data', JSON.stringify(companies));
  }, [companies, isInitialLoadDone]);

  useEffect(() => {
    if (!isInitialLoadDone) return;
    idbSet('cards', 'all_cards', cards);
    safeLocalStorageSet('yebocards_data', JSON.stringify(cards));
  }, [cards, isInitialLoadDone]);

  useEffect(() => {
    if (!isInitialLoadDone) return;
    idbSet('users', 'all_users', users);
    safeLocalStorageSet('yebousers_data', JSON.stringify(users));
  }, [users, isInitialLoadDone]);

  useEffect(() => {
    if (!isInitialLoadDone) return;
    idbSet('leads', 'all_leads', leads);
    safeLocalStorageSet('yeboleads_data', JSON.stringify(leads));
  }, [leads, isInitialLoadDone]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const isAdmin = currentUser?.role === 'admin';

  // Active company when inside a company workspace
  const activeCompany = useMemo(() => {
    return selectedCompanyId
      ? companies.find((c) => c.id === selectedCompanyId) || undefined
      : null;
  }, [selectedCompanyId, companies]);

  // Linked cards for the currently selected company
  const companyCards = useMemo(() => {
    return activeCompany
      ? cards.filter(
          (c) =>
            c.companyId === activeCompany.id ||
            c.businessName.toLowerCase() === activeCompany.name.toLowerCase() ||
            users.some(
              (u) =>
                u.companyId === activeCompany.id &&
                (u.assignedCardId === c.id || c.assignedMemberId === u.id)
            )
        )
      : [];
  }, [activeCompany, cards, users]);

  // All employees linked to the currently selected company
  const companyEmployees = useMemo(() => {
    return activeCompany
      ? users.filter(
          (u) =>
            u.companyId === activeCompany.id ||
            companyCards.some((c) => c.assignedMemberId === u.id || u.assignedCardId === c.id)
        )
      : [];
  }, [activeCompany, users, companyCards]);

  // Company Master Corporate Template Card (unallocated card or dedicated template)
  const companyTemplateCard = useMemo(() => {
    return activeCompany
      ? companyCards.find((c) => !c.assignedMemberId && (c.id === `card-${activeCompany.id}-master` || c.slug === activeCompany.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || c.id === activeCompany.id)) ||
        companyCards.find((c) => !c.assignedMemberId) ||
        companyCards[0] ||
        cards.find((c) => c.companyId === activeCompany.id) ||
        null
      : null;
  }, [activeCompany, companyCards, cards]);

  // Issued / Allocated cards specifically assigned to employees under this company
  const allocatedCompanyCards = useMemo(() => {
    return activeCompany
      ? companyCards.filter(
          (c) => !!c.assignedMemberId || companyEmployees.some((u) => u.assignedCardId === c.id)
        )
      : [];
  }, [activeCompany, companyCards, companyEmployees]);

  const activeCard = useMemo(() => {
    return cards.find((c) => c.id === selectedCardId) ||
      cards.find((c) => c.slug.toLowerCase() === selectedCardId.toLowerCase()) ||
      companyCards.find((c) => c.id === selectedCardId) ||
      allocatedCompanyCards[0] ||
      companyTemplateCard ||
      companyCards[0] ||
      cards[0];
  }, [cards, selectedCardId, companyCards, allocatedCompanyCards, companyTemplateCard]);

  // If member is logged in, their assigned card
  const memberAssignedCard = useMemo(() => {
    return !isAdmin && currentUser
      ? cards.find((c) => c.id === currentUser.assignedCardId) || cards[0]
      : null;
  }, [isAdmin, currentUser, cards]);

  // Handlers for companies
  const handleSaveCompany = async (savedCompany: Company) => {
    const exists = companies.some((c) => c.id === savedCompany.id);
    const updatedCompanies = exists
      ? companies.map((c) => (c.id === savedCompany.id ? savedCompany : c))
      : [savedCompany, ...companies];

    setCompanies(updatedCompanies);

    // Also update companyId on cards matching this company name if not set
    const updatedCards = cards.map((c) => {
      if (c.companyId === savedCompany.id || c.businessName.toLowerCase() === savedCompany.name.toLowerCase()) {
        return {
          ...c,
          companyId: savedCompany.id,
          businessName: savedCompany.name,
          tagline: c.tagline || savedCompany.tagline,
          logoUrl: c.logoUrl || savedCompany.logoUrl,
        };
      }
      return c;
    });
    setCards(updatedCards);

    // Immediately persist to IndexedDB
    await idbSet('companies', 'all_companies', updatedCompanies);
    safeLocalStorageSet('yebocompanies_data', JSON.stringify(updatedCompanies));
    await idbSet('cards', 'all_cards', updatedCards);
    safeLocalStorageSet('yebocards_data', JSON.stringify(updatedCards));

    setShowCompanyModal(false);
    setEditingCompany(null);
    showToast(`Company "${savedCompany.name}" saved & published!`);

    await dbSaveCompanies(updatedCompanies);
  };

  const handleCompleteOnboardingWizard = async (data: {
    company: Company;
    templateCard: BusinessCard;
    teamMembers: Array<{
      user: User;
      card: BusinessCard;
    }>;
  }) => {
    // 1. Save company
    const updatedCompanies = [data.company, ...companies.filter((c) => c.id !== data.company.id)];
    setCompanies(updatedCompanies);
    await dbSaveCompanies(updatedCompanies);

    // 2. Save template card and member cards
    const newCardsToAdd: BusinessCard[] = [data.templateCard];
    const newUsersToAdd: User[] = [];

    await dbSaveCard(data.templateCard);

    for (const item of data.teamMembers) {
      await dbSaveUser(item.user);
      await dbSaveCard(item.card);
      newCardsToAdd.push(item.card);
      newUsersToAdd.push(item.user);
    }

    const finalCards = [...newCardsToAdd, ...cards.filter((c) => !newCardsToAdd.some((nc) => nc.id === c.id))];
    const finalUsers = [...newUsersToAdd, ...users.filter((u) => !newUsersToAdd.some((nu) => nu.id === u.id))];
    setCards(finalCards);
    setUsers(finalUsers);

    await idbSet('companies', 'all_companies', updatedCompanies);
    safeLocalStorageSet('yebocompanies_data', JSON.stringify(updatedCompanies));
    await idbSet('cards', 'all_cards', finalCards);
    safeLocalStorageSet('yebocards_data', JSON.stringify(finalCards));
    await idbSet('users', 'all_users', finalUsers);
    safeLocalStorageSet('yebousers_data', JSON.stringify(finalUsers));

    setSelectedCompanyId(data.company.id);
    if (newCardsToAdd.length > 1) {
      setSelectedCardId(newCardsToAdd[1].id);
    } else {
      setSelectedCardId(data.templateCard.id);
    }

    setShowOnboardingWizardModal(false);
    showToast(`Successfully onboarded ${data.company.name} and ${data.teamMembers.length} team members!`);
  };

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
  };

  const executeDeleteCompany = async (targetCompany: Company) => {
    const updatedCompanies = companies.filter((c) => c.id !== targetCompany.id);
    setCompanies(updatedCompanies);
    safeLocalStorageSet('yebocompanies_data', JSON.stringify(updatedCompanies));

    // Find all cards belonging to this company to delete from DB and state
    const cardsToDelete = cards.filter(
      (c) =>
        c.companyId === targetCompany.id ||
        c.businessName.toLowerCase() === targetCompany.name.toLowerCase()
    );

    // Blacklist all deleted cards so they never reappear
    for (const card of cardsToDelete) {
      markCardAsDeleted(card.id);
    }

    const updatedCards = cards.filter(
      (c) =>
        c.companyId !== targetCompany.id &&
        c.businessName.toLowerCase() !== targetCompany.name.toLowerCase()
    );

    setCards(updatedCards);
    safeLocalStorageSet('yebocards_data', JSON.stringify(updatedCards));

    if (selectedCompanyId === targetCompany.id) {
      setSelectedCompanyId(null);
    }
    setCompanyToDelete(null);
    showToast(`Company "${targetCompany.name}" and linked cards removed.`);

    // PERMANENTLY REMOVE FROM CENTRAL DB & IDB
    try {
      await Promise.all([
        idbSet('companies', 'all_companies', updatedCompanies),
        idbSet('cards', 'all_cards', updatedCards),
        dbSaveCompanies(updatedCompanies),
        ...cardsToDelete.map((card) => dbDeleteCard(card.id)),
        ...cardsToDelete.map((card) => idbDelete('cards', card.id)),
      ]);
    } catch (e) {
      console.warn('Delete company persistence warning:', e);
    }
  };

  // Handlers for cards (synced with central DB)
  const handleSaveCard = async (savedCard: BusinessCard) => {
    unmarkCardAsDeleted(savedCard.id);
    const cardWithTimestamp: BusinessCard = {
      ...savedCard,
      updatedAt: new Date().toISOString(),
    };
    const exists = cards.some((c) => c.id === cardWithTimestamp.id);
    const updatedCards = exists
      ? cards.map((c) => (c.id === cardWithTimestamp.id ? cardWithTimestamp : c))
      : [cardWithTimestamp, ...cards];

    setCards(updatedCards);
    setSelectedCardId(cardWithTimestamp.id);
    if (cardWithTimestamp.companyId) {
      setSelectedCompanyId(cardWithTimestamp.companyId);
    }

    // Sync member assignment whenever card allocation is updated or cleared
    const targetMemberId = cardWithTimestamp.assignedMemberId || undefined;
    setUsers((prev) =>
      prev.map((u) => {
        if (targetMemberId && u.id === targetMemberId) {
          const updated = { ...u, assignedCardId: cardWithTimestamp.id, updatedAt: new Date().toISOString() };
          dbSaveUser(updated).catch(console.warn);
          return updated;
        }
        if (u.assignedCardId === cardWithTimestamp.id && u.id !== targetMemberId) {
          const updated = { ...u, assignedCardId: undefined, updatedAt: new Date().toISOString() };
          dbSaveUser(updated).catch(console.warn);
          return updated;
        }
        return u;
      })
    );

    setEditingCard(null);
    setActiveView('dashboard');

    // Immediately persist to safe localStorage and high-capacity IndexedDB
    safeLocalStorageSet('yebocards_data', JSON.stringify(updatedCards));
    try {
      await Promise.all([
        idbSet('cards', 'all_cards', updatedCards),
        idbSet('cards', cardWithTimestamp.id, cardWithTimestamp),
      ]);
    } catch (e) {
      console.warn('IDB write notice:', e);
    }

    showToast(`Smart Card "${cardWithTimestamp.businessName}" saved & published live!`);

    // Asynchronously sync to Central DB
    dbSaveCard(cardWithTimestamp).catch((err) => {
      console.warn('Central DB sync warning for card:', err);
    });
  };

  const handleDeleteCard = (cardId: string) => {
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard) return;
    setCardToDelete(targetCard);
  };

  const executeDeleteCard = async (targetCard: BusinessCard) => {
    const cardId = targetCard.id;
    markCardAsDeleted(cardId);

    const updatedCards = cards.filter((c) => c.id !== cardId);
    setCards(updatedCards);
    safeLocalStorageSet('yebocards_data', JSON.stringify(updatedCards));

    // Clear assignment from any user that had this card assigned
    setUsers((prev) =>
      prev.map((u) => {
        if (u.assignedCardId === cardId) {
          const updated = { ...u, assignedCardId: undefined, updatedAt: new Date().toISOString() };
          dbSaveUser(updated).catch(console.warn);
          return updated;
        }
        return u;
      })
    );

    if (selectedCardId === cardId) {
      const remaining = updatedCards.filter((c) => c.companyId === targetCard.companyId);
      if (remaining.length > 0) {
        setSelectedCardId(remaining[0].id);
      } else if (updatedCards.length > 0) {
        setSelectedCardId(updatedCards[0].id);
      }
    }

    setCardToDelete(null);
    showToast(`Card "${targetCard.businessName}" permanently removed.`);

    try {
      await Promise.all([
        idbSet('cards', 'all_cards', updatedCards),
        idbDelete('cards', cardId),
        dbDeleteCard(cardId),
      ]);
    } catch (e) {
      console.warn('Delete card persistence warning:', e);
    }
  };

  // Handlers for members & profiles (synced with central DB)
  const handleAddMember = async (newMemberData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...newMemberData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    showToast(`${newUser.role === 'admin' ? 'Admin' : 'Member'} "${newUser.name}" saved to Central DB!`);
    await dbSaveUser(newUser);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const now = new Date().toISOString();
    const userWithTimestamp: User = {
      ...updatedUser,
      updatedAt: now,
    };

    const nextUsers = users.map((u) => (u.id === userWithTimestamp.id ? userWithTimestamp : u));
    setUsers(nextUsers);

    // Save to IndexedDB and LocalStorage immediately
    await idbSet('users', 'all_users', nextUsers);
    safeLocalStorageSet('yebousers_data', JSON.stringify(nextUsers));

    if (currentUser && currentUser.id === userWithTimestamp.id) {
      setCurrentUser(userWithTimestamp);
      safeLocalStorageSet('yebo_admin_session', JSON.stringify(userWithTimestamp));
    }

    // Automatically update any cards assigned to or associated with this member
    const updatedCardsToSave: BusinessCard[] = [];
    const nextCards = cards.map((c) => {
      if (
        c.assignedMemberId === userWithTimestamp.id ||
        userWithTimestamp.assignedCardId === c.id
      ) {
        const updatedCard: BusinessCard = {
          ...c,
          contactPersonName: userWithTimestamp.name,
          designation: userWithTimestamp.designation || c.designation,
          companyId: userWithTimestamp.companyId || c.companyId,
          socialLinks: {
            ...c.socialLinks,
            phone: userWithTimestamp.phone || c.socialLinks?.phone || '',
            whatsapp: userWithTimestamp.phone || c.socialLinks?.whatsapp || '',
            email: userWithTimestamp.email || c.socialLinks?.email || '',
          },
          updatedAt: now,
        };
        updatedCardsToSave.push(updatedCard);
        return updatedCard;
      }
      return c;
    });

    if (updatedCardsToSave.length > 0) {
      setCards(nextCards);
      await idbSet('cards', 'all_cards', nextCards);
      safeLocalStorageSet('yebocards_data', JSON.stringify(nextCards));
      for (const cardToSave of updatedCardsToSave) {
        await dbSaveCard(cardToSave);
      }
    }

    showToast(`Profile "${userWithTimestamp.name}" updated & saved!`);
    await dbSaveUser(userWithTimestamp);
  };

  const handleUpdateMemberPassword = async (userId: string, newPass: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    if (targetUser) {
      await dbSaveUser({ ...targetUser, password: newPass });
    }
  };

  const handleAssignCard = async (userId: string, cardId: string | undefined) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (cardId) {
      const targetCard = cards.find((c) => c.id === cardId);
      if (targetCard) {
        const updatedCard: BusinessCard = {
          ...targetCard,
          assignedMemberId: userId,
          contactPersonName: targetUser.name,
          designation: targetUser.designation || targetCard.designation,
          socialLinks: {
            ...targetCard.socialLinks,
            phone: targetUser.phone || targetCard.socialLinks?.phone || '',
            whatsapp: targetUser.phone || targetCard.socialLinks?.whatsapp || '',
            email: targetUser.email || targetCard.socialLinks?.email || '',
          },
          updatedAt: new Date().toISOString(),
        };
        setCards((prev) => prev.map((c) => (c.id === cardId ? updatedCard : c)));
        await dbSaveCard(updatedCard);
      }
    }

    const updatedUser: User = { ...targetUser, assignedCardId: cardId };
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    showToast(`Smart card link assigned to ${targetUser.name}!`);
    await dbSaveUser(updatedUser);
  };

  const handleDeleteMember = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    // Clear assignment on cards if member was assigned
    if (targetUser?.assignedCardId) {
      setCards((prev) =>
        prev.map((c) => (c.id === targetUser.assignedCardId ? { ...c, assignedMemberId: undefined } : c))
      );
    }

    try {
      const deletedIds = getDeletedUserIds();
      if (!deletedIds.includes(userId)) {
        deletedIds.push(userId);
        localStorage.setItem('yebo_deleted_user_ids', JSON.stringify(deletedIds));
      }
    } catch {
      // ignore
    }

    showToast('Member removed permanently from Central DB.');
    await dbDeleteUser(userId);
  };

  const handleAdminLoginSuccess = (admin: User) => {
    setCurrentUser(admin);
    safeLocalStorageSet('yebo_admin_session', JSON.stringify(admin));
    showToast(`Welcome back, ${admin.name}!`);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('yebo_admin_session');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    showToast('Signed out successfully.');
  };

  const handleUpdateCurrentProfilePhoto = async (dataUrl: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatarUrl: dataUrl };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    safeLocalStorageSet('yebo_admin_session', JSON.stringify(updated));
    showToast('Profile photo updated & saved to Central DB!');
    await dbSaveUser(updated);
  };

  const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          const targetDim = 512;
          canvas.width = targetDim;
          canvas.height = targetDim;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const startX = (img.width - size) / 2;
            const startY = (img.height - size) / 2;
            ctx.drawImage(img, startX, startY, size, size, 0, 0, targetDim, targetDim);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            await handleUpdateCurrentProfilePhoto(compressed);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Dedicated Card Allocation
  const handleAllocateCard = async (
    cardId: string,
    employeeId: string | null,
    syncContactInfo: boolean
  ) => {
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard) return;

    const previousEmployee = users.find((u) => u.assignedCardId === cardId);
    const newEmployee = employeeId ? users.find((u) => u.id === employeeId) : null;

    if (!newEmployee) {
      // Unallocating card
      const updatedCard = { ...targetCard, assignedMemberId: undefined };
      setCards((prev) => prev.map((c) => (c.id === cardId ? updatedCard : c)));
      await dbSaveCard(updatedCard);

      if (previousEmployee) {
        const clearedPrev = { ...previousEmployee, assignedCardId: undefined };
        setUsers((prev) => prev.map((u) => (u.id === previousEmployee.id ? clearedPrev : u)));
        await dbSaveUser(clearedPrev);
      }
      showToast(`Card "${targetCard.businessName}" is now unallocated.`);
      return;
    }

    // Check if targetCard is the primary company card template
    const isCompanyMasterTemplate = !targetCard.assignedMemberId || targetCard.id === targetCard.companyId;

    let finalCardToSave: BusinessCard;

    if (isCompanyMasterTemplate) {
      // CLONE a unique employee card from the company template so the company template card stays clean!
      const newCardId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c-alloc-${Date.now()}`;
      const compSlug = (targetCard.slug || 'card').split('-')[0].toLowerCase().replace(/[^a-z0-9]+/g, '');
      const namePart = newEmployee.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const baseSlug = (namePart ? `${compSlug}-${namePart}` : `${compSlug}-member`).slice(0, 32);

      let uniqueSlug = baseSlug;
      let counter = 1;
      while (cards.some((c) => c.id !== newCardId && c.slug === uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      finalCardToSave = {
        ...targetCard,
        id: newCardId,
        companyId: targetCard.companyId || targetCard.id,
        slug: uniqueSlug,
        businessName: targetCard.businessName,
        contactPersonName: newEmployee.name,
        designation: newEmployee.designation || targetCard.designation,
        assignedMemberId: newEmployee.id,
        logoUrl: targetCard.logoUrl,
        socialLinks: {
          ...targetCard.socialLinks,
          phone: newEmployee.phone || targetCard.socialLinks?.phone || '',
          whatsapp: newEmployee.phone || targetCard.socialLinks?.whatsapp || '',
          email: newEmployee.email || targetCard.socialLinks?.email || '',
        },
        status: 'live',
        updatedAt: new Date().toISOString(),
      };

      const updatedCardsList = [finalCardToSave, ...cards];
      setCards(updatedCardsList);
      safeLocalStorageSet('yebocards_data', JSON.stringify(updatedCardsList));
      idbSet('cards', 'all_cards', updatedCardsList).catch(console.warn);
    } else {
      // Updating an existing employee card
      finalCardToSave = {
        ...targetCard,
        assignedMemberId: newEmployee.id,
        contactPersonName: syncContactInfo ? newEmployee.name : targetCard.contactPersonName,
        designation: syncContactInfo ? (newEmployee.designation || targetCard.designation) : targetCard.designation,
        socialLinks: {
          ...targetCard.socialLinks,
          phone: syncContactInfo ? (newEmployee.phone || targetCard.socialLinks?.phone || '') : targetCard.socialLinks?.phone,
          whatsapp: syncContactInfo ? (newEmployee.phone || targetCard.socialLinks?.whatsapp || '') : targetCard.socialLinks?.whatsapp,
          email: syncContactInfo ? (newEmployee.email || targetCard.socialLinks?.email || '') : targetCard.socialLinks?.email,
        },
        updatedAt: new Date().toISOString(),
      };

      const updatedCardsList = cards.map((c) => (c.id === cardId ? finalCardToSave : c));
      setCards(updatedCardsList);
      safeLocalStorageSet('yebocards_data', JSON.stringify(updatedCardsList));
      idbSet('cards', 'all_cards', updatedCardsList).catch(console.warn);
    }

    unmarkCardAsDeleted(finalCardToSave.id);
    await dbSaveCard(finalCardToSave);

    if (previousEmployee && previousEmployee.id !== newEmployee.id) {
      const clearedPrev = { ...previousEmployee, assignedCardId: undefined, updatedAt: new Date().toISOString() };
      setUsers((prev) => prev.map((u) => (u.id === previousEmployee.id ? clearedPrev : u)));
      await dbSaveUser(clearedPrev);
    }

    const updatedEmp: User = {
      ...newEmployee,
      assignedCardId: finalCardToSave.id,
      companyId: newEmployee.companyId || targetCard.companyId || undefined,
      updatedAt: new Date().toISOString(),
    };
    setUsers((prev) => prev.map((u) => (u.id === newEmployee.id ? updatedEmp : u)));
    await dbSaveUser(updatedEmp);

    setSelectedCardId(finalCardToSave.id);
    showToast(`Unique card allocated to ${newEmployee.name} (/card/${finalCardToSave.slug})!`);
  };

  // Dedicated Bulk Card Allocation (Allocating cards to multiple employees simultaneously & saving to database)
  const handleBulkAllocateCards = async (
    companyCardId: string,
    employeeIds: string[],
    syncContactInfo: boolean
  ) => {
    const templateCard = cards.find((c) => c.id === companyCardId) || cards[0];
    if (!templateCard || employeeIds.length === 0) return;

    let updatedCardsList = [...cards];
    let updatedUsersList = [...users];

    for (const empId of employeeIds) {
      const emp = updatedUsersList.find((u) => u.id === empId);
      if (!emp) continue;

      let empCard = updatedCardsList.find(
        (c) => c.assignedMemberId === emp.id || (emp.assignedCardId && c.id === emp.assignedCardId)
      );

      const cardId = empCard
        ? empCard.id
        : typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `c-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      const compSlug = (templateCard.slug || 'card').split('-')[0].toLowerCase().replace(/[^a-z0-9]+/g, '');
      const namePart = emp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const baseSlug = (namePart ? `${compSlug}-${namePart}` : `${compSlug}-member`).slice(0, 32);

      let uniqueSlug = empCard ? empCard.slug : baseSlug;
      if (!empCard) {
        let counter = 1;
        while (updatedCardsList.some((c) => c.id !== cardId && c.slug === uniqueSlug)) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      const assignedCompId = templateCard.companyId || templateCard.id;

      const newOrUpdatedCard: BusinessCard = {
        ...(empCard || templateCard),
        id: cardId,
        companyId: assignedCompId,
        slug: uniqueSlug,
        businessName: templateCard.businessName,
        tagline: templateCard.tagline,
        businessType: templateCard.businessType,
        businessTypeLabel: templateCard.businessTypeLabel,
        contactPersonName: syncContactInfo ? emp.name : (empCard?.contactPersonName || emp.name),
        designation: syncContactInfo ? (emp.designation || templateCard.designation) : (empCard?.designation || emp.designation || templateCard.designation),
        logoUrl: templateCard.logoUrl,
        theme: templateCard.theme,
        banners: templateCard.banners,
        aboutText: templateCard.aboutText,
        services: templateCard.services,
        galleryImages: templateCard.galleryImages,
        operatingHours: templateCard.operatingHours,
        assignedMemberId: emp.id,
        status: 'live',
        socialLinks: {
          ...templateCard.socialLinks,
          phone: syncContactInfo ? (emp.phone || templateCard.socialLinks?.phone || '') : (empCard?.socialLinks?.phone || emp.phone || ''),
          whatsapp: syncContactInfo ? (emp.phone || templateCard.socialLinks?.whatsapp || '') : (empCard?.socialLinks?.whatsapp || emp.phone || ''),
          email: syncContactInfo ? (emp.email || templateCard.socialLinks?.email || '') : (empCard?.socialLinks?.email || emp.email || ''),
        },
        updatedAt: new Date().toISOString(),
      };

      const existingIdx = updatedCardsList.findIndex((c) => c.id === cardId);
      if (existingIdx >= 0) {
        updatedCardsList[existingIdx] = newOrUpdatedCard;
      } else {
        updatedCardsList.unshift(newOrUpdatedCard);
      }
      await dbSaveCard(newOrUpdatedCard);

      const empIdx = updatedUsersList.findIndex((u) => u.id === empId);
      if (empIdx >= 0) {
        const updatedEmp: User = {
          ...updatedUsersList[empIdx],
          assignedCardId: cardId,
          companyId: assignedCompId,
        };
        updatedUsersList[empIdx] = updatedEmp;
        await dbSaveUser(updatedEmp);
      }
    }

    setCards(updatedCardsList);
    setUsers(updatedUsersList);
    safeLocalStorageSet('yebocards_data', JSON.stringify(updatedCardsList));
    safeLocalStorageSet('yebousers_data', JSON.stringify(updatedUsersList));
    idbSet('cards', 'all_cards', updatedCardsList).catch(console.warn);
    idbSet('users', 'all_users', updatedUsersList).catch(console.warn);
    showToast(`Successfully allocated unique cards to ${employeeIds.length} employee(s) & saved to database!`);
  };

  // Dedicated helper to unlink an employee from a card
  const handleUnlinkEmployeeCard = async (employeeId: string, cardId?: string) => {
    const targetEmployee = users.find((u) => u.id === employeeId);
    const targetCardId = cardId || targetEmployee?.assignedCardId;
    const targetCard = cards.find((c) => c.id === targetCardId || c.assignedMemberId === employeeId);
    
    if (targetCard) {
      const updatedCard = { ...targetCard, assignedMemberId: undefined };
      setCards((prev) => prev.map((c) => (c.id === targetCard.id ? updatedCard : c)));
      await dbSaveCard(updatedCard);
    }

    if (targetEmployee) {
      const updatedUser = { ...targetEmployee, assignedCardId: undefined };
      setUsers((prev) => prev.map((u) => (u.id === targetEmployee.id ? updatedUser : u)));
      await dbSaveUser(updatedUser);
      showToast(`Unlinked ${targetEmployee.name} from smart card.`);
    }
  };

  // Dedicated helper to select or auto-allocate an employee card for live preview
  const handleSelectEmployeeForPreview = async (emp: User) => {
    const targetComp = activeCompany || companies.find((c) => c.id === emp.companyId) || companies[0];
    let empCard =
      cards.find((c) => c.assignedMemberId === emp.id) ||
      cards.find((c) => c.id === emp.assignedCardId) ||
      cards.find(
        (c) =>
          c.companyId === targetComp?.id &&
          c.contactPersonName &&
          emp.name &&
          c.contactPersonName.toLowerCase().trim() === emp.name.toLowerCase().trim()
      );

    if (!empCard && targetComp) {
      // Auto-allocate unique card for this employee strictly inheriting company template branding
      const templateCard =
        companyTemplateCard ||
        cards.find((c) => c.companyId === targetComp.id && !c.assignedMemberId) ||
        companyCards.find((c) => !c.assignedMemberId) ||
        companyCards[0] ||
        cards[0];

      if (templateCard) {
        const cardId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c-emp-${Date.now()}`;
        const compSlug = (templateCard.slug || targetComp.name || 'card')
          .split('-')[0]
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '');
        const namePart = emp.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
        const desigPart = (emp.designation || 'staff').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
        const baseSlug = `${compSlug}-${namePart}-${desigPart}`.slice(0, 40);

        let uniqueSlug = baseSlug;
        let counter = 1;
        while (cards.some((c) => c.id !== cardId && c.slug === uniqueSlug)) {
          uniqueSlug = `${baseSlug}-${counter}`.slice(0, 48);
          counter++;
        }

        uniqueSlug = uniqueSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

        empCard = {
          ...templateCard,
          id: cardId,
          companyId: targetComp.id,
          slug: uniqueSlug,
          businessName: templateCard.businessName || targetComp.name,
          tagline: templateCard.tagline || targetComp.tagline || '',
          contactPersonName: emp.name,
          designation: emp.designation || templateCard.designation,
          assignedMemberId: emp.id,
          logoUrl: targetComp.logoUrl || templateCard.logoUrl,
          theme: targetComp.theme || templateCard.theme,
          banners: templateCard.banners || [],
          services: templateCard.services || [],
          galleryImages: templateCard.galleryImages || [],
          operatingHours: templateCard.operatingHours || targetComp.operatingHours || '',
          aboutText: emp.bio || templateCard.aboutText || targetComp.aboutText || '',
          socialLinks: {
            ...templateCard.socialLinks,
            phone: emp.phone || templateCard.socialLinks?.phone || '',
            whatsapp: emp.phone || templateCard.socialLinks?.whatsapp || '',
            email: emp.email || templateCard.socialLinks?.email || '',
            website: targetComp.website || templateCard.socialLinks?.website || '',
            address: targetComp.address || templateCard.socialLinks?.address || '',
          },
          status: 'live',
          viewsCount: 0,
          sharesCount: 0,
          callClicksCount: 0,
          whatsappClicksCount: 0,
          vcardDownloadsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCards((prev) => [empCard!, ...prev]);
        await dbSaveCard(empCard!);

        const updatedEmp: User = { ...emp, assignedCardId: cardId, companyId: targetComp.id };
        setUsers((prev) => prev.map((u) => (u.id === emp.id ? updatedEmp : u)));
        await dbSaveUser(updatedEmp);
      }
    }

    if (empCard) {
      setSelectedCardId(empCard.id);
      showToast(`Simulating ${emp.name}'s unique smart card (/card/${empCard.slug})`);

      // On mobile/tablet screens, smooth-scroll to the simulator so the user sees the preview immediately
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          const simEl = document.getElementById('company-live-simulator');
          if (simEl) {
            simEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  };

  // Dedicated helper to unlink an employee from a company
  const handleUnlinkEmployeeFromCompany = async (employeeId: string, companyId: string) => {
    const targetEmployee = users.find((u) => u.id === employeeId);
    if (!targetEmployee) return;

    // Check if they had a card linked from this company
    const linkedCompanyCard = cards.find(
      (c) => c.companyId === companyId && (c.assignedMemberId === employeeId || targetEmployee.assignedCardId === c.id)
    );
    if (linkedCompanyCard) {
      const updatedCard = { ...linkedCompanyCard, assignedMemberId: undefined };
      setCards((prev) => prev.map((c) => (c.id === linkedCompanyCard.id ? updatedCard : c)));
      await dbSaveCard(updatedCard);
    }

    const updatedUser: User = {
      ...targetEmployee,
      companyId: undefined,
      assignedCardId: linkedCompanyCard ? undefined : targetEmployee.assignedCardId,
    };
    setUsers((prev) => prev.map((u) => (u.id === employeeId ? updatedUser : u)));
    await dbSaveUser(updatedUser);
    showToast(`Unlinked ${targetEmployee.name} from company.`);
  };

  // Dedicated helper to link an existing employee to a company
  const handleLinkEmployeeToCompany = async (employeeId: string, companyId: string) => {
    const targetEmployee = users.find((u) => u.id === employeeId);
    if (!targetEmployee) return;

    const targetCompany = companies.find((c) => c.id === companyId);
    const updatedUser: User = {
      ...targetEmployee,
      companyId: companyId,
    };
    setUsers((prev) => prev.map((u) => (u.id === employeeId ? updatedUser : u)));
    await dbSaveUser(updatedUser);
    setShowLinkEmployeeModal(false);
    showToast(`Linked ${targetEmployee.name} to ${targetCompany?.name || 'company'}!`);
  };

  // Issue Company Card to Employee
  const handleIssueEmployeeCard = async (newCard: BusinessCard, newEmployee?: User) => {
    // Ensure companyId is assigned if created from inside a company
    const cardToSave = {
      ...newCard,
      companyId: newCard.companyId || selectedCompanyId || undefined,
    };

    // 1. Add/Update Card in state & database
    setCards((prev) => {
      const exists = prev.some((c) => c.id === cardToSave.id);
      if (exists) {
        return prev.map((c) => (c.id === cardToSave.id ? cardToSave : c));
      }
      return [cardToSave, ...prev];
    });
    setSelectedCardId(cardToSave.id);
    await dbSaveCard(cardToSave);

    // 2. Add Employee user profile if created
    if (newEmployee) {
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === newEmployee.id || u.email.toLowerCase() === newEmployee.email.toLowerCase());
        if (exists) {
          return prev.map((u) => (u.id === newEmployee.id || u.email.toLowerCase() === newEmployee.email.toLowerCase() ? newEmployee : u));
        }
        return [...prev, newEmployee];
      });
      await dbSaveUser(newEmployee);
    }

    showToast(`Smart Card "${cardToSave.contactPersonName || cardToSave.businessName}" issued!`);
  };

  const handleLeadSubmit = async (leadData: Omit<LeadInquiry, 'id' | 'createdAt' | 'status'>) => {
    const newLead: LeadInquiry = {
      ...leadData,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    setLeads((prev) => [newLead, ...prev]);
    showToast('Inquiry submitted successfully! We will connect shortly.');
    await dbSaveLead(newLead);
  };

  const handleActionClick = async (type: 'call' | 'whatsapp' | 'share' | 'vcard') => {
    if (!activeCard) return;
    const cardId = activeCard.id;

    if (type === 'call') {
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, callClicksCount: (c.callClicksCount || 0) + 1 } : c
        )
      );
      await dbIncrementCardMetric(cardId, 'call');
    } else if (type === 'whatsapp') {
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? { ...c, whatsappClicksCount: (c.whatsappClicksCount || 0) + 1 }
            : c
        )
      );
      await dbIncrementCardMetric(cardId, 'whatsapp');
    } else if (type === 'share') {
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, sharesCount: (c.sharesCount || 0) + 1 } : c
        )
      );
      await dbIncrementCardMetric(cardId, 'share');
    } else if (type === 'vcard') {
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? { ...c, vcardDownloadsCount: (c.vcardDownloadsCount || 0) + 1 }
            : c
        )
      );
      await dbIncrementCardMetric(cardId, 'vcard');
    }
  };

  // Filtered companies for the Home Page Directory
  const filteredCompanies = useMemo(() => {
    return companies.filter((comp) => {
      const matchesSearch =
        !searchCompanyQuery ||
        comp.name.toLowerCase().includes(searchCompanyQuery.toLowerCase()) ||
        comp.tagline.toLowerCase().includes(searchCompanyQuery.toLowerCase()) ||
        comp.categoryLabel.toLowerCase().includes(searchCompanyQuery.toLowerCase());

      const matchesCategory =
        selectedCategoryFilter === 'all' || comp.category === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [companies, searchCompanyQuery, selectedCategoryFilter]);

  // Unique categories list for filters
  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(companies.map((c) => c.category).filter(Boolean))
    );
  }, [companies]);

  // STANDALONE PREVIEW VIEW
  if (activeView === 'preview_standalone') {
    const cardFullUrl = activeCard ? `${window.location.origin}/card/${activeCard.slug}` : '';

    const handleCloseStandaloneCard = () => {
      try {
        window.close();
      } catch {
        // ignore
      }
      if (currentUser && currentUser.role === 'admin') {
        setActiveView('dashboard');
        try {
          window.history.pushState({}, '', '/');
        } catch {
          window.location.hash = '';
        }
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        showToast('You can safely close this browser tab.');
      }
    };

    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col`}>
        {/* Micro top bar for standalone card view */}
        <div className={`p-3 border-b ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white/90'} backdrop-blur-md flex items-center justify-between gap-2 z-20`}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              /card/{activeCard?.slug}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {activeCard && (
              <>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cardFullUrl);
                    showToast(`Link copied: ${cardFullUrl}`);
                  }}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-amber-600'
                  } text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer`}
                  title="Copy direct web link"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Link</span>
                </button>

                <button
                  onClick={() => {
                    const message = encodeURIComponent(`Here is the official smart card for ${activeCard.contactPersonName || activeCard.businessName}: ${cardFullUrl}`);
                    window.open(`https://wa.me/?text=${message}`, '_blank');
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Share link via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  onClick={() => {
                    setCardToPrint(activeCard);
                    setShowPrintModal(true);
                  }}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-300'
                  } text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer`}
                  title="Print 10 physical cards on a single sheet (Avery 5371 standard)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print (10/pg)</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingCard(activeCard);
                      setActiveView('editor');
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-300'
                    } text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer`}
                    title="Edit this card"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Edit Card</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteCard(activeCard.id)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Delete this card"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </>
            )}

            <ThemeToggle showLabel={false} />

            {/* Clean Close Button */}
            <button
              onClick={handleCloseStandaloneCard}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl ${
                isDark ? 'bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-800/50' : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300'
              } text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer`}
              title="Close card view"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          {activeCard ? (
            <CardView
              card={activeCard}
              allocatedMember={
                users.find((u) => u.id === activeCard.assignedMemberId) ||
                users.find((u) => u.assignedCardId === activeCard.id) ||
                (activeCard.contactPersonName ? users.find((u) => u.name.toLowerCase().trim() === activeCard.contactPersonName.toLowerCase().trim()) : null) ||
                null
              }
              company={companies.find((c) => c.id === (activeCard.companyId || users.find((u) => u.id === activeCard.assignedMemberId)?.companyId))}
              companyTemplate={cards.find((c) => c.companyId === activeCard.companyId && !c.assignedMemberId) || undefined}
              onLeadSubmit={handleLeadSubmit}
              onActionClick={handleActionClick}
              isStandalone={true}
            />
          ) : (
            <div className={`p-8 max-w-sm mx-auto text-center rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Card Link Unavailable</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                This digital smart card could not be located or may have been updated.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveView('dashboard');
                  try {
                    window.history.pushState({}, '', '/');
                  } catch {
                    window.location.hash = '';
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADMIN ACCESS GUARD: Make sure admins are logged in before accessing the system
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <AdminLoginView
        users={users}
        onLoginSuccess={(adminUser) => {
          safeLocalStorageSet('yebo_admin_session', JSON.stringify(adminUser));
          setCurrentUser(adminUser);
          showToast(`Welcome back, ${adminUser.name}!`);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950`}>
      {/* Top Main Navigation Bar */}
      <header className={`sticky top-0 z-40 border-b ${isDark ? 'border-slate-800/80 bg-slate-950/85' : 'border-slate-200 bg-white/85'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div
            onClick={() => {
              setSelectedCompanyId(null);
              setActiveView('dashboard');
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className={`w-full h-full ${isDark ? 'bg-slate-950' : 'bg-slate-900'} rounded-[10px] flex items-center justify-center`}>
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  B-Smart
                </h1>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                  Mobile Communicator
                </span>
              </div>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium hidden sm:block`}>
                Enterprise Mobile Communicator Platform
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => {
                setSelectedCompanyId(null);
                setActiveView('dashboard');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'dashboard'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Companies Directory</span>
            </button>

            <button
              onClick={() => setActiveView('members')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'members'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Members</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-700'
              }`}>
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveView('leads')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeView === 'leads'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Inquiries</span>
              {leads.filter((l) => l.status === 'new').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Help & Visual Guide Button */}
            <button
              type="button"
              onClick={() => setShowHelpGuideModal(true)}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-amber-600 shadow-sm'
              }`}
              title="Open Step-by-Step Onboarding Guide with Screenshots"
              aria-label="Help and Guide"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline font-bold">Help & Guide</span>
            </button>

            {/* Quick Step-by-Step Onboarding Button */}
            <button
              type="button"
              onClick={() => setShowOnboardingWizardModal(true)}
              className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/20 transition-all cursor-pointer"
              title="Launch 4-Step Simplified Onboarding Wizard"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Guided Onboard</span>
            </button>

            {/* Live Database Sync Status & Refresh Button */}
            <button
              type="button"
              onClick={() => syncCentralDatabase(true)}
              disabled={isSyncingDb}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                dbOnline
                  ? isDark
                    ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/60 text-emerald-400'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                  : isDark
                  ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-800/60 text-amber-400'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
              }`}
              title={`Database is ${dbOnline ? 'Live & In Sync' : 'Offline'}. Last synced: ${lastSyncTime.toLocaleTimeString()}. Click to sync now.`}
              aria-label="Database sync status"
            >
              <span className="relative flex h-2 w-2">
                {dbOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dbOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline font-bold">
                {isSyncingDb ? 'Syncing...' : 'DB Live'}
              </span>
            </button>

            {/* Dark / Light Theme Mode Switcher */}
            <ThemeToggle showLabel={false} />

            {/* Desktop Current user pill */}
            <div
              onClick={() => setShowAuthModal(true)}
              className={`hidden md:flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border ${
                isDark ? 'bg-slate-900 hover:bg-slate-850 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 shadow-sm'
              } transition-colors cursor-pointer`}
              title="Click to switch user profile"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-800 border border-amber-500/30 shrink-0">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl || undefined} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-400">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="hidden lg:block text-left">
                <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-none truncate max-w-[110px]`}>
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-amber-400 font-semibold leading-tight capitalize">
                  {currentUser.role}
                </div>
              </div>
            </div>

            {/* Desktop Direct Photo Upload Button */}
            <label
              className={`hidden md:flex min-h-[38px] min-w-[38px] p-2 rounded-xl ${isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-sm'} border cursor-pointer transition-colors items-center justify-center gap-1`}
              title="Upload your profile photo directly"
              aria-label="Upload photo"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold hidden xl:inline">Photo</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleDirectPhotoUpload}
                className="hidden"
              />
            </label>

            {/* Desktop Explicit Sign Out / Log Out Button */}
            <button
              onClick={handleLogout}
              className={`hidden md:flex min-h-[38px] min-w-[38px] p-2 rounded-xl ${isDark ? 'bg-slate-900 hover:bg-red-950/40 border-slate-800 hover:border-red-800/50 text-slate-400 hover:text-red-400' : 'bg-slate-100 hover:bg-red-50 border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-600 shadow-sm'} border transition-colors items-center justify-center gap-1`}
              title="Sign Out / Log Out"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold hidden xl:inline">Logout</span>
            </button>

            {/* Mobile Menu Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`sm:hidden min-h-[38px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                isMobileMenuOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                  : isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
              }`}
              title="Toggle Mobile Navigation Menu"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 text-amber-500" />}
              <span>Menu</span>
            </button>
          </div>
        </div>

        {/* ALWAYS-VISIBLE MOBILE NAVIGATION MENU STRIP (Shows on all mobile screens) */}
        <div className={`sm:hidden border-t ${isDark ? 'border-slate-800/80 bg-slate-950/95' : 'border-slate-200 bg-white/95'} px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar`}>
          <button
            type="button"
            onClick={() => {
              setSelectedCompanyId(null);
              setActiveView('dashboard');
              setIsMobileMenuOpen(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Companies</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('members');
              setIsMobileMenuOpen(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeView === 'members'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Members</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
              activeView === 'members' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-500'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('leads');
              setIsMobileMenuOpen(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 relative cursor-pointer ${
              activeView === 'leads'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Inquiries</span>
            {leads.filter((l) => l.status === 'new').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCard(null);
              setActiveView('editor');
              setIsMobileMenuOpen(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeView === 'editor'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : isDark ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Card</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowIssueEmployeeModal(true);
              setIsMobileMenuOpen(false);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Issue Card</span>
          </button>
        </div>
      </header>

      {/* EXPANDABLE MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <React.Fragment key="mobile-drawer-fragment">
            {/* Backdrop overlay */}
            <motion.div
              key="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="sm:hidden fixed inset-0 top-[105px] bg-slate-950/70 backdrop-blur-sm z-30"
            />

            {/* Slide-down Drawer Menu */}
            <motion.div
              key="mobile-drawer-panel"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className={`sm:hidden fixed top-[105px] left-0 right-0 z-40 border-b ${
                isDark ? 'bg-slate-950/98 border-slate-800 text-slate-100' : 'bg-white/98 border-slate-200 text-slate-900 shadow-2xl'
              } backdrop-blur-xl max-h-[calc(100vh-9rem)] overflow-y-auto p-4 space-y-4`}
            >
              {/* Menu Title & Close */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">
                      Mobile Menu & Actions
                    </h3>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Select section, manage cards & settings
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'} transition-colors cursor-pointer`}
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links Grid */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompanyId(null);
                    setActiveView('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeView === 'dashboard'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : isDark ? 'hover:bg-slate-900 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      activeView === 'dashboard' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black">Companies Directory</div>
                      <div className={`text-[10px] ${activeView === 'dashboard' ? 'text-slate-950/80 font-medium' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Browse corporate profiles & department cards
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('members');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeView === 'members'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : isDark ? 'hover:bg-slate-900 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      activeView === 'members' ? 'bg-slate-950/20 text-slate-950' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>Team Members Directory</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                          activeView === 'members' ? 'bg-slate-950 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {users.length}
                        </span>
                      </div>
                      <div className={`text-[10px] ${activeView === 'members' ? 'text-slate-950/80 font-medium' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Manage company team members, assign cards & share links
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('leads');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeView === 'leads'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : isDark ? 'hover:bg-slate-900 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      activeView === 'leads' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>Inquiries & Leads</span>
                        {leads.filter((l) => l.status === 'new').length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className={`text-[10px] ${activeView === 'leads' ? 'text-slate-950/80 font-medium' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Incoming customer contacts and requests
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingCard(null);
                    setActiveView('editor');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeView === 'editor'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : isDark ? 'hover:bg-slate-900 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      activeView === 'editor' ? 'bg-slate-950/20 text-slate-950' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black">Smart Card Editor</div>
                      <div className={`text-[10px] ${activeView === 'editor' ? 'text-slate-950/80 font-medium' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Create or edit cards with custom branding
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>

                {/* Step-by-Step Onboarding */}
                <button
                  type="button"
                  onClick={() => {
                    setShowOnboardingWizardModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    isDark ? 'hover:bg-slate-900 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black">Guided Step-by-Step Onboarding</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Simplified 4-step wizard to set up company & team members
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>

                {/* Help & Visual Guide */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHelpGuideModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    isDark ? 'hover:bg-slate-900 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black">Help & Visual Guide (Screenshots)</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Illustrated user manual with workflows & best practices
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowIssueEmployeeModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    isDark ? 'hover:bg-slate-900 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black">Issue Team Member Card</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Generate instant live smart card for a team member
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingCompany(null);
                    setShowCompanyModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    isDark ? 'hover:bg-slate-900 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <FolderPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black">Register New Company</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Add organization profile, brand logo & theme
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>
              </div>

              {/* User Profile & Actions Bar inside Mobile Drawer */}
              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-amber-500/40 shrink-0">
                      {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl || undefined} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-400">
                          {currentUser.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-none`}>
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-amber-500 font-semibold mt-0.5 capitalize">
                        {currentUser.role} Account · {currentUser.email}
                      </div>
                    </div>
                  </div>

                  <ThemeToggle showLabel={false} />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/40">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    <ScanFace className="w-3.5 h-3.5 text-amber-500" />
                    <span>Switch User</span>
                  </button>

                  <label
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-500" />
                    <span>Photo</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={(e) => {
                        handleDirectPhotoUpload(e);
                        setIsMobileMenuOpen(false);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      syncCentralDatabase(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                      dbOnline ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingDb ? 'animate-spin' : ''}`} />
                    <span>Database {dbOnline ? 'Live' : 'Offline'} · Sync Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="app-toast-alert"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold shadow-xl flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-28 sm:pb-8">
        {/* VIEW 1: CARD EDITOR */}
        {activeView === 'editor' && (
          <CardEditor
            card={editingCard}
            defaultCompany={activeCompany}
            companies={companies}
            members={users}
            onSave={handleSaveCard}
            onCancel={() => {
              setEditingCard(null);
              setActiveView('dashboard');
            }}
          />
        )}

        {/* VIEW 2: USERS & EMPLOYEE MANAGEMENT */}
        {activeView === 'members' && (
          <AdminMembers
            members={users}
            cards={cards}
            companies={companies}
            currentUserId={currentUser.id}
            onAddMember={handleAddMember}
            onUpdateUser={handleUpdateUser}
            onUpdateMemberPassword={handleUpdateMemberPassword}
            onAssignCard={handleAssignCard}
            onDeleteMember={handleDeleteMember}
            onOpenAllocateModal={(cardId) => {
              const c = cards.find((x) => x.id === cardId) || cards[0];
              setCardToAllocate(c);
              setAllocateModalMode('single');
              setShowAllocateModal(true);
            }}
            onOpenBulkAllocateModal={() => {
              setCardToAllocate(cards[0]);
              setAllocateModalMode('bulk');
              setShowAllocateModal(true);
            }}
            onOpenIssueCardModal={(targetUser) => {
              setIssueCardTargetUser(targetUser || null);
              setShowIssueEmployeeModal(true);
            }}
            onEditCard={(card) => {
              setEditingCard(card);
              setActiveView('editor');
            }}
            onDeleteCard={(cardId) => {
              handleDeleteCard(cardId);
            }}
            onPreviewCard={(card) => {
              setSelectedCardId(card.id);
              if (card.companyId) {
                setSelectedCompanyId(card.companyId);
              }
              setActiveView('preview_standalone');
            }}
            onSelectEmployeeForPreview={async (user) => {
              const targetComp = companies.find((c) => c.id === user.companyId) || companies[0];
              if (targetComp) {
                setSelectedCompanyId(targetComp.id);
              }
              await handleSelectEmployeeForPreview(user);
              setActiveView('dashboard');
            }}
          />
        )}

        {/* VIEW 3: LEADS & INQUIRIES MANAGER */}
        {activeView === 'leads' && (
          <LeadsManager
            leads={leads}
            onUpdateStatus={async (id, status) => {
              setLeads((prev) =>
                prev.map((l) => (l.id === id ? { ...l, status } : l))
              );
              showToast('Lead status updated in Central DB.');
              await dbUpdateLeadStatus(id, status);
            }}
            onDeleteLead={async (id) => {
              setLeads((prev) => prev.filter((l) => l.id !== id));
              showToast('Lead removed from Central DB.');
              await dbDeleteLead(id);
            }}
          />
        )}

        {/* VIEW 4: MAIN DASHBOARD */}
        {activeView === 'dashboard' && (
          <>
            {/* LEVEL 1: MAIN HOME PAGE - ONLY COMPANIES DIRECTORY */}
            {!selectedCompanyId ? (
              <div className="space-y-6">
                {/* Home Page Top Banner & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Building2 className="w-5 h-5" />
                      </span>
                      <h2 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                        Companies & Organizations
                      </h2>
                    </div>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                      Select a company to manage its linked digital cards, issue team member links, and customize branding.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowHelpGuideModal(true)}
                      className={`px-3 py-2.5 rounded-xl ${
                        isDark ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-800' : 'bg-white hover:bg-slate-50 text-amber-600 border-slate-300 shadow-sm'
                      } border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer`}
                      title="Open Step-by-Step Onboarding Guide with Screenshots"
                    >
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Help & Guide</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOnboardingWizardModal(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/20 transition-all cursor-pointer"
                      title="Launch Step-by-Step Company & Members Onboarding Wizard"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Guided Onboarding</span>
                    </button>

                    <button
                      onClick={() => setActiveView('members')}
                      className={`px-3.5 py-2.5 rounded-xl ${
                        isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      } border font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer`}
                      title="Manage team members, roles, card links, and allocations"
                    >
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Team Members</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingCompany(null);
                        setShowCompanyModal(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>Add Company</span>
                    </button>
                  </div>
                </div>

                {/* Directory Stats Overview Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Total Companies
                    </span>
                    <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>
                      {companies.length}
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Total Cards Linked
                    </span>
                    <div className="text-xl font-black text-amber-400 mt-0.5">
                      {cards.length}
                    </div>
                  </div>

                  {/* Clickable Active Team Members Card */}
                  <div
                    onClick={() => setActiveView('members')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      isDark ? 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-amber-500/60 shadow-sm hover:shadow-amber-950/20' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:border-amber-400'
                    }`}
                    title="Click to view and manage company team members"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Active Team Members
                      </span>
                      <span className="text-[10px] font-bold text-amber-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>Manage</span>
                        <span>→</span>
                      </span>
                    </div>
                    <div className={`text-xl font-black ${isDark ? 'text-slate-200' : 'text-slate-800'} mt-0.5`}>
                      {users.length}
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Total Card Views
                    </span>
                    <div className="text-xl font-black text-emerald-400 mt-0.5">
                      {cards.reduce((acc, c) => acc + (c.viewsCount || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col sm:flex-row items-center justify-between gap-3`}>
                  <div className="relative w-full sm:w-80">
                    <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      placeholder="Search company by name or industry..."
                      value={searchCompanyQuery}
                      onChange={(e) => setSearchCompanyQuery(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      All ({companies.length})
                    </button>
                    {availableCategories.map((cat, catIdx) => (
                      <button
                        key={`cat-filter-${cat}-${catIdx}`}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors shrink-0 ${
                          selectedCategoryFilter === cat
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Companies Grid (Only Companies shown on home page) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCompanies.map((comp, compIdx) => {
                    const linkedCards = cards.filter(
                      (c) =>
                        c.companyId === comp.id ||
                        c.businessName.toLowerCase() === comp.name.toLowerCase()
                    );
                    const totalViews = linkedCards.reduce((acc, c) => acc + (c.viewsCount || 0), 0);
                    const totalEmployees = users.filter((u) =>
                      u.companyId === comp.id ||
                      linkedCards.some((c) => c.assignedMemberId === u.id || u.assignedCardId === c.id)
                    ).length;

                    return (
                      <div
                        key={`comp-${comp.id}-${compIdx}`}
                        onClick={() => {
                          setSelectedCompanyId(comp.id);
                          if (linkedCards.length > 0) {
                            setSelectedCardId(linkedCards[0].id);
                          }
                        }}
                        className={`group p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isDark
                            ? 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-amber-500/60 shadow-lg hover:shadow-amber-950/20'
                            : 'bg-white hover:bg-slate-50/90 border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400'
                        }`}
                      >
                        <div>
                          {/* Top row: Logo thumbnail & Category Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-100'} p-0.5 border overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                              style={{ borderColor: comp.theme?.primaryColor || '#f59e0b' }}
                            >
                              {comp.logoUrl ? (
                                <img
                                  src={comp.logoUrl || undefined}
                                  alt={comp.name}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                <div className={`w-full h-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'} flex items-center justify-center`}>
                                  <Building2 className="w-6 h-6 text-amber-500" />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                                isDark ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {comp.categoryLabel || comp.category}
                              </span>

                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  onClick={() => {
                                    setEditingCompany(comp);
                                    setShowCompanyModal(true);
                                  }}
                                  className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'} transition-colors cursor-pointer`}
                                  title="Edit Company Profile"
                                  aria-label="Edit company"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCompany(comp)}
                                  className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-red-950/40 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'} transition-colors cursor-pointer`}
                                  title="Delete Company"
                                  aria-label="Delete company"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Company Name & Tagline */}
                          <div className="mt-3">
                            <h3 className={`text-base font-bold ${isDark ? 'text-white group-hover:text-amber-400' : 'text-slate-900 group-hover:text-amber-600'} transition-colors leading-snug line-clamp-1`}>
                              {comp.name}
                            </h3>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1 line-clamp-2 leading-relaxed`}>
                              {comp.tagline || comp.aboutText || 'Digital smart communicators and team member profiles.'}
                            </p>
                          </div>

                          {/* Linked Cards Count & Active Personnel Badge */}
                          <div className="mt-4 pt-3 border-t border-slate-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-amber-500">
                              <CreditCard className="w-4 h-4 shrink-0" />
                              <span>{linkedCards.length} {linkedCards.length === 1 ? 'Card Linked' : 'Cards Linked'}</span>
                            </div>

                            <div className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
                              <Users className="w-3.5 h-3.5" />
                              <span>{totalEmployees} {totalEmployees === 1 ? 'Team Member' : 'Team Members'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom CTA to Enter Company Workspace */}
                        <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between">
                          <div className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-medium`}>
                            {totalViews.toLocaleString()} total views
                          </div>

                          <span className="text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            <span>Open Workspace</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredCompanies.length === 0 && (
                  <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
                    <Building2 className="w-12 h-12 text-slate-500 mx-auto opacity-40" />
                    <h3 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      No companies match your search
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Try adjusting your keywords or filter to find the organization you are looking for.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* LEVEL 2: INSIDE A COMPANY WORKSPACE - Cards Details, Adding, Editing & Live Phone Preview */
              <div className="space-y-6">
                {/* Company Workspace Breadcrumbs & Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCompanyId(null)}
                      className={`px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      } border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Companies</span>
                    </button>

                    <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/</span>

                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
                        {activeCompany?.name}
                      </h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isDark ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {activeCompany?.categoryLabel || activeCompany?.category}
                      </span>
                    </div>
                  </div>

                  {activeCompany && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveView('members')}
                        className={`px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        } border text-xs font-bold flex items-center gap-1.5 transition-colors`}
                        title="Manage team members and allocations"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Team Members</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingCompany(activeCompany);
                          setShowCompanyModal(true);
                        }}
                        className={`px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        } border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Company</span>
                      </button>

                      <button
                        onClick={() => setShowIssueEmployeeModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        title="Issue a team member smart card for this company"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Issue Team Member Card</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingCard(null);
                          setActiveView('editor');
                        }}
                        className={`px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        } border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer`}
                        title="Create a new card variant from scratch"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Card</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Company Overview Header Banner */}
                {activeCompany && (
                  <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-100'} p-0.5 border overflow-hidden shrink-0 shadow-md`}
                          style={{ borderColor: activeCompany.theme?.primaryColor || '#f59e0b' }}
                        >
                          {activeCompany.logoUrl ? (
                            <img
                              src={activeCompany.logoUrl || undefined}
                              alt={activeCompany.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <div className={`w-full h-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'} flex items-center justify-center`}>
                              <Building2 className="w-8 h-8 text-amber-500" />
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {activeCompany.name}
                          </h3>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                            {activeCompany.tagline}
                          </p>
                          <div className={`flex flex-wrap items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-2`}>
                            {activeCompany.website && (
                              <a
                                href={activeCompany.website}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                              >
                                <Globe className="w-3.5 h-3.5 text-amber-500" />
                                <span>{activeCompany.website.replace(/^https?:\/\//, '')}</span>
                              </a>
                            )}
                            {activeCompany.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-amber-500" />
                                <span>{activeCompany.phone}</span>
                              </span>
                            )}
                            {activeCompany.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                <span>{activeCompany.address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Company Linked Cards Count Banner */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setCompanyWorkspaceTab('allocated')}
                          className={`p-2.5 sm:p-3 px-3 sm:px-4 rounded-xl border text-center transition-all cursor-pointer ${
                            companyWorkspaceTab === 'allocated' || companyWorkspaceTab === 'cards'
                              ? 'bg-amber-500/15 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                              : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block truncate`}>
                            Issued Cards
                          </span>
                          <div className="text-base sm:text-lg font-black text-amber-400">
                            {allocatedCompanyCards.length}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompanyWorkspaceTab('employees')}
                          className={`p-2.5 sm:p-3 px-3 sm:px-4 rounded-xl border text-center transition-all cursor-pointer ${
                            companyWorkspaceTab === 'employees'
                              ? 'bg-sky-500/15 border-sky-500/50 shadow-sm ring-1 ring-sky-500/30'
                              : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block truncate`}>
                            Team Members
                          </span>
                          <div className="text-base sm:text-lg font-black text-sky-400">
                            {companyEmployees.length}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompanyWorkspaceTab('template')}
                          className={`p-2.5 sm:p-3 px-3 sm:px-4 rounded-xl border text-center transition-all cursor-pointer ${
                            companyWorkspaceTab === 'template'
                              ? 'bg-purple-500/15 border-purple-500/50 shadow-sm ring-1 ring-purple-500/30'
                              : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} block truncate`}>
                            Template
                          </span>
                          <div className="text-base sm:text-lg font-black text-purple-400">
                            {companyTemplateCard ? 'Active' : 'Base'}
                          </div>
                        </button>

                        <div className={`p-2.5 sm:p-3 px-3 sm:px-4 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border text-center`}>
                          <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} block truncate`}>
                            Total Views
                          </span>
                          <div className="text-base sm:text-lg font-black text-emerald-400">
                            {companyCards.reduce((acc, c) => acc + (c.viewsCount || 0), 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Workspace Two-Column Grid: Cards or Employee List (Left) + Interactive Phone Simulator (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Workspace Tab Switcher Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
                      <div className={`p-1 rounded-xl border flex flex-wrap sm:flex-nowrap items-center gap-1 w-full sm:w-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                        <button
                          type="button"
                          onClick={() => setCompanyWorkspaceTab('allocated')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            companyWorkspaceTab === 'allocated' || companyWorkspaceTab === 'cards'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Issued Cards ({allocatedCompanyCards.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompanyWorkspaceTab('employees')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            companyWorkspaceTab === 'employees'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            Team Members ({companyEmployees.length})
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompanyWorkspaceTab('template')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            companyWorkspaceTab === 'template'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Template</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setCardToAllocate(companyTemplateCard || companyCards[0] || cards[0]);
                            setAllocateModalMode('bulk');
                            setShowAllocateModal(true);
                          }}
                          className={`min-h-[34px] px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 shadow-sm'
                          }`}
                          title="Allocate cards to multiple team members simultaneously"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Bulk Allocate Cards</span>
                        </button>

                        {companyWorkspaceTab === 'employees' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowLinkEmployeeModal(true)}
                              className={`min-h-[34px] px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
                              }`}
                              title="Link an existing personnel to this company"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-sky-400" />
                              <span>Link Personnel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowIssueEmployeeModal(true)}
                              className="min-h-[34px] px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                              title="Add a new team member and allocate a card"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>New Team Member</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowIssueEmployeeModal(true)}
                            className="min-h-[34px] px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Issue Team Member Card</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* View 1: ALLOCATED & ISSUED CARDS TAB */}
                    {(companyWorkspaceTab === 'allocated' || companyWorkspaceTab === 'cards') && (
                      <div className="space-y-3">
                        {allocatedCompanyCards.map((card, cardIdx) => {
                          const isSelected = card.id === selectedCardId;
                          const assignedMember =
                            users.find((u) => u.id === card.assignedMemberId) ||
                            users.find((u) => u.assignedCardId === card.id) ||
                            (card.contactPersonName ? users.find((u) => u.name.toLowerCase().trim() === card.contactPersonName.toLowerCase().trim()) : undefined);
                          const cardUrl = `${window.location.origin}/card/${card.slug}`;

                          return (
                            <div
                              key={`card-${card.id}-${cardIdx}`}
                              onClick={() => {
                                setSelectedCardId(card.id);
                                showToast(`Simulating ${assignedMember?.name || card.contactPersonName || card.businessName}'s card`);
                              }}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                isSelected
                                  ? isDark
                                    ? 'bg-slate-900 border-amber-500/80 shadow-xl shadow-amber-950/20 ring-2 ring-amber-500/60'
                                    : 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-400/60'
                                  : isDark
                                  ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {/* Member Avatar / Photo */}
                                  <div
                                    className={`w-12 h-12 rounded-xl ${isDark ? 'bg-slate-950' : 'bg-slate-100'} p-0.5 border overflow-hidden shrink-0 shadow-sm`}
                                    style={{ borderColor: activeCompany?.theme?.primaryColor || card.theme.primaryColor || '#ef4444' }}
                                  >
                                    {assignedMember?.avatarUrl || (card.logoUrl && card.logoUrl !== activeCompany?.logoUrl) ? (
                                      <img
                                        src={assignedMember?.avatarUrl || card.logoUrl || undefined}
                                        alt={card.contactPersonName || card.businessName}
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      <div className={`w-full h-full ${isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-100 text-amber-700'} flex items-center justify-center font-bold text-xs`}>
                                        {(card.contactPersonName || assignedMember?.name || 'EM')
                                          .split(' ')
                                          .map((p) => p[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-tight truncate`}>
                                        {card.contactPersonName || assignedMember?.name || card.businessName}
                                      </h3>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 ${
                                          card.status === 'live'
                                            ? isDark
                                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
                                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                                        }`}
                                      >
                                        {card.status}
                                      </span>

                                      {isSelected && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                          Live Simulator Active
                                        </span>
                                      )}
                                    </div>

                                    {/* Role & Company Brand Affiliation Tag */}
                                    <p className="text-xs text-amber-500 font-semibold mt-0.5 flex items-center gap-1 truncate">
                                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">
                                        {card.designation || assignedMember?.designation || 'Team Member'} • {activeCompany?.name}
                                      </span>
                                    </p>

                                    <div className={`flex flex-wrap items-center gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1.5 font-mono`}>
                                      <span className="truncate">/card/<strong>{card.slug}</strong></span>
                                      <span>•</span>
                                      <span>{card.viewsCount} views</span>
                                      {card.socialLinks?.phone && (
                                        <>
                                          <span>•</span>
                                          <span className="font-sans">{card.socialLinks.phone}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Card action buttons */}
                                <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/40 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                                  {/* Preview in Simulator */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCardId(card.id);
                                      showToast(`Simulating ${card.contactPersonName || card.businessName}'s card in live simulator`);
                                    }}
                                    className={`min-h-[34px] px-2.5 py-1.5 rounded-xl ${
                                      isSelected
                                        ? 'bg-amber-500 text-slate-950 font-bold'
                                        : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                    } text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0`}
                                    title="View this card in the live simulator on the right"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{isSelected ? 'Simulating' : 'Preview'}</span>
                                  </button>

                                  {/* Quick Copy Link button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(cardUrl);
                                      showToast(`Card link copied: /card/${card.slug}`);
                                    }}
                                    className="min-h-[34px] min-w-[34px] p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                                    title="Copy direct team member card link"
                                    aria-label="Copy card link"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Allocate / Reassign Card to Team Member */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCardToAllocate(card);
                                      setShowAllocateModal(true);
                                    }}
                                    className={`min-h-[34px] p-1.5 px-2.5 rounded-xl ${
                                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                    } border text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm cursor-pointer shrink-0`}
                                    title={assignedMember ? "Reassign or unassign this card" : "Allocate this card to a team member"}
                                    aria-label="Allocate card"
                                  >
                                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{assignedMember ? 'Reassign' : 'Allocate'}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingCard(card);
                                      setActiveView('editor');
                                    }}
                                    className={`min-h-[34px] min-w-[34px] p-2 rounded-xl ${
                                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                    } border transition-colors flex items-center justify-center cursor-pointer shrink-0`}
                                    title="Edit Card"
                                    aria-label="Edit card"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedCardId(card.id);
                                      setActiveView('preview_standalone');
                                    }}
                                    className={`min-h-[34px] min-w-[34px] p-2 rounded-xl ${
                                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                    } border transition-colors flex items-center justify-center cursor-pointer shrink-0`}
                                    title="Fullscreen Preview"
                                    aria-label="Fullscreen preview"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCardToPrint(card);
                                      setShowPrintModal(true);
                                    }}
                                    className={`min-h-[34px] min-w-[34px] p-2 rounded-xl ${
                                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-amber-600 border-slate-300'
                                    } border transition-colors flex items-center justify-center cursor-pointer shrink-0`}
                                    title="Print 10 Physical Cards (Sheet)"
                                    aria-label="Print 10 physical cards"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCard(card.id)}
                                    className={`min-h-[34px] min-w-[34px] p-2 rounded-xl ${
                                      isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                    } transition-colors flex items-center justify-center cursor-pointer shrink-0`}
                                    title="Delete Card"
                                    aria-label="Delete card"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {allocatedCompanyCards.length === 0 && (
                          <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
                            <CreditCard className="w-10 h-10 text-slate-500 mx-auto opacity-40" />
                            <h3 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              No cards allocated to team members under {activeCompany?.name} yet
                            </h3>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              Issue individual smart cards for each team member. Every allocated card has a unique link while maintaining the same {activeCompany?.name} branding.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                              <button
                                onClick={() => setShowIssueEmployeeModal(true)}
                                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4" />
                                <span>Issue Team Member Card</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCardToAllocate(companyTemplateCard || cards[0]);
                                  setAllocateModalMode('bulk');
                                  setShowAllocateModal(true);
                                }}
                                className={`px-4 py-2 rounded-xl ${
                                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                } font-bold text-xs inline-flex items-center gap-1.5 border border-slate-700 cursor-pointer`}
                              >
                                <Users className="w-3.5 h-3.5 text-amber-400" />
                                <span>Bulk Allocate Team Cards</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* View 2: EMPLOYEES DIRECTORY TAB */}
                    {companyWorkspaceTab === 'employees' && (
                      <div className="space-y-3">
                        {(() => {
                          if (!activeCompany) return null;
                          const companyEmployees = users.filter(
                            (u) =>
                              u.companyId === activeCompany.id ||
                              companyCards.some((c) => c.assignedMemberId === u.id || u.assignedCardId === c.id)
                          );

                          if (companyEmployees.length === 0) {
                            return (
                              <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
                                <Users className="w-10 h-10 text-slate-500 mx-auto opacity-40" />
                                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  No employees registered under {activeCompany.name} yet
                                </h3>
                                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  Link existing personnel or issue a new card to add employees directly to this company.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                  <button
                                    onClick={() => setShowLinkEmployeeModal(true)}
                                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Link Existing Personnel</span>
                                  </button>
                                  <button
                                    onClick={() => setShowIssueEmployeeModal(true)}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Issue Employee Card</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return companyEmployees.map((emp, empIdx) => {
                            const assignedCard =
                              cards.find((c) => c.id === emp.assignedCardId) ||
                              companyCards.find((c) => c.assignedMemberId === emp.id);
                            const isAdminUser = emp.role === 'admin';
                            const isCurrentlyActiveInSimulator =
                              !!activeCard &&
                              ((assignedCard && activeCard.id === assignedCard.id) ||
                                activeCard.assignedMemberId === emp.id ||
                                (activeCard.contactPersonName && emp.name && activeCard.contactPersonName.toLowerCase().trim() === emp.name.toLowerCase().trim()));

                            return (
                              <div
                                key={`emp-${emp.id}-${empIdx}`}
                                onClick={() => handleSelectEmployeeForPreview(emp)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                  isCurrentlyActiveInSimulator
                                    ? isDark
                                      ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                                      : 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                                    : isDark
                                    ? 'bg-slate-900/70 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
                                    : 'bg-white border-slate-200 shadow-sm hover:border-amber-400 hover:bg-slate-50'
                                } space-y-3`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Employee Avatar */}
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-sm flex items-center justify-center relative">
                                      {emp.avatarUrl ? (
                                        <img src={emp.avatarUrl || undefined} alt={emp.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-sm font-bold text-amber-400">
                                          {emp.name
                                            .split(' ')
                                            .map((p) => p[0])
                                            .join('')
                                            .slice(0, 2)
                                            .toUpperCase()}
                                        </span>
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
                                          {emp.name}
                                        </h4>
                                        <span
                                          className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 ${
                                            isAdminUser
                                              ? isDark
                                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                                              : isDark
                                              ? 'bg-sky-950/80 text-sky-300 border border-sky-800/40'
                                              : 'bg-sky-50 text-sky-800 border border-sky-200'
                                          }`}
                                        >
                                          {isAdminUser ? 'Admin' : 'Employee'}
                                        </span>

                                        {isCurrentlyActiveInSimulator && (
                                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Live Simulator Active
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs text-amber-500 font-semibold mt-0.5 truncate">
                                        {emp.designation || 'Company Employee'}
                                      </p>

                                      <div className={`flex flex-wrap items-center gap-3 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                                        {emp.email && <span className="truncate">{emp.email}</span>}
                                        {emp.phone && (
                                          <span className="flex items-center gap-1 truncate">
                                            <span>•</span>
                                            <span>{emp.phone}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Employee Actions */}
                                  <div className="flex items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/40 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {/* Unlink from Company Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleUnlinkEmployeeFromCompany(emp.id, activeCompany.id)}
                                      className={`min-h-[34px] px-2.5 py-1.5 rounded-xl ${
                                        isDark ? 'bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border-slate-700' : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border-slate-200'
                                      } border text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer`}
                                      title={`Unlink ${emp.name} from ${activeCompany.name}`}
                                    >
                                      <Unlink className="w-3.5 h-3.5" />
                                      <span>Unlink Company</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Linked Card Status Bar */}
                                <div
                                  onClick={() => handleSelectEmployeeForPreview(emp)}
                                  className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                                    assignedCard
                                      ? isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                                      : isDark ? 'bg-amber-950/20 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                                  } flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                                >
                                  {assignedCard ? (
                                    <>
                                      <div className="flex items-center gap-2 min-w-0">
                                        <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
                                              {assignedCard.businessName}
                                            </span>
                                            <span className="text-[10px] font-mono text-emerald-400">/card/{assignedCard.slug}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleSelectEmployeeForPreview(emp)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                            isCurrentlyActiveInSimulator
                                              ? 'bg-amber-500 text-slate-950 font-bold'
                                              : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                                          } transition-colors flex items-center gap-1 cursor-pointer`}
                                          title="View card simulation in simulator"
                                        >
                                          <Eye className="w-3 h-3 text-amber-400" />
                                          <span>{isCurrentlyActiveInSimulator ? 'Simulating' : 'Preview'}</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/card/${assignedCard.slug}`);
                                            showToast(`Copied ${emp.name}'s card link!`);
                                          }}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                                          } transition-colors flex items-center gap-1 cursor-pointer`}
                                          title="Copy direct profile link"
                                        >
                                          <Copy className="w-3 h-3" />
                                          <span>Copy Link</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingCard(assignedCard);
                                            setActiveView('editor');
                                          }}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                                          } transition-colors flex items-center gap-1 cursor-pointer`}
                                          title="Edit this card"
                                        >
                                          <Edit className="w-3 h-3 text-sky-400" />
                                          <span>Edit Card</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCard(assignedCard.id)}
                                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition-colors flex items-center gap-1 cursor-pointer"
                                          title="Delete this card"
                                        >
                                          <Trash2 className="w-3 h-3 text-red-400" />
                                          <span>Delete</span>
                                        </button>

                                        {/* Unlink Card Button */}
                                        <button
                                          type="button"
                                          onClick={() => handleUnlinkEmployeeCard(emp.id, assignedCard.id)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                            isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                                          } transition-colors flex items-center gap-1 cursor-pointer`}
                                          title={`Unlink card from ${emp.name}`}
                                        >
                                          <UserX className="w-3 h-3" />
                                          <span>Unlink</span>
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-xs font-medium">No smart card allocated to this employee yet</span>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleSelectEmployeeForPreview(emp)}
                                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                                        >
                                          <UserCheck className="w-3 h-3" />
                                          <span>Allocate & Simulate</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setShowIssueEmployeeModal(true)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                                          } transition-colors flex items-center gap-1 cursor-pointer`}
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Issue Card</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {/* View 3: COMPANY MASTER TEMPLATE TAB */}
                    {companyWorkspaceTab === 'template' && (
                      <div className="space-y-4">
                        {companyTemplateCard ? (
                          <div
                            className={`p-5 rounded-2xl border transition-all ${
                              activeCard?.id === companyTemplateCard.id
                                ? isDark
                                  ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                                  : 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/40 shadow-md'
                                : isDark
                                ? 'bg-slate-900/80 border-slate-800'
                                : 'bg-white border-slate-200 shadow-sm'
                            } space-y-4`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div
                                  className="w-14 h-14 rounded-2xl bg-slate-950 p-0.5 border overflow-hidden shrink-0 shadow-md"
                                  style={{ borderColor: activeCompany?.theme?.primaryColor || companyTemplateCard.theme?.primaryColor || '#f59e0b' }}
                                >
                                  {companyTemplateCard.logoUrl ? (
                                    <img
                                      src={companyTemplateCard.logoUrl || undefined}
                                      alt={companyTemplateCard.businessName}
                                      className="w-full h-full object-cover rounded-xl"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                      <Building2 className="w-7 h-7 text-amber-500" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} leading-tight truncate`}>
                                      {companyTemplateCard.businessName}
                                    </h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      Master Brand Template
                                    </span>
                                    {activeCard?.id === companyTemplateCard.id && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Simulating in Live Phone
                                      </span>
                                    )}
                                  </div>

                                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5 truncate`}>
                                    {companyTemplateCard.tagline || activeCompany?.tagline}
                                  </p>

                                  <div className="flex items-center gap-2 text-[11px] text-amber-400 font-mono mt-1">
                                    <span>/card/<strong>{companyTemplateCard.slug}</strong></span>
                                    <span>•</span>
                                    <span>{companyTemplateCard.viewsCount || 0} views</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCardId(companyTemplateCard.id);
                                    showToast(`Simulating ${companyTemplateCard.businessName} Master Corporate Template`);
                                  }}
                                  className={`px-3 py-2 rounded-xl ${
                                    activeCard?.id === companyTemplateCard.id
                                      ? 'bg-amber-500 text-slate-950 font-black'
                                      : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                  } text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer`}
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{activeCard?.id === companyTemplateCard.id ? 'Simulating Template' : 'Simulate Template'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCard(companyTemplateCard);
                                    setActiveView('editor');
                                  }}
                                  className={`p-2 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} border border-slate-700 transition-colors cursor-pointer`}
                                  title="Edit Template Guidelines"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCard(companyTemplateCard.id)}
                                  className={`p-2 rounded-xl ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'} border border-slate-700 transition-colors cursor-pointer`}
                                  title="Delete Template Card"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Brand Guidelines Inheritance Banner */}
                            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-amber-400 flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                                  Corporate Branding Standards
                                </span>
                                <span className="text-slate-400 text-[11px]">Strictly applied to all employee cards</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Brand Accent</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <div
                                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm shrink-0"
                                      style={{ backgroundColor: activeCompany?.theme?.primaryColor || companyTemplateCard.theme?.primaryColor || '#f59e0b' }}
                                    />
                                    <span className="font-mono text-white text-[11px] truncate">
                                      {activeCompany?.theme?.primaryColor || companyTemplateCard.theme?.primaryColor || '#f59e0b'}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Hero Banners</span>
                                  <span className="font-bold text-white text-[11px] block mt-1 truncate">
                                    {companyTemplateCard.banners?.length || 0} slide(s)
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Services</span>
                                  <span className="font-bold text-white text-[11px] block mt-1 truncate">
                                    {companyTemplateCard.services?.length || 0} listed
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Theme Mode</span>
                                  <span className="font-bold text-white text-[11px] block mt-1 capitalize truncate">
                                    {companyTemplateCard.theme?.bgType || 'Image / Glass'}
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Schedule</span>
                                  <span className="font-bold text-amber-400 text-[11px] block mt-1 truncate" title={companyTemplateCard.operatingHours || activeCompany?.operatingHours}>
                                    {companyTemplateCard.operatingHours || activeCompany?.operatingHours || 'Mon - Fri 08:00 - 17:00'}
                                  </span>
                                </div>
                              </div>

                              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                                All team member smart cards issued under <strong>{activeCompany?.name}</strong> automatically inherit this corporate design, theme colors, banners, and logo. Each team member receives a unique direct link and contact profile while brand identity remains uniform across the organization.
                              </p>

                              <div className="pt-2 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowIssueEmployeeModal(true)}
                                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Issue Team Member from Template</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCardToAllocate(companyTemplateCard);
                                    setAllocateModalMode('bulk');
                                    setShowAllocateModal(true);
                                  }}
                                  className={`px-3 py-2 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'} font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer`}
                                >
                                  <Users className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Bulk Allocate to Team</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
                            <Building2 className="w-10 h-10 text-slate-500 mx-auto opacity-40" />
                            <h3 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              No master template card for {activeCompany?.name}
                            </h3>
                            <button
                              onClick={() => {
                                setEditingCard(null);
                                setActiveView('editor');
                              }}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Create Template Card</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Interactive Phone Preview */}
                  <div id="company-live-simulator" className="lg:col-span-6 flex flex-col items-center">
                    {/* Preview Toolbar */}
                    <div className="w-full max-w-[440px] mb-3 flex items-center justify-between text-xs px-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-300">
                        <Smartphone className="w-4 h-4 text-amber-400" />
                        <span>Live Card Simulator</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && activeCard && (
                          <button
                            onClick={() => {
                              setCardToAllocate(activeCard);
                              setShowAllocateModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Allocate this card to an employee"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Allocate</span>
                            {activeCard.assignedMemberId && (
                              <span className="text-[10px] text-emerald-400 font-normal hidden sm:inline">
                                ({users.find((u) => u.id === activeCard.assignedMemberId)?.name?.split(' ')[0] || 'Assigned'})
                              </span>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setCardToPrint(activeCard);
                            setShowPrintModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors"
                          title="Print 10 physical business cards on a single sheet"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Print (10/pg)</span>
                        </button>

                        {isAdmin && activeCard && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCard(activeCard);
                              setActiveView('editor');
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors"
                            title="Edit this active card"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-400" />
                            <span>Edit</span>
                          </button>
                        )}

                        {isAdmin && activeCard && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(activeCard.id)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors"
                            title="Delete this active card"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            <span>Delete</span>
                          </button>
                        )}

                        <button
                          onClick={() => setActiveView('preview_standalone')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                          title="Open Fullscreen"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Fullscreen</span>
                        </button>
                      </div>
                    </div>

                    {/* Mobile Phone Mockup Container */}
                    <div className="w-full flex justify-center">
                      {activeCard ? (
                        <CardView
                          card={activeCard}
                          allocatedMember={
                            users.find((u) => u.id === activeCard.assignedMemberId) ||
                            users.find((u) => u.assignedCardId === activeCard.id) ||
                            (activeCard.contactPersonName ? users.find((u) => u.name.toLowerCase().trim() === activeCard.contactPersonName.toLowerCase().trim()) : null) ||
                            null
                          }
                          company={activeCompany || companies.find((c) => c.id === (activeCard.companyId || users.find((u) => u.id === activeCard.assignedMemberId)?.companyId))}
                          companyTemplate={
                            companyTemplateCard ||
                            cards.find((c) => c.companyId === (activeCard.companyId || activeCompany?.id) && !c.assignedMemberId) ||
                            null
                          }
                          onLeadSubmit={handleLeadSubmit}
                          onActionClick={handleActionClick}
                        />
                      ) : (
                        <div className={`w-[360px] h-[580px] rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'} flex flex-col items-center justify-center p-6 text-center`}>
                          <CreditCard className="w-12 h-12 mb-3 opacity-30" />
                          <p className="text-xs">Select or issue a smart card to view simulation</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL 1: Authentication / Profile Switcher Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          users={users}
          onLoginSuccess={(user: User) => {
            setCurrentUser(user);
            setShowAuthModal(false);
            showToast(`Logged in as ${user.name} (${user.role.toUpperCase()})`);
          }}
        />
      )}

      {/* MODAL 2: Issue Company Card to Employee Modal */}
      {showIssueEmployeeModal && (
        <IssueEmployeeCardModal
          isOpen={showIssueEmployeeModal}
          onClose={() => {
            setShowIssueEmployeeModal(false);
            setIssueCardTargetUser(null);
          }}
          companies={cards}
          defaultCompanyId={selectedCompanyId || undefined}
          existingEmployees={users}
          targetEmployee={issueCardTargetUser}
          onIssueCard={handleIssueEmployeeCard}
          onOpenCardPreview={(cardId, slug) => {
            setSelectedCardId(cardId);
            const found = cards.find((c) => c.id === cardId);
            const finalSlug = slug || found?.slug;
            if (finalSlug) {
              try {
                window.history.pushState({}, '', `/card/${finalSlug}`);
              } catch {
                window.location.hash = `card/${finalSlug}`;
              }
            }
            setActiveView('preview_standalone');
          }}
        />
      )}

      {/* MODAL 3: Allocate Business Card Modal */}
      {showAllocateModal && (
        <AllocateCardModal
          isOpen={showAllocateModal}
          onClose={() => setShowAllocateModal(false)}
          card={cardToAllocate}
          employees={users}
          allCards={cards}
          onAllocate={handleAllocateCard}
          onBulkAllocate={handleBulkAllocateCards}
          initialMode={allocateModalMode}
        />
      )}

      {/* MODAL 4: Company Create / Edit Modal */}
      {showCompanyModal && (
        <CompanyModal
          isOpen={showCompanyModal}
          onClose={() => {
            setShowCompanyModal(false);
            setEditingCompany(null);
          }}
          company={editingCompany}
          onSave={handleSaveCompany}
        />
      )}

      {/* MODAL 5: Professional Confirmation Modal for Card Deletion */}
      {cardToDelete && (
        <ConfirmationModal
          isOpen={!!cardToDelete}
          onClose={() => setCardToDelete(null)}
          onConfirm={() => {
            if (cardToDelete) executeDeleteCard(cardToDelete);
          }}
          title="Delete Smart Card"
          highlightText={cardToDelete?.businessName}
          message="Are you sure you want to permanently delete this digital business card? All active QR links and personalized shares for this card will stop responding."
          confirmLabel="Yes, Delete Card"
          cancelLabel="Keep Card"
          type="danger"
        />
      )}

      {/* MODAL 6: Professional Confirmation Modal for Company Deletion */}
      {companyToDelete && (
        <ConfirmationModal
          isOpen={!!companyToDelete}
          onClose={() => setCompanyToDelete(null)}
          onConfirm={() => {
            if (companyToDelete) executeDeleteCompany(companyToDelete);
          }}
          title="Delete Company & Linked Cards"
          highlightText={companyToDelete?.name}
          message="Are you sure you want to delete this company? All associated digital business cards, employee links, and brand settings linked to this company will also be removed."
          confirmLabel="Yes, Delete Company"
          cancelLabel="Cancel"
          type="danger"
        />
      )}

      {/* MODAL 7: Link Existing Personnel to Company */}
      {showLinkEmployeeModal && activeCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`w-full max-w-lg rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            } overflow-hidden max-h-[85vh] flex flex-col`}
          >
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 border-b ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50'} flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Link Personnel to {activeCompany.name}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Select an existing employee or administrator to associate with this company.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLinkEmployeeModal(false);
                  setLinkEmployeeSearch('');
                }}
                className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'} cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search filter */}
            <div className="p-4 border-b border-slate-800/40">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search personnel by name, email, designation..."
                  value={linkEmployeeSearch}
                  onChange={(e) => setLinkEmployeeSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  } border text-xs focus:outline-none focus:border-amber-500`}
                />
              </div>
            </div>

            {/* List of unlinked / other employees */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {(() => {
                const availablePersonnel = users.filter((u) => {
                  const matchesSearch =
                    !linkEmployeeSearch ||
                    u.name.toLowerCase().includes(linkEmployeeSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(linkEmployeeSearch.toLowerCase()) ||
                    (u.designation && u.designation.toLowerCase().includes(linkEmployeeSearch.toLowerCase()));
                  return matchesSearch;
                });

                if (availablePersonnel.length === 0) {
                  return (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No personnel matching your search.
                    </div>
                  );
                }

                return availablePersonnel.map((u, uIdx) => {
                  const isAlreadyLinked = u.companyId === activeCompany.id;
                  const currentCompany = companies.find((c) => c.id === u.companyId);

                  return (
                    <div
                      key={`personnel-${u.id}-${uIdx}`}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isAlreadyLinked
                          ? isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                          : isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl || undefined} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-amber-400">
                              {u.name
                                .split(' ')
                                .map((p) => p[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
                            {u.name}
                          </h4>
                          <p className="text-[11px] text-amber-500 font-medium truncate">
                            {u.designation || (u.role === 'admin' ? 'Administrator' : 'Employee')}
                          </p>
                          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>
                            {currentCompany ? `Current: ${currentCompany.name}` : 'Unassigned to any company'}
                          </p>
                        </div>
                      </div>

                      {isAlreadyLinked ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                          Already Linked
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLinkEmployeeToCompany(u.id, activeCompany.id)}
                          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-sm shrink-0 cursor-pointer"
                        >
                          <Link className="w-3 h-3" />
                          <span>Link to {activeCompany.name.split(' ')[0]}</span>
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className={`p-3 px-4 border-t ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50'} flex items-center justify-end`}>
              <button
                type="button"
                onClick={() => {
                  setShowLinkEmployeeModal(false);
                  setLinkEmployeeSearch('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                } transition-colors cursor-pointer`}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 8: Step-by-Step Onboarding Wizard Modal */}
      {showOnboardingWizardModal && (
        <OnboardingWizardModal
          isOpen={showOnboardingWizardModal}
          onClose={() => setShowOnboardingWizardModal(false)}
          onComplete={handleCompleteOnboardingWizard}
        />
      )}

      {/* MODAL 9: Help & Onboarding Guide with Screenshots Modal */}
      {showHelpGuideModal && (
        <HelpGuideModal
          isOpen={showHelpGuideModal}
          onClose={() => setShowHelpGuideModal(false)}
          onStartOnboarding={() => setShowOnboardingWizardModal(true)}
        />
      )}

      {/* MODAL 10: Print Actual Business Cards (10 per Page Sheet) */}
      {showPrintModal && cardToPrint && (
        <PrintBusinessCardsModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setCardToPrint(null);
          }}
          card={cardToPrint}
          company={companies.find((c) => c.id === (cardToPrint.companyId || (activeCompany && activeCompany.id)))}
          allocatedMember={users.find((u) => u.id === cardToPrint.assignedMemberId || u.assignedCardId === cardToPrint.id)}
        />
      )}

      {/* Mobile Bottom Navigation Dock for instant 1-tap thumb navigation */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t ${
        isDark ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-xl'
      } backdrop-blur-lg px-2 py-1.5 flex items-center justify-around safe-area-bottom`}>
        {/* 1. Companies */}
        <button
          type="button"
          onClick={() => {
            setSelectedCompanyId(null);
            setActiveView('dashboard');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            activeView === 'dashboard' && !isMobileMenuOpen
              ? 'text-amber-500'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Companies</span>
        </button>

        {/* 2. Employees */}
        <button
          type="button"
          onClick={() => {
            setActiveView('members');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-bold transition-colors relative cursor-pointer ${
            activeView === 'members' && !isMobileMenuOpen
              ? 'text-amber-500'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employees</span>
          {users.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute top-1 right-3" />
          )}
        </button>

        {/* 3. Center Highlight: New Card */}
        <button
          type="button"
          onClick={() => {
            setEditingCard(null);
            setActiveView('editor');
            setIsMobileMenuOpen(false);
          }}
          className="flex flex-col items-center -mt-3 shrink-0 cursor-pointer"
          title="Create New Smart Card"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center text-slate-950 active:scale-95 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-black text-amber-500 mt-0.5">New Card</span>
        </button>

        {/* 4. Inquiries */}
        <button
          type="button"
          onClick={() => {
            setActiveView('leads');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-bold transition-colors relative cursor-pointer ${
            activeView === 'leads' && !isMobileMenuOpen
              ? 'text-amber-500'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Inquiries</span>
          {leads.filter((l) => l.status === 'new').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-0.5 right-3 animate-pulse" />
          )}
        </button>

        {/* 5. Mobile Menu Drawer Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            isMobileMenuOpen
              ? 'text-amber-500'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Menu</span>
        </button>
      </div>
    </div>
  );
}
