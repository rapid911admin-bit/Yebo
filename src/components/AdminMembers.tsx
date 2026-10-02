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
} from 'lucide-react';
import { BusinessCard, User, UserRole } from '../types';
import { AvatarUploadField } from './AvatarUploadField';

interface AdminMembersProps {
  members: User[];
  cards: BusinessCard[];
  currentUserId?: string;
  onAddMember: (member: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (user: User) => void;
  onUpdateMemberPassword: (userId: string, newPassword: string) => void;
  onAssignCard: (userId: string, cardId: string | undefined) => void;
  onDeleteMember: (userId: string) => void;
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
  currentUserId,
  onAddMember,
  onUpdateUser,
  onUpdateMemberPassword,
  onAssignCard,
  onDeleteMember,
}) => {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Add User Form State
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: UserRole;
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
    role: 'member',
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
  const handleOpenAdd = (defaultRole: UserRole = 'member') => {
    setNewUser({
      name: '',
      email: '',
      role: defaultRole,
      password: 'password123',
      phone: '',
      designation: defaultRole === 'admin' ? 'System Administrator' : 'Card Member',
      avatarUrl: defaultRole === 'admin' ? PRESET_AVATARS[0] : PRESET_AVATARS[1],
      bio: '',
      assignedCardId: '',
      status: 'active',
    });
    setShowAddModal(true);
  };

  // Handle Add User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      alert('Please fill in required fields: Name, Email, and Password.');
      return;
    }

    // Check duplicate email
    if (members.some((m) => m.email.toLowerCase() === newUser.email.toLowerCase().trim())) {
      alert('An account with this email already exists.');
      return;
    }

    onAddMember({
      name: newUser.name.trim(),
      email: newUser.email.toLowerCase().trim(),
      role: newUser.role,
      password: newUser.password.trim(),
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
        ? `Admin user "${newUser.name}" created with full management rights!`
        : `Member "${newUser.name}" onboarded directly.`
    );
  };

  // Open Edit Profile Modal
  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({ ...user });
  };

  // Handle Save Edit Profile
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !editFormData.name.trim() || !editFormData.email.trim()) {
      alert('Name and Email are required.');
      return;
    }

    // Safeguard: Ensure at least one admin exists
    if (editFormData.role === 'member' && editingUser?.role === 'admin') {
      const remainingAdmins = members.filter((m) => m.id !== editFormData.id && m.role === 'admin');
      if (remainingAdmins.length === 0) {
        alert('Cannot demote this user. The system must have at least one active Admin.');
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
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
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
  const totalMembers = members.filter((m) => m.role === 'member').length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                User Profiles & Admin Access Control
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Add, edit, or configure administrator credentials, member profiles, and card assignments.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Add Admin & Add Member */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenAdd('admin')}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Add Admin User</span>
          </button>

          <button
            onClick={() => handleOpenAdd('member')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member Profile</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 w-full">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              roleFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Users ({members.length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              roleFilter === 'admin' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admins ({totalAdmins})</span>
          </button>
          <button
            onClick={() => setRoleFilter('member')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              roleFilter === 'member' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Members ({totalMembers})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Profiles Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl w-full">
        {/* Mobile horizontal swipe notice */}
        <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/60 flex md:hidden items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Swipe table horizontally to view actions</span>
          <span className="text-amber-400 font-bold font-mono">⇄</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[650px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Profile / Contact</th>
                <th className="py-3 px-4">Access Role</th>
                <th className="py-3 px-4">Designation / Bio</th>
                <th className="py-3 px-4">Assigned Smart Card</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.map((user) => {
                const assignedCard = cards.find((c) => c.id === user.assignedCardId);
                const isAdmin = user.role === 'admin';

                return (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Avatar & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
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

                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.id === currentUserId && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isAdmin ? <Shield className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-sky-400" />}
                        <span>{isAdmin ? 'Administrator' : 'Member'}</span>
                      </span>
                    </td>

                    {/* Designation / Department */}
                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-200 font-semibold">
                        {user.designation || (isAdmin ? 'Operations / Admin' : 'Standard Member')}
                      </div>
                      {user.bio && (
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 max-w-[180px]">
                          {user.bio}
                        </div>
                      )}
                    </td>

                    {/* Assigned Smart Card */}
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Full Control (All Cards)</span>
                        </div>
                      ) : (
                        <select
                          value={user.assignedCardId || ''}
                          onChange={(e) => onAssignCard(user.id, e.target.value || undefined)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white max-w-[190px] truncate focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- No Card Assigned --</option>
                          {cards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.businessName}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        {user.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Profile Button */}
                        <button
                          onClick={() => handleStartEdit(user)}
                          title="Edit Complete Profile"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3 h-3 text-sky-400" />
                          <span>Edit</span>
                        </button>

                        {/* Set Password Button */}
                        <button
                          onClick={() => {
                            setShowPasswordModal(user);
                            setResetPasswordVal(user.password || 'password123');
                          }}
                          title="Set Password"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Delete User (Prevent deleting last admin or self) */}
                        {user.id !== currentUserId && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove profile "${user.name}"?`)) {
                                onDeleteMember(user.id);
                              }
                            }}
                            title="Remove Profile"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {newUser.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-amber-400" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-amber-400" />
                  )}
                  <h3 className="text-base font-bold text-white">
                    {newUser.role === 'admin' ? 'Add New Administrator' : 'Add New Member Profile'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Account Access Role *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        newUser.role === 'admin'
                          ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Shield className={`w-4 h-4 mt-0.5 shrink-0 ${newUser.role === 'admin' ? 'text-amber-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">System Admin</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Full management: add/edit cards, add admins, manage members & leads.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: 'member' })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        newUser.role === 'member'
                          ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <UserCheck className={`w-4 h-4 mt-0.5 shrink-0 ${newUser.role === 'member' ? 'text-sky-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">Member Profile</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          View assigned smart card, track link visitors, share card & receive leads.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sipho Ndlovu"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="sipho@example.co.za"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Password & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assigned Initial Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="password123"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Contact Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="+27 82 123 4567"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Designation & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Designation / Role Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Operations Manager"
                      value={newUser.designation}
                      onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Account Status
                    </label>
                    <select
                      value={newUser.status}
                      onChange={(e) => setNewUser({ ...newUser, status: e.target.value as 'active' | 'paused' })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
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

                {/* Assign Card (if Member) */}
                {newUser.role === 'member' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assign Smart Card (Optional)
                    </label>
                    <select
                      value={newUser.assignedCardId}
                      onChange={(e) => setNewUser({ ...newUser, assignedCardId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Assign Later --</option>
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.businessName} ({c.contactPersonName || c.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Bio / Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Internal Notes / Bio
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of responsibilities or department..."
                    value={newUser.bio}
                    onChange={(e) => setNewUser({ ...newUser, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    Edit Profile: {editingUser.name}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setEditFormData(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, role: 'admin' })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        editFormData.role === 'admin'
                          ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Shield className={`w-4 h-4 mt-0.5 shrink-0 ${editFormData.role === 'admin' ? 'text-amber-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">Administrator</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Full admin privileges</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, role: 'member' })}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        editFormData.role === 'member'
                          ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <UserCheck className={`w-4 h-4 mt-0.5 shrink-0 ${editFormData.role === 'member' ? 'text-sky-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">Member</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Restricted to card view</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Phone & Designation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="+27 82 123 4567"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Designation / Role Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.designation || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                      placeholder="e.g. Managing Partner"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Status & Card Assignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'active' | 'paused' })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="active">🟢 Active</option>
                      <option value="paused">🟡 Paused</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assigned Card
                    </label>
                    {editFormData.role === 'admin' ? (
                      <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-400 font-medium">
                        Admin has access to all cards
                      </div>
                    ) : (
                      <select
                        value={editFormData.assignedCardId || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, assignedCardId: e.target.value || undefined })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- No Card Assigned --</option>
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.businessName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Password field in profile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password (Optional update)
                  </label>
                  <input
                    type="text"
                    value={editFormData.password || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bio / Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.bio || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setEditFormData(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-amber-400" />
                Assign Password
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Update credentials for <strong>{showPasswordModal.name}</strong> ({showPasswordModal.email}).
              </p>

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="text"
                    required
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
