import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, X, Check, Copy, Shield, Terminal, AlertCircle } from 'lucide-react';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [projectId, setProjectId] = useState('gcquxurtomxbmrpwclka');
  const [anonKey, setAnonKey] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcXV4dXJ0b214Ym1ycHdjbGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MTg1NDIsImV4cCI6MjEwNjM5NDU0Mn0.eUY1UslqZk8BtRqgaMm4SdiIdlWr_28BvuB72nL1syw'
  );
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('sql');

  const migrationSQL = `-- =====================================================================
-- YEBO CARD - COMPLETE IDEMPOTENT SUPABASE MIGRATION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

-- 1. CARDS TABLE SETUP & COLUMN ENFORCEMENT
CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL
);

-- Safely add all required columns if they do not exist
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT 'My Business';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'security';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS business_type_label TEXT DEFAULT 'Security & Armed Response';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS contact_person_name TEXT DEFAULT '';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT '';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS emergency_phone TEXT DEFAULT '';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS banners JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{"primaryColor": "#ef4444", "darkOverlayOpacity": 75}'::jsonb;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS about_text TEXT DEFAULT '';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS operating_hours TEXT DEFAULT '24/7 Armed Control Room';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'live';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS assigned_member_id TEXT DEFAULT '';
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS call_clicks_count INTEGER DEFAULT 0;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS whatsapp_clicks_count INTEGER DEFAULT 0;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS vcard_downloads_count INTEGER DEFAULT 0;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- 2. USERS / PROFILES TABLE SETUP & COLUMN ENFORCEMENT
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'password123';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS assigned_card_id TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- 3. LEADS TABLE SETUP & COLUMN ENFORCEMENT
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';


-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Clean up existing policy rules safely
DROP POLICY IF EXISTS "Public can view live cards" ON public.cards;
DROP POLICY IF EXISTS "Public can insert cards" ON public.cards;
DROP POLICY IF EXISTS "Admin full access to cards" ON public.cards;
DROP POLICY IF EXISTS "Public can view cards" ON public.cards;
DROP POLICY IF EXISTS "Public can modify cards" ON public.cards;
DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;
DROP POLICY IF EXISTS "Public can access users" ON public.users;

-- Create policies
CREATE POLICY "Public can view cards"
  ON public.cards FOR SELECT
  USING (true);

CREATE POLICY "Public can modify cards"
  ON public.cards FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can submit leads"
  ON public.leads FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can access users"
  ON public.users FOR ALL
  USING (true)
  WITH CHECK (true);


-- 5. SEED MASTER ADMIN USERS
INSERT INTO public.users (id, email, name, role, password, phone, designation, status)
VALUES 
  (
    'user-zweli-admin',
    'zweli@msn.com',
    'Zweli Mkhize (Master Admin)',
    'admin',
    'password123',
    '+27 82 911 0000',
    'Managing Director & Operations Head',
    'active'
  ),
  (
    'user-clint-admin',
    'clint@rapid911.co.za',
    'Clint (Rapid 911 Admin)',
    'admin',
    'password123',
    '+27 82 911 9999',
    'Executive Director & Rapid 911 Admin',
    'active'
  )
ON CONFLICT (email) DO UPDATE
SET role = 'admin', password = 'password123';
`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(migrationSQL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Supabase Backend & Migration Script
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sql')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'sql'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Full Updated SQL Schema
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'config'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Credentials & Project Info
            </button>
          </div>

          {activeTab === 'sql' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Paste and run this in your Supabase SQL Editor:
                </span>
                <button
                  onClick={handleCopySQL}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow"
                >
                  {copiedSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSQL ? 'Copied to Clipboard' : 'Copy Complete SQL'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-80 select-all leading-relaxed">
                {migrationSQL}
              </pre>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <h4 className="font-bold">Project Ref: gcquxurtomxbmrpwclka</h4>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    Configured for admin <strong>zweli@msn.com</strong>. High-performance offline fallback active.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Supabase Project ID
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Supabase Anon Public API Key
                </label>
                <textarea
                  rows={2}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white text-xs"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
