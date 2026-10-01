import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, X, Shield, User as UserIcon, Lock, Check } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!found) {
      setError('No account found with this email.');
      return;
    }

    if (found.password && found.password !== password) {
      setError('Incorrect password. Please verify or ask admin to reset.');
      return;
    }

    onLoginSuccess(found);
    onClose();
  };

  const handleQuickLogin = (targetUser: User) => {
    onLoginSuccess(targetUser);
    onClose();
  };

  if (!isOpen) return null;

  const adminUsers = users.filter((u) => u.role === 'admin');
  const memberUsers = users.filter((u) => u.role === 'member');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <LogIn className="w-5 h-5 text-amber-400" />
              Sign in to YeboCard
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick 1-tap persona selector */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Switch Account ({users.length} registered profiles)
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className={`w-full p-2 rounded-xl border text-left transition-colors flex items-center justify-between ${
                      isAdmin
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                        : 'bg-slate-950/70 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-amber-400">
                            {u.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span
                            className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono font-bold ${
                              isAdmin
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isAdmin ? 'Admin' : 'Member'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {u.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">Switch →</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest">
              Or sign in with email & password
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            {error && (
              <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/60 text-xs text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.co.za"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Default password for initial accounts is <code>password123</code>.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40"
              >
                Sign In
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
