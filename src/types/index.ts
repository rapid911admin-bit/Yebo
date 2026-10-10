export type UserRole = 'admin' | 'employee' | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string; // Company affiliation (companies can have multiple employees)
  password?: string; // Only administrators have management logins
  assignedCardId?: string; // Direct smart card link
  status: 'active' | 'paused';
  phone?: string;
  designation?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  badgeText?: string;
  overlayPosition?: 'bottom' | 'top' | 'none';
  overlayStyle?: 'transparent' | 'light' | 'medium' | 'dark' | 'solid';
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price?: string; // in ZAR or custom
  iconName?: string;
}

export interface SocialLinks {
  whatsapp?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  twitter?: string; // X
  tiktok?: string;
  youtube?: string;
  telegram?: string;
}

export type BusinessCategory =
  | 'security'
  | 'restaurant'
  | 'retail'
  | 'trades'
  | 'medical'
  | 'beauty'
  | 'real_estate'
  | 'professional'
  | 'freelance'
  | 'community'
  | 'custom';

export interface CardTheme {
  primaryColor: string; // brand accent
  secondaryColor?: string;
  bgType: 'gradient' | 'image' | 'dark' | 'glass';
  bgImageUrl?: string;
  headerImageUrl?: string;
  darkOverlayOpacity: number; // 0 to 100
  glassmorphism: boolean;
}

export interface Company {
  id: string;
  name: string;
  tagline: string;
  category: BusinessCategory;
  categoryLabel: string;
  logoUrl: string;
  theme: CardTheme;
  aboutText?: string;
  operatingHours?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessCard {
  id: string;
  companyId?: string; // Parent organization ID
  slug: string; // link name e.g. "beepd-communicator" or "zweli-security"
  businessName: string;
  tagline: string;
  businessType: BusinessCategory;
  businessTypeLabel: string;
  
  // Person details
  contactPersonName: string;
  designation: string; // Job title
  
  // Media
  logoUrl: string;
  banners: BannerSlide[];
  theme: CardTheme;
  
  // Contact & Social
  socialLinks: SocialLinks;
  emergencyPhone?: string; // For security / medical cards
  
  // Sections
  aboutText: string;
  services: ServiceItem[];
  galleryImages: string[];
  operatingHours: string;
  
  // Meta & Status
  status: 'live' | 'draft';
  assignedMemberId?: string;
  viewsCount: number;
  sharesCount: number;
  callClicksCount: number;
  whatsappClicksCount: number;
  vcardDownloadsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadInquiry {
  id: string;
  cardId: string;
  cardName: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'resolved';
}

export interface StarterTemplate {
  id: BusinessCategory;
  name: string;
  description: string;
  icon: string;
  tag: string;
  defaultData: Partial<BusinessCard>;
}
