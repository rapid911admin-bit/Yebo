import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Save,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Image,
  Upload,
  Layers,
  Palette,
  Eye,
  Info,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { BusinessCard, StarterTemplate, User, BannerSlide, ServiceItem } from '../types';
import { STARTER_TEMPLATES } from '../data/starterTemplates';
import { AvatarUploadField } from './AvatarUploadField';

interface CardEditorProps {
  card?: BusinessCard | null;
  members: User[];
  onSave: (card: BusinessCard) => void;
  onCancel: () => void;
}

const PRESET_BACKGROUNDS = [
  { name: 'Dark Tactical', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Luxury Glass', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Warm Culinary', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Modern Architecture', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Healthcare Clean', url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Boutique Leather', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80' },
];

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#0ea5e9', // Sky
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const CardEditor: React.FC<CardEditorProps> = ({
  card,
  members,
  onSave,
  onCancel,
}) => {
  const isNew = !card;

  // Selected Starter Template state if creating new
  const [selectedTemplate, setSelectedTemplate] = useState<StarterTemplate | null>(null);
  const [hasPickedStarter, setHasPickedStarter] = useState(!isNew);

  // Form state
  const [formData, setFormData] = useState<BusinessCard>(() => {
    if (card) return { ...card };
    return {
      id: `card-${Date.now()}`,
      slug: '',
      businessName: '',
      tagline: '',
      businessType: 'security',
      businessTypeLabel: 'Security & Armed Response',
      contactPersonName: '',
      designation: '',
      logoUrl: '',
      banners: [],
      theme: {
        primaryColor: '#ef4444',
        secondaryColor: '#1e293b',
        bgType: 'image',
        bgImageUrl: PRESET_BACKGROUNDS[0].url,
        darkOverlayOpacity: 75,
        glassmorphism: true,
      },
      socialLinks: {},
      aboutText: '',
      services: [],
      galleryImages: [],
      operatingHours: 'Mon - Fri: 08:00 - 17:00',
      status: 'live',
      viewsCount: 0,
      sharesCount: 0,
      callClicksCount: 0,
      whatsappClicksCount: 0,
      vcardDownloadsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [activeSection, setActiveSection] = useState<'details' | 'banners' | 'services' | 'theme' | 'social'>('details');
  const [slugError, setSlugError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Apply starter template
  const handleApplyStarter = (tmpl: StarterTemplate) => {
    setSelectedTemplate(tmpl);
    const def = tmpl.defaultData;
    const baseSlug = (def.businessName || 'smart-card')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setFormData((prev) => ({
      ...prev,
      slug: baseSlug,
      businessName: def.businessName || '',
      tagline: def.tagline || '',
      businessType: def.businessType || tmpl.id,
      businessTypeLabel: def.businessTypeLabel || tmpl.name,
      contactPersonName: def.contactPersonName || '',
      designation: def.designation || '',
      emergencyPhone: def.emergencyPhone || '',
      logoUrl: def.logoUrl || '',
      aboutText: def.aboutText || '',
      operatingHours: def.operatingHours || 'Mon - Fri: 08:30 - 17:00',
      banners: def.banners ? [...def.banners] : [],
      services: def.services ? [...def.services] : [],
      theme: def.theme ? { ...prev.theme, ...def.theme } : prev.theme,
      socialLinks: def.socialLinks ? { ...def.socialLinks } : {},
    }));
    setHasPickedStarter(true);
  };

  const handleSlugChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, slug: sanitized });
    if (!sanitized) {
      setSlugError('Link name is required and forms the web address.');
    } else {
      setSlugError('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug.trim()) {
      setSlugError('Please specify a valid link name.');
      setActiveSection('details');
      return;
    }
    if (!formData.businessName.trim()) {
      alert('Please provide a business name.');
      setActiveSection('details');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      onSave({
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      setIsSaving(false);
    }, 400);
  };

  // Banner slide helpers
  const handleAddBanner = () => {
    const newBanner: BannerSlide = {
      id: `b-${Date.now()}`,
      title: 'New Promotional Offer',
      subtitle: 'Highlight your top service or seasonal discount here',
      imageUrl: PRESET_BACKGROUNDS[0].url,
      badgeText: 'Featured',
    };
    setFormData({
      ...formData,
      banners: [...formData.banners, newBanner],
    });
  };

  const handleRemoveBanner = (id: string) => {
    setFormData({
      ...formData,
      banners: formData.banners.filter((b) => b.id !== id),
    });
  };

  // Service helpers
  const handleAddService = () => {
    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      title: 'New Service or Product',
      description: 'Detail the features, delivery timeline, or warranty.',
      price: 'R499',
    };
    setFormData({
      ...formData,
      services: [...formData.services, newService],
    });
  };

  const handleRemoveService = (id: string) => {
    setFormData({
      ...formData,
      services: formData.services.filter((s) => s.id !== id),
    });
  };

  // If new card and starter hasn't been chosen yet:
  if (isNew && !hasPickedStarter) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 text-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Choose a Starter Template
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select an industry template to prefill colors, banners, promo copy, and services in 1 click.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {STARTER_TEMPLATES.map((tmpl) => (
            <motion.div
              key={tmpl.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleApplyStarter(tmpl)}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold">
                    {tmpl.tag}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{tmpl.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{tmpl.description}</p>
              </div>
              <button className="mt-4 w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1">
                <span>Select Starter</span>
                <Sparkles className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {isNew ? 'Create New YeboCard' : `Edit: ${formData.businessName || 'Card'}`}
            </h2>
            <p className="text-xs text-slate-400">
              Admin Control: Only administrators can publish and update card configurations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/40"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
          </motion.button>
        </div>
      </div>

      {/* Editor Sub-nav Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 mb-6 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSection('details')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'details' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          1. Business & Person
        </button>
        <button
          onClick={() => setActiveSection('banners')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'banners' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          2. Hero Banners ({formData.banners.length})
        </button>
        <button
          onClick={() => setActiveSection('services')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'services' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          3. Services & Pricing ({formData.services.length})
        </button>
        <button
          onClick={() => setActiveSection('theme')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'theme' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          4. Background & Brand
        </button>
        <button
          onClick={() => setActiveSection('social')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'social' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          5. Contact & Socials
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="space-y-6">
        {activeSection === 'details' && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
              Card Identification & Ownership
            </h3>

            {/* Link name / Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Card Web Link Name (Slug) *
                </label>
                <span className="text-[11px] text-slate-500">
                  URL: yourdomain.co.za/card/<strong>{formData.slug || 'slug'}</strong>
                </span>
              </div>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. vanguard-security"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
              {slugError ? (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {slugError}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  Only lowercase letters, numbers, and dashes. No spaces or special characters.
                </p>
              )}
            </div>

            {/* Status & Member Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Card Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'live' | 'draft' })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="live">🟢 Live & Published</option>
                  <option value="draft">🟡 Draft (Hidden from public)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assign Card to Member
                </label>
                <select
                  value={formData.assignedMemberId || ''}
                  onChange={(e) => setFormData({ ...formData, assignedMemberId: e.target.value || undefined })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Unassigned / Admin Owned --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Business info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Vanguard Tactical Security"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business Category Label
                </label>
                <input
                  type="text"
                  value={formData.businessTypeLabel}
                  onChange={(e) => setFormData({ ...formData, businessTypeLabel: e.target.value })}
                  placeholder="e.g. Armed Response & Surveillance"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Contact Person Name & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={formData.contactPersonName}
                  onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                  placeholder="e.g. Zweli Mkhize"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Managing Director"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Tagline & Emergency phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company Tagline / Value Proposition
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Rapid 24/7 Armed Response & Tactical Perimeter Security"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Emergency Panic Line (Optional - highlights red emergency bar)
              </label>
              <input
                type="tel"
                value={formData.emergencyPhone || ''}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="e.g. +27 82 911 0000"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Bio summary */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                About Company / Bio Summary
              </label>
              <textarea
                rows={3}
                value={formData.aboutText}
                onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                placeholder="Describe your capabilities, accreditations (PSIRA, PIRB), and coverage areas..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Logo / Profile Image with real upload & take photo */}
            <div className="pt-2">
              <AvatarUploadField
                value={formData.logoUrl}
                onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                label="Card Logo or Profile Photo"
                helperText="Upload a logo, headshot, or take a live camera snapshot."
              />
              <p className="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1 font-medium">
                <Info className="w-3.5 h-3.5" />
                Recommended: Square image 512 × 512 px (1:1 ratio) with clean transparent or dark backdrop.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'banners' && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
                  Rotating Hero Banners
                </h3>
                <p className="text-xs text-slate-400">
                  Highlight specials, new releases, or critical emergency services. Cross-fades automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBanner}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Banner</span>
              </button>
            </div>

            {formData.banners.map((banner, index) => (
              <div
                key={banner.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Banner #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBanner(banner.id)}
                    className="p-1 rounded text-red-400 hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Banner Headline
                    </label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) => {
                        const updated = [...formData.banners];
                        updated[index].title = e.target.value;
                        setFormData({ ...formData, banners: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Badge Tag (e.g. Emergency, Special)
                    </label>
                    <input
                      type="text"
                      value={banner.badgeText || ''}
                      onChange={(e) => {
                        const updated = [...formData.banners];
                        updated[index].badgeText = e.target.value;
                        setFormData({ ...formData, banners: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Subtitle Description
                  </label>
                  <input
                    type="text"
                    value={banner.subtitle}
                    onChange={(e) => {
                      const updated = [...formData.banners];
                      updated[index].subtitle = e.target.value;
                      setFormData({ ...formData, banners: updated });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={banner.imageUrl}
                    onChange={(e) => {
                      const updated = [...formData.banners];
                      updated[index].imageUrl = e.target.value;
                      setFormData({ ...formData, banners: updated });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Recommended resolution: 1200 × 600 px (2:1 landscape ratio).
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'services' && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
                  Services & Pricing Catalogue
                </h3>
                <p className="text-xs text-slate-400">
                  List your core offerings, packages, and pricing in South African Rands (ZAR).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddService}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            {formData.services.map((srv, index) => (
              <div
                key={srv.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Service Item #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(srv.id)}
                    className="p-1 rounded text-red-400 hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Service Title
                    </label>
                    <input
                      type="text"
                      value={srv.title}
                      onChange={(e) => {
                        const updated = [...formData.services];
                        updated[index].title = e.target.value;
                        setFormData({ ...formData, services: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Price / Rate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. R499/mo or Free"
                      value={srv.price || ''}
                      onChange={(e) => {
                        const updated = [...formData.services];
                        updated[index].price = e.target.value;
                        setFormData({ ...formData, services: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={srv.description}
                    onChange={(e) => {
                      const updated = [...formData.services];
                      updated[index].description = e.target.value;
                      setFormData({ ...formData, services: updated });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'theme' && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
              Visual Appearance & Rich Image Background
            </h3>

            {/* Brand Color selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Primary Brand Accent Color
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: { ...formData.theme, primaryColor: col } })}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                      style={{
                        backgroundColor: col,
                        borderColor: formData.theme.primaryColor === col ? '#ffffff' : 'transparent',
                      }}
                    >
                      {formData.theme.primaryColor === col && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                  <input
                    type="color"
                    value={formData.theme.primaryColor}
                    onChange={(e) => setFormData({ ...formData, theme: { ...formData.theme, primaryColor: e.target.value } })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={formData.theme.primaryColor}
                    onChange={(e) => setFormData({ ...formData, theme: { ...formData.theme, primaryColor: e.target.value } })}
                    className="w-24 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Background Image / Presets */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Card Background Image
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                Select from our curated high-resolution textures or paste your own custom image URL.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {PRESET_BACKGROUNDS.map((bg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      theme: { ...formData.theme, bgType: 'image', bgImageUrl: bg.url },
                    })}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all group ${
                      formData.theme.bgImageUrl === bg.url ? 'border-amber-400 shadow-md shadow-amber-950/50' : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-end p-1 text-[9px] font-bold text-white leading-tight">
                      {bg.name}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Custom Background Image URL
                </label>
                <input
                  type="url"
                  value={formData.theme.bgImageUrl || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    theme: { ...formData.theme, bgType: 'image', bgImageUrl: e.target.value },
                  })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
                <p className="text-[10px] text-amber-400 mt-1">
                  Recommended size: 1080 × 1920 px (9:16 mobile portrait) or 1200 × 800 px (3:2).
                </p>
              </div>

              {/* Overlay Opacity Slider */}
              <div className="pt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Dark Contrast Overlay Opacity</span>
                  <span className="font-mono text-amber-400">{formData.theme.darkOverlayOpacity ?? 75}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="95"
                  value={formData.theme.darkOverlayOpacity ?? 75}
                  onChange={(e) => setFormData({
                    ...formData,
                    theme: { ...formData.theme, darkOverlayOpacity: Number(e.target.value) },
                  })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Darkens the background photo to make the white text and action icons instantly readable.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'social' && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
              Direct Contact & Social Links
            </h3>
            <p className="text-xs text-slate-400">
              Add phone numbers with country code (+27 for South Africa) and social profiles.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number (Call Now)
                </label>
                <input
                  type="tel"
                  value={formData.socialLinks.phone || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, phone: e.target.value },
                  })}
                  placeholder="+27 11 555 0192"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp Direct Number
                </label>
                <input
                  type="tel"
                  value={formData.socialLinks.whatsapp || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, whatsapp: e.target.value },
                  })}
                  placeholder="+27 82 911 0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={formData.socialLinks.email || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, email: e.target.value },
                  })}
                  placeholder="contact@example.co.za"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.website || ''}
                  onChange={(e) => {
                    let val = e.target.value;
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, website: val },
                    });
                  }}
                  placeholder="https://www.example.co.za"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Physical Address / Premises
              </label>
              <input
                type="text"
                value={formData.socialLinks.address || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, address: e.target.value },
                })}
                placeholder="84 Sandton Drive, Sandhurst, Sandton, 2196"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instagram Profile Link
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.instagram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, instagram: e.target.value },
                  })}
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  LinkedIn Page Link
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.linkedin || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                  })}
                  placeholder="https://linkedin.com/company/yourhandle"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Facebook Page Link
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.facebook || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, facebook: e.target.value },
                  })}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  X (Twitter) Profile Link
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.twitter || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                  })}
                  placeholder="https://x.com/yourhandle"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-950/40"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Publishing...' : 'Save & Publish Card'}</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
};
