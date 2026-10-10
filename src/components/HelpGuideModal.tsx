import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  X,
  Building2,
  Users,
  CreditCard,
  QrCode,
  Share2,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Smartphone,
  Copy,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Compass,
  Phone,
  BookOpen,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnboarding?: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  onStartOnboarding,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'overview' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5'>('overview');

  if (!isOpen) return null;

  return (
    <div key="help-guide-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`relative w-full max-w-4xl ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl shadow-amber-950/20' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        } border rounded-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col`}
      >
          {/* Header */}
          <div className={`p-4 sm:p-6 border-b ${isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    B-Smart Mobile Communicator
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    Guide
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                  Complete Onboarding & Communicator User Manual
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'} transition-colors cursor-pointer`}
              title="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subnav Tabs */}
          <div className={`px-4 sm:px-6 py-2.5 border-b ${isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-100/60'} overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0 text-xs font-bold`}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>1. Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('step1')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'step1'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>2. Organization Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('step2')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'step2'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>3. Schedule & Template</span>
            </button>

            <button
              onClick={() => setActiveTab('step3')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'step3'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>4. Team Members & Cards</span>
            </button>

            <button
              onClick={() => setActiveTab('step4')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'step4'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              <span>5. Share & Distribute</span>
            </button>

            <button
              onClick={() => setActiveTab('step5')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'step5'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>6. Leads & Inquiries</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-amber-50/70 border-amber-200'} space-y-3`}>
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>How B-Smart Mobile Communicator Works</span>
                  </div>
                  <h4 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'} leading-tight`}>
                    Unified Brand Architecture with Personalized Team Cards
                  </h4>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
                    B-Smart Mobile Communicator separates <strong>Corporate Brand Consistency</strong> from <strong>Individual Team Member Profiles</strong>.
                    Every organization sets a master brand template (logo, brand accent color, hero banners, trading hours, and services). When individual team members receive their unique smart card link, they inherit 100% of corporate brand standards while displaying their own direct phone number, photo, job title, and unique QR code.
                  </p>
                </div>

                {/* Architecture Visual Mockup / Screenshot */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Architecture Workflow Screenshot
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>1. Company Level</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Corporate Name, Logo, Brand Palette, 24/7 Operating Hours, Services list.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                        <Users className="w-4 h-4 shrink-0" />
                        <span>2. Team Member Level</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Full Name, Job Title/Designation, Mobile, WhatsApp, and Profile Avatar.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <Smartphone className="w-4 h-4 shrink-0" />
                        <span>3. Smart Communicator</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Unique URL (/card/slug), QR Code, NFC Tap, Call/WhatsApp, and vCard export.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3 Step Quick Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <h5 className="text-xs font-bold text-white">Create Company Profile</h5>
                    <p className="text-[11px] text-slate-400">
                      Set up your company, upload logo, choose brand colors, and configure operating schedule.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      2
                    </div>
                    <h5 className="text-xs font-bold text-white">Add Team Members</h5>
                    <p className="text-[11px] text-slate-400">
                      Input your staff member names and roles. Unique URLs are auto-generated with zero manual coding.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      3
                    </div>
                    <h5 className="text-xs font-bold text-white">Share Everywhere</h5>
                    <p className="text-[11px] text-slate-400">
                      Print QR codes on badges, share via WhatsApp, write to NFC cards, or save directly to phone contacts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STEP 1 - ORGANIZATION PROFILE */}
            {activeTab === 'step1' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Step 1: Setting Up Your Organization Profile
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                    Start by registering your company in the Companies Directory. This acts as the root umbrella for all corporate smart communicators and team member links.
                  </p>
                </div>

                {/* Screenshot UI Mockup: Company Creation Card */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-800">
                    <span>UI Screenshot Mockup: Company Creation Modal</span>
                    <span className="text-amber-400">● Live Step</span>
                  </div>

                  <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 font-black text-base">
                        BS
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">BeSmart Corporate Solutions</div>
                        <div className="text-[10px] text-amber-500 font-semibold">Corporate, Legal & Financial Advisory</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block">Brand Accent</span>
                        <span className="font-mono text-amber-400 font-bold">#f59e0b</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block">Industry</span>
                        <span className="text-slate-200 font-bold">Professional</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Corporate brand standards ready to inherit across all team cards.</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-white">Best Practices for Step 1:</h5>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>Use a square (1:1 aspect ratio) transparent PNG or high-res JPG for your corporate logo.</li>
                    <li>Select an accent color that matches your official brand guide (e.g. amber, emerald, sky, or custom hex).</li>
                    <li>Include official website and headquarters switchboard number for vCard exports.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 3: STEP 2 - OPERATION SCHEDULE & TEMPLATE */}
            {activeTab === 'step2' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Step 2: Brand Template Guidelines & Operating Schedule
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                    Inside each company workspace, you can define a <strong>Master Brand Template</strong>. This sets the hero banners carousel, list of company services, and trading timetable.
                  </p>
                </div>

                {/* Screenshot UI Mockup: Operating Schedule Timetable */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-800">
                    <span>UI Screenshot Mockup: Operation Schedule & Timetable</span>
                    <span className="text-emerald-400">● Active Editor</span>
                  </div>

                  <div className="max-w-lg mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Operation Schedule & Hours</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        Open Now
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="p-2 rounded-lg bg-slate-950 flex items-center justify-between">
                        <span className="font-bold text-slate-300">Mon - Fri:</span>
                        <span className="text-amber-400">08:00 - 18:00 (Support: 24/7)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 flex items-center justify-between">
                        <span className="font-bold text-slate-300">Saturday:</span>
                        <span className="text-slate-400">08:30 - 13:00</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 flex items-center justify-between">
                        <span className="font-bold text-slate-300">Sunday:</span>
                        <span className="text-slate-500 italic">Closed (Emergency Hotline Active)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-white">Schedule Features:</h5>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li><strong>Instant Presets:</strong> Choose 1-click presets for Corporate Office, 24/7 Armed Response, Retail, Hospitality, or By-Appointment.</li>
                    <li><strong>Day-by-Day Editor:</strong> Set custom opening and closing times for each day of the week with 1-click "Apply Monday to Weekdays".</li>
                    <li><strong>Live Status Pill:</strong> Displays green "Trading Hours" or "24/7 Active" automatically on cards.</li>
                  </ul>

                  {/* 300 DPI & Auto-Fit Banner Guide Tip */}
                  <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'} text-xs space-y-1.5`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Auto-Fit Banners & 300 DPI High-Resolution Standard</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Hero banners automatically fit to display 100% of your full image with zero edge cropping. All uploaded media is processed at <strong>300 DPI high resolution</strong> with certified metadata, ensuring pristine detail across high-density displays, mobile screens, and physical print exports.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STEP 3 - TEAM MEMBERS & AUTO-ISSUED CARDS */}
            {activeTab === 'step3' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Step 3: Onboard Team Members & Issue Smart Cards
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                    Team Members do not need administrative login accounts. Admins issue personalized digital smart cards with unique links (/card/slug) that team members can access immediately.
                  </p>
                </div>

                {/* Screenshot UI Mockup: Team Member Card */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-800">
                    <span>UI Screenshot Mockup: Issued Team Member Card in Workspace</span>
                    <span className="text-amber-400">● Live Card</span>
                  </div>

                  <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-amber-500 overflow-hidden flex items-center justify-center font-bold text-amber-400">
                        LK
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h6 className="text-sm font-bold text-white truncate">Lindiwe Khumalo</h6>
                          <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                            LIVE
                          </span>
                        </div>
                        <p className="text-xs text-amber-500 font-semibold truncate">
                          Client Relations Lead • Amazizi Software
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          /card/amazizi-lindiwe-khumalo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/60">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1">
                        <span>Reassign</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-white">Streamlined Team Management:</h5>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li><strong>No Confusing Duplicate Links:</strong> A single clean "Reassign" button lets you allocate or change card ownership at any time.</li>
                    <li><strong>Instant Auto-Slug:</strong> The card link is generated automatically from company name and team member name (e.g. <code>/card/amazizi-lindiwe-khumalo</code>).</li>
                    <li><strong>Live Simulator:</strong> Click "Preview" on any team member row to test their live communicator in the phone simulator on the right.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 5: STEP 4 - SHARE & DISTRIBUTE */}
            {activeTab === 'step4' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Step 4: Distribute Your Communicators
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                    B-Smart Communicators are built to be shared friction-free without requiring the recipient to download an app.
                  </p>
                </div>

                {/* Screenshot UI Mockup: Share Modal with QR code */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-800">
                    <span>UI Screenshot Mockup: 1-Tap QR & Direct Share Dialogue</span>
                    <span className="text-amber-400">● 4 Distribution Channels</span>
                  </div>

                  <div className="max-w-sm mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                    <div className="w-32 h-32 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg">
                      <QrCode className="w-24 h-24 text-slate-950" />
                    </div>

                    <div className="text-xs text-slate-300">
                      Scan with any smartphone camera to open instantly
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-1">
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800 text-amber-400 font-bold flex items-center justify-center gap-1 border border-amber-500/30">
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-400">1. Instant QR Code:</span>
                    <p className="text-slate-400">Print on company badges, packaging, vehicles, or point-of-sale displays.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-400">2. WhatsApp Direct:</span>
                    <p className="text-slate-400">Pre-formats a WhatsApp message with the recipient's card link ready to send.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-bold text-sky-400">3. .VCF vCard Download:</span>
                    <p className="text-slate-400">Recipients can tap "Save Contact" to save all info into their Apple or Android Contacts app.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-bold text-purple-400">4. Physical NFC Tap:</span>
                    <p className="text-slate-400">Write the unique card link to any standard NFC card or tag for 1-tap phone transfers.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: STEP 5 - LEADS & INQUIRIES */}
            {activeTab === 'step5' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Step 5: Managing Captured Leads & Callbacks
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                    Every communicator card has a built-in interactive contact inquiry form. Customer inquiries are routed directly to the Central DB and displayed in real-time in the Inquiries manager.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-800">
                    <span>UI Screenshot Mockup: Inquiries & Callback Management</span>
                    <span className="text-amber-400">● Real-time Lead Capture</span>
                  </div>

                  <div className="max-w-lg mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white">Sipho Dlamini</span>
                        <span className="text-[10px] text-slate-400 block font-mono">+27 82 555 9191 • sipho@invest.co.za</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        New Inquiry
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 text-xs text-slate-300 leading-snug">
                      "Hi Lindiwe, please provide a corporate proposal for 25 smart communicator licenses for our regional team."
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className={`p-4 sm:p-5 border-t ${isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'} flex items-center justify-between gap-3 shrink-0`}>
            <div className="text-xs text-slate-400 hidden sm:block">
              Need to set up a new company right now?
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'} text-xs font-bold transition-colors cursor-pointer`}
              >
                Close Guide
              </button>

              {onStartOnboarding && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartOnboarding();
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Guided Onboarding</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
};
