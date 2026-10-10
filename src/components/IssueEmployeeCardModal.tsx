import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CreditCard,
  UserCheck,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Link as LinkIcon,
  Share2,
  ShieldCheck,
  QrCode,
  Download,
  Eye,
  Smartphone,
  Printer,
} from 'lucide-react';
import { BusinessCard, Company, User } from '../types';
import { ImageUploadOrUrlField } from './ImageUploadOrUrlField';
import { QRCodeSVG } from '../utils/qr';
import { CardView } from './CardView';
import { useTheme } from '../context/ThemeContext';
import { PrintBusinessCardsModal } from './PrintBusinessCardsModal';

interface IssueEmployeeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: BusinessCard[];
  defaultCompanyId?: string;
  existingEmployees: User[];
  targetEmployee?: User | null;
  onIssueCard: (newCard: BusinessCard, newEmployee?: User) => Promise<void>;
  onOpenCardPreview: (cardId: string, slug?: string) => void;
}

const DESIGNATION_SUGGESTIONS = [
  'Lead Designer',
  'Accounts Manager',
  'Operations Manager',
  'Senior Software Engineer',
  'Technical Director',
  'Client Relations Lead',
  'Marketing Director',
  'Executive Head',
  'Branch Manager',
  'Field Security Officer',
  'Master Property Practitioner',
  'Head Chef & Patron',
];

export const IssueEmployeeCardModal: React.FC<IssueEmployeeCardModalProps> = ({
  isOpen,
  onClose,
  companies,
  defaultCompanyId,
  existingEmployees,
  targetEmployee,
  onIssueCard,
  onOpenCardPreview,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Wizard steps: 'form' | 'success'
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Selected company template
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => {
    if (defaultCompanyId) {
      const match = companies.find(c => c.companyId === defaultCompanyId || c.id === defaultCompanyId);
      if (match) return match.id;
    }
    return companies[0]?.id || '';
  });

  // Employee details form
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState('');
  const [designation, setDesignation] = useState('Lead Designer');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      if (targetEmployee) {
        setSelectedEmployeeId(targetEmployee.id);
        setEmployeeName(targetEmployee.name || '');
        setDesignation(targetEmployee.designation || 'Client Relations Lead');
        setEmail(targetEmployee.email || '');
        setPhone(targetEmployee.phone || '');
        setWhatsapp(targetEmployee.phone || '');
        setAvatarUrl(targetEmployee.avatarUrl || '');
        if (targetEmployee.companyId) {
          const match = companies.find(c => c.companyId === targetEmployee.companyId || c.id === targetEmployee.companyId);
          if (match) setSelectedCompanyId(match.id);
        }
      } else {
        setSelectedEmployeeId('');
        setEmployeeName('');
        setDesignation('Client Relations Lead');
        setEmail('');
        setPhone('');
        setWhatsapp('');
        setAvatarUrl('');
      }

      if (defaultCompanyId) {
        const match = companies.find(c => c.companyId === defaultCompanyId || c.id === defaultCompanyId);
        if (match) setSelectedCompanyId(match.id);
      } else if (companies.length > 0 && !companies.some(c => c.id === selectedCompanyId)) {
        setSelectedCompanyId(companies[0].id);
      }
    }
  }, [isOpen, defaultCompanyId, companies, targetEmployee]);

  // Result of issued card & created employee
  const [issuedCard, setIssuedCard] = useState<BusinessCard | null>(null);
  const [issuedEmployee, setIssuedEmployee] = useState<User | null>(null);

  // Filter so only parent company templates (not already-allocated employee cards) are selectable
  const companyTemplates = companies.filter((c) => !c.assignedMemberId);
  const availableCompanies = companyTemplates.length > 0 ? companyTemplates : companies;

  const selectedCompany = availableCompanies.find((c) => c.id === selectedCompanyId) || availableCompanies[0] || companies[0];

  // Auto-generate a clean, simple, and memorable slug
  const generateSlug = (name: string, _desig: string, comp: BusinessCard) => {
    const compPart = (comp?.slug || comp?.businessName || 'card')
      .split('-')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    const namePart = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const cleanBase = namePart ? `${compPart}-${namePart}` : `${compPart}-team`;
    const simpleBase = cleanBase.slice(0, 32);

    let uniqueSlug = simpleBase;
    let counter = 1;
    while (companies.some((c) => c.slug === uniqueSlug)) {
      uniqueSlug = `${simpleBase}-${counter}`;
      counter++;
    }
    return uniqueSlug;
  };

  const handleSelectEmployeeOption = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!empId) {
      setEmployeeName('');
      setDesignation('Client Relations Lead');
      setEmail('');
      setPhone('');
      setWhatsapp('');
      setAvatarUrl('');
      return;
    }
    const emp = existingEmployees.find((e) => e.id === empId);
    if (emp) {
      setEmployeeName(emp.name || '');
      setDesignation(emp.designation || 'Client Relations Lead');
      setEmail(emp.email || '');
      setPhone(emp.phone || '');
      setWhatsapp(emp.phone || '');
      setAvatarUrl(emp.avatarUrl || '');
      if (emp.companyId) {
        const match = companies.find((c) => c.companyId === emp.companyId || c.id === emp.companyId);
        if (match) setSelectedCompanyId(match.id);
      }
      if (selectedCompany) {
        setCustomSlug(generateSlug(emp.name, emp.designation || 'Client Relations Lead', selectedCompany));
      }
    }
  };

  const handleCompanyChange = (compId: string) => {
    setSelectedCompanyId(compId);
    const comp = companies.find((c) => c.id === compId) || companies[0];
    if (comp && employeeName) {
      setCustomSlug(generateSlug(employeeName, designation, comp));
    }
  };

  const handleNameChange = (val: string) => {
    setEmployeeName(val);
    if (selectedCompany) {
      setCustomSlug(generateSlug(val, designation, selectedCompany));
    }
  };

  const handleDesignationChange = (val: string) => {
    setDesignation(val);
    if (selectedCompany) {
      setCustomSlug(generateSlug(employeeName, val, selectedCompany));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !designation.trim() || !selectedCompany) return;

    setIsSubmitting(true);

    try {
      const cardId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c${Date.now()}-0000-4000-8000-000000000000`.slice(0, 36);
      const finalSlug = customSlug.trim() || generateSlug(employeeName, designation, selectedCompany);
      const userId = `user-emp-${Date.now()}`;

      // 1. Assign to selected company (companies can have multiple employees)
      const assignedCompId = selectedCompany.companyId || defaultCompanyId || selectedCompany.id;

      // 2. Create or update employee profile
      const selectedEmp = existingEmployees.find((u) => u.id === selectedEmployeeId) ||
        existingEmployees.find((u) => email && u.email.toLowerCase() === email.toLowerCase().trim()) ||
        targetEmployee;

      const employeeUser: User = selectedEmp
        ? {
            ...selectedEmp,
            name: employeeName.trim(),
            designation: designation.trim(),
            companyId: assignedCompId,
            avatarUrl: avatarUrl.trim() || selectedEmp.avatarUrl,
            phone: phone.trim() || selectedEmp.phone,
            email: email.trim().toLowerCase() || selectedEmp.email,
            assignedCardId: cardId,
            updatedAt: new Date().toISOString(),
          }
        : {
            id: userId,
            email: email.trim().toLowerCase() || `${finalSlug}@company.local`,
            name: employeeName.trim(),
            role: 'employee',
            companyId: assignedCompId,
            designation: designation.trim(),
            avatarUrl: avatarUrl.trim() || undefined,
            phone: phone.trim() || undefined,
            assignedCardId: cardId,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

      // 3. Clone company card as an official issued business card for the employee
      const newEmployeeCard: BusinessCard = {
        ...selectedCompany,
        id: cardId,
        companyId: assignedCompId,
        slug: finalSlug,
        contactPersonName: employeeName.trim(),
        designation: designation.trim(),
        assignedMemberId: employeeUser.id,
        logoUrl: selectedCompany.logoUrl,
        socialLinks: {
          ...selectedCompany.socialLinks,
          phone: phone.trim() || selectedCompany.socialLinks.phone,
          whatsapp: whatsapp.trim() || phone.trim() || selectedCompany.socialLinks.whatsapp,
          email: email.trim() || selectedCompany.socialLinks.email,
        },
        viewsCount: 0,
        sharesCount: 0,
        callClicksCount: 0,
        whatsappClicksCount: 0,
        vcardDownloadsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onIssueCard(newEmployeeCard, employeeUser);

      setIssuedCard(newEmployeeCard);
      setIssuedEmployee(employeeUser);
      setStep('success');
    } catch (err) {
      console.error('Error issuing card:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullCardUrl = issuedCard ? `${origin}/card/${issuedCard.slug}` : `${origin}/card/${customSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullCardUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    if (!issuedCard) return;
    const message = encodeURIComponent(
      `Hi ${employeeName}, here is your official ${selectedCompany.businessName} digital smart business card:\n\n🔗 ${fullCardUrl}\n\nTitle: ${designation}\nCompany: ${selectedCompany.businessName}\nIssued by Company Administration.`
    );
    const targetPhone = (whatsapp || phone || '').replace(/[^0-9]/g, '');
    if (targetPhone) {
      window.open(`https://wa.me/${targetPhone}?text=${message}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const handleShareEmail = () => {
    if (!issuedCard) return;
    const subject = encodeURIComponent(`Your Official Digital Business Card - ${selectedCompany.businessName}`);
    const body = encodeURIComponent(
      `Hi ${employeeName},\n\nYour official digital business card has been created and issued by company administration.\n\nYour Personal Card Link:\n${fullCardUrl}\n\nPosition: ${designation}\nCompany: ${selectedCompany.businessName}\n\nYou can bookmark this link on your phone or share it via WhatsApp and email with clients.\n\nKind regards,\nCompany Administration`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDownloadQR = () => {
    const svgEl = document.getElementById('issued-qr-svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${issuedCard?.slug || 'card'}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStep('form');
    setEmployeeName('');
    setDesignation('Lead Designer');
    setEmail('');
    setPhone('');
    setWhatsapp('');
    setAvatarUrl('');
    setCustomSlug('');
    setIssuedCard(null);
    setIssuedEmployee(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div key="issue-employee-card-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`relative w-full ${
          step === 'success' ? 'max-w-4xl' : 'max-w-2xl'
        } ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        } border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col`}
      >
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                  <span>{step === 'form' ? 'Issue Team Member Smart Card' : 'Card Successfully Issued & Published'}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold hidden xs:inline">
                    {step === 'form' ? 'Active' : 'Live & Verified'}
                  </span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {step === 'form'
                    ? 'Generate and issue a personalized digital card link for a team member.'
                    : 'Your smart card is live with instant link sharing, live preview, and QR code access.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className={`p-1.5 rounded-xl ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'} transition-colors cursor-pointer`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {step === 'form' ? (
              <form id="issue-card-form" onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Parent Company Template Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider flex items-center gap-1.5`}>
                      <Building2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>1. Select Company / Organization Brand</span>
                    </label>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Card will inherit branding and styling
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1 rounded-xl">
                    {availableCompanies.map((comp, compIdx) => {
                      const isSelected = comp.id === selectedCompanyId;
                      return (
                        <div
                          key={`issue-comp-${comp.id}-${compIdx}`}
                          onClick={() => handleCompanyChange(comp.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50 shadow-md'
                              : isDark ? 'bg-slate-950/60 hover:bg-slate-950 border-slate-800' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border shrink-0"
                            style={{ borderColor: comp.theme?.primaryColor || '#ef4444' }}
                          >
                            <img
                              src={comp.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80'}
                              alt={comp.businessName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate leading-tight`}>
                              {comp.businessName}
                            </h4>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate mt-0.5`}>
                              {comp.businessTypeLabel || 'Smart Business Card'}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Team Member Info */}
                <div className={`space-y-4 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider flex items-center gap-1.5`}>
                    <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>2. Team Member Profile & Role Details</span>
                  </label>

                  {/* Optional Employee Selector Dropdown */}
                  {existingEmployees.length > 0 && (
                    <div>
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1 flex items-center justify-between`}>
                        <span>Select Existing Member or Create New *</span>
                        <span className="text-[10px] text-amber-400 font-mono">Pre-fills profile details</span>
                      </label>
                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => handleSelectEmployeeOption(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        } border text-xs focus:outline-none focus:border-amber-500 font-semibold`}
                      >
                        <option value="">-- Create New Team Member --</option>
                        {existingEmployees.map((emp) => (
                          <option key={`opt-emp-${emp.id}`} value={emp.id}>
                            {emp.name} ({emp.designation || emp.role || 'Member'}) {emp.assignedCardId ? '• [Card Assigned]' : '• [Unassigned]'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                        Team Member Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={employeeName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Nomfundo Sithole"
                        className={`w-full px-3.5 py-2 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        } border text-xs focus:outline-none focus:border-amber-500`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                        Job Designation / Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={designation}
                        onChange={(e) => handleDesignationChange(e.target.value)}
                        placeholder="e.g. Lead Designer or Accounts Manager"
                        className={`w-full px-3.5 py-2 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        } border text-xs focus:outline-none focus:border-amber-500 font-semibold`}
                      />
                    </div>
                  </div>

                  {/* Quick Designation Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'} font-medium`}>Quick suggestions:</span>
                    {DESIGNATION_SUGGESTIONS.slice(0, 6).map((chip, chipIdx) => (
                      <button
                        key={`desig-${chip}-${chipIdx}`}
                        type="button"
                        onClick={() => handleDesignationChange(chip)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          designation === chip
                            ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 font-bold'
                            : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Contact info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                        Team Member Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="member@company.co.za"
                        className={`w-full px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        } border text-xs focus:outline-none focus:border-amber-500`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                        Direct Phone (Call)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+27 82 123 4567"
                        className={`w-full px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        } border text-xs focus:outline-none focus:border-amber-500`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                        Direct WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+27 82 123 4567"
                        className={`w-full px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        } border text-xs focus:outline-none focus:border-amber-500`}
                      />
                    </div>
                  </div>

                  {/* Profile photo field */}
                  <div>
                    <ImageUploadOrUrlField
                      label="Team Member Portrait / Profile Photo (Optional)"
                      value={avatarUrl}
                      onChange={setAvatarUrl}
                      aspectRatio="portrait"
                      helperText="Upload photo or paste image URL"
                    />
                  </div>

                  {/* Custom link / Slug */}
                  <div className={`p-3.5 rounded-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-1.5`}>
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} flex items-center gap-1.5`}>
                        <LinkIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Generated Web Link (Card Slug)</span>
                      </label>
                      <span className="text-[10px] text-amber-500 font-mono">
                        Instant mobile web address
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} shrink-0`}>
                        /card/
                      </span>
                      <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="slug"
                        className={`flex-1 ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        } px-2 py-1 rounded font-bold text-xs border focus:border-amber-500 focus:outline-none`}
                      />
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'} mt-1`}>
                      Team members share this link with clients. Changes update their live card immediately.
                    </p>
                  </div>
                </div>
              </form>
            ) : (
              /* Success Screen with Live Card Preview and Rich Link Sharing Hub */
              <div className="space-y-6">
                {/* Success Top Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {employeeName} · {designation}
                      </h4>
                      <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        Official digital smart card is active and verified under <strong>{selectedCompany?.businessName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    {issuedCard && (
                      <button
                        onClick={() => {
                          onOpenCardPreview(issuedCard.id, issuedCard.slug);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Open interactive card in standalone preview"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span>Open Standalone</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Two-Column Grid: Live Card Preview (Left) + Link Share Hub (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Live Phone Mockup & Card Preview */}
                  <div className="md:col-span-5 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Live Card Preview</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        Live Simulation
                      </span>
                    </div>

                    {/* Scaled Mobile Phone Bezel */}
                    <div className="w-[300px] max-w-full rounded-[30px] p-2 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl border border-slate-700/60 ring-2 ring-amber-500/20">
                      {/* Notch / Speaker */}
                      <div className="w-20 h-3 bg-slate-950 rounded-full mx-auto mb-2 opacity-80" />
                      
                      {/* Interactive Card Container */}
                      <div className="rounded-[22px] overflow-hidden max-h-[460px] overflow-y-auto bg-slate-950 border border-slate-800 shadow-inner">
                        {issuedCard ? (
                          <CardView
                            card={issuedCard}
                            allocatedMember={issuedEmployee}
                            company={
                              (() => {
                                const parent = companies.find((c) => c.id === (issuedCard.companyId || selectedCompanyId));
                                return parent
                                  ? ({
                                      id: parent.id,
                                      name: parent.businessName,
                                      tagline: parent.tagline,
                                      category: 'custom',
                                      categoryLabel: parent.businessTypeLabel || 'Custom',
                                      logoUrl: parent.logoUrl,
                                      phone: parent.socialLinks?.phone,
                                      email: parent.socialLinks?.email,
                                      address: parent.socialLinks?.address,
                                      website: parent.socialLinks?.website,
                                      theme: parent.theme,
                                      createdAt: new Date().toISOString(),
                                    } as Company)
                                  : null;
                              })()
                            }
                            isStandalone={false}
                          />
                        ) : null}
                      </div>

                      {/* Home indicator bar */}
                      <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mt-2 opacity-70" />
                    </div>
                  </div>

                  {/* Right Column: Complete Link Share & Distribution Hub */}
                  <div className="md:col-span-7 space-y-4">
                    {/* Share Link Box */}
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-2.5`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Direct Card Link</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Ready for distribution</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={fullCardUrl}
                          className={`flex-1 ${
                            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                          } px-3 py-2 rounded-xl text-xs font-mono border select-all focus:outline-none`}
                        />
                        <button
                          onClick={handleCopyLink}
                          className="min-h-[38px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-colors cursor-pointer"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>

                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                        This link can be sent to <strong>{employeeName}</strong>, added to email signatures, printed on company cards, or saved to phone home screens.
                      </p>
                    </div>

                    {/* Instant 1-Click Sharing Channels */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={handleShareWhatsApp}
                        className="min-h-[42px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Send via WhatsApp</span>
                      </button>

                      <button
                        onClick={handleShareEmail}
                        className={`min-h-[42px] py-2.5 px-4 rounded-xl ${
                          isDark ? 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        } font-bold text-xs flex items-center justify-center gap-2 border transition-colors cursor-pointer`}
                      >
                        <Mail className="w-4 h-4 text-sky-500" />
                        <span>Send via Email</span>
                      </button>
                    </div>

                    {/* QR Code and ID Badge Distribution */}
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between gap-4`}>
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 bg-white rounded-xl shrink-0 shadow-sm">
                          <QRCodeSVG id="issued-qr-svg" value={fullCardUrl} size={76} />
                        </div>
                        <div>
                          <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5`}>
                            <QrCode className="w-3.5 h-3.5 text-amber-500" />
                            <span>Team Member QR Code</span>
                          </h5>
                          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5 leading-snug`}>
                            Scan live with any smartphone camera to open this card. Ready for staff badges & brochures.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleDownloadQR}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                        title="Download QR code SVG"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>

                    {/* Link Verification & Direct Test Button */}
                    <div className={`p-3.5 rounded-xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'} border flex items-center justify-between gap-2`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} truncate`}>
                          Routing Active: <strong>/card/{issuedCard?.slug}</strong>
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (issuedCard) {
                            onOpenCardPreview(issuedCard.id, issuedCard.slug);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Test Link Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'} flex flex-wrap items-center justify-between gap-2 shrink-0`}>
            {step === 'form' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className={`min-h-[40px] px-4 py-2 rounded-xl ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  } text-xs font-semibold cursor-pointer`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="issue-card-form"
                  disabled={isSubmitting || !employeeName.trim()}
                  className="min-h-[40px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Issuing Card...' : 'Issue Team Member Card'}</span>
                  <span className="hidden sm:inline">& Generate Link</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className={`min-h-[40px] px-4 py-2 rounded-xl ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  } text-xs font-semibold cursor-pointer`}
                >
                  + Issue Another Card
                </button>

                <div className="flex items-center gap-2">
                  {issuedCard && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowPrintModal(true)}
                        className={`min-h-[40px] px-4 py-2 rounded-xl ${
                          isDark ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300' : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-700'
                        } border text-xs font-bold flex items-center gap-1.5 cursor-pointer`}
                        title="Print 10 physical cards on a single sheet"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Print 10 Cards</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenCardPreview(issuedCard.id);
                          onClose();
                        }}
                        className={`min-h-[40px] px-4 py-2 rounded-xl ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-amber-600'
                        } text-xs font-bold flex items-center gap-1.5 cursor-pointer`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview Live Card</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      handleReset();
                      onClose();
                    }}
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Print 10 Business Cards Modal */}
      {showPrintModal && issuedCard && (
        <PrintBusinessCardsModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          card={issuedCard}
          company={
            (() => {
              const parent = companies.find((c) => c.id === (issuedCard.companyId || selectedCompanyId));
              return parent
                ? ({
                    id: parent.id,
                    name: parent.businessName,
                    tagline: parent.tagline,
                    category: 'custom',
                    categoryLabel: parent.businessTypeLabel || 'Custom',
                    logoUrl: parent.logoUrl,
                    phone: parent.socialLinks?.phone,
                    email: parent.socialLinks?.email,
                    address: parent.socialLinks?.address,
                    website: parent.socialLinks?.website,
                    theme: parent.theme,
                    createdAt: new Date().toISOString(),
                  } as Company)
                : null;
            })()
          }
          allocatedMember={issuedEmployee}
        />
      )}
    </>
  );
};
