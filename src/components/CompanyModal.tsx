import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  X,
  Check,
  Sparkles,
  Palette,
  Layers,
  Image,
  Globe,
  Phone,
  Mail,
  MapPin,
  Clock,
} from 'lucide-react';
import { Company, BusinessCategory, CardTheme } from '../types';
import { ImageUploadOrUrlField } from './ImageUploadOrUrlField';
import { useTheme } from '../context/ThemeContext';

import { OperatingScheduleEditor } from './OperatingScheduleEditor';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company | null;
  onSave: (company: Company) => void;
}

const CATEGORY_OPTIONS: { id: BusinessCategory; label: string }[] = [
  { id: 'security', label: 'Security & Armed Response' },
  { id: 'professional', label: 'Corporate, Legal & Financial Advisory' },
  { id: 'restaurant', label: 'Restaurant, Cafe & Hospitality' },
  { id: 'real_estate', label: 'Real Estate & Property Development' },
  { id: 'trades', label: 'Trades, Automotive & Engineering' },
  { id: 'beauty', label: 'Beauty, Salon & Wellness' },
  { id: 'medical', label: 'Medical, Health & Clinical Care' },
  { id: 'retail', label: 'Retail, Boutique & E-Commerce' },
  { id: 'freelance', label: 'Design, Media & Creative Services' },
  { id: 'custom', label: 'Custom Enterprise / Organization' },
];

const PRESET_COLORS = [
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  onSave,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isEditing = !!company;

  const [formData, setFormData] = useState<Company>({
    id: `comp-${Date.now()}`,
    name: '',
    tagline: '',
    category: 'professional',
    categoryLabel: 'Corporate, Legal & Financial Advisory',
    logoUrl: '',
    theme: {
      primaryColor: '#f59e0b',
      bgType: 'dark',
      darkOverlayOpacity: 75,
      glassmorphism: true,
    },
    aboutText: '',
    operatingHours: 'Mon - Fri: 08:00 - 17:00',
    website: '',
    phone: '',
    email: '',
    address: '',
    createdAt: new Date().toISOString(),
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (company) {
      setFormData({ ...company });
    } else {
      setFormData({
        id: `comp-${Date.now()}`,
        name: '',
        tagline: '',
        category: 'professional',
        categoryLabel: 'Corporate, Legal & Financial Advisory',
        logoUrl: '',
        theme: {
          primaryColor: '#f59e0b',
          bgType: 'dark',
          darkOverlayOpacity: 75,
          glassmorphism: true,
        },
        aboutText: '',
        operatingHours: 'Mon - Fri: 08:00 - 17:00',
        website: '',
        phone: '',
        email: '',
        address: '',
        createdAt: new Date().toISOString(),
      });
    }
    setErrorMsg('');
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Company / Organization Name is required.');
      return;
    }

    const matchedCat = CATEGORY_OPTIONS.find((c) => c.id === formData.category);

    onSave({
      ...formData,
      name: formData.name.trim(),
      categoryLabel: matchedCat ? matchedCat.label : formData.categoryLabel,
      updatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div key="company-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`relative w-full max-w-xl ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        } border rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col`}
      >
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isEditing ? `Edit Company: ${company.name}` : 'Add New Company / Organization'}
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Define organization brand identity, industry category, and default style.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'} transition-colors`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form id="company-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name & Tagline */}
              <div>
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazizi Software Solutions"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  } border text-xs font-bold focus:outline-none focus:border-amber-500`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                  Tagline / Core Value Proposition
                </label>
                <input
                  type="text"
                  placeholder="e.g. Custom Software Engineering, Web & Mobile Apps · Gauteng"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  } border text-xs focus:outline-none focus:border-amber-500`}
                />
              </div>

              {/* Industry Category */}
              <div>
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                  Industry / Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const cat = e.target.value as BusinessCategory;
                    const match = CATEGORY_OPTIONS.find((c) => c.id === cat);
                    setFormData({
                      ...formData,
                      category: cat,
                      categoryLabel: match ? match.label : formData.categoryLabel,
                    });
                  }}
                  className={`w-full px-3.5 py-2 rounded-xl ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } border text-xs focus:outline-none focus:border-amber-500 font-medium`}
                >
                  {CATEGORY_OPTIONS.map((cat, catIdx) => (
                    <option key={`comp-cat-${cat.id}-${catIdx}`} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Logo Upload with link fallback */}
              <div>
                <ImageUploadOrUrlField
                  label="Company Brand Logo"
                  aspectRatio="square"
                  value={formData.logoUrl}
                  onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                  helperText="Upload official company brand logo (square recommended) or paste an image link."
                  placeholderUrl="https://images.unsplash.com/..."
                />
              </div>

              {/* Primary Accent Color */}
              <div>
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1.5`}>
                  Brand Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((col, colIdx) => (
                    <button
                      key={`comp-col-${col}-${colIdx}`}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: { ...formData.theme, primaryColor: col } })}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                      style={{
                        backgroundColor: col,
                        borderColor: formData.theme.primaryColor === col ? '#ffffff' : 'transparent',
                      }}
                    >
                      {formData.theme.primaryColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={formData.theme.primaryColor}
                    onChange={(e) => setFormData({ ...formData, theme: { ...formData.theme, primaryColor: e.target.value } })}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 ml-2"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} grid grid-cols-1 sm:grid-cols-2 gap-3`}>
                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                    Company Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.co.za"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border text-xs focus:outline-none focus:border-amber-500`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                    Main Phone / Switchboard
                  </label>
                  <input
                    type="tel"
                    placeholder="+27 11 000 0000"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border text-xs focus:outline-none focus:border-amber-500`}
                  />
                </div>
              </div>

              {/* Company Default Operation Schedule */}
              <div className="pt-2">
                <OperatingScheduleEditor
                  value={formData.operatingHours || ''}
                  onChange={(val) => setFormData({ ...formData, operatingHours: val })}
                  title="Company Standard Operation Schedule"
                  subtitle="Default trading hours inherited by all team member smart cards issued under this organization."
                />
              </div>
            </form>
          </div>

          {/* Footer Controls */}
          <div className={`p-4 sm:p-5 border-t ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'} flex items-center justify-end gap-2.5 shrink-0`}>
            <button
              type="button"
              onClick={onClose}
              className={`min-h-[40px] px-4 py-2 rounded-xl ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              } text-xs font-semibold transition-colors`}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="company-form"
              className="min-h-[40px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Company'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
};
