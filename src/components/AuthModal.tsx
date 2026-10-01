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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4"
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
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Sign-in (1-Tap Simulation)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const zweli = users.find((u) => u.email === 'zweli@msn.com');
                  if (zweli) handleQuickLogin(zweli);
                }}
                className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Zweli Mkhize</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1">
                  Full Admin (zweli@msn.com)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const member = users.find((u) => u.role === 'member');
                  if (member) handleQuickLogin(member);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Member Account</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1">
                  View card & leads
                </span>
              </button>
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
                placeholder="zweli@msn.com"
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
                Default password for seed accounts is <code>password123</code>.
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
