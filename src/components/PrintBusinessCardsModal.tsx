import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  X,
  Scissors,
  FileText,
  Sliders,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles,
  QrCode,
  MessageSquare,
  Clock,
  ShieldAlert,
  Layers,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';
import { BusinessCard, Company, User } from '../types';
import { QRCodeSVG } from '../utils/qr';

interface PrintBusinessCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BusinessCard;
  company?: Company | null;
  allocatedMember?: User | null;
}

export const PrintBusinessCardsModal: React.FC<PrintBusinessCardsModalProps> = ({
  isOpen,
  onClose,
  card,
  company,
  allocatedMember,
}) => {
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [cardStyle, setCardStyle] = useState<'clean' | 'accent' | 'dark'>('clean');
  const [printSide, setPrintSide] = useState<'front' | 'back' | 'single'>('front');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showOperatingHours, setShowOperatingHours] = useState(true);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cardUrl = `${origin}/card/${card.slug}`;
  const shortDomain = origin.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Complete data synthesis ensuring NO details are missed
  const displayName = allocatedMember?.name || card.contactPersonName || card.businessName;
  const displayRole = allocatedMember?.designation || card.designation || '';
  const displayCompany = company?.name || card.businessName;
  const displayTagline = card.tagline || company?.tagline || '';
  const displayCategory = card.businessTypeLabel || company?.categoryLabel || 'Digital Smart Card';
  const displayLogo = company?.logoUrl || card.logoUrl || allocatedMember?.avatarUrl || '';
  const primaryColor = card.theme?.primaryColor || company?.theme?.primaryColor || '#f59e0b';

  const phone = card.socialLinks?.phone || allocatedMember?.phone || company?.phone || '';
  const rawWhatsapp = card.socialLinks?.whatsapp || '';
  const whatsapp = rawWhatsapp && rawWhatsapp !== phone ? rawWhatsapp : '';
  const email = card.socialLinks?.email || allocatedMember?.email || company?.email || '';
  const website = card.socialLinks?.website || company?.website || '';
  const address = card.socialLinks?.address || company?.address || '';
  const emergencyPhone = card.emergencyPhone || '';
  const operatingHours = card.operatingHours || company?.operatingHours || '';
  const aboutText = card.aboutText || company?.aboutText || '';
  const services = card.services && card.services.length > 0 ? card.services : [];

  const cleanWebsite = website.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const handlePrint = () => {
    window.print();
  };

  // 10 cards per sheet (2 columns × 5 rows or 3 columns × 4 rows)
  const cardIndices = Array.from({ length: 10 }, (_, i) => i);

  // Render Front of Business Card (Strict 88.9mm × 50.8mm / 3.5" × 2.0" in Landscape or Portrait)
  const renderFrontCard = (cardKey: string) => {
    const isDarkCard = cardStyle === 'dark';
    const isAccent = cardStyle === 'accent';
    const isPortrait = orientation === 'portrait';

    return (
      <div
        key={cardKey}
        className={`printed-business-card-item relative p-2 flex flex-col justify-between overflow-hidden select-none transition-colors ${
          isPortrait ? 'aspect-[2/3.5]' : 'aspect-[3.5/2]'
        } ${
          showCutGuides
            ? 'border border-dashed border-slate-300'
            : 'border border-transparent'
        } ${
          isDarkCard
            ? 'bg-slate-950 text-white'
            : isAccent
            ? 'bg-slate-50 text-slate-900'
            : 'bg-white text-slate-900'
        }`}
        style={{
          width: isPortrait ? '50.8mm' : '88.9mm',
          height: isPortrait ? '88.9mm' : '50.8mm',
          boxSizing: 'border-box',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
        }}
      >
        {/* Top Brand Accent Strip */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: primaryColor }}
        />

        {isPortrait ? (
          /* PORTRAIT FRONT CARD (50.8mm W × 88.9mm H) */
          <>
            {/* 1. Header: Logo Top Centered & Company Details */}
            <div className="flex flex-col items-center text-center gap-1 pt-0.5 shrink-0">
              {displayLogo && (
                <div className="rounded-md overflow-hidden shrink-0 border border-slate-200/80 bg-white p-0.5 flex items-center justify-center w-8 h-8 shadow-xs">
                  <img
                    src={displayLogo || undefined}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 w-full px-1">
                <h4
                  className={`font-black leading-tight tracking-tight truncate text-[10px] ${
                    isDarkCard ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  {displayCompany}
                </h4>
                <div className="flex items-center justify-center gap-1 mt-0.5 text-[6.5px] font-semibold truncate">
                  <span
                    className={`uppercase tracking-wider shrink-0 ${
                      isDarkCard ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {displayCategory}
                  </span>
                  {displayTagline && displayTagline !== displayCategory && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span
                        className={`italic truncate ${
                          isDarkCard ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {displayTagline}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Middle Section: Person Name & Designation */}
            <div className="my-1 py-1 px-0.5 border-y border-slate-200/70 dark:border-slate-800/70 bg-transparent flex flex-col items-center text-center justify-center min-h-0">
              <div
                className={`font-extrabold leading-tight tracking-tight truncate text-[10.5px] ${
                  isDarkCard ? 'text-white' : 'text-slate-950'
                }`}
              >
                {displayName}
              </div>
              {displayRole && (
                <div
                  className="font-bold leading-tight uppercase tracking-wider truncate mt-0.5 text-[7.5px]"
                  style={{ color: primaryColor }}
                >
                  {displayRole}
                </div>
              )}
            </div>

            {/* 3. Contact Channels Stack (Compact Vertical) */}
            <div className="pt-0.5 flex-1 flex flex-col justify-center space-y-1 text-[6.5px] font-medium leading-tight">
              {phone && (
                <div className="flex items-center gap-1 min-w-0">
                  <Phone className="w-2 h-2 shrink-0 text-slate-500" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {phone}
                  </span>
                </div>
              )}
              {whatsapp ? (
                <div className="flex items-center gap-1 min-w-0">
                  <MessageSquare className="w-2 h-2 shrink-0 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                    WA: {whatsapp}
                  </span>
                </div>
              ) : emergencyPhone ? (
                <div className="flex items-center gap-1 min-w-0">
                  <ShieldAlert className="w-2 h-2 shrink-0 text-red-600" />
                  <span className="text-red-700 dark:text-red-400 font-bold truncate">
                    24/7: {emergencyPhone}
                  </span>
                </div>
              ) : null}
              {email && (
                <div className="flex items-center gap-1 min-w-0">
                  <Mail className="w-2 h-2 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                    {email}
                  </span>
                </div>
              )}
              {website && (
                <div className="flex items-center gap-1 min-w-0">
                  <Globe className="w-2 h-2 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                    {cleanWebsite}
                  </span>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="w-2 h-2 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-600 dark:text-slate-400 leading-tight">
                    {address}
                  </span>
                </div>
              )}
              {showOperatingHours && operatingHours && (
                <div className="flex items-center gap-1 min-w-0">
                  <Clock className="w-2 h-2 shrink-0 text-slate-500" />
                  <span className="truncate text-slate-500 dark:text-slate-400 leading-tight">
                    {operatingHours.split('(')[0].trim()}
                  </span>
                </div>
              )}
            </div>

            {/* 4. Bottom Vector QR Code (Centered) */}
            {showQrCode && (
              <div className="shrink-0 flex flex-col items-center justify-center pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="p-0.5 bg-white rounded border border-slate-300 shadow-xs">
                  <QRCodeSVG
                    value={cardUrl}
                    size={34}
                    fgColor="#020617"
                    bgColor="#ffffff"
                  />
                </div>
                <span className="text-[5px] uppercase font-black tracking-tighter text-slate-600 dark:text-slate-400 mt-0.5 text-center leading-none">
                  Scan vCard
                </span>
              </div>
            )}
          </>
        ) : (
          /* LANDSCAPE FRONT CARD (88.9mm W × 50.8mm H) */
          <>
            {/* 1. HEADER ROW: Centered Logo, Company Name & Category */}
            <div className="flex flex-col items-center text-center gap-0.5 pt-0.5 shrink-0">
              {displayLogo && (
                <div className="rounded-md overflow-hidden shrink-0 border border-slate-200/80 bg-white p-0.5 flex items-center justify-center w-7 h-7 mx-auto shadow-xs">
                  <img
                    src={displayLogo || undefined}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 w-full px-1">
                <h4
                  className={`font-black leading-tight tracking-tight truncate text-[9.5px] ${
                    isDarkCard ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  {displayCompany}
                </h4>
                <div className="flex items-center justify-center gap-1 text-[6px] font-semibold truncate">
                  <span
                    className={`uppercase tracking-wider shrink-0 ${
                      isDarkCard ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {displayCategory}
                  </span>
                  {displayTagline && displayTagline !== displayCategory && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span
                        className={`italic truncate ${
                          isDarkCard ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {displayTagline}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. MIDDLE ROW: Person Name & Designation */}
            <div className="my-1 py-1 px-0.5 border-y border-slate-200/70 dark:border-slate-800/70 bg-transparent flex-1 flex flex-col justify-center min-h-0">
              <div
                className={`font-extrabold leading-tight tracking-tight truncate text-[10.5px] ${
                  isDarkCard ? 'text-white' : 'text-slate-950'
                }`}
              >
                {displayName}
              </div>
              {displayRole && (
                <div
                  className="font-bold leading-tight uppercase tracking-wider truncate mt-0.5 text-[7.5px]"
                  style={{ color: primaryColor }}
                >
                  {displayRole}
                </div>
              )}
            </div>

            {/* 3. BOTTOM DETAILS SECTION: Compact Multi-Channel Contact Grid + Vector QR */}
            <div className="pt-1 flex items-end justify-between gap-1.5 shrink-0">
              <div className="min-w-0 flex-1 grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[6.5px] font-medium leading-tight">
                {phone && (
                  <div className="flex items-center gap-1 min-w-0">
                    <Phone className="w-2 h-2 shrink-0 text-slate-500" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {phone}
                    </span>
                  </div>
                )}
                {whatsapp ? (
                  <div className="flex items-center gap-1 min-w-0">
                    <MessageSquare className="w-2 h-2 shrink-0 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                      WA: {whatsapp}
                    </span>
                  </div>
                ) : emergencyPhone ? (
                  <div className="flex items-center gap-1 min-w-0">
                    <ShieldAlert className="w-2 h-2 shrink-0 text-red-600" />
                    <span className="text-red-700 dark:text-red-400 font-bold truncate">
                      24/7: {emergencyPhone}
                    </span>
                  </div>
                ) : null}
                {email && (
                  <div className="flex items-center gap-1 min-w-0">
                    <Mail className="w-2 h-2 shrink-0 text-slate-500" />
                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                      {email}
                    </span>
                  </div>
                )}
                {website && (
                  <div className="flex items-center gap-1 min-w-0">
                    <Globe className="w-2 h-2 shrink-0 text-slate-500" />
                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                      {cleanWebsite}
                    </span>
                  </div>
                )}
                {address && (
                  <div className="flex items-center gap-1 min-w-0 col-span-2">
                    <MapPin className="w-2 h-2 shrink-0 text-slate-500" />
                    <span className="truncate text-slate-600 dark:text-slate-400 leading-tight">
                      {address}
                    </span>
                  </div>
                )}
                {showOperatingHours && operatingHours && (
                  <div className="flex items-center gap-1 min-w-0 col-span-2">
                    <Clock className="w-2 h-2 shrink-0 text-slate-500" />
                    <span className="truncate text-slate-500 dark:text-slate-400 leading-tight">
                      {operatingHours.split('(')[0].trim()}
                    </span>
                  </div>
                )}
              </div>

              {showQrCode && (
                <div className="shrink-0 flex flex-col items-center justify-end pl-0.5">
                  <div className="p-0.5 bg-white rounded border border-slate-300 shadow-xs">
                    <QRCodeSVG
                      value={cardUrl}
                      size={36}
                      fgColor="#020617"
                      bgColor="#ffffff"
                    />
                  </div>
                  <span className="text-[5px] uppercase font-black tracking-tighter text-slate-600 dark:text-slate-400 mt-0.5 text-center leading-none">
                    Scan vCard
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Precision Corner Crop Marks */}
        {showCutGuides && (
          <>
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-slate-400 pointer-events-none" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-slate-400 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-slate-400 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-slate-400 pointer-events-none" />
          </>
        )}
      </div>
    );
  };

  // Render Back of Business Card (Reverse Side for Dual-Sided Printing)
  const renderBackCard = (cardKey: string) => {
    const isDarkCard = cardStyle === 'dark';
    const isAccent = cardStyle === 'accent';
    const isPortrait = orientation === 'portrait';

    return (
      <div
        key={cardKey}
        className={`printed-business-card-item relative p-2 flex flex-col justify-between overflow-hidden select-none transition-colors ${
          isPortrait ? 'aspect-[2/3.5]' : 'aspect-[3.5/2]'
        } ${
          showCutGuides
            ? 'border border-dashed border-slate-300'
            : 'border border-transparent'
        } ${
          isDarkCard
            ? 'bg-slate-950 text-white'
            : isAccent
            ? 'bg-slate-50 text-slate-900'
            : 'bg-white text-slate-900'
        }`}
        style={{
          width: isPortrait ? '50.8mm' : '88.9mm',
          height: isPortrait ? '88.9mm' : '50.8mm',
          boxSizing: 'border-box',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
        }}
      >
        {/* Top Brand Accent Strip */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: primaryColor }}
        />

        {isPortrait ? (
          /* PORTRAIT BACK CARD */
          <>
            {/* Header: Company & Slogan */}
            <div className="flex flex-col items-center text-center gap-1 pt-0.5 border-b border-slate-200/60 pb-1 shrink-0">
              {displayLogo && (
                <div className="rounded-md overflow-hidden shrink-0 border border-slate-200/60 bg-white p-0.5 flex items-center justify-center w-7 h-7">
                  <img src={displayLogo || undefined} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="min-w-0 w-full px-1">
                <h4
                  className={`font-black leading-tight tracking-tight truncate text-[10px] ${
                    isDarkCard ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  {displayCompany}
                </h4>
                {displayTagline && (
                  <p
                    className={`italic leading-tight truncate text-[6.5px] ${
                      isDarkCard ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {displayTagline}
                  </p>
                )}
              </div>
            </div>

            {/* Middle Body: About & Core Services */}
            <div className="my-1 py-1 px-0.5 flex-1 flex flex-col items-center text-center justify-center min-h-0 space-y-1 bg-transparent">
              {aboutText ? (
                <p className="leading-snug line-clamp-3 text-slate-600 dark:text-slate-300 text-[6.5px]">
                  "{aboutText}"
                </p>
              ) : (
                <p className="leading-snug text-slate-600 dark:text-slate-300 text-[6.5px]">
                  Official Smart Business Profile & Verified Communicator. Tap or scan to connect directly.
                </p>
              )}

              {/* Services Highlights */}
              {services.length > 0 && (
                <div className="flex flex-col gap-1 w-full pt-0.5">
                  {services.slice(0, 2).map((srv, sIdx) => (
                    <div
                      key={`back-srv-${srv.id || sIdx}-${sIdx}`}
                      className="flex items-center justify-center gap-1 px-1 py-0.5 rounded bg-transparent text-[6px] font-semibold text-slate-800 dark:text-slate-200 truncate border border-slate-300 dark:border-slate-700"
                    >
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} />
                      <span className="truncate">{srv.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer: Digital Link & QR Callout */}
            <div className="pt-1 border-t border-slate-200/70 flex flex-col items-center gap-1 text-center shrink-0">
              <div className="min-w-0 w-full space-y-0.5 text-[6.5px] text-slate-500">
                {emergencyPhone && (
                  <div className="text-red-600 font-bold flex items-center justify-center gap-1 truncate">
                    <ShieldAlert className="w-2 h-2 shrink-0" />
                    <span className="truncate">24/7: {emergencyPhone}</span>
                  </div>
                )}
                {operatingHours && (
                  <div className="flex items-center justify-center gap-1 truncate">
                    <Clock className="w-2 h-2 shrink-0 opacity-70" />
                    <span className="truncate">{operatingHours.split('(')[0].trim()}</span>
                  </div>
                )}
                <div className="font-mono text-slate-600 dark:text-slate-400 truncate text-[6px]">
                  {shortDomain}/card/{card.slug}
                </div>
              </div>

              {showQrCode && (
                <div className="shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
                  <div className="p-0.5 bg-white rounded border border-slate-300 shadow-xs">
                    <QRCodeSVG
                      value={cardUrl}
                      size={32}
                      fgColor="#020617"
                      bgColor="#ffffff"
                    />
                  </div>
                  <div className="text-[5px] uppercase font-black text-slate-900 dark:text-white leading-none">
                    Scan to Save
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* LANDSCAPE BACK CARD */
          <>
            {/* Header: Company & Slogan with Centered Logo */}
            <div className="flex flex-col items-center text-center gap-0.5 pt-0.5 border-b border-slate-200/60 pb-0.5 shrink-0">
              {displayLogo && (
                <div className="rounded-md overflow-hidden shrink-0 border border-slate-200/60 bg-white p-0.5 flex items-center justify-center w-6 h-6 mx-auto">
                  <img src={displayLogo || undefined} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="min-w-0 w-full">
                <h4
                  className={`font-black leading-tight tracking-tight truncate text-[9.5px] ${
                    isDarkCard ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  {displayCompany}
                </h4>
                {displayTagline && (
                  <p
                    className={`italic leading-tight truncate text-[6px] ${
                      isDarkCard ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {displayTagline}
                  </p>
                )}
              </div>
            </div>

            {/* Middle Body: About & Core Services */}
            <div className="my-1 py-1 px-0.5 flex-1 flex flex-col justify-center min-h-0 space-y-1 bg-transparent">
              {aboutText ? (
                <p className="leading-snug line-clamp-2 text-slate-600 dark:text-slate-300 text-[6.5px]">
                  "{aboutText}"
                </p>
              ) : (
                <p className="leading-snug text-slate-600 dark:text-slate-300 text-[6.5px]">
                  Official Smart Business Profile & Verified Communicator. Tap or scan to connect directly.
                </p>
              )}

              {/* Services Highlights */}
              {services.length > 0 && (
                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  {services.slice(0, 2).map((srv, sIdx) => (
                    <div
                      key={`back-srv-${srv.id || sIdx}-${sIdx}`}
                      className="flex items-center gap-1 px-1 py-0.5 rounded bg-transparent text-[6px] font-semibold text-slate-800 dark:text-slate-200 truncate border border-slate-300 dark:border-slate-700"
                    >
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} />
                      <span className="truncate">{srv.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer: Digital Link & QR Callout */}
            <div className="pt-0.5 border-t border-slate-200/70 flex items-center justify-between gap-1 shrink-0">
              <div className="min-w-0 flex-1 space-y-0.5 text-[6.5px] text-slate-500">
                {emergencyPhone && (
                  <div className="text-red-600 font-bold flex items-center gap-1 truncate">
                    <ShieldAlert className="w-2 h-2 shrink-0" />
                    <span className="truncate">24/7: {emergencyPhone}</span>
                  </div>
                )}
                {operatingHours && (
                  <div className="flex items-center gap-1 truncate">
                    <Clock className="w-2 h-2 shrink-0 opacity-70" />
                    <span className="truncate">{operatingHours.split('(')[0].trim()}</span>
                  </div>
                )}
                <div className="font-mono text-slate-600 dark:text-slate-400 truncate text-[6px]">
                  {shortDomain}/card/{card.slug}
                </div>
              </div>

              {showQrCode && (
                <div className="shrink-0 flex items-center gap-1">
                  <div className="text-right">
                    <div className="text-[5px] uppercase font-black text-slate-900 dark:text-white leading-none">
                      Digital Card
                    </div>
                    <div className="text-[4.5px] text-slate-500 leading-none mt-0.5">
                      Scan to Save
                    </div>
                  </div>
                  <div className="p-0.5 bg-white rounded border border-slate-300 shadow-xs">
                    <QRCodeSVG
                      value={cardUrl}
                      size={32}
                      fgColor="#020617"
                      bgColor="#ffffff"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Crop Marks */}
        {showCutGuides && (
          <>
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-slate-400 pointer-events-none" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-slate-400 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-slate-400 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-slate-400 pointer-events-none" />
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div key="print-business-cards-modal-wrapper" className="print-modal-container fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 overflow-y-auto print:fixed print:inset-0 print:bg-white print:p-0 print:overflow-visible">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="print-modal-card relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col print:border-none print:shadow-none print:bg-white print:max-h-none print:overflow-visible"
      >
          {/* Top Modal Controls Header (Hidden in Print) */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Print Physical Cards (88.9mm × 50.8mm)</span>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Avery 5371 / Standard 10-Up
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Calibrated to 88.9 × 50.8 mm standard business card specs ({orientation === 'portrait' ? 'Portrait 50.8mm × 88.9mm' : 'Landscape 88.9mm × 50.8mm'}).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print {printSide === 'single' ? 'Single Card' : 'Sheet Now'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Customization Toolbar (Hidden in Print) */}
          <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
            {/* View Mode & Controls Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Side / Mode */}
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Side:</span>
              </span>
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrintSide('front')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    printSide === 'front'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSide('back')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    printSide === 'back'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSide('single')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    printSide === 'single'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Proof
                </button>
              </div>

              {/* Orientation Toggle */}
              <span className="text-slate-400 font-semibold ml-2 flex items-center gap-1">
                <RectangleHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Orientation:</span>
              </span>
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    orientation === 'landscape'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RectangleHorizontal className="w-3.5 h-3.5" />
                  <span>Landscape</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    orientation === 'portrait'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RectangleVertical className="w-3.5 h-3.5" />
                  <span>Portrait</span>
                </button>
              </div>

              {/* Paper Size */}
              <span className="text-slate-400 font-semibold ml-2 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Paper:</span>
              </span>
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaperSize('a4')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    paperSize === 'a4'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('letter')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    paperSize === 'letter'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  US Letter
                </button>
              </div>

              {/* Card Style */}
              <span className="text-slate-400 font-semibold ml-2 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Theme:</span>
              </span>
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCardStyle('clean')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    cardStyle === 'clean'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  White
                </button>
                <button
                  type="button"
                  onClick={() => setCardStyle('accent')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    cardStyle === 'accent'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Accent
                </button>
                <button
                  type="button"
                  onClick={() => setCardStyle('dark')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    cardStyle === 'dark'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Toggles: Cut Guides, QR, Hours */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={showCutGuides}
                  onChange={(e) => setShowCutGuides(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>Cut Guides</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Smart QR</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={showOperatingHours}
                  onChange={(e) => setShowOperatingHours(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Hours</span>
              </label>
            </div>
          </div>

          {/* Interactive Print Sheet Preview Container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950 flex flex-col items-center">
            {/* Sheet container - Print Target */}
            <div
              id="printable-business-card-sheet"
              className={`w-full max-w-[850px] bg-white text-slate-900 rounded-xl shadow-2xl p-4 sm:p-6 transition-all font-sans`}
              style={{
                boxSizing: 'border-box',
              }}
            >
              {/* Sheet Top Indicator (Screen only) */}
              <div className="mb-4 pb-2 border-b border-dashed border-slate-300 flex flex-wrap items-center justify-between text-[11px] text-slate-500 print:hidden font-mono gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    {printSide === 'single'
                      ? `Single Card Proof (${orientation === 'portrait' ? '50.8mm × 88.9mm Portrait' : '88.9mm × 50.8mm Landscape'})`
                      : printSide === 'back'
                      ? `Reverse Side Sheet (${orientation === 'portrait' ? 'Portrait' : 'Landscape'}) • Double-Sided Ready`
                      : `Standard Sheet (${orientation === 'portrait' ? 'Portrait 50.8 × 88.9 mm' : 'Landscape 88.9 × 50.8 mm'})`}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    All Fields Active
                  </span>
                </div>
                <span>Paper: {paperSize === 'a4' ? 'A4 (210×297mm)' : 'US Letter (8.5×11")'}</span>
              </div>

              {/* RENDER MODE: Single Card Proof vs 10-Card Sheet */}
              {printSide === 'single' ? (
                <div className="flex flex-col items-center justify-center py-4 gap-8">
                  <div className="w-full max-w-[500px] flex flex-col items-center">
                    <div className="w-full text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Front View Proof ({orientation})</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Exact {orientation === 'portrait' ? '50.8mm × 88.9mm' : '88.9mm × 50.8mm'}</span>
                    </div>
                    <div className="card-scale-wrapper w-full flex items-center justify-center p-3 bg-slate-900/40 rounded-2xl border border-slate-800/80 shadow-inner overflow-hidden">
                      <div className="scale-canvas transform scale-100 sm:scale-110 my-3 sm:my-6 transition-transform shadow-2xl rounded-sm">
                        {renderFrontCard(`single-front-${card.id}`)}
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-[500px] flex flex-col items-center">
                    <div className="w-full text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Back / Reverse Side Proof ({orientation})</span>
                      <span className="text-[10px] text-slate-400">About, Services & Scannable QR</span>
                    </div>
                    <div className="card-scale-wrapper w-full flex items-center justify-center p-3 bg-slate-900/40 rounded-2xl border border-slate-800/80 shadow-inner overflow-hidden">
                      <div className="scale-canvas transform scale-100 sm:scale-110 my-3 sm:my-6 transition-transform shadow-2xl rounded-sm">
                        {renderBackCard(`single-back-${card.id}`)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 10-Card Grid */
                <div className="sheet-scale-wrapper w-full overflow-x-auto flex justify-center">
                  <div
                    className={`grid ${
                      orientation === 'portrait'
                        ? 'grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5'
                        : 'grid-cols-2 gap-2 sm:gap-2.5'
                    } ${
                      showCutGuides ? 'border border-dashed border-slate-300' : ''
                    }`}
                  >
                    {cardIndices.map((idx) =>
                      printSide === 'back'
                        ? renderBackCard(`print-card-back-${card.id}-${idx}`)
                        : renderFrontCard(`print-card-front-${card.id}-${idx}`)
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Print Instructions & Action */}
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Tip: In browser print dialog, set <strong>Scale: 100%</strong> (Actual Size) and check <strong>"Background Graphics"</strong>. Orientation set to <strong>{orientation.toUpperCase()}</strong>.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print {printSide === 'single' ? 'Single Proof' : 'Cards'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scoped Dedicated Print Stylesheet: Calibrated for Landscape (88.9×50.8mm) or Portrait (50.8×88.9mm) */}
      <style>{`
        /* Physical business card dimensions based on active orientation */
        .printed-business-card-item {
          width: ${orientation === 'portrait' ? '50.8mm' : '88.9mm'} !important;
          height: ${orientation === 'portrait' ? '88.9mm' : '50.8mm'} !important;
          min-width: ${orientation === 'portrait' ? '50.8mm' : '88.9mm'} !important;
          min-height: ${orientation === 'portrait' ? '88.9mm' : '50.8mm'} !important;
          max-width: ${orientation === 'portrait' ? '50.8mm' : '88.9mm'} !important;
          max-height: ${orientation === 'portrait' ? '88.9mm' : '50.8mm'} !important;
          box-sizing: border-box !important;
          position: relative !important;
          overflow: hidden !important;
        }

        .card-scale-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          overflow: hidden;
        }

        .scale-canvas {
          transform-origin: center center;
          transition: transform 0.2s ease-in-out;
        }

        /* Screen Preview Responsive Auto-Scaling for Mobile & Tablet Viewports */
        @media screen and (max-width: 768px) {
          .sheet-scale-wrapper {
            zoom: 0.82;
            -webkit-text-size-adjust: 100%;
          }
        }
        @media screen and (max-width: 580px) {
          .sheet-scale-wrapper {
            zoom: 0.60;
            -webkit-text-size-adjust: 100%;
          }
        }
        @media screen and (max-width: 440px) {
          .sheet-scale-wrapper {
            zoom: 0.48;
            -webkit-text-size-adjust: 100%;
          }
        }
        @media screen and (max-width: 360px) {
          .sheet-scale-wrapper {
            zoom: 0.42;
            -webkit-text-size-adjust: 100%;
          }
        }

        @media print {
          @page {
            size: ${paperSize === 'letter' ? '8.5in 11in' : '210mm 297mm'} portrait;
            margin: ${paperSize === 'letter' ? '0.5in 0.75in' : '20mm 16mm'};
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Reset scale wrappers in print output */
          .card-scale-wrapper, .scale-canvas, .sheet-scale-wrapper {
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Hide entire application shell and non-print overlays */
          header, nav, main, aside, footer, [role="navigation"], .print\\:hidden {
            display: none !important;
          }

          /* Ensure modal backdrop and frame take full print page without scrollbars */
          .print-modal-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            z-index: 999999 !important;
          }

          .print-modal-card {
            position: static !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Printable sheet styling */
          #printable-business-card-sheet {
            position: static !important;
            display: block !important;
            width: ${orientation === 'portrait' ? '152.4mm' : '177.8mm'} !important;
            max-width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Physical card sheet grid: 2 cols of 88.9mm (landscape) or 3 cols of 50.8mm (portrait) */
          #printable-business-card-sheet .grid {
            display: grid !important;
            grid-template-columns: ${orientation === 'portrait' ? 'repeat(3, 50.8mm)' : 'repeat(2, 88.9mm)'} !important;
            gap: 0 !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: ${orientation === 'portrait' ? '152.4mm' : '177.8mm'} !important;
            border: none !important;
          }

          .printed-business-card-item {
            width: ${orientation === 'portrait' ? '50.8mm' : '88.9mm'} !important;
            height: ${orientation === 'portrait' ? '88.9mm' : '50.8mm'} !important;
            max-width: ${orientation === 'portrait' ? '50.8mm' : '88.9mm'} !important;
            max-height: ${orientation === 'portrait' ? '88.9mm' : '50.8mm'} !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </>
  );
};


