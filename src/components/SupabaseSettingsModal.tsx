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
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');

  const migrationSQL = `-- YeboCard Complete Database Schema & Admin Access Control
-- Run this in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  tagline TEXT,
  business_type TEXT DEFAULT 'security',
  business_type_label TEXT DEFAULT 'Security & Armed Response',
  contact_person_name TEXT,
  designation TEXT,
  emergency_phone TEXT,
  logo_url TEXT,
  banners JSONB DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '{"primaryColor": "#ef4444", "bgType": "image"}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  about_text TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  operating_hours TEXT DEFAULT '24/7 Armed Control',
  status TEXT DEFAULT 'live',
  assigned_member_id TEXT,
  views_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) Rules:
-- 1. Public can view live cards and submit leads
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view live cards"
  ON public.cards FOR SELECT
  USING (status = 'live');

CREATE POLICY "Public can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- 2. Only Zweli / Admin can insert or update cards
CREATE POLICY "Admin full access to cards"
  ON public.cards FOR ALL
  USING (auth.jwt() ->> 'email' = 'zweli@msn.com');
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
                Supabase Backend & Security Configuration
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
              onClick={() => setActiveTab('config')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'config'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Credentials & Status
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'sql'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              SQL Schema & RLS Policy
            </button>
          </div>

          {activeTab === 'config' ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <h4 className="font-bold">Connected Project: gcquxurtomxbmrpwclka</h4>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    Integrated with admin identity: <strong>zweli@msn.com</strong>.
                    Local offline fallback is active with persistent state so all features work immediately.
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
                  Supabase Anon Public API Key (Safe for client browsers)
                </label>
                <textarea
                  rows={2}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  The secret <code>service_role</code> key is never bundled in the client to protect database security.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Run this migration in your Supabase SQL Editor:
                </span>
                <button
                  onClick={handleCopySQL}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                >
                  {copiedSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSQL ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-72">
                {migrationSQL}
              </pre>
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
