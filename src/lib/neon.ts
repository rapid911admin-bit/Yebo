import { neon } from '@neondatabase/serverless';
import { BusinessCard, Company, LeadInquiry, User } from '../types';
import { INITIAL_CARDS, INITIAL_COMPANIES, INITIAL_USERS } from '../data/defaultCards';

// Neon Project Configuration
export const NEON_PROJECT_ID = 'patient-snow-11357681';

// Direct Client-Side Neon SQL fallback if VITE_NEON_DATABASE_URL is set
const CLIENT_NEON_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEON_DATABASE_URL) || '';

let clientSql: any = null;
if (CLIENT_NEON_URL) {
  try {
    clientSql = neon(CLIENT_NEON_URL);
  } catch (e) {
    console.warn('[Neon Client] Direct connection init notice:', e);
  }
}

/* =========================================================================
   TYPE MAPPERS: TypeScript (camelCase) <--> PostgreSQL (snake_case)
   ========================================================================= */

export function mapDbToCard(row: any): BusinessCard {
  return {
    id: row.id,
    companyId: row.company_id || undefined,
    slug: row.slug,
    businessName: row.business_name || row.name || 'Business Card',
    tagline: row.tagline || row.role || '',
    businessType: (row.business_type as any) || (row.biz_type as any) || 'custom',
    businessTypeLabel: row.business_type_label || row.business_type || 'Custom',
    contactPersonName: row.contact_person_name || row.contact_name || '',
    designation: row.designation || '',
    logoUrl: row.logo_url || '',
    emergencyPhone: row.emergency_phone || row.panic_phone || undefined,
    banners: Array.isArray(row.banners) ? row.banners : [],
    theme: typeof row.theme === 'object' && row.theme ? row.theme : {
      primaryColor: row.accent || '#f59e0b',
      bgType: 'dark',
      darkOverlayOpacity: 70,
      glassmorphism: true,
    },
    socialLinks: typeof row.social_links === 'object' && row.social_links ? row.social_links : {
      phone: row.phone || '',
      whatsapp: row.whatsapp || '',
      email: row.email || '',
      website: row.website || '',
      address: row.address || '',
    },
    aboutText: row.about_text || '',
    services: Array.isArray(row.services) ? row.services : [],
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : [],
    operatingHours: row.operating_hours || '',
    status: (row.status as any) || 'live',
    assignedMemberId: row.assigned_member_id || undefined,
    viewsCount: row.views_count ?? 0,
    sharesCount: row.shares_count ?? 0,
    callClicksCount: row.call_clicks_count ?? 0,
    whatsappClicksCount: row.whatsapp_clicks_count ?? 0,
    vcardDownloadsCount: row.vcard_downloads_count ?? 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapDbToCompany(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline || '',
    category: row.category || 'custom',
    categoryLabel: row.category_label || row.category || 'Business',
    logoUrl: row.logo_url || '',
    theme: typeof row.theme === 'object' && row.theme ? row.theme : { primaryColor: '#f59e0b', bgType: 'dark', glassmorphism: true, darkOverlayOpacity: 70 },
    aboutText: row.about_text || '',
    operatingHours: row.operating_hours || '',
    website: row.website || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapDbToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === 'admin' ? 'admin' : 'employee',
    companyId: row.company_id || undefined,
    password: row.role === 'admin' ? (row.password || 'password123') : undefined,
    assignedCardId: row.assigned_card_id || undefined,
    status: (row.status as any) || 'active',
    phone: row.phone || undefined,
    designation: row.designation || undefined,
    avatarUrl: row.avatar_url || undefined,
    bio: row.bio || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

export function mapDbToLead(row: any): LeadInquiry {
  return {
    id: row.id,
    cardId: row.card_id || 'card-general',
    cardName: row.card_name || 'Smart Card',
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    message: row.message || '',
    status: (row.status as any) || 'new',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/* =========================================================================
   DATABASE OPERATIONS: Neon via /api with Direct Fallback
   ========================================================================= */

// COMPANIES
export async function dbFetchCompanies(): Promise<Company[]> {
  try {
    const res = await fetch('/api/companies');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.companies) && data.companies.length > 0) {
        return data.companies.map(mapDbToCompany);
      }
    }
  } catch (err) {
    console.warn('[Neon] Fetch companies notice (offline/local mode):', err);
  }

  // Direct client fallback if configured
  if (clientSql) {
    try {
      const rows = await clientSql`SELECT * FROM companies ORDER BY name ASC`;
      if (rows && rows.length > 0) return rows.map(mapDbToCompany);
    } catch (e) {
      console.warn('[Neon Direct] Fetch companies notice:', e);
    }
  }

  return [];
}

export async function dbSaveCompanies(companies: Company[]): Promise<boolean> {
  try {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companies }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Neon] Save companies notice:', err);
    return false;
  }
}

// CARDS
export async function dbFetchCards(): Promise<BusinessCard[]> {
  try {
    const res = await fetch('/api/cards');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.cards) && data.cards.length > 0) {
        return data.cards.map(mapDbToCard);
      }
    }
  } catch (err) {
    console.warn('[Neon] Fetch cards notice (offline/local mode):', err);
  }

  if (clientSql) {
    try {
      const rows = await clientSql`
        SELECT * FROM cards WHERE slug != 'system-companies-registry' ORDER BY created_at DESC
      `;
      if (rows && rows.length > 0) return rows.map(mapDbToCard);
    } catch (e) {
      console.warn('[Neon Direct] Fetch cards notice:', e);
    }
  }

  return [];
}

export async function dbFetchCardBySlugOrId(slugOrId: string): Promise<BusinessCard | null> {
  const clean = slugOrId.toLowerCase().trim();
  try {
    const res = await fetch(`/api/cards/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.card) return mapDbToCard(data.card);
    }
  } catch (err) {
    console.warn('[Neon] Fetch card by slug notice:', err);
  }

  if (clientSql) {
    try {
      const rows = await clientSql`
        SELECT * FROM cards
        WHERE id = ${slugOrId} OR LOWER(slug) = ${clean} OR slug ILIKE ${`%${clean}%`}
        LIMIT 1
      `;
      if (rows && rows[0]) return mapDbToCard(rows[0]);
    } catch (e) {
      console.warn('[Neon Direct] Fetch card notice:', e);
    }
  }

  return null;
}

export async function dbSaveCard(card: BusinessCard): Promise<boolean> {
  try {
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Neon] Save card notice:', err);
    return false;
  }
}

export async function dbDeleteCard(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/cards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Neon] Delete card notice:', err);
    return false;
  }
}

export async function dbIncrementCardMetric(
  cardId: string,
  type: 'view' | 'share' | 'call' | 'whatsapp' | 'vcard'
): Promise<void> {
  try {
    await fetch(`/api/cards/${encodeURIComponent(cardId)}/metric`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
  } catch (err) {
    console.warn('[Neon] Increment metric notice:', err);
  }
}

// USERS
export async function dbFetchUsers(): Promise<User[]> {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users) && data.users.length > 0) {
        return data.users.map(mapDbToUser);
      }
    }
  } catch (err) {
    console.warn('[Neon] Fetch users notice (offline/local mode):', err);
  }

  if (clientSql) {
    try {
      const rows = await clientSql`SELECT * FROM users ORDER BY created_at ASC`;
      if (rows && rows.length > 0) return rows.map(mapDbToUser);
    } catch (e) {
      console.warn('[Neon Direct] Fetch users notice:', e);
    }
  }

  return [];
}

export async function dbSaveUser(user: User): Promise<boolean> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Neon] Save user notice:', err);
    return false;
  }
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Neon] Delete user notice:', err);
    return false;
  }
}

// LEADS
export async function dbFetchLeads(): Promise<LeadInquiry[]> {
  try {
    const res = await fetch('/api/leads');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.leads) && data.leads.length > 0) {
        return data.leads.map(mapDbToLead);
      }
    }
  } catch (err) {
    console.warn('[Neon] Fetch leads notice (offline/local mode):', err);
  }

  return [];
}

export async function dbSaveLead(lead: LeadInquiry): Promise<boolean> {
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Neon] Save lead notice:', err);
    return false;
  }
}

export async function dbUpdateLeadStatus(
  id: string,
  status: 'new' | 'contacted' | 'resolved'
): Promise<boolean> {
  try {
    const res = await fetch(`/api/leads/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Neon] Update lead status notice:', err);
    return false;
  }
}

export async function dbDeleteLead(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Neon] Delete lead notice:', err);
    return false;
  }
}

/* =========================================================================
   SEED & SUBSCRIPTION HELPERS
   ========================================================================= */

export async function seedCentralDatabaseIfNeeded(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      const alreadySeeded =
        sessionStorage.getItem('yebo_session_seeded') ||
        localStorage.getItem('yebo_central_db_seeded');
      if (alreadySeeded) return;
    }

    // Check if remote has users
    const users = await dbFetchUsers();
    if (!users || users.length === 0) {
      for (const u of INITIAL_USERS) {
        await dbSaveUser(u);
      }
    }

    // Check if remote has cards
    const cards = await dbFetchCards();
    if (!cards || cards.length === 0) {
      for (const c of INITIAL_CARDS.slice(0, 5)) {
        await dbSaveCard(c);
      }
    }

    // Check if remote has companies
    const companies = await dbFetchCompanies();
    if (!companies || companies.length === 0) {
      await dbSaveCompanies(INITIAL_COMPANIES);
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('yebo_session_seeded', 'true');
      localStorage.setItem('yebo_central_db_seeded', 'true');
    }
  } catch (err) {
    console.warn('[Neon] Database seed check notice:', err);
  }
}

/**
 * Real-time heartbeat sync subscription
 */
export function subscribeToCentralDatabase(callbacks: {
  onCardsChange?: () => void;
  onUsersChange?: () => void;
  onLeadsChange?: () => void;
  onStatusChange?: (online: boolean) => void;
}): () => void {
  // Test connection health
  fetch('/api/health')
    .then((r) => r.json())
    .then((data) => {
      callbacks.onStatusChange?.(data.connected || false);
    })
    .catch(() => {
      callbacks.onStatusChange?.(false);
    });

  // Periodic heartbeat every 45s
  const interval = setInterval(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        callbacks.onStatusChange?.(data.connected || false);
      } else {
        callbacks.onStatusChange?.(false);
      }
    } catch {
      callbacks.onStatusChange?.(false);
    }
  }, 45000);

  return () => {
    clearInterval(interval);
  };
}
