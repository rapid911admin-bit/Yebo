import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Neon Postgres Connection configuration
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID || 'patient-snow-11357681';
const NEON_DATABASE_URL =
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  '';

let neonSql: any = null;
if (NEON_DATABASE_URL) {
  try {
    neonSql = neon(NEON_DATABASE_URL);
  } catch (err) {
    console.warn('Neon client initialization notice:', err);
  }
}

// Auto-initialize Neon PostgreSQL tables if connected
async function initNeonTables() {
  if (!neonSql) return;
  try {
    await neonSql`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tagline TEXT,
        category VARCHAR(64) NOT NULL DEFAULT 'custom',
        category_label VARCHAR(128),
        logo_url TEXT,
        theme JSONB NOT NULL DEFAULT '{"primaryColor": "#f59e0b"}'::jsonb,
        about_text TEXT,
        operating_hours TEXT,
        website TEXT,
        phone VARCHAR(64),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await neonSql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'employee',
        company_id VARCHAR(64),
        password TEXT,
        assigned_card_id VARCHAR(64),
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        phone VARCHAR(64),
        designation VARCHAR(128),
        avatar_url TEXT,
        bio TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await neonSql`
      CREATE TABLE IF NOT EXISTS cards (
        id VARCHAR(64) PRIMARY KEY,
        company_id VARCHAR(64),
        owner_email VARCHAR(255),
        slug VARCHAR(128) NOT NULL UNIQUE,
        business_name VARCHAR(255) NOT NULL,
        tagline TEXT,
        business_type VARCHAR(64) NOT NULL DEFAULT 'custom',
        business_type_label VARCHAR(128),
        contact_person_name VARCHAR(255),
        designation VARCHAR(128),
        logo_url TEXT,
        accent VARCHAR(32) DEFAULT '#f59e0b',
        theme JSONB NOT NULL DEFAULT '{"primaryColor": "#f59e0b"}'::jsonb,
        banners JSONB DEFAULT '[]'::jsonb,
        chips JSONB DEFAULT '[]'::jsonb,
        tabs JSONB DEFAULT '[]'::jsonb,
        phone VARCHAR(64),
        whatsapp VARCHAR(64),
        email VARCHAR(255),
        address TEXT,
        website TEXT,
        panic_phone VARCHAR(64),
        emergency_phone VARCHAR(64),
        social_links JSONB DEFAULT '{}'::jsonb,
        about_text TEXT,
        services JSONB DEFAULT '[]'::jsonb,
        gallery_images JSONB DEFAULT '[]'::jsonb,
        operating_hours TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'live',
        assigned_member_id VARCHAR(64),
        views_count INT DEFAULT 0,
        shares_count INT DEFAULT 0,
        call_clicks_count INT DEFAULT 0,
        whatsapp_clicks_count INT DEFAULT 0,
        vcard_downloads_count INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await neonSql`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(64) PRIMARY KEY,
        card_id VARCHAR(64),
        card_name VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(64),
        message TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log(`[Neon] PostgreSQL tables verified for project ${NEON_PROJECT_ID}`);
  } catch (err) {
    console.warn('[Neon] Table initialization warning (non-fatal):', err);
  }
}

initNeonTables().catch(console.warn);

/* =========================================================================
   API ENDPOINTS (/api/*)
   ========================================================================= */

// Health & Status
app.get('/api/health', async (_req: Request, res: Response) => {
  const isNeonConfigured = !!neonSql;
  let isConnected = false;
  if (neonSql) {
    try {
      await neonSql`SELECT 1`;
      isConnected = true;
    } catch {
      isConnected = false;
    }
  }

  res.json({
    status: 'ok',
    provider: 'neon',
    projectId: NEON_PROJECT_ID,
    configured: isNeonConfigured,
    connected: isConnected,
  });
});

// COMPANIES API
app.get('/api/companies', async (_req: Request, res: Response) => {
  if (!neonSql) return res.json({ companies: [], source: 'local' });
  try {
    const rows = await neonSql`SELECT * FROM companies ORDER BY name ASC`;
    res.json({ companies: rows, source: 'neon' });
  } catch (err: any) {
    console.warn('[Neon] Fetch companies error:', err.message);
    res.json({ companies: [], source: 'fallback', error: err.message });
  }
});

app.post('/api/companies', async (req: Request, res: Response) => {
  const { companies } = req.body;
  if (!neonSql || !Array.isArray(companies)) {
    return res.json({ success: true, saved: companies?.length || 0 });
  }
  try {
    for (const c of companies) {
      await neonSql`
        INSERT INTO companies (id, name, tagline, category, category_label, logo_url, theme, about_text, operating_hours, website, phone, email, address, updated_at)
        VALUES (${c.id}, ${c.name}, ${c.tagline || ''}, ${c.category || 'custom'}, ${c.categoryLabel || ''}, ${c.logoUrl || ''}, ${JSON.stringify(c.theme || {})}, ${c.aboutText || ''}, ${c.operatingHours || ''}, ${c.website || ''}, ${c.phone || ''}, ${c.email || ''}, ${c.address || ''}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          tagline = EXCLUDED.tagline,
          category = EXCLUDED.category,
          category_label = EXCLUDED.category_label,
          logo_url = EXCLUDED.logo_url,
          theme = EXCLUDED.theme,
          about_text = EXCLUDED.about_text,
          operating_hours = EXCLUDED.operating_hours,
          website = EXCLUDED.website,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          address = EXCLUDED.address,
          updated_at = NOW();
      `;
    }
    res.json({ success: true, count: companies.length });
  } catch (err: any) {
    console.warn('[Neon] Save companies error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// CARDS API
app.get('/api/cards', async (_req: Request, res: Response) => {
  if (!neonSql) return res.json({ cards: [], source: 'local' });
  try {
    const rows = await neonSql`
      SELECT * FROM cards
      WHERE slug != 'system-companies-registry'
      ORDER BY created_at DESC
    `;
    res.json({ cards: rows, source: 'neon' });
  } catch (err: any) {
    console.warn('[Neon] Fetch cards error:', err.message);
    res.json({ cards: [], source: 'fallback', error: err.message });
  }
});

app.get('/api/cards/:slugOrId', async (req: Request, res: Response) => {
  const { slugOrId } = req.params;
  if (!neonSql) return res.json({ card: null });
  try {
    const clean = slugOrId.toLowerCase().trim();
    const rows = await neonSql`
      SELECT * FROM cards
      WHERE id = ${slugOrId} OR LOWER(slug) = ${clean} OR slug ILIKE ${`%${clean}%`}
      LIMIT 1
    `;
    res.json({ card: rows[0] || null });
  } catch (err: any) {
    console.warn('[Neon] Fetch card by slug error:', err.message);
    res.json({ card: null, error: err.message });
  }
});

app.post('/api/cards', async (req: Request, res: Response) => {
  const card = req.body;
  if (!neonSql || !card || !card.id) {
    return res.json({ success: true, card });
  }
  try {
    await neonSql`
      INSERT INTO cards (
        id, company_id, owner_email, slug, business_name, tagline, business_type, business_type_label,
        contact_person_name, designation, logo_url, accent, theme, banners, chips, tabs,
        phone, whatsapp, email, address, website, panic_phone, emergency_phone,
        social_links, about_text, services, gallery_images, operating_hours, status,
        assigned_member_id, views_count, shares_count, call_clicks_count, whatsapp_clicks_count, vcard_downloads_count, updated_at
      )
      VALUES (
        ${card.id}, ${card.companyId || null}, ${card.ownerEmail || 'zweli@msn.com'}, ${card.slug},
        ${card.businessName || 'Business Card'}, ${card.tagline || ''}, ${card.businessType || 'custom'}, ${card.businessTypeLabel || ''},
        ${card.contactPersonName || ''}, ${card.designation || ''}, ${card.logoUrl || ''}, ${card.theme?.primaryColor || '#f59e0b'},
        ${JSON.stringify(card.theme || {})}, ${JSON.stringify(card.banners || [])}, ${JSON.stringify(card.chips || [])}, ${JSON.stringify(card.tabs || [])},
        ${card.socialLinks?.phone || ''}, ${card.socialLinks?.whatsapp || ''}, ${card.socialLinks?.email || ''}, ${card.socialLinks?.address || ''}, ${card.socialLinks?.website || ''},
        ${card.emergencyPhone || ''}, ${card.emergencyPhone || ''}, ${JSON.stringify(card.socialLinks || {})},
        ${card.aboutText || ''}, ${JSON.stringify(card.services || [])}, ${JSON.stringify(card.galleryImages || [])}, ${card.operatingHours || ''},
        ${card.status || 'live'}, ${card.assignedMemberId || null},
        ${card.viewsCount || 0}, ${card.sharesCount || 0}, ${card.callClicksCount || 0}, ${card.whatsappClicksCount || 0}, ${card.vcardDownloadsCount || 0}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        slug = EXCLUDED.slug,
        business_name = EXCLUDED.business_name,
        tagline = EXCLUDED.tagline,
        business_type = EXCLUDED.business_type,
        business_type_label = EXCLUDED.business_type_label,
        contact_person_name = EXCLUDED.contact_person_name,
        designation = EXCLUDED.designation,
        logo_url = EXCLUDED.logo_url,
        accent = EXCLUDED.accent,
        theme = EXCLUDED.theme,
        banners = EXCLUDED.banners,
        chips = EXCLUDED.chips,
        tabs = EXCLUDED.tabs,
        phone = EXCLUDED.phone,
        whatsapp = EXCLUDED.whatsapp,
        email = EXCLUDED.email,
        address = EXCLUDED.address,
        website = EXCLUDED.website,
        panic_phone = EXCLUDED.panic_phone,
        emergency_phone = EXCLUDED.emergency_phone,
        social_links = EXCLUDED.social_links,
        about_text = EXCLUDED.about_text,
        services = EXCLUDED.services,
        gallery_images = EXCLUDED.gallery_images,
        operating_hours = EXCLUDED.operating_hours,
        status = EXCLUDED.status,
        assigned_member_id = EXCLUDED.assigned_member_id,
        views_count = EXCLUDED.views_count,
        shares_count = EXCLUDED.shares_count,
        call_clicks_count = EXCLUDED.call_clicks_count,
        whatsapp_clicks_count = EXCLUDED.whatsapp_clicks_count,
        vcard_downloads_count = EXCLUDED.vcard_downloads_count,
        updated_at = NOW();
    `;
    res.json({ success: true, card });
  } catch (err: any) {
    console.warn('[Neon] Save card error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cards/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!neonSql) return res.json({ success: true });
  try {
    await neonSql`DELETE FROM cards WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err: any) {
    console.warn('[Neon] Delete card error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// METRIC INCREMENT
app.post('/api/cards/:id/metric', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type } = req.body;
  if (!neonSql) return res.json({ success: true });
  try {
    if (type === 'view') {
      await neonSql`UPDATE cards SET views_count = COALESCE(views_count, 0) + 1 WHERE id = ${id}`;
    } else if (type === 'share') {
      await neonSql`UPDATE cards SET shares_count = COALESCE(shares_count, 0) + 1 WHERE id = ${id}`;
    } else if (type === 'call') {
      await neonSql`UPDATE cards SET call_clicks_count = COALESCE(call_clicks_count, 0) + 1 WHERE id = ${id}`;
    } else if (type === 'whatsapp') {
      await neonSql`UPDATE cards SET whatsapp_clicks_count = COALESCE(whatsapp_clicks_count, 0) + 1 WHERE id = ${id}`;
    } else if (type === 'vcard') {
      await neonSql`UPDATE cards SET vcard_downloads_count = COALESCE(vcard_downloads_count, 0) + 1 WHERE id = ${id}`;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// USERS API
app.get('/api/users', async (_req: Request, res: Response) => {
  if (!neonSql) return res.json({ users: [], source: 'local' });
  try {
    const rows = await neonSql`SELECT * FROM users ORDER BY created_at ASC`;
    res.json({ users: rows, source: 'neon' });
  } catch (err: any) {
    console.warn('[Neon] Fetch users error:', err.message);
    res.json({ users: [], source: 'fallback', error: err.message });
  }
});

app.post('/api/users', async (req: Request, res: Response) => {
  const user = req.body;
  if (!neonSql || !user || !user.id) {
    return res.json({ success: true, user });
  }
  try {
    await neonSql`
      INSERT INTO users (id, email, name, role, company_id, password, assigned_card_id, status, phone, designation, avatar_url, bio, updated_at)
      VALUES (
        ${user.id}, ${user.email.toLowerCase().trim()}, ${user.name}, ${user.role || 'employee'},
        ${user.companyId || null}, ${user.password || null}, ${user.assignedCardId || null},
        ${user.status || 'active'}, ${user.phone || ''}, ${user.designation || ''},
        ${user.avatarUrl || ''}, ${user.bio || ''}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        company_id = EXCLUDED.company_id,
        password = EXCLUDED.password,
        assigned_card_id = EXCLUDED.assigned_card_id,
        status = EXCLUDED.status,
        phone = EXCLUDED.phone,
        designation = EXCLUDED.designation,
        avatar_url = EXCLUDED.avatar_url,
        bio = EXCLUDED.bio,
        updated_at = NOW();
    `;
    res.json({ success: true, user });
  } catch (err: any) {
    console.warn('[Neon] Save user error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!neonSql) return res.json({ success: true });
  try {
    await neonSql`DELETE FROM users WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err: any) {
    console.warn('[Neon] Delete user error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// LEADS API
app.get('/api/leads', async (_req: Request, res: Response) => {
  if (!neonSql) return res.json({ leads: [], source: 'local' });
  try {
    const rows = await neonSql`SELECT * FROM leads ORDER BY created_at DESC`;
    res.json({ leads: rows, source: 'neon' });
  } catch (err: any) {
    console.warn('[Neon] Fetch leads error:', err.message);
    res.json({ leads: [], source: 'fallback', error: err.message });
  }
});

app.post('/api/leads', async (req: Request, res: Response) => {
  const lead = req.body;
  if (!neonSql || !lead) return res.json({ success: true, lead });
  try {
    const id = lead.id || `lead-${Date.now()}`;
    await neonSql`
      INSERT INTO leads (id, card_id, card_name, name, email, phone, message, status)
      VALUES (
        ${id}, ${lead.cardId || 'card-general'}, ${lead.cardName || 'Smart Card'},
        ${lead.name}, ${lead.email || ''}, ${lead.phone || ''}, ${lead.message || ''},
        ${lead.status || 'new'}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status;
    `;
    res.json({ success: true, lead: { ...lead, id } });
  } catch (err: any) {
    console.warn('[Neon] Save lead error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/leads/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!neonSql) return res.json({ success: true });
  try {
    await neonSql`UPDATE leads SET status = ${status} WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!neonSql) return res.json({ success: true });
  try {
    await neonSql`DELETE FROM leads WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   VITE MIDDLEWARE IN DEV OR STATIC SERVING IN PROD
   ========================================================================= */
async function bootstrap() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`B-Smart Communicator with Neon DB running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
