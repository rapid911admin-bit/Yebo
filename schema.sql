-- =============================================================================
-- B-SMART COMMUNICATOR & YEBO DIGITAL BUSINESS CARDS
-- Central PostgreSQL Database Schema & Architecture
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. COMPANIES REGISTRY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tagline TEXT,
  category VARCHAR(64) NOT NULL DEFAULT 'custom',
  category_label VARCHAR(128),
  logo_url TEXT,
  theme JSONB NOT NULL DEFAULT '{"primaryColor": "#f59e0b", "bgType": "dark", "glassmorphism": true, "darkOverlayOpacity": 70}'::jsonb,
  about_text TEXT,
  operating_hours TEXT,
  website TEXT,
  phone VARCHAR(64),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for searching companies by name and category
CREATE INDEX IF NOT EXISTS idx_companies_category ON public.companies (category);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies (name);

-- -----------------------------------------------------------------------------
-- 2. USERS & EMPLOYEES TABLE
-- Note: Administrators have login passwords; Employees use direct smart card links.
-- Companies can have multiple employees.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'employee', -- 'admin' | 'employee'
  company_id VARCHAR(64) REFERENCES public.companies(id) ON DELETE SET NULL,
  password TEXT, -- Populated exclusively for administrators
  assigned_card_id VARCHAR(64), -- Direct link to active smart business card
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active' | 'paused'
  phone VARCHAR(64),
  designation VARCHAR(128),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users (company_id);
CREATE INDEX IF NOT EXISTS idx_users_assigned_card_id ON public.users (assigned_card_id);

-- -----------------------------------------------------------------------------
-- 3. SMART BUSINESS CARDS TABLE
-- Stores full digital card profiles with company branding & employee details.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cards (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) REFERENCES public.companies(id) ON DELETE SET NULL,
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
  theme JSONB NOT NULL DEFAULT '{"primaryColor": "#f59e0b", "bgType": "dark", "glassmorphism": true, "darkOverlayOpacity": 70}'::jsonb,
  banners JSONB DEFAULT '[]'::jsonb,
  chips JSONB DEFAULT '[]'::jsonb,
  tabs JSONB DEFAULT '[]'::jsonb,
  phone VARCHAR(64),
  whatsapp VARCHAR(64),
  email VARCHAR(255),
  address TEXT,
  website TEXT,
  contact_name VARCHAR(255),
  hero_url TEXT,
  panic_phone VARCHAR(64),
  emergency_phone VARCHAR(64),
  social_links JSONB DEFAULT '{}'::jsonb,
  about_text TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  operating_hours TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'live', -- 'live' | 'draft'
  published BOOLEAN DEFAULT true,
  assigned_member_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  views_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  call_clicks_count INT DEFAULT 0,
  whatsapp_clicks_count INT DEFAULT 0,
  vcard_downloads_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_slug ON public.cards (slug);
CREATE INDEX IF NOT EXISTS idx_cards_company_id ON public.cards (company_id);
CREATE INDEX IF NOT EXISTS idx_cards_assigned_member_id ON public.cards (assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON public.cards (status);

-- -----------------------------------------------------------------------------
-- 4. LEADS & INQUIRIES TABLE
-- Captures contact form inquiries submitted from public digital card profiles.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id VARCHAR(64) REFERENCES public.cards(id) ON DELETE CASCADE,
  card_name VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(64),
  message TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'new', -- 'new' | 'contacted' | 'resolved'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_card_id ON public.leads (card_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public read of published cards & companies
CREATE POLICY "Public Read Live Cards" ON public.cards
  FOR SELECT USING (status = 'live' OR slug = 'system-companies-registry');

CREATE POLICY "Public Read Companies" ON public.companies
  FOR SELECT USING (true);

-- Allow public lead submission
CREATE POLICY "Public Insert Leads" ON public.leads
  FOR INSERT WITH CHECK (true);

-- Allow system administrative read & write
CREATE POLICY "System All Operations on Cards" ON public.cards
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System All Operations on Users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System All Operations on Leads" ON public.leads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System All Operations on Companies" ON public.companies
  FOR ALL USING (true) WITH CHECK (true);
