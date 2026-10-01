import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
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
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { BusinessCard, LeadInquiry } from '../types';
import { downloadVCard } from '../utils/vcard';
import { QRCodeSVG } from '../utils/qr';

interface CardViewProps {
  card: BusinessCard;
  onLeadSubmit?: (lead: Omit<LeadInquiry, 'id' | 'createdAt' | 'status'>) => void;
  onActionClick?: (actionType: 'call' | 'whatsapp' | 'share' | 'vcard') => void;
  isStandalone?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  onLeadSubmit,
  onActionClick,
  isStandalone = false,
}) => {
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'gallery' | 'contact'>('about');
  
  // Lead form state
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  // Auto-rotate banners smoothly
  useEffect(() => {
    if (!card.banners || card.banners.length <= 1 || isBannerPaused) return;
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % card.banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [card.banners, isBannerPaused]);

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/card/${card.slug}` : `https://yebocard.co.za/card/${card.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
    onActionClick?.('share');
  };

  const handleSaveContact = () => {
    downloadVCard(card);
    onActionClick?.('vcard');
  };

  const handleCall = () => {
    onActionClick?.('call');
    if (card.socialLinks.phone) {
      window.location.href = `tel:${card.socialLinks.phone}`;
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
    const waNumber = (card.socialLinks.whatsapp || card.socialLinks.phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Hi ${card.contactPersonName || card.businessName}, I viewed your YeboCard digital profile and would like to connect.`);
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
        message: leadForm.message || 'Direct inquiry submitted from smart card profile.',
      });
      setLeadSubmitting(false);
      setLeadSubmitted(true);
      setLeadForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setLeadSubmitted(false), 5000);
    }, 600);
  };

  const primaryColor = card.theme.primaryColor || '#ef4444';
  const overlayOpacity = (card.theme.darkOverlayOpacity ?? 75) / 100;

  return (
    <div className="relative w-full max-w-[440px] mx-auto min-h-screen text-slate-100 flex flex-col font-sans select-none overflow-x-hidden shadow-2xl rounded-2xl md:rounded-3xl border border-slate-800/80">
      {/* Background Image / Gradient Layer */}
      {card.theme.bgType === 'image' && card.theme.bgImageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center -z-20 transition-all duration-700"
          style={{ backgroundImage: `url(${card.theme.bgImageUrl})` }}
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
      <div className="pt-3 px-4 pb-2 flex items-center justify-between z-20 backdrop-blur-md bg-slate-950/40 border-b border-slate-800/40">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
          <span>YeboCard</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400 font-mono">
            {card.businessTypeLabel || 'Smart Card'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            aria-label="Share card"
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Cross-fade Banner Carousel */}
      {card.banners && card.banners.length > 0 && (
        <div
          className="relative w-full h-52 sm:h-56 overflow-hidden bg-slate-900 group"
          onMouseEnter={() => setIsBannerPaused(true)}
          onMouseLeave={() => setIsBannerPaused(false)}
        >
          {card.banners.map((banner, idx) => (
            <motion.div
              key={banner.id}
              initial={false}
              animate={{
                opacity: activeBannerIdx === idx ? 1 : 0,
                scale: activeBannerIdx === idx ? 1 : 1.05,
              }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute inset-0 pointer-events-none"
              style={{ pointerEvents: activeBannerIdx === idx ? 'auto' : 'none' }}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-left">
                {banner.badgeText && (
                  <span
                    className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded text-white shadow-sm mb-1.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {banner.badgeText}
                  </span>
                )}
                <h4 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2 drop-shadow">
                  {banner.title}
                </h4>
                {banner.subtitle && (
                  <p className="text-xs text-slate-300 line-clamp-1 mt-0.5 drop-shadow">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </motion.div>
          ))}

          {/* Carousel Navigation Indicators */}
          {card.banners.length > 1 && (
            <div className="absolute bottom-1 right-4 flex items-center gap-1.5 z-10">
              {card.banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeBannerIdx === i
                      ? 'w-5 bg-white shadow'
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
        {/* Logo Avatar with glow */}
        <div className="relative inline-block mx-auto mb-3">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden p-1 shadow-xl bg-slate-900/90 border-2"
            style={{ borderColor: primaryColor }}
          >
            {card.logoUrl ? (
              <img
                src={card.logoUrl}
                alt={card.businessName}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
            )}
          </div>
          <div
            className="absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow-lg"
            style={{ backgroundColor: primaryColor }}
            title="Verified Yebo Communicator"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Contact Person & Job Title */}
        {card.contactPersonName && (
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            {card.contactPersonName}
          </h2>
        )}
        {card.designation && (
          <p
            className="text-xs sm:text-sm font-semibold tracking-wide uppercase mt-0.5"
            style={{ color: primaryColor }}
          >
            {card.designation}
          </p>
        )}

        {/* Business Name & Tagline */}
        <h3 className="text-sm font-bold text-slate-300 mt-1">
          {card.businessName}
        </h3>
        {card.tagline && (
          <p className="text-xs text-slate-400 mt-1 px-4 leading-relaxed line-clamp-2">
            {card.tagline}
          </p>
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
          {card.socialLinks.email && (
            <a
              href={`mailto:${card.socialLinks.email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[170px]">{card.socialLinks.email}</span>
            </a>
          )}
          {card.socialLinks.website && (
            <a
              href={card.socialLinks.website.startsWith('http') ? card.socialLinks.website : `https://${card.socialLinks.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[150px]">Website</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
          {card.socialLinks.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(card.socialLinks.address)}`}
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
          {card.socialLinks.whatsapp && (
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
              {/* Bio summary */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  About Our Business
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {card.aboutText || 'Welcome to our smart business communicator. Contact us directly for quotes, bookings, and immediate inquiries.'}
                </p>
              </div>

              {/* Operating Hours */}
              {card.operatingHours && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">Operating Schedule</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{card.operatingHours}</p>
                  </div>
                </div>
              )}

              {/* Physical Address Card */}
              {card.socialLinks.address && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-rose-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-slate-200">Location & Premises</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{card.socialLinks.address}</p>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(card.socialLinks.address)}`}
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
              {card.services && card.services.length > 0 ? (
                card.services.map((service) => (
                  <div
                    key={service.id}
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
              {card.galleryImages && card.galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {card.galleryImages.map((imgUrl, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow"
                    >
                      <img
                        src={imgUrl}
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
                  Leave your details and {card.contactPersonName || card.businessName} will respond shortly.
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
          Powered by <strong>YeboCard</strong> Smart Communicator.
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
                Point any smartphone camera to instantly open and save <strong>{card.businessName}</strong>.
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
                    const text = encodeURIComponent(`Check out ${card.businessName} smart card: ${currentUrl}`);
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
