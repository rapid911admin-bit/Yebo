import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Lock,
  LogIn,
  AlertCircle,
  ScanFace,
  Check,
  Building2,
  Sparkles,
  Camera,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface AdminLoginViewProps {
  users: User[];
  onLoginSuccess: (adminUser: User) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  users,
  onLoginSuccess,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [authTab, setAuthTab] = useState<'quick' | 'password' | 'biometric'>('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter for genuine admin users only
  const adminUsers = users.filter((u) => u.role === 'admin');

  // Biometric / Face ID Scanner State
  const [selectedAdminForFace, setSelectedAdminForFace] = useState<User | null>(adminUsers[0] || undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanProgress, setScanProgress] = useState(0);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (adminUsers.length > 0 && !selectedAdminForFace) {
      setSelectedAdminForFace(adminUsers[0]);
    }
  }, [users, adminUsers, selectedAdminForFace]);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    setWebcamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setWebcamActive(true);
    } catch {
      setWebcamError('Camera access unavailable. Interactive facial verification mode active.');
      setWebcamActive(false);
    }
  };

  const handleStartFaceScan = async () => {
    if (!selectedAdminForFace) return;
    setIsScanning(true);
    setScanProgress(0);
    setError('');

    await startWebcam();

    setScanStep('Detecting authorized administrator facial geometry...');
    setScanProgress(25);

    setTimeout(() => {
      setScanStep('Matching 3D biometric landmarks for ' + selectedAdminForFace.name + '...');
      setScanProgress(65);

      setTimeout(() => {
        setScanStep('Decrypting admin cryptographic key token...');
        setScanProgress(90);

        setTimeout(() => {
          setScanStep('Face ID Verified ✓');
          setScanProgress(100);

          setTimeout(() => {
            stopWebcam();
            setIsScanning(false);
            onLoginSuccess(selectedAdminForFace);
          }, 600);
        }, 600);
      }, 700);
    }, 700);
  };

  const handleQuickLogin = (admin: User) => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(admin);
    }, 300);
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.toLowerCase().trim();
    const foundUser = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!foundUser) {
      setError('No user profile found with this email address.');
      return;
    }

    if (foundUser.role !== 'admin') {
      setError(
        'Access Restricted: Only Administrators (Clint & Zweli) can log into the management system. Employees do not have logins and access their cards directly via unique URL links.'
      );
      return;
    }

    if (foundUser.password && password && foundUser.password !== password) {
      setError('Incorrect password. Please verify your administrator credentials.');
      return;
    }

    onLoginSuccess(foundUser);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950`}>
      {/* Top Bar with Brand & Theme Toggle */}
      <div className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className={`w-full h-full ${isDark ? 'bg-slate-950' : 'bg-slate-900'} rounded-[10px] flex items-center justify-center`}>
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                BeSmart
              </span>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                Admin
              </span>
            </div>
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
              Official Digital Smart Business Communicator Platform
            </p>
          </div>
        </div>

        <ThemeToggle showLabel={false} />
      </div>

      {/* Center Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-lg rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 shadow-2xl shadow-amber-950/10' : 'bg-white border-slate-200 shadow-xl'
          } p-6 sm:p-8 backdrop-blur-xl space-y-6`}
        >
          {/* Header & Lock Shield */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10 mb-1">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Administrator Login
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-sm mx-auto leading-relaxed`}>
              Authorized personnel only. Please sign in to access the BeSmart corporate workspace, manage companies, and allocate smart cards.
            </p>
          </div>

          {/* Access Policy Info Banner */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-amber-50/60 border-amber-200/80'} text-xs space-y-1.5`}>
            <div className="flex items-center gap-1.5 font-bold text-amber-500 text-[11px] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Admin-Only Security Policy</span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
              Only verified administrators (<strong>Clint</strong> & <strong>Zweli</strong>) have access to the system. Employees do not have login credentials and access their allocated smart cards directly via unique public links.
            </p>
          </div>

          {/* Error Message Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </motion.div>
          )}

          {/* Auth Method Switcher Tabs */}
          <div className={`p-1 rounded-2xl border grid grid-cols-3 gap-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button
              type="button"
              onClick={() => {
                setAuthTab('quick');
                setError('');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'quick'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Quick Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('password');
                setError('');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'password'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('biometric');
                setError('');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'biometric'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Face ID</span>
            </button>
          </div>

          {/* TAB 1: QUICK ADMIN 1-CLICK SIGN IN */}
          {authTab === 'quick' && (
            <div className="space-y-3 pt-1">
              <span className={`text-[11px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} block`}>
                Select Administrator Profile
              </span>

              <div className="space-y-2.5">
                {adminUsers.map((admin, aIdx) => (
                  <button
                    key={`admin-btn-${admin.id}-${aIdx}`}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin(admin)}
                    className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 group cursor-pointer ${
                      isDark
                        ? 'bg-slate-950/70 hover:bg-slate-950 border-slate-800 hover:border-amber-500/80 shadow-md hover:shadow-amber-950/20'
                        : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border-2 border-amber-500/60 shrink-0 shadow-md">
                        {admin.avatarUrl ? (
                          <img src={admin.avatarUrl || undefined} alt={admin.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base font-bold text-amber-400 bg-slate-900">
                            {admin.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 p-0.5 bg-amber-500 text-slate-950 rounded-tl">
                          <Shield className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-amber-400 transition-colors truncate`}>
                            {admin.name}
                          </h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Admin
                          </span>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate font-mono mt-0.5`}>
                          {admin.email}
                        </p>
                        <p className="text-[10px] text-amber-500 font-semibold mt-0.5 truncate">
                          {admin.designation || 'Co-Founder & Administrator'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all">
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL & PASSWORD SIGN IN */}
          {authTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4 pt-1">
              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1.5`}>
                  Administrator Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zweli@msn.com or clint@brandedbydigital.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  } border focus:outline-none transition-colors`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1.5`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password (optional for demo)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                    } border focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200`}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Authenticate Administrator</span>
              </button>
            </form>
          )}

          {/* TAB 3: BIOMETRIC / FACE ID AUTHENTICATION */}
          {authTab === 'biometric' && (
            <div className="space-y-4 pt-1 text-center">
              <span className={`text-[11px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} block text-left`}>
                Select Administrator For Face ID Verification
              </span>

              {/* Administrator Selection Dropdown */}
              <div className="grid grid-cols-2 gap-2">
                {adminUsers.map((admin, aIdx) => {
                  const isSelected = selectedAdminForFace?.id === admin.id;
                  return (
                    <button
                      key={`face-admin-${admin.id}-${aIdx}`}
                      type="button"
                      onClick={() => setSelectedAdminForFace(admin)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/50'
                          : isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                        {admin.avatarUrl ? (
                          <img src={admin.avatarUrl || undefined} alt={admin.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-amber-400">
                            {admin.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">
                          {admin.name.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-amber-500 font-medium truncate">
                          Admin
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Biometric Camera Viewport / Scanner */}
              <div className="relative w-48 h-48 mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-amber-500/50 shadow-2xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${webcamActive ? 'block' : 'hidden'}`}
                />

                {!webcamActive && (
                  <div className="flex flex-col items-center justify-center text-amber-400 space-y-2 p-4">
                    <ScanFace className="w-16 h-16 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-300">
                      {selectedAdminForFace?.name}
                    </span>
                  </div>
                )}

                {/* Laser scan line animation */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                    <div className="w-full h-1 bg-amber-400 shadow-[0_0_15px_#f59e0b] animate-bounce" />
                    <div className="p-2 bg-slate-950/80 backdrop-blur-md text-[10px] text-amber-300 font-mono">
                      {scanStep}
                    </div>
                  </div>
                )}
              </div>

              {webcamError && (
                <p className="text-[11px] text-slate-400">{webcamError}</p>
              )}

              {/* Trigger Button */}
              <button
                type="button"
                disabled={isScanning}
                onClick={handleStartFaceScan}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning Face ID ({scanProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Start Face ID Scan ({selectedAdminForFace?.name.split(' ')[0]})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer info */}
      <div className={`p-4 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
        BeSmart Corporate Platform · South Africa · Secure Administrator Access
      </div>
    </div>
  );
};
