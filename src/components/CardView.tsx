import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Share2,
  Download,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Copy,
  Check,
  Send,
  ExternalLink,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  Youtube,
  QrCode,
  ShieldCheck,
  UserCheck,
  Info,
  Building2,
  Maximize2,
  Eye,
  EyeOff,
  Printer,
  Droplet,
} from 'lucide-react';
import { BusinessCard, Company, LeadInquiry, User } from '../types';
import { downloadVCard } from '../utils/vcard';
import { QRCodeSVG } from '../utils/qr';
import { ThemeToggle } from './ThemeToggle';
import { PrintBusinessCardsModal } from './PrintBusinessCardsModal';

interface CardViewProps {
  card: BusinessCard;
  allocatedMember?: User | null;
  company?: Company | null;
  companyTemplate?: BusinessCard | null;
  onLeadSubmit?: (lead: Omit<LeadInquiry, 'id' | 'createdAt' | 'status'>) => void;
  onActionClick?: (actionType: 'call' | 'whatsapp' | 'share' | 'vcard') => void;
  isStandalone?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  allocatedMember,
  company,
  companyTemplate,
  onLeadSubmit,
  onActionClick,
  isStandalone = false,
}) => {
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [fullscreenBannerUrl, setFullscreenBannerUrl] = useState<string | null>(null);
  const [showBannerOverlay, setShowBannerOverlay] = useState(true);
  const [overlayTransparentOverrides, setOverlayTransparentOverrides] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'gallery' | 'contact'>('about');
  
  // Lead form state
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [vcardExportedToast, setVcardExportedToast] = useState(false);

  // Resolved company branding (Employee cards strictly inherit company theme, logo & brand guidelines)
  const companyName = company?.name || companyTemplate?.businessName || card.businessName;
  const companyLogo = company?.logoUrl || companyTemplate?.logoUrl || card.logoUrl;
  const companyTagline = company?.tagline || companyTemplate?.tagline || card.tagline;
  const primaryColor = company?.theme?.primaryColor || companyTemplate?.theme?.primaryColor || card.theme?.primaryColor || '#f59e0b';
  const secondaryColor = company?.theme?.secondaryColor || companyTemplate?.theme?.secondaryColor || card.theme?.secondaryColor || '#b45309';
  const effectiveBgImageUrl = company?.theme?.bgImageUrl || companyTemplate?.theme?.bgImageUrl || card.theme?.bgImageUrl;
  const effectiveBgType = effectiveBgImageUrl ? 'image' : (company?.theme?.bgType || companyTemplate?.theme?.bgType || card.theme?.bgType || 'dark');
  const effectiveDarkOverlay = company?.theme?.darkOverlayOpacity ?? companyTemplate?.theme?.darkOverlayOpacity ?? card.theme?.darkOverlayOpacity ?? 75;
  const overlayOpacity = effectiveDarkOverlay / 100;

  // Company Brand Fallbacks for address, website, operating hours, about text
  const effectiveAddress = card.socialLinks?.address || company?.address || companyTemplate?.socialLinks?.address || '';
  const effectiveWebsite = card.socialLinks?.website || company?.website || companyTemplate?.socialLinks?.website || '';
  const effectiveOperatingHours = card.operatingHours || company?.operatingHours || companyTemplate?.operatingHours || '';

  // Determine if this is an employee-specific card or a master generic company card
  const isEmployeeCard = !!(
    allocatedMember ||
    card.assignedMemberId ||
    (card.contactPersonName &&
      card.contactPersonName.trim() !== '' &&
      card.contactPersonName.toLowerCase() !== companyName.toLowerCase())
  );

  // Resolved dynamic employee details
  const memberName = allocatedMember?.name || (isEmployeeCard ? card.contactPersonName : '');
  const memberDesignation = allocatedMember?.designation || (isEmployeeCard ? card.designation : '');
  const employeePhoto = allocatedMember?.avatarUrl || (isEmployeeCard && card.logoUrl !== companyLogo ? card.logoUrl : undefined);
  const memberPhoto = employeePhoto || undefined;
  const memberPhone = allocatedMember?.phone || (isEmployeeCard ? card.socialLinks?.phone : undefined) || company?.phone || companyTemplate?.socialLinks?.phone;
  const memberWhatsApp = allocatedMember?.phone || (isEmployeeCard ? (card.socialLinks?.whatsapp || card.socialLinks?.phone) : undefined) || company?.phone || companyTemplate?.socialLinks?.whatsapp;
  const memberEmail = allocatedMember?.email || (isEmployeeCard ? card.socialLinks?.email : undefined) || company?.email || companyTemplate?.socialLinks?.email;
  const effectiveAboutText = (isEmployeeCard && card.aboutText && card.aboutText !== company?.aboutText && card.aboutText !== companyTemplate?.aboutText)
    ? card.aboutText
    : (company?.aboutText || companyTemplate?.aboutText || card.aboutText || '');

  // Inherit banners, services and gallery strictly from company template for brand uniformity
  const effectiveBanners = (isEmployeeCard && companyTemplate?.banners && companyTemplate.banners.length > 0)
    ? companyTemplate.banners
    : (card.banners && card.banners.length > 0 ? card.banners : (companyTemplate?.banners || []));
  const effectiveServices = (isEmployeeCard && companyTemplate?.services && companyTemplate.services.length > 0)
    ? companyTemplate.services
    : (card.services && card.services.length > 0 ? card.services : (companyTemplate?.services || []));
  const effectiveGalleryImages = (isEmployeeCard && companyTemplate?.galleryImages && companyTemplate.galleryImages.length > 0)
    ? companyTemplate.galleryImages
    : (card.galleryImages && card.galleryImages.length > 0 ? card.galleryImages : (companyTemplate?.galleryImages || []));

  // Auto-rotate banners smoothly
  useEffect(() => {
    if (!effectiveBanners || effectiveBanners.length <= 1 || isBannerPaused) return;
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % effectiveBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [effectiveBanners, isBannerPaused]);

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/card/${card.slug}` : `https://yebocard.co.za/card/${card.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
    onActionClick?.('share');
  };

  const handleSaveContact = async () => {
    onActionClick?.('vcard');
    const enrichedCard: BusinessCard = {
      ...card,
      businessName: companyName || card.businessName,
      contactPersonName: memberName || card.contactPersonName,
      designation: memberDesignation || card.designation,
      logoUrl: memberPhoto || card.logoUrl,
      socialLinks: {
        ...card.socialLinks,
        phone: memberPhone || card.socialLinks.phone,
        whatsapp: memberWhatsApp || card.socialLinks.whatsapp,
        email: memberEmail || card.socialLinks.email,
        address: card.socialLinks?.address || company?.address,
        website: card.socialLinks?.website || company?.website,
      },
    };
    const res = await downloadVCard(enrichedCard);
    if (res.success) {
      setVcardExportedToast(true);
      setTimeout(() => setVcardExportedToast(false), 4000);
    }
  };

  const handleCall = () => {
    onActionClick?.('call');
    if (memberPhone) {
      window.location.href = `tel:${memberPhone}`;
    }
  };

  const handleEmergencyCall = () => {
    onActionClick?.('call');
    if (card.emergencyPhone) {
      window.location.href = `tel:${card.emergencyPhone}`;
    }
  };

  const handleWhatsApp = () => {
    onActionClick?.('whatsapp');
    const waNumber = (memberWhatsApp || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Hi ${memberName || card.businessName}, I viewed your B-Smart digital profile and would like to connect.`);
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) return;
    setLeadSubmitting(true);
    setTimeout(() => {
      onLeadSubmit?.({
        cardId: card.id,
        cardName: card.businessName,
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone,
        message: leadForm.message || `Direct inquiry submitted for ${memberName || card.businessName}.`,
      });
      setLeadSubmitting(false);
      setLeadSubmitted(true);
      setLeadForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setLeadSubmitted(false), 5000);
    }, 600);
  };

  return (
    <div className="relative w-full max-w-[440px] mx-auto min-h-screen text-slate-100 flex flex-col font-sans select-none overflow-x-hidden shadow-2xl rounded-2xl md:rounded-3xl border border-slate-800/80">
      {/* Background Image / Gradient Layer */}
      {effectiveBgType === 'image' && effectiveBgImageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center -z-20 transition-all duration-700"
          style={{ backgroundImage: `url(${effectiveBgImageUrl})` }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black -z-20"
        />
      )}

      {/* Dark Ambient Overlay Layer */}
      <div
        className="absolute inset-0 bg-slate-950 -z-10 backdrop-blur-[2px]"
        style={{ opacity: overlayOpacity }}
      />

      {/* Top App Status / Micro Nav */}
      <div className="pt-3 px-4 pb-2 flex items-center justify-between gap-2 z-20 backdrop-blur-md bg-slate-950/40 border-b border-slate-800/40">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 min-w-0 flex-1">
          <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: primaryColor }} />
          <span className="shrink-0 font-bold">B-Smart</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 font-mono truncate max-w-[130px] sm:max-w-[200px]"
            title={card.businessTypeLabel || 'Smart Card'}
          >
            {card.businessTypeLabel || 'Smart Card'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle className="p-1 rounded-full text-xs" />
          <button
            onClick={() => setShowPrintModal(true)}
            aria-label="Print physical cards (10 per page)"
            title="Print Physical Cards (10 per page)"
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            aria-label="Share card"
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* vCard Exported Toast Notification */}
      <AnimatePresence>
        {vcardExportedToast && (
          <motion.div
            key="vcard-exported-toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-3 mt-2 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs shadow-lg flex items-center justify-between gap-2 backdrop-blur-md z-30"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Contact (.vcf) generated! Save to Contacts app.</span>
            </div>
            <button
              onClick={() => setVcardExportedToast(false)}
              className="p-1 rounded-lg text-emerald-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Cross-fade Banner Carousel with Auto-Fit Full Image Display */}
      {effectiveBanners && effectiveBanners.length > 0 && (
        <div
          className="relative w-full h-56 sm:h-64 md:h-72 overflow-hidden bg-slate-950 group select-none shadow-inner"
          onMouseEnter={() => setIsBannerPaused(true)}
          onMouseLeave={() => setIsBannerPaused(false)}
        >
          {effectiveBanners.map((banner, idx) => (
            <motion.div
              key={`banner-slide-${banner.id || idx}-${idx}`}
              initial={false}
              animate={{
                opacity: activeBannerIdx === idx ? 1 : 0,
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 pointer-events-none"
              style={{ pointerEvents: activeBannerIdx === idx ? 'auto' : 'none' }}
            >
              {/* Ambient backdrop so edges blend seamlessly with zero awkward black bars */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                  src={banner.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover blur-2xl opacity-35 scale-110 filter transform-gpu"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-slate-950/45" />
              </div>

              {/* Foreground: full fill object-cover */}
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={banner.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
                  alt={banner.title || `Banner ${idx + 1}`}
                  className="w-full h-full object-cover object-center select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
              </div>

              {/* Title & Tag Overlay: respecting overlayPosition, overlayStyle, and transparency overrides */}
              {showBannerOverlay && banner.overlayPosition !== 'none' && (banner.title || banner.subtitle || banner.badgeText) && (() => {
                const isTransparent = overlayTransparentOverrides[idx] ?? (banner.overlayStyle === 'transparent');
                const overlayStyle = banner.overlayStyle || 'dark';
                
                let bgClasses = 'bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-2xl';
                if (isTransparent) {
                  bgClasses = 'bg-transparent border border-transparent shadow-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]';
                } else if (overlayStyle === 'light') {
                  bgClasses = 'bg-slate-950/30 backdrop-blur-sm border border-white/10 shadow-lg';
                } else if (overlayStyle === 'medium') {
                  bgClasses = 'bg-slate-950/60 backdrop-blur-md border border-white/15 shadow-xl';
                } else if (overlayStyle === 'solid') {
                  bgClasses = 'bg-slate-950 border border-slate-800 shadow-2xl';
                }

                return (
                  <div
                    className={`absolute left-3 right-16 sm:left-4 sm:right-20 text-left pointer-events-auto z-10 ${
                      banner.overlayPosition === 'top'
                        ? 'top-4 sm:top-5'
                        : 'bottom-3 sm:bottom-4'
                    }`}
                  >
                    <div className={`inline-block max-w-full p-2.5 sm:p-3 rounded-2xl transition-all ${bgClasses}`}>
                      {banner.badgeText && (
                        <span
                          className="inline-block px-2 py-0.5 text-[10px] uppercase font-extrabold tracking-wider rounded text-white shadow-sm mb-1"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {banner.badgeText}
                        </span>
                      )}
                      {banner.title && (
                        <h4 className={`text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 ${
                          isTransparent ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' : 'drop-shadow'
                        }`}>
                          {banner.title}
                        </h4>
                      )}
                      {banner.subtitle && (
                        <p className={`text-[11px] text-slate-300 line-clamp-1 mt-0.5 ${
                          isTransparent ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] font-medium text-slate-100' : 'drop-shadow'
                        }`}>
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          ))}

          {/* Action buttons: Toggle overlay, Toggle Transparency & Fullscreen HD View */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            {/* Toggle Overlay Button if text exists */}
            {(effectiveBanners[activeBannerIdx]?.title || effectiveBanners[activeBannerIdx]?.subtitle || effectiveBanners[activeBannerIdx]?.badgeText) && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBannerOverlay(!showBannerOverlay);
                  }}
                  title={showBannerOverlay ? 'Hide text overlay (clean graphic view)' : 'Show text overlay'}
                  className="p-2 rounded-xl bg-slate-950/75 hover:bg-slate-900 border border-white/15 text-white/80 hover:text-white shadow-xl backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 sm:opacity-75 cursor-pointer"
                >
                  {showBannerOverlay ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {showBannerOverlay && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverlayTransparentOverrides(prev => {
                        const isTrans = prev[activeBannerIdx] ?? (effectiveBanners[activeBannerIdx]?.overlayStyle === 'transparent');
                        return { ...prev, [activeBannerIdx]: !isTrans };
                      });
                    }}
                    title={
                      (overlayTransparentOverrides[activeBannerIdx] ?? (effectiveBanners[activeBannerIdx]?.overlayStyle === 'transparent'))
                        ? 'Switch to dark glass box'
                        : 'Make text overlay background 100% transparent'
                    }
                    className={`p-2 rounded-xl border transition-all opacity-0 group-hover:opacity-100 sm:opacity-75 cursor-pointer ${
                      (overlayTransparentOverrides[activeBannerIdx] ?? (effectiveBanners[activeBannerIdx]?.overlayStyle === 'transparent'))
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg font-bold'
                        : 'bg-slate-950/75 hover:bg-slate-900 border-white/15 text-white/80 hover:text-white shadow-xl backdrop-blur-md'
                    }`}
                  >
                    <Droplet className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}

            {/* Full Screen HD View Button */}
            {effectiveBanners[activeBannerIdx]?.imageUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenBannerUrl(effectiveBanners[activeBannerIdx].imageUrl);
                }}
                title="View full banner in 300 DPI HD"
                className="p-2 rounded-xl bg-slate-950/75 hover:bg-slate-900 border border-white/15 text-white/80 hover:text-white shadow-xl backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 sm:opacity-75 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Carousel Navigation Indicators */}
          {effectiveBanners.length > 1 && (
            <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-10">
              {effectiveBanners.map((_, i) => (
                <button
                  key={`banner-indicator-${i}`}
                  onClick={() => setActiveBannerIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeBannerIdx === i
                      ? 'w-5 bg-white shadow-md'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Header Profile & Brand Section */}
      <div className="px-5 pt-3 pb-4 relative z-10 text-center">
        {/* Company Header Branding Badge - Centered at Top */}
        {companyName && (
          <div className="mb-3 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-slate-700/80 shadow-md backdrop-blur-md">
              {companyLogo ? (
                <img
                  src={companyLogo || undefined}
                  alt={companyName}
                  className="w-4 h-4 rounded-full object-contain border border-slate-600 shadow-sm shrink-0 bg-slate-950"
                />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="text-xs font-bold text-slate-200 tracking-wide">{companyName}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 uppercase tracking-wider">
                Company
              </span>
            </div>
          </div>
        )}

        {/* Profile Picture Frame - Centered directly below Company */}
        <div className="relative inline-flex items-center justify-center mx-auto mb-3">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden p-1 shadow-2xl bg-slate-900/90 border-2 flex items-center justify-center"
            style={{ borderColor: primaryColor }}
          >
            {isEmployeeCard ? (
              memberPhoto ? (
                <img
                  src={memberPhoto || undefined}
                  alt={memberName || companyName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex flex-col items-center justify-center text-white font-bold shadow-inner">
                  <span className="text-xl sm:text-2xl tracking-wider">
                    {(memberName || 'EM')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span className="text-[9px] uppercase opacity-80 font-mono mt-0.5">Staff</span>
                </div>
              )
            ) : companyLogo ? (
              <img
                src={companyLogo || undefined}
                alt={companyName}
                className="w-full h-full object-contain p-1 rounded-xl bg-slate-950/60"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
            )}
          </div>
          
          {/* Status Badge */}
          <div
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full text-white shadow-lg flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
            title={isEmployeeCard ? `Verified Team Member: ${memberName} • ${companyName}` : `Official Digital Card • ${companyName}`}
          >
            {isEmployeeCard ? (
              <UserCheck className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {/* Employee of Company Pill Badge */}
        {isEmployeeCard ? (
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-200 text-[11px] font-bold tracking-wide shadow-sm">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Team Member</span>
            </span>
          </div>
        ) : (
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 text-[11px] font-bold tracking-wide shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Company Communicator</span>
            </span>
          </div>
        )}

        {/* Contact Person & Job Title vs Company Name */}
        {isEmployeeCard ? (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
              {memberName || 'Team Member'}
            </h2>
            <p
              className="text-xs sm:text-sm font-bold tracking-wide uppercase mt-0.5"
              style={{ color: primaryColor }}
            >
              {memberDesignation || `Team Member at ${companyName}`}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
              {companyName}
            </h2>
            {companyTagline && (
              <p
                className="text-xs sm:text-sm font-semibold tracking-wide mt-0.5 px-2 leading-relaxed"
                style={{ color: primaryColor }}
              >
                {companyTagline}
              </p>
            )}
          </>
        )}

        {/* Emergency Panic Bar (for Security / Medical Cards) */}
        {card.emergencyPhone && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEmergencyCall}
            className="mt-3.5 w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-red-600/90 hover:bg-red-600 text-white shadow-lg shadow-red-900/40 border border-red-500/60 animate-pulse"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>24/7 Emergency Dispatch: {card.emergencyPhone}</span>
          </motion.button>
        )}

        {/* Primary Contact Action Grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleCall}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 transition-all hover:border-slate-700 shadow-sm"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold">Call Now</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleWhatsApp}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 transition-all hover:border-slate-700 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold">WhatsApp</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSaveContact}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 transition-all hover:border-slate-700 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold">Save Contact</span>
          </motion.button>
        </div>

        {/* Secondary Contact Quick Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs">
          {memberEmail && (
            <a
              href={`mailto:${memberEmail}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[170px]">{memberEmail}</span>
            </a>
          )}
          {memberPhone && (
            <a
              href={`tel:${memberPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[150px]">{memberPhone}</span>
            </a>
          )}
          {effectiveWebsite && (
            <a
              href={effectiveWebsite.startsWith('http') ? effectiveWebsite : `https://${effectiveWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[150px]">Website</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
          {effectiveAddress && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(effectiveAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span className="truncate max-w-[180px]">Directions</span>
            </a>
          )}
        </div>
      </div>

      {/* Social Media Links Bar */}
      <div className="px-5 py-2">
        <div className="flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          {memberWhatsApp && (
            <button
              onClick={handleWhatsApp}
              className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-300 transition-colors"
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
          {card.socialLinks.instagram && (
            <a
              href={card.socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-pink-950/60 text-pink-400 hover:bg-pink-900/60 hover:text-pink-300 transition-colors"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {card.socialLinks.linkedin && (
            <a
              href={card.socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-sky-950/60 text-sky-400 hover:bg-sky-900/60 hover:text-sky-300 transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
          {card.socialLinks.facebook && (
            <a
              href={card.socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-blue-950/60 text-blue-400 hover:bg-blue-900/60 hover:text-blue-300 transition-colors"
              title="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
          )}
          {card.socialLinks.twitter && (
            <a
              href={card.socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
              title="X (Twitter)"
            >
              <Twitter className="w-4 h-4" />
            </a>
          )}
          {card.socialLinks.youtube && (
            <a
              href={card.socialLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:text-red-300 transition-colors"
              title="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2 rounded-lg bg-slate-800/80 text-amber-400 hover:bg-slate-700 transition-colors"
            title="Scan QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="p-2 rounded-lg bg-slate-800/80 text-amber-400 hover:bg-slate-700 transition-colors"
            title="Print Physical Cards (10 per page)"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive HotTabs Navigation */}
      <div className="px-5 mt-2">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('about')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'about'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'services'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'gallery'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'contact'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inquire
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="px-5 py-4 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Employee Profile Information Card */}
              {isEmployeeCard && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-md space-y-3 shadow-md text-center">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Team Member Profile • {companyName}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 font-medium">
                      Official Card
                    </span>
                  </div>
                  
                  {/* Centered Profile Picture directly below Company heading */}
                  <div className="flex flex-col items-center justify-center pt-1 pb-2">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 overflow-hidden shadow-lg mb-2 flex items-center justify-center" style={{ borderColor: primaryColor }}>
                      {employeePhoto ? (
                        <img src={employeePhoto || undefined} alt={memberName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-base">
                          {(memberName || 'TM')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h5 className="text-sm font-bold text-white">{memberName || 'Team Member'}</h5>
                    <p className="text-xs font-semibold mt-0.5 uppercase tracking-wide" style={{ color: primaryColor }}>{memberDesignation || `Team Member at ${companyName}`}</p>
                    {(allocatedMember?.bio || card.aboutText) && (
                      <p className="text-xs text-slate-300 mt-2 max-w-sm leading-relaxed text-center">{allocatedMember?.bio || card.aboutText}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {memberPhone && (
                      <div className="flex items-center gap-1.5 text-slate-300 truncate">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{memberPhone}</span>
                      </div>
                    )}
                    {memberEmail && (
                      <div className="flex items-center gap-1.5 text-slate-300 truncate">
                        <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">{memberEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bio summary */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  About Our Business
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {effectiveAboutText || 'Welcome to our smart business communicator. Contact us directly for quotes, bookings, and immediate inquiries.'}
                </p>
              </div>

              {/* Operating Hours & Schedule */}
              {effectiveOperatingHours && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300">
                        Operating Schedule
                      </h4>
                    </div>

                    {/* Live Open / 24-7 Status Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{effectiveOperatingHours.includes('24/7') || effectiveOperatingHours.includes('24 Hours') ? '24/7 Active' : 'Trading Hours'}</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 font-medium leading-relaxed space-y-1">
                    {effectiveOperatingHours.split('|').map((segment, sIdx) => (
                      <div key={`sched-seg-${sIdx}-${segment.slice(0, 8)}`} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                        <span className="font-mono text-slate-300">{segment.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physical Address Card */}
              {effectiveAddress && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-rose-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-slate-200">Location & Premises</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{effectiveAddress}</p>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(effectiveAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {effectiveServices && effectiveServices.length > 0 ? (
                effectiveServices.map((service, srvIdx) => (
                  <div
                    key={`service-item-${service.id || srvIdx}-${srvIdx}`}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs sm:text-sm font-bold text-white leading-tight">
                        {service.title}
                      </h5>
                      {service.price && (
                        <span
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 whitespace-nowrap"
                        >
                          {service.price}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setActiveTab('contact');
                        setLeadForm((prev) => ({
                          ...prev,
                          message: `Inquiry regarding: ${service.title}`,
                        }));
                      }}
                      className="mt-1 text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 self-start"
                      style={{ color: primaryColor }}
                    >
                      <span>Inquire about this</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No specific services listed yet.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {effectiveGalleryImages && effectiveGalleryImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {effectiveGalleryImages.map((imgUrl, i) => (
                    <div
                      key={`gallery-${i}-${imgUrl || 'photo'}`}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow"
                    >
                      <img
                        src={imgUrl || undefined}
                        alt={`Showcase ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500">
                  No gallery photos uploaded yet.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  Direct Lead & Callback Request
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Leave your details and {memberName || card.businessName} will respond shortly.
                </p>

                {leadSubmitted ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-center space-y-1.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-600/30 text-emerald-400 mx-auto flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-emerald-300">Inquiry Sent Successfully!</h5>
                    <p className="text-xs text-slate-300">
                      Your request has been logged. We will contact you soon.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sipho Sithole"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Phone / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +27 82 123 4567"
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="name@example.co.za"
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Message / Request
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us what you need or when you'd like a call..."
                        value={leadForm.message}
                        onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={leadSubmitting}
                      className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg flex items-center justify-center gap-2 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {leadSubmitting ? (
                        <span>Sending Request...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Request</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Analytics Badge & POPIA Privacy Footer */}
      <div className="px-5 py-4 mt-auto border-t border-slate-800/60 text-center bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400 mb-2">
          <span>Views: <strong className="text-slate-200">{(card.viewsCount || 0).toLocaleString()}</strong></span>
          <span>•</span>
          <span>Shares: <strong className="text-slate-200">{(card.sharesCount || 0).toLocaleString()}</strong></span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Protected under POPIA (Protection of Personal Information Act, South Africa).
          <br />
          Powered by <strong>B-Smart</strong> Smart Communicator.
        </p>
      </div>

      {/* Persistent Sticky Mobile Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 p-3 z-30 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 flex items-center gap-2">
        <button
          onClick={handleCall}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Phone className="w-4 h-4 text-emerald-400" />
          <span>Quick Call</span>
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
      </div>

      {/* Share & QR Code Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            key="cardview-share-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-center space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  Scan or Share Card
                </h4>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* QR Code Canvas */}
              <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-inner">
                <QRCodeSVG
                  value={currentUrl}
                  size={190}
                  fgColor="#020617"
                  bgColor="#ffffff"
                />
              </div>

              <p className="text-xs text-slate-300">
                Point any smartphone camera to instantly open and save <strong>{isEmployeeCard && memberName ? `${memberName} (${companyName})` : card.businessName}</strong>.
              </p>

              {/* Copy Link Row */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 bg-transparent px-2 text-xs text-slate-300 outline-none truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Quick Social Shares */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Check out ${isEmployeeCard && memberName ? `${memberName} • ${companyName}` : card.businessName}'s official smart card: ${currentUrl}`
                    );
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="py-2 px-3 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/30 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  onClick={handleSaveContact}
                  className="py-2 px-3 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .vcf</span>
                </button>
              </div>

              {/* Print Physical Cards Action */}
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShowPrintModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Physical Cards (10 per Sheet)</span>
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Fullscreen HD Banner Lightbox Modal (Auto-fit Full Image at 300 DPI) */}
        {fullscreenBannerUrl && (
          <motion.div
            key={`cardview-fullscreen-banner-${fullscreenBannerUrl}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90"
            onClick={() => setFullscreenBannerUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[92vh] flex flex-col items-center justify-center"
            >
              {/* Top Controls Bar */}
              <div className="w-full flex items-center justify-between gap-3 mb-3 px-2 text-white">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>300 DPI High-Resolution Banner</span>
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Full image auto-fit without cropping
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={fullscreenBannerUrl}
                    download="banner-300dpi.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download HD Image"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Save HD</span>
                  </a>
                  <button
                    onClick={() => setFullscreenBannerUrl(null)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
                    title="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Full Image View */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center max-h-[82vh]">
                <img
                  src={fullscreenBannerUrl || undefined}
                  alt="Full Banner"
                  className="max-w-full max-h-[82vh] w-auto h-auto object-contain select-none"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Physical Business Cards Modal (10-Up A4 / Letter) */}
      <PrintBusinessCardsModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        card={card}
        company={company}
        allocatedMember={allocatedMember}
      />
    </div>
  );
};
