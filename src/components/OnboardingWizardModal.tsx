import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Users,
  CreditCard,
  Clock,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Smartphone,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { BusinessCategory, CardTheme, Company, BusinessCard, User } from '../types';
import { ImageUploadOrUrlField } from './ImageUploadOrUrlField';
import { OperatingScheduleEditor } from './OperatingScheduleEditor';
import { useTheme } from '../context/ThemeContext';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    company: Company;
    templateCard: BusinessCard;
    teamMembers: Array<{
      user: User;
      card: BusinessCard;
    }>;
  }) => void;
}

interface NewTeamMemberInput {
  name: string;
  designation: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

const CATEGORY_OPTIONS: { id: BusinessCategory; label: string }[] = [
  { id: 'security', label: 'Security & Armed Response' },
  { id: 'professional', label: 'Corporate, Legal & Financial Advisory' },
  { id: 'restaurant', label: 'Restaurant, Cafe & Hospitality' },
  { id: 'real_estate', label: 'Real Estate & Property Development' },
  { id: 'trades', label: 'Trades, Automotive & Engineering' },
  { id: 'medical', label: 'Medical, Health & Clinical Care' },
  { id: 'beauty', label: 'Beauty, Salon & Wellness' },
  { id: 'retail', label: 'Retail, Boutique & E-Commerce' },
  { id: 'freelance', label: 'Creative Studio, Media & Technology' },
  { id: 'community', label: 'Community & Non-Profit' },
  { id: 'custom', label: 'Custom Enterprise / Organization' },
];

const PRESET_COLORS = [
  '#f59e0b', // Amber (Default)
  '#ef4444', // Red
  '#10b981', // Emerald
  '#0ea5e9', // Sky
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Company Profile
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('professional');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f59e0b');

  // Step 2: Schedule & Contact
  const [operatingHours, setOperatingHours] = useState('Mon - Fri: 08:00 - 18:00 (24/7 Digital Card Sharing)');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Step 3: Team Members
  const [teamMembers, setTeamMembers] = useState<NewTeamMemberInput[]>([
    { name: '', designation: '', email: '', phone: '' },
  ]);

  if (!isOpen) return null;

  const handleAddMemberRow = () => {
    setTeamMembers([...teamMembers, { name: '', designation: '', email: '', phone: '' }]);
  };

  const handleRemoveMemberRow = (index: number) => {
    if (teamMembers.length <= 1) return;
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleUpdateMember = (index: number, field: keyof NewTeamMemberInput, value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!companyName.trim()) {
        setErrorMsg('Please enter your company or organization name.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Filter valid members that have at least a name
      const validMembers = teamMembers.filter((m) => m.name.trim().length > 0);
      if (validMembers.length === 0) {
        setErrorMsg('Please add at least one team member to issue their smart communicator card.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleFinish = () => {
    const companyId = `comp-${Date.now()}`;
    const selectedCat = CATEGORY_OPTIONS.find((c) => c.id === category);

    const newCompany: Company = {
      id: companyId,
      name: companyName.trim(),
      tagline: tagline.trim() || 'Official Digital Smart Business Communicator',
      category,
      categoryLabel: selectedCat ? selectedCat.label : 'Corporate Advisory',
      logoUrl: logoUrl.trim(),
      theme: {
        primaryColor,
        bgType: 'dark',
        darkOverlayOpacity: 75,
        glassmorphism: true,
      },
      operatingHours,
      website: website.trim(),
      phone: phone.trim(),
      address: address.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Master Corporate Template Card
    const compSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const templateCardId = `card-${companyId}-master`;
    const templateCard: BusinessCard = {
      id: templateCardId,
      companyId,
      slug: compSlug || `company-${Date.now()}`,
      businessName: companyName.trim(),
      tagline: tagline.trim() || 'Official Digital Smart Business Communicator',
      businessType: category,
      businessTypeLabel: selectedCat ? selectedCat.label : 'Smart Card',
      contactPersonName: '',
      designation: 'Headquarters / Master Template',
      logoUrl: logoUrl.trim(),
      banners: [],
      theme: { ...newCompany.theme },
      socialLinks: {
        website: website.trim(),
        phone: phone.trim(),
        address: address.trim(),
      },
      aboutText: `Welcome to ${companyName.trim()}'s official smart business communicator. Contact any of our verified team members directly for inquiries, bookings, and instant WhatsApp support.`,
      services: [],
      galleryImages: [],
      operatingHours,
      status: 'live',
      viewsCount: 0,
      sharesCount: 0,
      callClicksCount: 0,
      whatsappClicksCount: 0,
      vcardDownloadsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Build Team Members & their cards
    const validMembers = teamMembers.filter((m) => m.name.trim().length > 0);
    const generatedTeam = validMembers.map((m, idx) => {
      const userId = `user-${Date.now()}-${idx}`;
      const memberCardId = `card-${companyId}-member-${idx + 1}`;
      const memberSlug = `${compSlug}-${m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

      const card: BusinessCard = {
        id: memberCardId,
        companyId,
        slug: memberSlug,
        businessName: companyName.trim(),
        tagline: tagline.trim() || 'Official Digital Smart Business Communicator',
        businessType: category,
        businessTypeLabel: selectedCat ? selectedCat.label : 'Smart Card',
        contactPersonName: m.name.trim(),
        designation: m.designation.trim() || 'Team Member',
        logoUrl: logoUrl.trim(),
        banners: [],
        theme: { ...newCompany.theme },
        socialLinks: {
          website: website.trim(),
          phone: m.phone.trim() || phone.trim(),
          email: m.email.trim(),
          whatsapp: m.phone.trim() || phone.trim(),
          address: address.trim(),
        },
        aboutText: `${m.name.trim()} is an official team member at ${companyName.trim()}. Reach out directly for consultations, quotes, and instant communications.`,
        services: [],
        galleryImages: [],
        operatingHours,
        status: 'live',
        assignedMemberId: userId,
        viewsCount: 0,
        sharesCount: 0,
        callClicksCount: 0,
        whatsappClicksCount: 0,
        vcardDownloadsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const user: User = {
        id: userId,
        name: m.name.trim(),
        email: m.email.trim() || `${m.name.toLowerCase().replace(/\s+/g, '.')}@${compSlug}.co.za`,
        role: 'employee',
        designation: m.designation.trim() || 'Team Member',
        companyId,
        assignedCardId: memberCardId,
        phone: m.phone.trim() || phone.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      return { user, card };
    });

    onComplete({
      company: newCompany,
      templateCard,
      teamMembers: generatedTeam,
    });

    onClose();
  };

  return (
    <div key="onboarding-wizard-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`relative w-full max-w-2xl ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl shadow-amber-950/20' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        } border rounded-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col`}
      >
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b ${isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Step-by-Step Onboarding Wizard
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Easily set up an organization and issue team smart communicator cards.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'} transition-colors cursor-pointer`}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className={`px-4 sm:px-6 py-3 border-b ${isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-100/60'} shrink-0`}>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { num: 1, label: 'Organization' },
                { num: 2, label: 'Schedule' },
                { num: 3, label: 'Team Members' },
                { num: 4, label: 'Launch' },
              ].map((step) => {
                const isActive = currentStep === step.num;
                const isPassed = currentStep > step.num;
                return (
                  <div key={`onb-step-${step.num}`} className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-500/40'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : step.num}
                    </div>
                    <span className={`text-[11px] font-bold truncate ${isActive ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Error Banner */}
          {errorMsg && (
            <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* STEP 1: ORGANIZATION / COMPANY PROFILE */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    1. Organization Identity & Brand
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Enter company name, industry sector, and brand accent colors.
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazizi Software Solutions or BeSmart Corporate"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border text-xs focus:outline-none focus:border-amber-500`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                    Corporate Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Digital Transformation & Next-Gen Smart Cards"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border text-xs focus:outline-none focus:border-amber-500`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Industry Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                      className={`w-full px-3.5 py-2.5 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    >
                      {CATEGORY_OPTIONS.map((cat, catIdx) => (
                        <option key={`onb-cat-${cat.id}-${catIdx}`} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {PRESET_COLORS.map((col, colIdx) => (
                        <button
                          key={`onb-col-${col}-${colIdx}`}
                          type="button"
                          onClick={() => setPrimaryColor(col)}
                          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shrink-0"
                          style={{
                            backgroundColor: col,
                            borderColor: primaryColor === col ? '#ffffff' : 'transparent',
                          }}
                        >
                          {primaryColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                    Company Logo
                  </label>
                  <ImageUploadOrUrlField
                    label="Upload Logo or Paste URL"
                    value={logoUrl}
                    onChange={(val) => setLogoUrl(val)}
                    placeholderUrl="https://images.unsplash.com/photo-..."
                  />
                </div>
              </div>
            )}

            {/* STEP 2: OPERATING SCHEDULE & CONTACT */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    2. Trading Schedule & Headquarters Contact
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Set your organization's business hours and official headquarters contact details.
                  </p>
                </div>

                <OperatingScheduleEditor
                  value={operatingHours}
                  onChange={(val) => setOperatingHours(val)}
                  title="Corporate Trading Schedule"
                  subtitle="Automatically inherited across all team member communicators."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Headquarters Switchboard Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+27 11 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Corporate Website
                    </label>
                    <input
                      type="url"
                      placeholder="https://company.co.za"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                    Physical Premises / Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Sandton Drive, Sandhurst, Sandton, 2196"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border text-xs focus:outline-none focus:border-amber-500`}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: TEAM MEMBERS ONBOARDING */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      3. Add Team Members & Auto-Issue Smart Cards
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Input staff personnel. Each receives a dedicated unique smart communicator link.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMemberRow}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {teamMembers.map((member, idx) => (
                    <div
                      key={`onb-member-input-${idx}`}
                      className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>Team Member #{idx + 1}</span>
                        </span>
                        {teamMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberRow(idx)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-1`}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Lindiwe Khumalo"
                            value={member.name}
                            onChange={(e) => handleUpdateMember(idx, 'name', e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl ${
                              isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            } border text-xs focus:outline-none focus:border-amber-500`}
                          />
                        </div>

                        <div>
                          <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-1`}>
                            Job Title / Designation *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Client Relations Lead or Director"
                            value={member.designation}
                            onChange={(e) => handleUpdateMember(idx, 'designation', e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl ${
                              isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            } border text-xs focus:outline-none focus:border-amber-500`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-1`}>
                            Direct Mobile / WhatsApp
                          </label>
                          <input
                            type="tel"
                            placeholder="+27 82 000 0000"
                            value={member.phone}
                            onChange={(e) => handleUpdateMember(idx, 'phone', e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl ${
                              isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            } border text-xs focus:outline-none focus:border-amber-500`}
                          />
                        </div>

                        <div>
                          <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-1`}>
                            Official Work Email
                          </label>
                          <input
                            type="email"
                            placeholder="member@company.co.za"
                            value={member.email}
                            onChange={(e) => handleUpdateMember(idx, 'email', e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl ${
                              isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            } border text-xs focus:outline-none focus:border-amber-500`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: LAUNCH & SUMMARY */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    4. Ready to Launch & Provision
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Review your setup summary before saving to the central database.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-white shadow-md shrink-0"
                      style={{ backgroundColor: primaryColor, borderColor: '#ffffff20' }}
                    >
                      {companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="text-base font-black text-white">{companyName}</h5>
                      <p className="text-xs text-amber-500 font-semibold">{tagline || 'Digital Smart Communicator'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Schedule</span>
                      <span className="text-amber-400 font-mono text-[11px] truncate block mt-0.5">
                        {operatingHours}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Team Cards</span>
                      <span className="text-emerald-400 font-black text-sm block mt-0.5">
                        {teamMembers.filter((m) => m.name.trim().length > 0).length} Cards
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Brand Accent</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                        <span className="font-mono text-white text-[11px]">{primaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">
                    Team Communicator Cards to be Activated:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {teamMembers
                      .filter((m) => m.name.trim().length > 0)
                      .map((m, idx) => (
                        <div
                          key={`onb-member-preview-${m.name}-${idx}`}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {m.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">{m.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{m.designation || 'Team Member'}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                            Ready to Issue
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className={`p-4 sm:p-5 border-t ${isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'} flex items-center justify-between gap-2 shrink-0`}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className={`min-h-[38px] px-4 py-2 rounded-xl ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                } text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className={`min-h-[38px] px-4 py-2 rounded-xl ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                } text-xs font-bold transition-colors cursor-pointer`}
              >
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[38px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/20 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="min-h-[38px] px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-950/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Company & Team Cards</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
};
