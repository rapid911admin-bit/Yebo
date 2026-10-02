import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BusinessCard, LeadInquiry, User } from '../types';
import { INITIAL_CARDS, INITIAL_USERS } from '../data/defaultCards';

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

  return {
    id: card.id,
    owner_email: 'zweli@msn.com',
    slug: card.slug,
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
      ...(card.socialLinks || {}),
    },
    about_text: card.aboutText || '',
    services: card.services || [],
    gallery_images: card.galleryImages || [],
    operating_hours: card.operatingHours || '',
    status: card.status || 'live',
    published: card.status === 'live',
    assigned_member_id: card.assignedMemberId || null,
    views_count: card.viewsCount || 0,
    shares_count: card.sharesCount || 0,
    call_clicks_count: card.callClicksCount || 0,
    whatsapp_clicks_count: card.whatsappClicksCount || 0,
    vcard_downloads_count: card.vcardDownloadsCount || 0,
    updated_at: new Date().toISOString(),
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

export function mapUserToDb(user: User): any {
  return {
    id: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name,
    role: user.role,
    password: user.password || 'password123',
    assigned_card_id: user.assignedCardId || null,
    status: user.status || 'active',
    phone: user.phone || '',
    designation: user.designation || '',
    avatar_url: user.avatarUrl || '',
    bio: user.bio || '',
    updated_at: new Date().toISOString(),
  };
}

export function mapDbToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: (row.role as any) || 'member',
    password: row.password || 'password123',
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

// CARDS
export async function dbFetchCards(): Promise<BusinessCard[]> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
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
    console.error('Failed to query central database for cards:', err);
    return [];
  }
}

export async function dbSaveCard(card: BusinessCard): Promise<boolean> {
  try {
    const payload = mapCardToDb(card);
    const { error } = await supabase.from('cards').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert card error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save card to central DB:', err);
    return false;
  }
}

export async function dbDeleteCard(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete card error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete card from central DB:', err);
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
    console.error('Failed to query central database for users:', err);
    return [];
  }
}

export async function dbSaveUser(user: User): Promise<boolean> {
  try {
    const payload = mapUserToDb(user);
    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'email' });
    if (error) {
      console.error('Supabase upsert user error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save user to central DB:', err);
    return false;
  }
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete user error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete user from central DB:', err);
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
    console.error('Failed to query central database for leads:', err);
    return [];
  }
}

export async function dbSaveLead(lead: LeadInquiry): Promise<boolean> {
  try {
    const payload = mapLeadToDb(lead);
    const { error } = await supabase.from('leads').insert([payload]);
    if (error) {
      console.error('Supabase insert lead error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save lead to central DB:', err);
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
      console.error('Supabase update lead error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to update lead status in central DB:', err);
    return false;
  }
}

export async function dbDeleteLead(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete lead error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete lead from central DB:', err);
    return false;
  }
}

/**
 * Seed central database safely without overwriting existing changes
 */
export async function seedCentralDatabaseIfNeeded() {
  try {
    // 1. Fetch existing users to avoid destructive overwrites
    const { data: existingUsers } = await supabase.from('users').select('id, email');
    const existingEmails = new Set(
      (existingUsers || []).map((u) => u.email?.toLowerCase().trim())
    );

    // Only seed users that don't exist yet
    for (const u of INITIAL_USERS) {
      if (!existingEmails.has(u.email.toLowerCase().trim())) {
        await dbSaveUser(u);
      }
    }

    // 2. Check if cards table is empty, if so seed starter cards
    const { data: existingCards } = await supabase.from('cards').select('id').limit(1);
    if (!existingCards || existingCards.length === 0) {
      for (const c of INITIAL_CARDS.slice(0, 5)) {
        await dbSaveCard(c);
      }
    }
  } catch (err) {
    console.warn('Database seed check non-fatal:', err);
  }
}
