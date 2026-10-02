import React, { useState, useEffect } from 'react';
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
  Camera,
} from 'lucide-react';

import { BusinessCard, LeadInquiry, User } from './types';
import { INITIAL_CARDS, INITIAL_USERS, INITIAL_LEADS } from './data/defaultCards';
import { CardView } from './components/CardView';
import { CardEditor } from './components/CardEditor';
import { AdminMembers } from './components/AdminMembers';
import { LeadsManager } from './components/LeadsManager';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';
import { AuthModal } from './components/AuthModal';
import { PhotoCaptureModal } from './components/PhotoCaptureModal';
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
} from './lib/supabase';

export default function App() {
  // Persistence state
  const [cards, setCards] = useState<BusinessCard[]>(() => {
    try {
      const saved = localStorage.getItem('yebocards_data');
      return saved ? JSON.parse(saved) : INITIAL_CARDS;
    } catch {
      return INITIAL_CARDS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('yebousers_data');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [leads, setLeads] = useState<LeadInquiry[]>(() => {
    try {
      const saved = localStorage.getItem('yeboleads_data');
      return saved ? JSON.parse(saved) : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  // Current logged in user (default to Zweli - Master Admin for rich management experience)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    return users.find((u) => u.email === 'zweli@msn.com') || users[0];
  });

  // Active view: 'dashboard' | 'editor' | 'members' | 'leads' | 'preview_standalone'
  const [activeView, setActiveView] = useState<'dashboard' | 'editor' | 'members' | 'leads' | 'preview_standalone'>('dashboard');
  
  // Selected card for preview or editing
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [editingCard, setEditingCard] = useState<BusinessCard | null>(null);

  // Device simulation frame for card preview
  const [deviceFrame, setDeviceFrame] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [dbOnline, setDbOnline] = useState<boolean>(true);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);

  // Initial load & central database synchronization
  useEffect(() => {
    let isMounted = true;

    async function initCentralDatabase() {
      setIsSyncingDb(true);
      try {
        // Ensure Clint and Zweli exist in database seed
        await seedCentralDatabaseIfNeeded();

        // 1. Fetch real cards from Central DB
        const realCards = await dbFetchCards();
        if (isMounted && realCards.length > 0) {
          setCards(realCards);
          setSelectedCardId(realCards[0].id);
        }

        // 2. Fetch real users from Central DB
        const realUsers = await dbFetchUsers();
        if (isMounted && realUsers.length > 0) {
          setUsers(realUsers);
          // If Clint isn't in DB yet, ensure he is added and saved
          if (!realUsers.some((u) => u.email === 'clint@rapid911.co.za')) {
            const clint = INITIAL_USERS.find((u) => u.email === 'clint@rapid911.co.za');
            if (clint) {
              await dbSaveUser(clint);
              setUsers((prev) => [...prev, clint]);
            }
          }
        }

        // 3. Fetch real leads from Central DB
        const realLeads = await dbFetchLeads();
        if (isMounted && realLeads.length > 0) {
          setLeads(realLeads);
        }

        if (isMounted) setDbOnline(true);
      } catch (err) {
        console.warn('Central DB sync notice:', err);
        if (isMounted) setDbOnline(false);
      } finally {
        if (isMounted) setIsSyncingDb(false);
      }
    }

    initCentralDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to localStorage as instant offline cache
  useEffect(() => {
    try {
      localStorage.setItem('yebocards_data', JSON.stringify(cards));
    } catch (e) {
      console.error(e);
    }
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem('yebousers_data', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('yeboleads_data', JSON.stringify(leads));
    } catch (e) {
      console.error(e);
    }
  }, [leads]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const isAdmin = currentUser.role === 'admin';
  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  // If member is logged in, their assigned card
  const memberAssignedCard = !isAdmin
    ? cards.find((c) => c.id === currentUser.assignedCardId) || cards[0]
    : null;

  // Handlers for cards (synced with central DB)
  const handleSaveCard = async (savedCard: BusinessCard) => {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === savedCard.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCard.id ? savedCard : c));
      }
      return [savedCard, ...prev];
    });
    setSelectedCardId(savedCard.id);
    setEditingCard(null);
    setActiveView('dashboard');
    showToast(`Card "${savedCard.businessName}" saved & published to Central DB!`);

    await dbSaveCard(savedCard);
  };

  const handleDeleteCard = async (cardId: string) => {
    const cardToDelete = cards.find((c) => c.id === cardId);
    if (!cardToDelete) return;
    if (confirm(`Are you sure you want to delete "${cardToDelete.businessName}"?`)) {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      if (selectedCardId === cardId) {
        const remaining = cards.filter((c) => c.id !== cardId);
        if (remaining.length > 0) setSelectedCardId(remaining[0].id);
      }
      showToast('Card deleted from Central DB.');
      await dbDeleteCard(cardId);
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
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    showToast(`Profile "${updatedUser.name}" updated in Central DB.`);
    await dbSaveUser(updatedUser);
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
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, assignedCardId: cardId } : u))
    );
    showToast('Card assignment updated.');
    if (targetUser) {
      await dbSaveUser({ ...targetUser, assignedCardId: cardId });
    }
  };

  const handleDeleteMember = async (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast('Member removed.');
    await dbDeleteUser(userId);
  };

  const handleLogout = () => {
    showToast('Signed out successfully.');
    setShowAuthModal(true);
  };

  const handleUpdateCurrentProfilePhoto = async (dataUrl: string) => {
    const updated = { ...currentUser, avatarUrl: dataUrl };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    showToast('Profile photo updated & saved to Central DB!');
    await dbSaveUser(updated);
  };

  // Lead submission from public card (synced with central DB)
  const handleLeadSubmit = async (leadData: Omit<LeadInquiry, 'id' | 'createdAt' | 'status'>) => {
    const newLead: LeadInquiry = {
      ...leadData,
      id: `lead-${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);
    showToast('Lead inquiry received and saved to Central Database!');
    await dbSaveLead(newLead);
  };

  // Action clicks analytics
  const handleActionClick = (actionType: 'call' | 'whatsapp' | 'share' | 'vcard') => {
    if (!activeCard) return;
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== activeCard.id) return c;
        return {
          ...c,
          viewsCount: c.viewsCount + 1,
          callClicksCount: actionType === 'call' ? c.callClicksCount + 1 : c.callClicksCount,
          whatsappClicksCount: actionType === 'whatsapp' ? c.whatsappClicksCount + 1 : c.whatsappClicksCount,
          sharesCount: actionType === 'share' ? c.sharesCount + 1 : c.sharesCount,
          vcardDownloadsCount: actionType === 'vcard' ? c.vcardDownloadsCount + 1 : c.vcardDownloadsCount,
        };
      })
    );
    dbIncrementCardMetric(activeCard.id, actionType);
  };

  // If in Standalone Card Mode (fullscreen preview for testing client view)
  if (activeView === 'preview_standalone' && activeCard) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-4">
        {/* Top return bar */}
        <div className="w-full max-w-[440px] mb-3 flex items-center justify-between text-xs px-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
          >
            <span>← Exit Fullscreen Preview</span>
          </button>
          <span className="text-slate-400 font-mono text-[11px]">
            Live: /card/{activeCard.slug}
          </span>
        </div>

        <CardView
          card={activeCard}
          onLeadSubmit={handleLeadSubmit}
          onActionClick={handleActionClick}
          isStandalone={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-slate-950 font-black text-base sm:text-lg shadow-md shadow-amber-950/40 shrink-0">
              Y
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  YeboCard
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 hidden xs:inline-block">
                  Communicator
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                South African Smart Business Card Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation Items (Hidden on mobile to eliminate horizontal scrolling) */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeView === 'dashboard'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Cards</span>
                </button>

                <button
                  onClick={() => setActiveView('members')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeView === 'members'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Users & Admins</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] font-mono">
                    {users.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveView('leads')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeView === 'leads'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Leads</span>
                  {leads.filter((l) => l.status === 'new').length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setShowSupabaseModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                  title="Central Supabase Database Connected"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline">Central DB</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400 font-medium px-2">
                Member Portal
              </span>
            )}
          </div>

          {/* Current user pill, Biometric icon & Logout button (Always visible on mobile without horizontal scroll) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* User Profile Pill */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 py-1 px-2 sm:px-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-200 transition-colors"
              title="Switch Account or Profile"
            >
              <div className="relative w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] overflow-hidden shrink-0">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span className="truncate max-w-[80px]">{currentUser.name.split(' ')[0]}</span>
                  {isAdmin && (
                    <span className="text-[9px] uppercase px-1 py-0.2 bg-amber-500/30 text-amber-300 rounded font-mono">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Biometric Scan Quick Access */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
              title="Face ID & Biometric Sign In"
            >
              <ScanFace className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold hidden xl:inline">Face ID</span>
            </button>

            {/* Quick Profile Photo Upload or Camera Selfie */}
            <button
              onClick={() => setShowPhotoModal(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
              title="Upload Photo or Take Camera Selfie"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold hidden xl:inline">Photo</span>
            </button>

            {/* Explicit Sign Out / Log Out Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/50 text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
              title="Sign Out / Log Out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold hidden xl:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 md:pb-8">
        {/* VIEW 1: CARD EDITOR (Admin Only) */}
        {activeView === 'editor' && isAdmin && (
          <CardEditor
            card={editingCard}
            members={users.filter((u) => u.role === 'member')}
            onSave={handleSaveCard}
            onCancel={() => {
              setEditingCard(null);
              setActiveView('dashboard');
            }}
          />
        )}

        {/* VIEW 2: USERS & ADMIN MANAGEMENT (Admin Only) */}
        {activeView === 'members' && isAdmin && (
          <AdminMembers
            members={users}
            cards={cards}
            currentUserId={currentUser.id}
            onAddMember={handleAddMember}
            onUpdateUser={handleUpdateUser}
            onUpdateMemberPassword={handleUpdateMemberPassword}
            onAssignCard={handleAssignCard}
            onDeleteMember={handleDeleteMember}
          />
        )}

        {/* VIEW 3: LEADS MANAGER (Admin Only) */}
        {activeView === 'leads' && isAdmin && (
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

        {/* VIEW 4: MAIN DASHBOARD & INTERACTIVE LIVE PREVIEW */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cards List & Admin Controls (or Member Overview) */}
            <div className="lg:col-span-6 space-y-6">
              {isAdmin ? (
                <>
                  {/* Admin Dashboard Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <span>Digital Smart Cards</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage your company communicators, armed response links, and member cards.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingCard(null);
                        setActiveView('editor');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/40"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Card</span>
                    </button>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-3">
                    {cards.map((card) => {
                      const isSelected = card.id === selectedCardId;
                      const assignedMember = users.find((u) => u.id === card.assignedMemberId);

                      return (
                        <div
                          key={card.id}
                          onClick={() => setSelectedCardId(card.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 border-amber-500/80 shadow-xl shadow-amber-950/20 ring-1 ring-amber-500/50'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Logo thumbnail */}
                              <div
                                className="w-12 h-12 rounded-xl bg-slate-950 p-0.5 border overflow-hidden shrink-0"
                                style={{ borderColor: card.theme.primaryColor || '#ef4444' }}
                              >
                                {card.logoUrl ? (
                                  <img
                                    src={card.logoUrl}
                                    alt={card.businessName}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold text-white leading-tight">
                                    {card.businessName}
                                  </h3>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                      card.status === 'live'
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {card.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                  {card.contactPersonName ? `${card.contactPersonName} · ${card.designation || card.businessTypeLabel}` : card.tagline}
                                </p>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono">
                                  <span>/card/<strong>{card.slug}</strong></span>
                                  <span>•</span>
                                  <span>{card.viewsCount} views</span>
                                  {assignedMember && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-400">User: {assignedMember.name.split(' ')[0]}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card action buttons */}
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditingCard(card);
                                  setActiveView('editor');
                                }}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                                title="Edit Card"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCardId(card.id);
                                  setActiveView('preview_standalone');
                                }}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                                title="Fullscreen Preview"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                                title="Delete Card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* MEMBER EXPERIENCE (Read-only as per prompt #43) */
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Welcome, {currentUser.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Your YeboCard smart communicator profile and real-time activity numbers.
                    </p>
                  </div>

                  {memberAssignedCard ? (
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                            🟢 Live Profile
                          </span>
                          <h3 className="text-lg font-bold text-white mt-2">
                            {memberAssignedCard.businessName}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {memberAssignedCard.contactPersonName} · {memberAssignedCard.designation}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedCardId(memberAssignedCard.id);
                            setActiveView('preview_standalone');
                          }}
                          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Live Card</span>
                        </button>
                      </div>

                      {/* Share link box */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono text-slate-300 truncate">
                          yebocard.co.za/card/{memberAssignedCard.slug}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/card/${memberAssignedCard.slug}`);
                            showToast('Link copied to clipboard!');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>

                      {/* Activity Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                          <span className="text-[10px] uppercase font-semibold text-slate-500">Views</span>
                          <div className="text-lg font-black text-white mt-0.5">{memberAssignedCard.viewsCount}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                          <span className="text-[10px] uppercase font-semibold text-slate-500">WhatsApp Taps</span>
                          <div className="text-lg font-black text-emerald-400 mt-0.5">{memberAssignedCard.whatsappClicksCount}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                          <span className="text-[10px] uppercase font-semibold text-slate-500">Calls</span>
                          <div className="text-lg font-black text-sky-400 mt-0.5">{memberAssignedCard.callClicksCount}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                          <span className="text-[10px] uppercase font-semibold text-slate-500">vCards Saved</span>
                          <div className="text-lg font-black text-amber-400 mt-0.5">{memberAssignedCard.vcardDownloadsCount}</div>
                        </div>
                      </div>

                      {/* Admin-only notice (Matches requirement #43!) */}
                      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <div>
                          <h4 className="font-bold">Card Editing Restricted</h4>
                          <p className="text-[11px] text-amber-200/80 mt-0.5">
                            Members cannot edit or add cards directly. To update your logo, phone number, banners, or services, please contact your administrator (<strong>zweli@msn.com</strong>).
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                      <p className="text-xs text-slate-400">
                        No smart card assigned to your account yet. Contact <strong>zweli@msn.com</strong> to link your business card.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Interactive Phone Preview */}
            <div className="lg:col-span-6 flex flex-col items-center">
              {/* Preview Toolbar */}
              <div className="w-full max-w-[440px] mb-3 flex items-center justify-between text-xs px-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Live Card Simulator</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveView('preview_standalone')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] font-semibold"
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
                    onLeadSubmit={handleLeadSubmit}
                    onActionClick={handleActionClick}
                  />
                ) : (
                  <div className="p-12 text-slate-500 text-xs">No card selected.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Supabase Settings Modal */}
      <SupabaseSettingsModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />

      {/* Auth Persona Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        users={users}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'member' && user.assignedCardId) {
            setSelectedCardId(user.assignedCardId);
          }
          showToast(`Logged in as ${user.name}`);
        }}
      />

      {/* User Profile Photo Upload / Camera Selfie Modal */}
      <PhotoCaptureModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onPhotoSelected={handleUpdateCurrentProfilePhoto}
        currentPhotoUrl={currentUser.avatarUrl}
        title={`Update Profile Photo: ${currentUser.name}`}
      />
      {/* Mobile Bottom Navigation Bar (md:hidden) - Professional Native App UX */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 md:hidden pb-[max(env(safe-area-inset-bottom,0px),6px)] pt-1.5 px-2 shadow-2xl">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              activeView === 'dashboard'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Cards</span>
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={() => setActiveView('members')}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  activeView === 'members'
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-5 h-5 mb-0.5" />
                <span className="text-[10px]">Users</span>
                <span className="absolute top-0.5 right-2 px-1 rounded-full bg-slate-800 text-[8px] font-bold text-amber-400 font-mono border border-slate-700">
                  {users.length}
                </span>
              </button>

              <button
                onClick={() => setActiveView('leads')}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  activeView === 'leads'
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-5 h-5 mb-0.5" />
                <span className="text-[10px]">Leads</span>
                {leads.filter((l) => l.status === 'new').length > 0 && (
                  <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setShowSupabaseModal(true)}
                className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
              >
                <Database className="w-5 h-5 mb-0.5 text-emerald-400" />
                <span className="text-[10px]">Supabase</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                activeView === 'dashboard'
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">My Card</span>
            </button>
          )}

          <button
            onClick={() => setShowAuthModal(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
          >
            <ScanFace className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[10px]">Face ID</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
