import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  Check,
  AlertCircle,
  CreditCard,
  Trash2,
  Lock,
  UserCheck,
  Search,
  Edit,
  Mail,
  Phone,
  Briefcase,
  Camera,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  X,
  Eye,
  Filter,
  Copy,
  MessageCircle,
  QrCode,
  Download,
  Share2,
  Link as LinkIcon,
  Smartphone,
  Plus,
  Building2,
} from 'lucide-react';
import { BusinessCard, Company, User, UserRole } from '../types';
import { AvatarUploadField } from './AvatarUploadField';
import { ConfirmationModal } from './ConfirmationModal';
import { useTheme } from '../context/ThemeContext';
import { QRCodeSVG } from '../utils/qr';

interface AdminMembersProps {
  members: User[];
  cards: BusinessCard[];
  companies?: Company[];
  currentUserId?: string;
  onAddMember: (member: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (user: User) => void;
  onUpdateMemberPassword: (userId: string, newPassword: string) => void;
  onAssignCard: (userId: string, cardId: string | undefined) => void;
  onDeleteMember: (userId: string) => void;
  onOpenAllocateModal?: (cardId?: string) => void;
  onOpenBulkAllocateModal?: () => void;
  onOpenIssueCardModal?: (employee?: User) => void;
  onEditCard?: (card: BusinessCard) => void;
  onDeleteCard?: (cardId: string) => void;
  onPreviewCard?: (card: BusinessCard) => void;
  onSelectEmployeeForPreview?: (user: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
];

export const AdminMembers: React.FC<AdminMembersProps> = ({
  members,
  cards,
  companies = [],
  currentUserId,
  onAddMember,
  onUpdateUser,
  onUpdateMemberPassword,
  onAssignCard,
  onDeleteMember,
  onOpenAllocateModal,
  onOpenBulkAllocateModal,
  onOpenIssueCardModal,
  onEditCard,
  onDeleteCard,
  onPreviewCard,
  onSelectEmployeeForPreview,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Share Card Hub State
  const [shareCardUser, setShareCardUser] = useState<User | null>(null);
  const [shareCardObj, setShareCardObj] = useState<BusinessCard | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Form error state (in place of browser alert)
  const [formError, setFormError] = useState<string>('');

  // Add User Form State
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: UserRole;
    companyId: string;
    password: string;
    phone: string;
    designation: string;
    avatarUrl: string;
    bio: string;
    assignedCardId: string;
    status: 'active' | 'paused';
  }>({
    name: '',
    email: '',
    role: 'employee',
    companyId: '',
    password: '',
    phone: '',
    designation: '',
    avatarUrl: PRESET_AVATARS[0],
    bio: '',
    assignedCardId: '',
    status: 'active',
  });

  // Edit User Form State
  const [editFormData, setEditFormData] = useState<User | null>(null);

  // Password Reset Modal State
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  // Open Add modal with specified default role
  const handleOpenAdd = (defaultRole: UserRole = 'employee') => {
    setFormError('');
    setNewUser({
      name: '',
      email: '',
      role: defaultRole,
      companyId: companies && companies.length > 0 ? companies[0].id : '',
      password: defaultRole === 'admin' ? 'password123' : '',
      phone: '',
      designation: defaultRole === 'admin' ? 'System Administrator' : 'Staff Employee',
      avatarUrl: defaultRole === 'admin' ? PRESET_AVATARS[0] : PRESET_AVATARS[1],
      bio: '',
      assignedCardId: '',
      status: 'active',
    });
    setShowAddModal(true);
  };

  // Handle Add User / Employee
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newUser.name.trim()) {
      setFormError('Please enter full name.');
      return;
    }

    if (newUser.role === 'admin' && !newUser.password.trim()) {
      setFormError('Please provide a password for the Administrator account.');
      return;
    }

    const emailTrimmed = newUser.email.trim();
    if (emailTrimmed && members.some((m) => m.email.toLowerCase() === emailTrimmed.toLowerCase())) {
      setFormError('An account with this email address already exists.');
      return;
    }

    const finalEmail = emailTrimmed
      ? emailTrimmed.toLowerCase()
      : `${newUser.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}@employee.link`;

    onAddMember({
      name: newUser.name.trim(),
      email: finalEmail,
      role: newUser.role,
      companyId: newUser.companyId || undefined,
      password: newUser.role === 'admin' ? newUser.password.trim() : undefined,
      phone: newUser.phone.trim() || undefined,
      designation: newUser.designation.trim() || undefined,
      avatarUrl: newUser.avatarUrl || undefined,
      bio: newUser.bio.trim() || undefined,
      status: newUser.status,
      assignedCardId: newUser.assignedCardId || undefined,
    });

    setShowAddModal(false);
    showToast(
      newUser.role === 'admin'
        ? `Administrator "${newUser.name}" created with management access.`
        : `Employee "${newUser.name}" onboarded. Personal smart card link ready.`
    );
  };

  // Open Edit Profile Modal
  const handleStartEdit = (user: User) => {
    setFormError('');
    setEditingUser(user);
    setEditFormData({ ...user });
  };

  // Handle Save Edit Profile
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!editFormData || !editFormData.name.trim() || !editFormData.email.trim()) {
      setFormError('Name and Email are required.');
      return;
    }

    // Safeguard: Ensure at least one admin exists
    if (editFormData.role !== 'admin' && editingUser?.role === 'admin') {
      const remainingAdmins = members.filter((m) => m.id !== editFormData.id && m.role === 'admin');
      if (remainingAdmins.length === 0) {
        setFormError('Cannot demote this user. The platform must have at least one active Admin.');
        return;
      }
    }

    onUpdateUser({
      ...editFormData,
      name: editFormData.name.trim(),
      email: editFormData.email.toLowerCase().trim(),
      updatedAt: new Date().toISOString(),
    });

    setEditingUser(null);
    setEditFormData(null);
    showToast(`Profile for "${editFormData.name}" updated successfully.`);
  };

  // Handle Save Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordModal || !resetPasswordVal.trim()) return;

    onUpdateMemberPassword(showPasswordModal.id, resetPasswordVal.trim());
    setShowPasswordModal(null);
    setResetPasswordVal('');
    showToast(`Password successfully updated for ${showPasswordModal.name}.`);
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    if (roleFilter === 'admin' && m.role !== 'admin') return false;
    if (roleFilter === 'employee' && m.role === 'admin') return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (companyFilter !== 'all') {
      const assignedCard = cards.find((c) => c.id === m.assignedCardId);
      const mCompanyId = m.companyId || assignedCard?.companyId;
      if (mCompanyId !== companyFilter) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalAdmins = members.filter((m) => m.role === 'admin').length;
  const totalEmployees = members.filter((m) => m.role !== 'admin').length;

  return (
    <div className={`max-w-6xl mx-auto p-3 sm:p-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Top Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} mb-6`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Employees & Admin Directory
              </h2>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Companies can have multiple employees. Employees access and share cards via direct links (no logins needed).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Issue Card, Bulk Allocate, Add Admin & Add Employee */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {onOpenBulkAllocateModal && (
            <button
              onClick={() => onOpenBulkAllocateModal()}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all flex-1 sm:flex-initial cursor-pointer"
              title="Allocate company smart cards to multiple employees simultaneously"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Bulk Allocate Cards</span>
            </button>
          )}

          {onOpenIssueCardModal && (
            <button
              onClick={() => onOpenIssueCardModal()}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/20 transition-all flex-1 sm:flex-initial cursor-pointer"
              title="Issue a personalized digital card link to an employee"
            >
              <CreditCard className="w-4 h-4" />
              <span>Issue Employee Card</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAdd('employee')}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            } border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial cursor-pointer`}
            title="Add an employee profile (link-based, no login required)"
          >
            <UserPlus className="w-4 h-4 text-sky-500" />
            <span>Add Employee</span>
          </button>

          <button
            onClick={() => handleOpenAdd('admin')}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            } border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial cursor-pointer`}
            title="Create administrator account with login credentials"
          >
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            key="admin-notification-toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 w-full">
        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1 p-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border rounded-xl text-xs font-semibold overflow-x-auto w-full sm:w-auto`}>
            <button
              onClick={() => setRoleFilter('all')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                roleFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Personnel ({members.length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                roleFilter === 'admin' ? 'bg-amber-500 text-slate-950 font-bold' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admins ({totalAdmins})</span>
            </button>
            <button
              onClick={() => setRoleFilter('employee')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                roleFilter === 'employee' ? 'bg-amber-500 text-slate-950 font-bold' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Employees ({totalEmployees})</span>
            </button>
          </div>

          {/* Company Filter Dropdown */}
          {companies && companies.length > 0 && (
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
              } focus:outline-none focus:border-amber-500`}
            >
              <option value="all">All Companies ({companies.length})</option>
              {companies.map((c, cIdx) => (
                <option key={`adm-comp-${c.id}-${cIdx}`} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-amber-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 shadow-sm'
            } border text-xs focus:outline-none transition-colors`}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MOBILE CARDS VIEW (md:hidden) - Zero Overflow, High Touch Ergonomics */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-3">
        {filteredMembers.map((user, uIdx) => {
          const assignedCard =
            cards.find((c) => c.id === user.assignedCardId) ||
            cards.find((c) => c.assignedMemberId === user.id) ||
            (user.name ? cards.find((c) => c.contactPersonName && c.contactPersonName.toLowerCase().trim() === user.name.toLowerCase().trim()) : undefined);
          const isAdmin = user.role === 'admin';
          const userCompanyId = user.companyId || assignedCard?.companyId;
          const userCompany = companies.find((c) => c.id === userCompanyId);

          return (
            <div
              key={`member-card-${user.id}-${uIdx}`}
              className={`p-4 rounded-2xl ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              } border space-y-3`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl || undefined} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-amber-400 bg-slate-900">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="absolute bottom-0 right-0 p-0.5 bg-amber-500 text-slate-950 rounded-tl">
                        <Shield className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
                        {user.name}
                      </h4>
                      {user.id === currentUserId && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-mono font-bold shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate font-mono`}>
                      {user.email}
                    </p>
                    {userCompany && (
                      <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 mt-0.5 truncate">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{userCompany.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    isAdmin
                      ? isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      : isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {isAdmin ? <Shield className="w-3 h-3 text-amber-500" /> : <UserCheck className="w-3 h-3 text-sky-500" />}
                  <span>{isAdmin ? 'Admin' : 'Employee'}</span>
                </span>
              </div>

              {/* Designation & Assigned Card */}
              <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'} border space-y-2 text-xs`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Designation</span>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'} truncate max-w-[180px]`}>
                    {user.designation || (isAdmin ? 'Operations / Admin' : 'Staff Employee')}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Smart Card</span>
                    {isAdmin ? (
                      <span className="text-amber-500 font-medium text-[11px]">Full System Access</span>
                    ) : assignedCard ? (
                      <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'} truncate max-w-[180px]`}>
                        {assignedCard.businessName}
                      </span>
                    ) : (
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} italic`}>Unassigned</span>
                    )}
                  </div>

                  {!isAdmin && (
                    <div className="flex flex-wrap items-center gap-1.5 justify-start sm:justify-between w-full mt-1.5" onClick={(e) => e.stopPropagation()}>
                      {assignedCard ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setShareCardUser(user);
                              setShareCardObj(assignedCard);
                            }}
                            className="flex-1 min-w-[70px] min-h-[34px] px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </button>

                          {onEditCard && (
                            <button
                              type="button"
                              onClick={() => onEditCard(assignedCard)}
                              className={`px-2 py-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} border border-slate-700 text-[10px] font-semibold transition-colors flex items-center gap-0.5 cursor-pointer shrink-0`}
                              title="Edit Card branding and action buttons"
                            >
                              <Edit className="w-3 h-3 text-sky-400" />
                              <span>Edit</span>
                            </button>
                          )}

                          {onSelectEmployeeForPreview && (
                            <button
                              type="button"
                              onClick={() => onSelectEmployeeForPreview(user)}
                              className={`px-2 py-1.5 rounded-lg ${
                                isDark ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border-amber-500/30' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                              } border text-[10px] font-bold transition-colors flex items-center gap-0.5 cursor-pointer shrink-0`}
                              title={`Preview ${user.name}'s card in simulator`}
                            >
                              <Eye className="w-3 h-3 text-amber-400" />
                              <span>Simulate</span>
                            </button>
                          )}

                          {onPreviewCard && (
                            <button
                              type="button"
                              onClick={() => onPreviewCard(assignedCard)}
                              className={`px-2 py-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} border border-slate-700 text-[10px] font-semibold transition-colors flex items-center gap-0.5 cursor-pointer shrink-0`}
                              title="Fullscreen Preview card"
                            >
                              <ExternalLink className="w-3 h-3 text-emerald-400" />
                              <span>Live</span>
                            </button>
                          )}

                          {onDeleteCard && (
                            <button
                              type="button"
                              onClick={() => onDeleteCard(assignedCard.id)}
                              className={`px-2 py-1.5 rounded-lg ${isDark ? 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border-red-800/40' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'} border text-[10px] font-semibold transition-colors flex items-center gap-0.5 cursor-pointer shrink-0`}
                              title="Delete this smart card"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                              <span>Delete</span>
                            </button>
                          )}
                        </>
                      ) : (
                        onOpenIssueCardModal && (
                          <button
                            type="button"
                            onClick={() => onOpenIssueCardModal(user)}
                            className="w-full min-h-[34px] px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                            <span>Issue Smart Card Now</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleStartEdit(user)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  } border text-xs font-semibold flex items-center gap-1.5 transition-colors`}
                >
                  <Edit className="w-3.5 h-3.5 text-sky-500" />
                  <span>Edit</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowPasswordModal(user);
                      setResetPasswordVal(user.password || 'password123');
                    }}
                    className={`min-h-[38px] min-w-[38px] p-2 rounded-xl ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    } border flex items-center justify-center transition-colors`}
                    title="Assign Admin Password"
                    aria-label="Set admin password"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                )}

                {user.id !== currentUserId && (
                  <button
                    onClick={() => setUserToDelete(user)}
                    className={`min-h-[38px] min-w-[38px] p-2 rounded-xl ${
                      isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                    } flex items-center justify-center transition-colors`}
                    title="Remove Profile"
                    aria-label="Delete user profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP TABLE VIEW (hidden md:block) - Clean, Unboxed & Balanced */}
      {/* ========================================================================= */}
      <div className={`hidden md:block rounded-2xl ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      } border overflow-hidden`}>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`${isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'} border-b font-bold uppercase tracking-wider text-[10px]`}>
                <th className="py-3 px-4">Profile / Contact</th>
                <th className="py-3 px-4">Access Role</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Assigned Smart Card</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200/80'}`}>
              {filteredMembers.map((user, uIdx) => {
                const assignedCard =
                  cards.find((c) => c.id === user.assignedCardId) ||
                  cards.find((c) => c.assignedMemberId === user.id) ||
                  (user.name ? cards.find((c) => c.contactPersonName && c.contactPersonName.toLowerCase().trim() === user.name.toLowerCase().trim()) : undefined);
                const isAdmin = user.role === 'admin';
                const userCompanyId = user.companyId || assignedCard?.companyId;
                const userCompany = companies.find((c) => c.id === userCompanyId);

                return (
                  <tr key={`member-row-${user.id}-${uIdx}`} className={`${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'} transition-colors`}>
                    {/* Avatar & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl || undefined} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-amber-500 bg-slate-900">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          {isAdmin && (
                            <div className="absolute bottom-0 right-0 p-0.5 bg-amber-500 text-slate-950 rounded-tl">
                              <Shield className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-xs flex items-center gap-1.5`}>
                            <span>{user.name}</span>
                            {user.id === currentUserId && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-mono font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono mt-0.5`}>
                            {user.email}
                          </div>
                          {userCompany && (
                            <div className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 mt-0.5 truncate">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">{userCompany.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          isAdmin
                            ? isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isAdmin ? <Shield className="w-3.5 h-3.5 text-amber-500" /> : <UserCheck className="w-3.5 h-3.5 text-sky-500" />}
                        <span>{isAdmin ? 'Administrator' : 'Team Member'}</span>
                      </span>
                    </td>

                    {/* Designation */}
                    <td className="py-3.5 px-4">
                      <div className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'} font-semibold truncate max-w-[160px]`}>
                        {user.designation || (isAdmin ? 'Operations / Admin' : 'Team Member')}
                      </div>
                      {user.bio && (
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} line-clamp-1 mt-0.5 max-w-[180px]`}>
                          {user.bio}
                        </div>
                      )}
                    </td>

                    {/* Assigned Smart Card */}
                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <div className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Full Control (All Cards)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={user.assignedCardId || ''}
                            onChange={(e) => onAssignCard(user.id, e.target.value || undefined)}
                            aria-label={`Assign card to ${user.name}`}
                            className={`min-h-[34px] ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                            } border rounded-lg px-2.5 py-1 text-xs max-w-[170px] truncate focus:outline-none focus:border-amber-500`}
                          >
                            <option value="">-- No Card Assigned --</option>
                            {cards.map((c, cIdx) => (
                              <option key={`card-opt-${c.id}-${cIdx}`} value={c.id}>
                                {c.businessName}
                              </option>
                            ))}
                          </select>
                          {onOpenAllocateModal && (
                            <button
                              type="button"
                              onClick={() => onOpenAllocateModal(user.assignedCardId)}
                              className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 transition-colors"
                              title="Detailed Card Allocation"
                              aria-label="Open allocation modal"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.status === 'active'
                            ? isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-emerald-400' : 'bg-slate-400'
                          }`}
                        />
                        {user.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isAdmin && (
                          <div className="flex items-center gap-1 mr-1 border-r border-slate-700/50 pr-2">
                            {onSelectEmployeeForPreview && (
                              <button
                                type="button"
                                onClick={() => onSelectEmployeeForPreview(user)}
                                className={`px-2 py-1 rounded-lg ${
                                  isDark ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                } text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer`}
                                title={`Simulate & Preview ${user.name}'s unique smart card`}
                              >
                                <Eye className="w-3 h-3 text-amber-400" />
                                <span>Preview Card</span>
                              </button>
                            )}

                            {assignedCard && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShareCardUser(user);
                                    setShareCardObj(assignedCard);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                  title="Share employee smart card"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>Share</span>
                                </button>

                                {onEditCard && (
                                  <button
                                    type="button"
                                    onClick={() => onEditCard(assignedCard)}
                                    className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'} transition-colors cursor-pointer`}
                                    title="Edit Smart Card design & branding"
                                  >
                                    <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                                  </button>
                                )}

                                {onPreviewCard && (
                                  <button
                                    type="button"
                                    onClick={() => onPreviewCard(assignedCard)}
                                    className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'} transition-colors cursor-pointer`}
                                    title="Open Live Card Fullscreen Preview"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                                  </button>
                                )}

                                {onDeleteCard && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteCard(assignedCard.id)}
                                    className={`p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'} transition-colors cursor-pointer`}
                                    title="Delete Smart Card"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {!isAdmin && !assignedCard && onOpenIssueCardModal && (
                          <button
                            type="button"
                            onClick={() => onOpenIssueCardModal(user)}
                            className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer mr-2"
                            title="Generate smart card for employee"
                          >
                            <Plus className="w-3 h-3 text-amber-500" />
                            <span>Issue Card</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleStartEdit(user)}
                          title="Edit Profile"
                          className={`px-2.5 py-1.5 rounded-lg ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                          } text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer`}
                        >
                          <Edit className="w-3 h-3 text-sky-500" />
                          <span>Edit</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setShowPasswordModal(user);
                              setResetPasswordVal(user.password || 'password123');
                            }}
                            title="Set Admin Password"
                            aria-label="Set user password"
                            className={`p-1.5 rounded-lg ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            } transition-colors cursor-pointer`}
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        )}

                        {user.id !== currentUserId && (
                          <button
                            onClick={() => setUserToDelete(user)}
                            title="Remove Profile"
                            aria-label="Delete user profile"
                            className={`p-1.5 rounded-lg ${
                              isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            } transition-colors cursor-pointer`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD NEW USER (ADMIN OR MEMBER) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <div key="admin-add-user-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75">
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`w-full max-w-lg rounded-2xl ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              } border p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto`}
            >
              <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  {newUser.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-amber-500" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-amber-500" />
                  )}
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {newUser.role === 'admin' ? 'Add New Administrator' : 'Add New Team Member Profile'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* In-form error message */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Role Switcher */}
                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1.5`}>
                    Account Access Role *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        newUser.role === 'admin'
                          ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50'
                          : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Shield className={`w-4 h-4 mt-0.5 shrink-0 ${newUser.role === 'admin' ? 'text-amber-500' : 'text-slate-400'}`} />
                      <div>
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>System Admin</div>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                          Full card creation, editing, and management access with password login.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: 'employee' })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        newUser.role === 'employee'
                          ? 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-500/50'
                          : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <UserCheck className={`w-4 h-4 mt-0.5 shrink-0 ${newUser.role === 'employee' ? 'text-sky-500' : 'text-slate-400'}`} />
                      <div>
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Team Member (Link Only)</div>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                          No login needed. Receives unique card link, direct client sharing via WhatsApp & QR.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Company Affiliation */}
                {companies && companies.length > 0 && (
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Company Affiliation {newUser.role !== 'admin' && '*'}
                    </label>
                    <select
                      value={newUser.companyId || ''}
                      onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    >
                      <option value="">-- Select Company Affiliation --</option>
                      {companies.map((c, cIdx) => (
                        <option key={`new-comp-${c.id}-${cIdx}`} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                      Companies can have multiple team members. Team members access profile via link only.
                    </p>
                  </div>
                )}

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sipho Ndlovu"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Email Address {newUser.role === 'admin' ? '*' : '(For card link delivery)'}
                    </label>
                    <input
                      type="email"
                      required={newUser.role === 'admin'}
                      placeholder="sipho@example.co.za"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>
                </div>

                {/* Password only for Administrator vs Link-Only Info for Employee */}
                {newUser.role === 'admin' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                        Admin Login Password *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="password123"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        } border text-xs font-mono focus:outline-none focus:border-amber-500`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                        Contact Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="+27 82 123 4567"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        } border text-xs focus:outline-none focus:border-amber-500`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-sky-950/40 border-sky-800/60' : 'bg-sky-50 border-sky-200'} border flex items-start gap-2.5 text-xs`}>
                      <LinkIcon className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <div className={`font-bold ${isDark ? 'text-sky-300' : 'text-sky-900'}`}>
                          No Login Required (Direct Card Link Only)
                        </div>
                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>
                          Team members do not need a login password. They share and showcase their card using their direct web link or QR code.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                        Contact Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="+27 82 123 4567"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        } border text-xs focus:outline-none focus:border-amber-500`}
                      />
                    </div>
                  </div>
                )}

                {/* Designation & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Designation / Role Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Operations Manager"
                      value={newUser.designation}
                      onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Account Status
                    </label>
                    <select
                      value={newUser.status}
                      onChange={(e) => setNewUser({ ...newUser, status: e.target.value as 'active' | 'paused' })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    >
                      <option value="active">🟢 Active</option>
                      <option value="paused">🟡 Paused</option>
                    </select>
                  </div>
                </div>

                {/* Real Photo Upload & Camera Capture */}
                <AvatarUploadField
                  value={newUser.avatarUrl}
                  onChange={(url) => setNewUser({ ...newUser, avatarUrl: url })}
                  label="Profile Avatar Photo"
                  helperText="Upload a real photo, take a camera snapshot, or select a preset."
                  presetAvatars={PRESET_AVATARS}
                />

                {/* Assign Card (if Employee) */}
                {newUser.role !== 'admin' && (
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Assign Smart Card Link (Optional)
                    </label>
                    <select
                      value={newUser.assignedCardId}
                      onChange={(e) => setNewUser({ ...newUser, assignedCardId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    >
                      <option value="">-- Assign Later --</option>
                      {cards.map((c, cIdx) => (
                        <option key={`new-card-${c.id}-${cIdx}`} value={c.id}>
                          {c.businessName} ({c.contactPersonName || c.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Bio / Description */}
                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                    Internal Notes / Bio
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of responsibilities or department..."
                    value={newUser.bio}
                    onChange={(e) => setNewUser({ ...newUser, bio: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border text-xs focus:outline-none focus:border-amber-500 resize-none`}
                  />
                </div>

                {/* Submit Actions */}
                <div className={`flex items-center justify-end gap-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    } text-xs font-semibold`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Create Profile</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 2: EDIT EXISTING PROFILE (ADMIN OR MEMBER) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {editingUser && editFormData && (
          <div key="admin-edit-user-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75">
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`w-full max-w-lg rounded-2xl ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              } border p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto`}
            >
              <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" />
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Edit Profile: {editingUser.name}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setEditFormData(null);
                  }}
                  className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* In-form error message */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Role Switcher */}
                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1.5`}>
                    Account Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, role: 'admin' })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        editFormData.role === 'admin'
                          ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50'
                          : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Shield className={`w-4 h-4 mt-0.5 shrink-0 ${editFormData.role === 'admin' ? 'text-amber-500' : 'text-slate-400'}`} />
                      <div>
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Administrator</div>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Full admin privileges</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, role: 'employee' })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        editFormData.role === 'employee'
                          ? 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-500/50'
                          : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <UserCheck className={`w-4 h-4 mt-0.5 shrink-0 ${editFormData.role === 'employee' ? 'text-sky-500' : 'text-slate-400'}`} />
                      <div>
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Team Member (Link Only)</div>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Access via direct card link</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Company Affiliation */}
                {companies && companies.length > 0 && (
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Company Affiliation
                    </label>
                    <select
                      value={editFormData.companyId || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, companyId: e.target.value || undefined })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    >
                      <option value="">-- No Specific Company --</option>
                      {companies.map((c, cIdx) => (
                        <option key={`edit-comp-${c.id}-${cIdx}`} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>
                </div>

                {/* Phone & Designation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="+27 82 123 4567"
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Designation / Role Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.designation || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                      placeholder="e.g. Managing Partner"
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>
                </div>

                {/* Status & Card Assignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'active' | 'paused' })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    >
                      <option value="active">🟢 Active</option>
                      <option value="paused">🟡 Paused</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Assigned Card
                    </label>
                    {editFormData.role === 'admin' ? (
                      <div className={`px-3 py-2 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-700'} border text-xs font-medium`}>
                        Admin has access to all cards
                      </div>
                    ) : (
                      <select
                        value={editFormData.assignedCardId || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, assignedCardId: e.target.value || undefined })}
                        className={`w-full px-3 py-2 rounded-xl ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        } border text-xs focus:outline-none focus:border-amber-500`}
                      >
                        <option value="">-- No Card Assigned --</option>
                        {cards.map((c, cIdx) => (
                          <option key={`edit-card-${c.id}-${cIdx}`} value={c.id}>
                            {c.businessName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Password field only for administrator */}
                {editFormData.role === 'admin' ? (
                  <div>
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                      Admin Password (Optional update)
                    </label>
                    <input
                      type="text"
                      value={editFormData.password || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border text-xs font-mono focus:outline-none focus:border-amber-500`}
                    />
                  </div>
                ) : (
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-sky-950/40 border-sky-800/60' : 'bg-sky-50 border-sky-200'} border flex items-center gap-2 text-xs`}>
                    <LinkIcon className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      Team members do not have login credentials; they access and share their digital card directly via link.
                    </span>
                  </div>
                )}

                {/* Real Photo Upload & Camera Capture */}
                <AvatarUploadField
                  value={editFormData.avatarUrl || ''}
                  onChange={(url) => setEditFormData({ ...editFormData, avatarUrl: url })}
                  label="Profile Avatar Photo"
                  helperText="Upload a real photo, take a camera snapshot, or select a preset."
                  presetAvatars={PRESET_AVATARS}
                />

                {/* Bio / Description */}
                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                    Bio / Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.bio || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } border text-xs focus:outline-none focus:border-amber-500 resize-none`}
                  />
                </div>

                {/* Submit Actions */}
                <div className={`flex items-center justify-end gap-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setEditFormData(null);
                    }}
                    className={`min-h-[40px] px-4 py-2 rounded-xl ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    } text-xs font-semibold`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 3: QUICK SET PASSWORD */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showPasswordModal && (
          <div key="admin-password-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75">
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`w-full max-w-sm rounded-2xl ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              } border p-5 sm:p-6`}
            >
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2 mb-1`}>
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>Assign Password</span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-4`}>
                Update credentials for <strong>{showPasswordModal.name}</strong> ({showPasswordModal.email}).
              </p>

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                    New Password
                  </label>
                  <input
                    type="text"
                    required
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } border text-xs font-mono focus:outline-none focus:border-amber-500`}
                  />
                </div>

                <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(null)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    } text-xs font-semibold`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 4: PROFESSIONAL CONFIRMATION FOR PROFILE DELETION */}
      {/* ========================================================= */}
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) {
            onDeleteMember(userToDelete.id);
            setUserToDelete(null);
          }
        }}
        title={`Remove ${userToDelete?.role === 'admin' ? 'Administrator' : 'Team Member'} Profile?`}
        message={userToDelete?.role === 'admin' ? "Are you sure you want to delete this administrator account? They will lose access to system management." : "Are you sure you want to delete this team member? Their profile and card link will be removed."}
        highlightText={userToDelete ? `${userToDelete.name} · ${userToDelete.email}` : ''}
        confirmLabel="Remove User"
        cancelLabel="Keep User"
        type="danger"
      />

      {/* ========================================================= */}
      {/* MODAL 5: GORGEOUS SHARE CARD HUB */}
      {/* ========================================================= */}
      <AnimatePresence>
        {shareCardUser && shareCardObj && (
          <div key="admin-share-card-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`w-full max-w-2xl rounded-2xl sm:rounded-3xl ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              } border shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col`}
            >
              {/* Header */}
              <div className={`p-4 sm:p-5 border-b ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                      <span>Smart Card Distribution Hub</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        Live & Active
                      </span>
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Share and manage the active web link for {shareCardUser.name}.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShareCardUser(null);
                    setShareCardObj(null);
                  }}
                  className={`p-1.5 rounded-xl ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'} transition-colors cursor-pointer`}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                {/* Employee Row Badge */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'} border`}>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                      {shareCardUser.avatarUrl ? (
                        <img src={shareCardUser.avatarUrl || undefined} alt={shareCardUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-amber-500 bg-slate-900">
                          {shareCardUser.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {shareCardUser.name}
                      </h4>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} font-semibold text-amber-500 mt-0.5`}>
                        {shareCardUser.designation || 'Team Member'}
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-mono`}>
                        {shareCardUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onPreviewCard && (
                      <button
                        onClick={() => {
                          onPreviewCard(shareCardObj);
                          setShareCardUser(null);
                          setShareCardObj(null);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Open interactive preview"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span>Test Link</span>
                      </button>
                    )}
                    {onEditCard && (
                      <button
                        onClick={() => {
                          onEditCard(shareCardObj);
                          setShareCardUser(null);
                          setShareCardObj(null);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Edit smart card layout"
                      >
                        <Edit className="w-3.5 h-3.5 text-sky-400" />
                        <span>Edit Card</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Link Section */}
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Web Link (Card URL)</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Routing Active</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/card/${shareCardObj.slug}`}
                      className={`flex-1 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      } px-3 py-2.5 rounded-xl text-xs font-mono border select-all focus:outline-none`}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/card/${shareCardObj.slug}`);
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 2000);
                      }}
                      className="min-h-[38px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-colors cursor-pointer"
                    >
                      {shareCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{shareCopied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>

                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                    This unique address can be pinned to smartphones, added to social profiles, or printed on physical cards. Links resolve instantly on all mobile and desktop browsers.
                  </p>
                </div>

                {/* Channels & QR */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Share buttons */}
                  <div className="md:col-span-6 space-y-3 flex flex-col justify-center">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">
                      Instant Distribution Channels
                    </span>

                    <button
                      onClick={() => {
                        const msg = encodeURIComponent(
                          `Hi ${shareCardUser.name}, here is your official digital smart business card link:\n\n🔗 ${window.location.origin}/card/${shareCardObj.slug}\n\nYou can share this with clients via WhatsApp, email, or social media. Bookmark it on your phone for easy access!`
                        );
                        const cleanPhone = (shareCardUser.phone || '').replace(/[^0-9]/g, '');
                        if (cleanPhone) {
                          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                        } else {
                          window.open(`https://wa.me/?text=${msg}`, '_blank');
                        }
                      }}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Send to {shareCardUser.name} via WhatsApp</span>
                    </button>

                    <button
                      onClick={() => {
                        const subject = encodeURIComponent(`Your Official Digital Smart Business Card Link`);
                        const body = encodeURIComponent(
                          `Hi ${shareCardUser.name},\n\nYour official digital smart business card link is active and ready to use:\n\n🔗 ${window.location.origin}/card/${shareCardObj.slug}\n\nPosition: ${shareCardUser.designation || 'Team Member'}\n\nYou can bookmark this link on your smartphone's home screen or paste it into your email signature.\n\nKind regards,\nCompany Administration`
                        );
                        window.open(`mailto:${shareCardUser.email}?subject=${subject}&body=${body}`, '_blank');
                      }}
                      className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl ${
                        isDark ? 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      } font-bold text-xs flex items-center justify-center gap-2 border transition-colors cursor-pointer`}
                    >
                      <Mail className="w-4 h-4 text-sky-500" />
                      <span>Email Card Link directly</span>
                    </button>
                  </div>

                  {/* QR code */}
                  <div className={`md:col-span-6 p-4 rounded-2xl ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between gap-4`}>
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 bg-white rounded-xl shrink-0 shadow-sm animate-fade-in">
                        <QRCodeSVG id="share-qr-svg" value={`${window.location.origin}/card/${shareCardObj.slug}`} size={84} />
                      </div>
                      <div>
                        <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5`}>
                          <QrCode className="w-3.5 h-3.5 text-amber-500" />
                          <span>Insta QR Code</span>
                        </h5>
                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5 leading-snug`}>
                          Scan directly with smartphone camera. SVG format ready for badges, emails, and signatures.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const svgEl = document.getElementById('share-qr-svg');
                        if (!svgEl) return;
                        const serializer = new XMLSerializer();
                        const source = serializer.serializeToString(svgEl);
                        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${shareCardObj.slug}-qr.svg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      title="Download QR code SVG"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'} flex items-center justify-end shrink-0`}>
                <button
                  type="button"
                  onClick={() => {
                    setShareCardUser(null);
                    setShareCardObj(null);
                  }}
                  className="min-h-[40px] px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Close Share Hub
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
