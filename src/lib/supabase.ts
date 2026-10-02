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
   TYPE MAPPERS: TypeScript (camelCase) <--> Database (snake_case)
   ========================================================================= */

export function mapCardToDb(card: BusinessCard): any {
  return {
    id: card.id,
    slug: card.slug,
    business_name: card.businessName,
    tagline: card.tagline || '',
    business_type: card.businessType || 'general',
    business_type_label: card.businessTypeLabel || '',
    contact_person_name: card.contactPersonName || '',
    designation: card.designation || '',
    emergency_phone: card.emergencyPhone || '',
    logo_url: card.logoUrl || '',
    banners: card.banners || [],
    theme: card.theme || {},
    social_links: card.socialLinks || {},
    about_text: card.aboutText || '',
    services: card.services || [],
    gallery_images: card.galleryImages || [],
    operating_hours: card.operatingHours || '',
    status: card.status || 'live',
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
  return {
    id: row.id,
    slug: row.slug,
    businessName: row.business_name || row.businessName || 'Business',
    tagline: row.tagline || '',
    businessType: row.business_type || row.businessType || 'general',
    businessTypeLabel: row.business_type_label || row.businessTypeLabel || '',
    contactPersonName: row.contact_person_name || row.contactPersonName || '',
    designation: row.designation || '',
    emergencyPhone: row.emergency_phone || row.emergencyPhone || '',
    logoUrl: row.logo_url || row.logoUrl || '',
    banners: row.banners || [],
    theme: row.theme || { primaryColor: '#ef4444', darkOverlayOpacity: 75 },
    socialLinks: row.social_links || row.socialLinks || {},
    aboutText: row.about_text || row.aboutText || '',
    services: row.services || [],
    galleryImages: row.gallery_images || row.galleryImages || [],
    operatingHours: row.operating_hours || row.operatingHours || '',
    status: row.status || 'live',
    assignedMemberId: row.assigned_member_id || row.assignedMemberId || undefined,
    viewsCount: row.views_count ?? row.viewsCount ?? 0,
    sharesCount: row.shares_count ?? row.sharesCount ?? 0,
    callClicksCount: row.call_clicks_count ?? row.callClicksCount ?? 0,
    whatsappClicksCount: row.whatsapp_clicks_count ?? row.whatsappClicksCount ?? 0,
    vcardDownloadsCount: row.vcard_downloads_count ?? row.vcardDownloadsCount ?? 0,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
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
    assignedCardId: row.assigned_card_id || row.assignedCardId || undefined,
    status: (row.status as any) || 'active',
    phone: row.phone || undefined,
    designation: row.designation || undefined,
    avatarUrl: row.avatar_url || row.avatarUrl || undefined,
    bio: row.bio || undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || undefined,
  };
}

export function mapLeadToDb(lead: LeadInquiry): any {
  return {
    id: lead.id,
    card_id: lead.cardId,
    card_name: lead.cardName,
    name: lead.name,
    email: lead.email || '',
    phone: lead.phone,
    message: lead.message || '',
    status: lead.status || 'new',
    created_at: lead.createdAt || new Date().toISOString(),
  };
}

export function mapDbToLead(row: any): LeadInquiry {
  return {
    id: row.id,
    cardId: row.card_id || row.cardId,
    cardName: row.card_name || row.cardName || 'Card',
    name: row.name,
    email: row.email || undefined,
    phone: row.phone,
    message: row.message || '',
    status: (row.status as any) || 'new',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
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

export async function dbUpdateLeadStatus(id: string, status: 'new' | 'contacted' | 'resolved'): Promise<boolean> {
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
 * Seed central database if tables are initialized for the first time
 */
export async function seedCentralDatabaseIfNeeded() {
  try {
    // 1. Ensure Clint and Zweli exist in database
    for (const u of INITIAL_USERS) {
      await dbSaveUser(u);
    }

    // 2. Check if cards table has data, if not seed default starter cards
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
