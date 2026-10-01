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
} from 'lucide-react';
import { BusinessCard, User } from '../types';

interface AdminMembersProps {
  members: User[];
  cards: BusinessCard[];
  onAddMember: (member: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateMemberPassword: (userId: string, newPassword: string) => void;
  onAssignCard: (userId: string, cardId: string | undefined) => void;
  onDeleteMember: (userId: string) => void;
}

export const AdminMembers: React.FC<AdminMembersProps> = ({
  members,
  cards,
  onAddMember,
  onUpdateMemberPassword,
  onAssignCard,
  onDeleteMember,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Member Form State
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    password: '',
    assignedCardId: '',
    status: 'active' as const,
    role: 'member' as const,
  });

  // Password Reset Modal State
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email || !newMember.password) return;

    onAddMember({
      name: newMember.name,
      email: newMember.email.toLowerCase().trim(),
      password: newMember.password,
      role: 'member',
      status: 'active',
      assignedCardId: newMember.assignedCardId || undefined,
    });

    setNewMember({
      name: '',
      email: '',
      password: '',
      assignedCardId: '',
      status: 'active',
      role: 'member',
    });
    setShowAddModal(false);
    setNotificationMsg('Member onboarded directly! No email verification required.');
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordModal || !resetPasswordVal.trim()) return;

    onUpdateMemberPassword(showPasswordModal.id, resetPasswordVal.trim());
    setShowPasswordModal(null);
    setResetPasswordVal('');
    setNotificationMsg('Password successfully changed for member.');
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Member Management & Onboarding
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Admins onboard staff and business owners with direct credentials (avoiding email delivery issues).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard New Member</span>
        </button>
      </div>

      {/* Notification Banner */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search members by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Members Table / Card List */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Member / Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Smart Card</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.map((member) => {
                const assignedCard = cards.find((c) => c.id === member.assignedCardId);
                const isAdmin = member.role === 'admin';

                return (
                  <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        {member.name}
                        {isAdmin && (
                          <span className="p-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] uppercase font-mono font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {member.email}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isAdmin ? 'bg-amber-950 text-amber-400 border border-amber-800/50' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {isAdmin ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {member.role}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <span className="text-[11px] text-slate-400 italic">Master Access (All Cards)</span>
                      ) : (
                        <select
                          value={member.assignedCardId || ''}
                          onChange={(e) => onAssignCard(member.id, e.target.value || undefined)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white max-w-[200px] truncate focus:outline-none focus:border-amber-500"
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

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setShowPasswordModal(member);
                            setResetPasswordVal(member.password || 'newpass123');
                          }}
                          title="Assign or Reset Password"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <KeyRound className="w-3 h-3 text-amber-400" />
                          <span>Set Password</span>
                        </button>

                        {!isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove member ${member.name}?`)) {
                                onDeleteMember(member.id);
                              }
                            }}
                            title="Remove Member"
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
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

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <UserPlus className="w-5 h-5 text-amber-400" />
                Direct Member Onboarding
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Create an account directly with an assigned password. The member can log in immediately.
              </p>

              <form onSubmit={handleCreateMember} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sipho Ndlovu"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
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
                    placeholder="sipho@contractors.co.za"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assign Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pass@2026"
                    value={newMember.password}
                    onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assign Existing Smart Card (Optional)
                  </label>
                  <select
                    value={newMember.assignedCardId}
                    onChange={(e) => setNewMember({ ...newMember, assignedCardId: e.target.value })}
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
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                  >
                    Complete Onboarding
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set / Reset Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
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
              className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-amber-400" />
                Assign Password
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Update the password for <strong>{showPasswordModal.name}</strong> ({showPasswordModal.email}).
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
