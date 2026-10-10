import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BusinessCard, Company, LeadInquiry, User } from '../types';
import { INITIAL_CARDS, INITIAL_COMPANIES, INITIAL_USERS } from '../data/defaultCards';

// Project credentials from central Supabase project
export const SUPABASE_URL = 'https://gcquxurtomxbmrpwclka.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcXV4dXJ0b214Ym1ycHdjbGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MTg1NDIsImV4cCI6MjEwNjM5NDU0Mn0.eUY1UslqZk8BtRqgaMm4SdiIdlWr_28BvuB72nL1syw';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/* =========================================================================
   TYPE MAPPERS: TypeScript (camelCase) <--> Database (snake_case + constraints)
   ========================================================================= */

export function mapCardToDb(card: BusinessCard): any {
  const businessName = card.businessName || 'Business Card';
  const tagline = card.tagline || '';
  const contactPerson = card.contactPersonName || '';
  const designation = card.designation || '';
  const emergencyPhone = card.emergencyPhone || '';
  const primaryColor = card.theme?.primaryColor || '#ef4444';

  const phone = card.socialLinks?.phone || '';
  const whatsapp = card.socialLinks?.whatsapp || '';
  const email = card.socialLinks?.email || '';
  const address = card.socialLinks?.address || '';
  const website = card.socialLinks?.website || '';

  // Theme check constraint allows 'auto', 'light', 'dark'
  let themeStr = 'auto';
  if (typeof card.theme === 'string' && ['auto', 'light', 'dark'].includes(card.theme)) {
    themeStr = card.theme;
  }

  // Ensure slug strictly satisfies PostgreSQL cards_slug_check constraint
  // (must be non-empty, lowercase, alphanumeric and hyphens only, max 120 chars)
  let cleanSlug = (card.slug || `card-${card.id}`)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!cleanSlug) {
    cleanSlug = `card-${card.id.toLowerCase().replace(/[^a-z0-9-]+/g, '').slice(0, 12)}`;
  }
  cleanSlug = cleanSlug.slice(0, 120);

  return {
    id: card.id,
    owner_email: 'zweli@msn.com',
    slug: cleanSlug,
    // Dual column mapping for maximum compatibility and NOT-NULL constraint satisfaction
    name: businessName,
    business_name: businessName,
    role: tagline || designation,
    tagline: tagline,
    biz_type: card.businessType === 'security' ? 'sec' : (card.businessType || 'other'),
    business_type: card.businessType || 'general',
    business_type_label: card.businessTypeLabel || '',
    contact_name: contactPerson,
    contact_person_name: contactPerson,
    designation: designation,
    panic_phone: emergencyPhone,
    emergency_phone: emergencyPhone,
    logo_url: card.logoUrl || '',
    banners: card.banners || [],
    accent: primaryColor,
    theme: themeStr,
    phone: phone,
    whatsapp: whatsapp,
    email: email,
    address: address,
    website: website,
    social_links: {
      phone,
      whatsapp,
      email,
      address,
      website,
      company_id: card.companyId || undefined,
      assigned_member_id: card.assignedMemberId || undefined,
      ...(card.socialLinks || {}),
    },
    about_text: card.aboutText || '',
    services: card.services || [],
    gallery_images: card.galleryImages || [],
    operating_hours: card.operatingHours || '',
    status: card.status || 'live',
    published: card.status === 'live',
    views_count: card.viewsCount || 0,
    shares_count: card.sharesCount || 0,
    call_clicks_count: card.callClicksCount || 0,
    whatsapp_clicks_count: card.whatsappClicksCount || 0,
    vcard_downloads_count: card.vcardDownloadsCount || 0,
    updated_at: card.updatedAt || new Date().toISOString(),
  };
}

export function mapDbToCard(row: any): BusinessCard {
  const bName =
    row.business_name && row.business_name !== 'My Business'
      ? row.business_name
      : row.name && row.name !== 'My Business'
      ? row.name
      : row.business_name || row.name || 'Business Card';

  const cPerson = row.contact_person_name || row.contact_name || '';
  const phone = row.social_links?.phone || row.phone || '';
  const whatsapp = row.social_links?.whatsapp || row.whatsapp || '';
  const email = row.social_links?.email || row.email || '';
  const website = row.social_links?.website || row.website || '';
  const address = row.social_links?.address || row.address || '';
  const emergencyPhone = row.emergency_phone || row.panic_phone || '';

  // Services: array or legacy chips
  let services = Array.isArray(row.services) && row.services.length > 0 ? row.services : [];
  if (services.length === 0 && Array.isArray(row.chips) && row.chips.length > 0) {
    services = row.chips.map((c: string, idx: number) => ({
      id: `svc-${idx}`,
      title: c,
      description: '',
    }));
  }

  // About text: from about_text or legacy tabs
  let aboutText = row.about_text || '';
  if (!aboutText && Array.isArray(row.tabs) && row.tabs.length > 0) {
    aboutText = row.tabs.map((t: any) => `${t.title || 'About'}:\n${t.body || ''}`).join('\n\n');
  }

  const primaryColor =
    row.accent || (row.business_type === 'security' || row.biz_type === 'sec' ? '#ef4444' : '#f59e0b');

  return {
    id: row.id,
    companyId: row.company_id || row.social_links?.company_id || row.companyId || undefined,
    slug: row.slug || `card-${row.id}`,
    businessName: bName,
    tagline: row.tagline || row.role || '',
    businessType: row.business_type || (row.biz_type === 'sec' ? 'security' : 'general'),
    businessTypeLabel:
      row.business_type_label ||
      (row.business_type === 'security' || row.biz_type === 'sec'
        ? 'Security & Armed Response'
        : 'Smart Card'),
    contactPersonName: cPerson,
    designation: row.designation || '',
    emergencyPhone: emergencyPhone,
    logoUrl: row.logo_url || '',
    banners: Array.isArray(row.banners)
      ? row.banners.map((b: any, idx: number) => ({
          id: b.id || `banner-${row.id || 'card'}-${idx}`,
          title: b.title || b.text || '',
          subtitle: b.subtitle || '',
          imageUrl: b.imageUrl || b.image_url || '',
          linkUrl: b.linkUrl || b.link_url || undefined,
          badgeText: b.badgeText || b.badge_text || undefined,
          overlayPosition: b.overlayPosition || undefined,
          overlayStyle: b.overlayStyle || undefined,
        }))
      : [],
    theme: {
      primaryColor,
      darkOverlayOpacity: 75,
      ...(typeof row.theme === 'object' ? row.theme : {}),
    },
    socialLinks: {
      phone,
      whatsapp,
      email,
      website,
      address,
      ...(row.social_links || {}),
    },
    aboutText,
    services,
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : [],
    operatingHours: row.operating_hours || '',
    status: row.status || (row.published === false ? 'draft' : 'live'),
    assignedMemberId: row.assigned_member_id || row.social_links?.assigned_member_id || undefined,
    viewsCount: row.views_count ?? 0,
    sharesCount: row.shares_count ?? 0,
    callClicksCount: row.call_clicks_count ?? 0,
    whatsappClicksCount: row.whatsapp_clicks_count ?? 0,
    vcardDownloadsCount: row.vcard_downloads_count ?? 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapUserToDb(user: User): any {
  let bioWithCompany = user.bio || '';
  if (user.companyId) {
    bioWithCompany = bioWithCompany.replace(/\s*\[company:[^\]]+\]\s*/g, '').trim();
    bioWithCompany = bioWithCompany ? `${bioWithCompany} [company:${user.companyId}]` : `[company:${user.companyId}]`;
  }

  return {
    id: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name,
    role: user.role === 'admin' ? 'admin' : 'employee',
    password: user.role === 'admin' ? (user.password || 'password123') : '',
    assigned_card_id: user.assignedCardId || null,
    status: user.status || 'active',
    phone: user.phone || '',
    designation: user.designation || '',
    avatar_url: user.avatarUrl || '',
    bio: bioWithCompany,
    updated_at: user.updatedAt || new Date().toISOString(),
  };
}

export function mapDbToUser(row: any): User {
  const isAdmin = row.role === 'admin';
  let companyId = row.company_id || undefined;
  let cleanBio = row.bio || undefined;

  if (row.bio && typeof row.bio === 'string') {
    const match = row.bio.match(/\[company:([^\]]+)\]/);
    if (match) {
      companyId = match[1];
      cleanBio = row.bio.replace(/\s*\[company:[^\]]+\]\s*/g, '').trim() || undefined;
    }
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: isAdmin ? 'admin' : 'employee',
    companyId,
    password: isAdmin ? (row.password || 'password123') : undefined,
    assignedCardId: row.assigned_card_id || undefined,
    status: (row.status as any) || 'active',
    phone: row.phone || undefined,
    designation: row.designation || undefined,
    avatarUrl: row.avatar_url || undefined,
    bio: cleanBio,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

export function mapLeadToDb(lead: LeadInquiry): any {
  let combinedMessage = lead.message || '';
  if (lead.phone) combinedMessage += `\n[Phone: ${lead.phone}]`;
  if (lead.email) combinedMessage += `\n[Email: ${lead.email}]`;
  if (lead.cardName) combinedMessage += `\n[Card: ${lead.cardName}]`;

  return {
    card_id: lead.cardId,
    name: lead.name,
    message: combinedMessage,
    status: lead.status || 'new',
  };
}

export function mapDbToLead(row: any): LeadInquiry {
  const msg = row.message || '';
  let phone = '';
  let email = '';
  let cardName = 'Smart Card';

  const phoneMatch = msg.match(/\[Phone: (.*?)\]/);
  if (phoneMatch) phone = phoneMatch[1];

  const emailMatch = msg.match(/\[Email: (.*?)\]/);
  if (emailMatch) email = emailMatch[1];

  const cardMatch = msg.match(/\[Card: (.*?)\]/);
  if (cardMatch) cardName = cardMatch[1];

  const cleanMessage = msg.replace(/\[(Phone|Email|Card): .*?\]/g, '').trim();

  return {
    id: row.id,
    cardId: row.card_id || 'card-general',
    cardName: cardName,
    name: row.name,
    email: email || '',
    phone: phone || '',
    message: cleanMessage,
    status: (row.status as any) || 'new',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/* =========================================================================
   CENTRAL DATABASE OPERATIONS (Cards, Users, Leads)
   ========================================================================= */

export function isNetworkOrFetchError(err: any): boolean {
  if (!err) return false;
  const str = String(err?.message || err?.description || err?.name || err || '').toLowerCase();
  return (
    str.includes('failed to fetch') ||
    str.includes('networkerror') ||
    str.includes('network error') ||
    str.includes('typeerror') ||
    str.includes('load failed') ||
    str.includes('econnrefused') ||
    str.includes('offline') ||
    str.includes('fetch failed')
  );
}

// CARDS
export async function dbFetchCards(): Promise<BusinessCard[]> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .neq('slug', 'system-companies-registry')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch cards warning:', error.message);
      return [];
    }

    if (data && data.length > 0) {
      return data.map(mapDbToCard);
    }
    return [];
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      console.warn('Supabase fetch cards notice (offline/local mode):', err);
    } else {
      console.warn('Failed to query central database for cards notice:', err);
    }
    return [];
  }
}

// COMPANIES (persisted in central DB under system-companies-registry and companies table)
export async function dbFetchCompanies(): Promise<Company[]> {
  try {
    // 1. Try dedicated companies table first
    const { data: compData, error: compErr } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (!compErr && compData && compData.length > 0) {
      return compData.map((row: any) => ({
        id: row.id,
        name: row.name,
        tagline: row.tagline || '',
        category: row.category || 'custom',
        categoryLabel: row.category_label || row.category || 'Organization',
        logoUrl: row.logo_url || '',
        theme: typeof row.theme === 'object' ? row.theme : { primaryColor: '#f59e0b' },
        aboutText: row.about_text || '',
        operatingHours: row.operating_hours || '',
        website: row.website || '',
        phone: row.phone || '',
        email: row.email || '',
        address: row.address || '',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
      }));
    }

    // 2. Fallback to system-companies-registry card
    const { data, error } = await supabase
      .from('cards')
      .select('social_links')
      .eq('slug', 'system-companies-registry')
      .limit(1)
      .maybeSingle();

    if (!error && data && data.social_links?.companies && Array.isArray(data.social_links.companies)) {
      return data.social_links.companies;
    }
    return [];
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      console.warn('Supabase fetch companies notice (offline/local mode):', err);
    } else {
      console.warn('Failed to fetch companies from central DB notice:', err);
    }
    return [];
  }
}

export function optimizeCardPayloadForDb(payload: any, aggressive: boolean = false): any {
  if (!payload || typeof payload !== 'object') return payload;
  const p = { ...payload };

  const sanitizeUrl = (url: any, maxKb: number): string => {
    if (typeof url !== 'string') return '';
    if (url.startsWith('data:image/')) {
      const kb = Math.round((url.length * 3) / 4 / 1024);
      if (kb > maxKb || aggressive) {
        return '';
      }
    }
    return url;
  };

  if (p.logo_url) {
    p.logo_url = sanitizeUrl(p.logo_url, aggressive ? 100 : 300);
  }

  if (Array.isArray(p.banners)) {
    p.banners = p.banners.map((b: any) => {
      if (!b || typeof b !== 'object') return b;
      const img = b.imageUrl || b.image_url || '';
      return {
        ...b,
        imageUrl: sanitizeUrl(img, aggressive ? 100 : 250),
        image_url: sanitizeUrl(img, aggressive ? 100 : 250),
      };
    });
  }

  if (Array.isArray(p.gallery_images)) {
    p.gallery_images = p.gallery_images.map((g: any) => {
      if (typeof g === 'string') return sanitizeUrl(g, aggressive ? 100 : 250);
      if (g && typeof g === 'object') {
        const img = g.url || g.imageUrl || g.image_url || '';
        return {
          ...g,
          url: sanitizeUrl(img, aggressive ? 100 : 250),
          imageUrl: sanitizeUrl(img, aggressive ? 100 : 250),
        };
      }
      return g;
    });
  }

  if (p.social_links && typeof p.social_links === 'object') {
    const sl = { ...p.social_links };
    if (Array.isArray(sl.companies)) {
      sl.companies = sl.companies.map((c: any) => ({
        ...c,
        logoUrl: sanitizeUrl(c?.logoUrl, aggressive ? 80 : 200),
      }));
    }
    p.social_links = sl;
  }

  return p;
}

export async function dbSaveCompanies(companies: Company[]): Promise<boolean> {
  if (!companies || companies.length === 0) return true;
  try {
    // 1. Try to upsert into dedicated companies table
    try {
      const companyRows = companies.map((c) => ({
        id: c.id,
        name: c.name,
        tagline: c.tagline || '',
        category: c.category || 'custom',
        category_label: c.categoryLabel || '',
        logo_url: c.logoUrl && c.logoUrl.startsWith('data:image/') && c.logoUrl.length > 300000 ? '' : (c.logoUrl || ''),
        theme: c.theme || {},
        about_text: c.aboutText || '',
        operating_hours: c.operatingHours || '',
        website: c.website || '',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('companies').upsert(companyRows, { onConflict: 'id' });
    } catch {
      // Non-fatal if dedicated table has permission differences
    }

    // 2. Always persist into system registry card as reliable dual storage
    const cleanCompanies = companies.map((c) => ({
      ...c,
      logoUrl: c.logoUrl && c.logoUrl.startsWith('data:image/') && c.logoUrl.length > 300000 ? '' : (c.logoUrl || ''),
    }));

    const payload = {
      id: 'c0000000-0000-4000-8000-000000000001',
      owner_email: 'zweli@msn.com',
      slug: 'system-companies-registry',
      name: 'System Companies Registry',
      business_name: 'System Companies Registry',
      status: 'draft',
      social_links: {
        companies: cleanCompanies,
        is_system_registry: true,
        updated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('cards').upsert(payload, { onConflict: 'id' });
    if (error) {
      if (isNetworkOrFetchError(error)) {
        console.warn('Supabase system registry backup network notice:', error.message || error);
      } else {
        console.warn('Supabase system registry backup notice:', error.message);
      }
    }
    return true;
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      console.warn('Failed to save companies to central DB notice (offline mode):', err);
    } else {
      console.warn('Failed to save companies to central DB notice:', err);
    }
    return false;
  }
}

export async function dbSaveCard(card: BusinessCard): Promise<boolean> {
  try {
    const rawPayload = mapCardToDb(card);
    let currentPayload = optimizeCardPayloadForDb(rawPayload, false);

    const executeUpsert = async (p: any): Promise<{ error: any }> => {
      try {
        const timeoutMs = 8000;
        let timer: any;
        const timeoutPromise = new Promise<{ error: any }>((resolve) => {
          timer = setTimeout(() => {
            resolve({ error: { message: 'canceling statement due to statement timeout', code: '57014' } });
          }, timeoutMs);
        });

        const queryPromise = (async () => {
          const res = await supabase.from('cards').upsert(p, { onConflict: 'id' });
          clearTimeout(timer);
          return res;
        })();

        return await Promise.race([queryPromise, timeoutPromise]);
      } catch (err: any) {
        return { error: err };
      }
    };

    let { error } = await executeUpsert(currentPayload);

    // If network or fetch error, perform one quick retry
    if (error && isNetworkOrFetchError(error)) {
      await new Promise((res) => setTimeout(res, 400));
      const retryFetch = await executeUpsert(currentPayload);
      if (!retryFetch.error) return true;
      error = retryFetch.error;
    }

    // Handle statement timeouts gracefully by retrying with aggressively optimized payload
    if (
      error &&
      error.message &&
      (error.message.toLowerCase().includes('statement timeout') ||
        error.message.toLowerCase().includes('canceling statement') ||
        error.code === '57014')
    ) {
      console.warn('Statement timeout on card upsert. Applying aggressive payload compression and retrying...');
      currentPayload = optimizeCardPayloadForDb(rawPayload, true);
      const retryResult = await executeUpsert(currentPayload);
      if (!retryResult.error) return true;
      error = retryResult.error;
    }

    // Handle missing column errors gracefully (e.g. column not in remote schema cache)
    while (
      error &&
      error.message &&
      error.message.toLowerCase().includes('could not find the') &&
      error.message.toLowerCase().includes('column of')
    ) {
      const match = error.message.match(/could not find the '([^']+)' column/i);
      if (match && match[1]) {
        const missingCol = match[1];
        console.warn(`Column '${missingCol}' not found in remote schema cache. Decoupling and retrying...`);
        delete currentPayload[missingCol];
        const retryResult = await executeUpsert(currentPayload);
        if (!retryResult.error) return true;
        error = retryResult.error;
      } else {
        break;
      }
    }

    // Handle foreign key constraint violations gracefully
    if (error && error.message && error.message.toLowerCase().includes('foreign key constraint')) {
      console.warn('Foreign key notice on card upsert. Retrying with decoupled references...', error.message);
      delete currentPayload.company_id;
      delete currentPayload.assigned_member_id;
      const retryResult = await executeUpsert(currentPayload);
      if (!retryResult.error) return true;
      error = retryResult.error;
    }

    // Handle slug uniqueness constraint conflicts automatically
    if (error && (error.code === '23505' || (error.message && error.message.toLowerCase().includes('slug')))) {
      console.warn('Card slug conflict detected. Generating unique suffix and retrying...');
      currentPayload = {
        ...currentPayload,
        slug: `${currentPayload.slug.slice(0, 95)}-${Date.now().toString(36).slice(-4)}`,
      };
      const retryResult = await executeUpsert(currentPayload);
      if (!retryResult.error) return true;
      error = retryResult.error;
    }

    if (error) {
      if (isNetworkOrFetchError(error)) {
        console.warn('Supabase card save network notice (local-first storage active):', error.message || error);
      } else {
        console.warn('Supabase upsert card notice:', error.message || error);
      }
      return false;
    }
    return true;
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      console.warn('Failed to save card to central DB notice (offline mode active):', err);
    } else {
      console.warn('Failed to save card to central DB notice:', err);
    }
    return false;
  }
}

export async function dbDeleteCard(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) {
      if (isNetworkOrFetchError(error)) {
        console.warn('Supabase delete card network notice:', error.message || error);
      } else {
        console.warn('Supabase delete card notice:', error.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete card from central DB notice:', err);
    return false;
  }
}

export async function dbIncrementCardMetric(
  cardId: string,
  metric: 'call' | 'calls' | 'whatsapp' | 'share' | 'shares' | 'vcard' | 'view' | 'views'
): Promise<void> {
  try {
    const colMap: Record<string, string> = {
      view: 'views_count',
      views: 'views_count',
      share: 'shares_count',
      shares: 'shares_count',
      call: 'call_clicks_count',
      calls: 'call_clicks_count',
      whatsapp: 'whatsapp_clicks_count',
      vcard: 'vcard_downloads_count',
    };
    const colName = colMap[metric];
    if (!colName) return;

    // Fetch current count & increment
    const { data } = await supabase.from('cards').select(colName).eq('id', cardId).single();
    if (data) {
      const current = (data as any)[colName] || 0;
      await supabase
        .from('cards')
        .update({ [colName]: current + 1 })
        .eq('id', cardId);
    }
  } catch (err) {
    // Non-critical metric increment failure
  }
}

// USERS
export async function dbFetchUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetch users warning:', error.message);
      return [];
    }

    if (data && data.length > 0) {
      return data.map(mapDbToUser);
    }
    return [];
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      console.warn('Supabase fetch users notice (offline mode):', err);
    } else {
      console.warn('Failed to query central database for users notice:', err);
    }
    return [];
  }
}

export async function dbSaveUser(user: User): Promise<boolean> {
  try {
    const payload = mapUserToDb(user);
    // Try upserting on primary key 'id' first
    let { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      // Fallback to 'email' if schema constraint demands email conflict target
      const retry = await supabase.from('users').upsert(payload, { onConflict: 'email' });
      error = retry.error;
    }
    if (error) {
      if (isNetworkOrFetchError(error)) {
        console.warn('Supabase user save network notice (local-first storage active):', error.message || error);
      } else {
        console.warn('Supabase upsert user notice:', error.message || error);
      }
      return false;
    }
    return true;
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      console.warn('Failed to save user to central DB notice (offline mode active):', err);
    } else {
      console.warn('Failed to save user to central DB notice:', err);
    }
    return false;
  }
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      if (isNetworkOrFetchError(error)) {
        console.warn('Supabase delete user network notice:', error.message || error);
      } else {
        console.warn('Supabase delete user notice:', error.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete user from central DB notice:', err);
    return false;
  }
}

// LEADS
export async function dbFetchLeads(): Promise<LeadInquiry[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch leads warning:', error.message);
      return [];
    }

    if (data && data.length > 0) {
      return data.map(mapDbToLead);
    }
    return [];
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      console.warn('Supabase fetch leads notice (offline mode):', err);
    } else {
      console.warn('Failed to query central database for leads notice:', err);
    }
    return [];
  }
}

export async function dbSaveLead(lead: LeadInquiry): Promise<boolean> {
  try {
    const payload = mapLeadToDb(lead);
    const { error } = await supabase.from('leads').insert([payload]);
    if (error) {
      if (isNetworkOrFetchError(error)) {
        console.warn('Supabase insert lead network notice:', error.message || error);
      } else {
        console.warn('Supabase insert lead notice:', error.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to save lead to central DB notice:', err);
    return false;
  }
}

export async function dbUpdateLeadStatus(
  id: string,
  status: 'new' | 'contacted' | 'resolved'
): Promise<boolean> {
  try {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) {
      console.warn('Supabase update lead notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to update lead status in central DB notice:', err);
    return false;
  }
}

export async function dbDeleteLead(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete lead notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete lead from central DB notice:', err);
    return false;
  }
}

/**
 * Seed central database safely without overwriting existing changes
 */
export async function seedCentralDatabaseIfNeeded() {
  try {
    if (typeof window !== 'undefined') {
      const alreadySeeded = sessionStorage.getItem('yebo_session_seeded') || localStorage.getItem('yebo_central_db_seeded');
      if (alreadySeeded) return;
    }

    // 1. Seed users ONLY if database users table is completely empty
    const { data: existingUsers } = await supabase.from('users').select('id').limit(1);
    if (!existingUsers || existingUsers.length === 0) {
      for (const u of INITIAL_USERS) {
        await dbSaveUser(u);
      }
    }

    // 2. Check if cards table has non-system cards, if empty AND never seeded before
    const hasCardsSeeded = typeof window !== 'undefined' && localStorage.getItem('yebo_cards_seeded');
    if (!hasCardsSeeded) {
      const { data: existingCards } = await supabase
        .from('cards')
        .select('id')
        .neq('slug', 'system-companies-registry')
        .limit(1);

      if (!existingCards || existingCards.length === 0) {
        for (const c of INITIAL_CARDS.slice(0, 5)) {
          await dbSaveCard(c);
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('yebo_cards_seeded', 'true');
      }
    }

    // 3. Seed initial companies registry if missing
    const { data: regCard } = await supabase
      .from('cards')
      .select('id')
      .eq('slug', 'system-companies-registry')
      .limit(1);

    if (!regCard || regCard.length === 0) {
      await dbSaveCompanies(INITIAL_COMPANIES);
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('yebo_session_seeded', 'true');
      localStorage.setItem('yebo_central_db_seeded', 'true');
    }
  } catch (err) {
    console.warn('Database seed check non-fatal:', err);
  }
}

/**
 * Fetch a specific card by slug or id directly from central DB
 * Critical for direct link sharing (/card/:slug) across devices
 */
export async function dbFetchCardBySlugOrId(slugOrId: string): Promise<BusinessCard | null> {
  try {
    const clean = slugOrId.toLowerCase().trim();

    // 1. First attempt exact or case-insensitive slug match
    const { data: bySlug, error: slugErr } = await supabase
      .from('cards')
      .select('*')
      .ilike('slug', clean)
      .limit(1)
      .maybeSingle();

    if (!slugErr && bySlug) {
      return mapDbToCard(bySlug);
    }

    // 2. Fallback to direct ID match
    const { data: byId, error: idErr } = await supabase
      .from('cards')
      .select('*')
      .eq('id', slugOrId)
      .limit(1)
      .maybeSingle();

    if (!idErr && byId) {
      return mapDbToCard(byId);
    }

    // 3. Robust fallback: partial slug match
    const { data: byPartial } = await supabase
      .from('cards')
      .select('*')
      .ilike('slug', `%${clean}%`)
      .limit(1)
      .maybeSingle();

    if (byPartial) {
      return mapDbToCard(byPartial);
    }

    return null;
  } catch (err) {
    console.error('Failed to query card by slug/id from DB:', err);
    return null;
  }
}

/**
 * Real-time live subscription to Central Database changes
 * Keeps cards, users, and inquiries live and in sync across sessions
 */
export function subscribeToCentralDatabase(callbacks: {
  onCardsChange?: () => void;
  onUsersChange?: () => void;
  onLeadsChange?: () => void;
  onStatusChange?: (online: boolean) => void;
}) {
  try {
    const channel = supabase
      .channel('yebo_live_sync_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        callbacks.onCardsChange?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        callbacks.onUsersChange?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        callbacks.onLeadsChange?.();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          callbacks.onStatusChange?.(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          callbacks.onStatusChange?.(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription notice:', err);
    return () => {};
  }
}

/**
 * Health check for central database
 */
export async function dbCheckHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('cards').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
