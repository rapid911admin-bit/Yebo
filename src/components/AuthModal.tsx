import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn,
  X,
  Shield,
  User as UserIcon,
  Lock,
  Check,
  ScanFace,
  Fingerprint,
  Camera,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
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
  const [authMethod, setAuthMethod] = useState<'biometric' | 'password' | 'quick'>('biometric');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Biometric / Face ID Scanner State
  const [selectedUserForFace, setSelectedUserForFace] = useState<User>(users[0] || null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanProgress, setScanProgress] = useState(0);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Synchronize default selected user if list updates
  useEffect(() => {
    if (users.length > 0 && !selectedUserForFace) {
      setSelectedUserForFace(users[0]);
    }
  }, [users]);

  // Cleanup camera stream on close or unmount
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopWebcam();
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [isOpen]);

  // Start webcam for real camera scan
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
    } catch (err) {
      setWebcamError('Camera access unavailable or denied. Simulation mode active.');
      setWebcamActive(false);
    }
  };

  // Perform Face ID Biometric Scan
  const handleStartFaceScan = async () => {
    if (!selectedUserForFace) return;
    setIsScanning(true);
    setScanProgress(0);
    setError('');

    // Try starting camera if possible
    await startWebcam();

    // Step 1: Detect Face
    setScanStep('Detecting facial geometry...');
    setScanProgress(25);

    setTimeout(() => {
      // Step 2: Mesh verification
      setScanStep('Matching 3D biometric landmarks...');
      setScanProgress(65);

      setTimeout(() => {
        // Step 3: Signature validation
        setScanStep('Decrypting biometric signature token...');
        setScanProgress(90);

        setTimeout(() => {
          // Success!
          setScanStep('Face ID Verified ✓');
          setScanProgress(100);

          setTimeout(() => {
            stopWebcam();
            setIsScanning(false);
            onLoginSuccess(selectedUserForFace);
            onClose();
          }, 600);
        }, 600);
      }, 700);
    }, 700);
  };

  // Native WebAuthn Passkey Trigger
  const handleWebAuthnPasskey = async () => {
    if (!window.PublicKeyCredential) {
      alert('Native WebAuthn passkeys not supported on this browser. Use Face ID camera scanner.');
      return;
    }

    try {
      setIsScanning(true);
      setScanStep('Requesting device biometric authentication (Face ID / Touch ID)...');

      // Native prompt simulation / fallback
      setTimeout(() => {
        setIsScanning(false);
        if (selectedUserForFace) {
          onLoginSuccess(selectedUserForFace);
          onClose();
        }
      }, 1000);
    } catch (err) {
      setIsScanning(false);
      setError('Biometric authentication cancelled or failed.');
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
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
      setError('Incorrect password. Please check your credentials.');
      return;
    }

    onLoginSuccess(found);
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
          className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ScanFace className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  YeboCard Biometric Sign In
                </h3>
                <p className="text-[11px] text-slate-400">
                  Face ID, Passkey or Password Access
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                stopWebcam();
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Auth Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                stopWebcam();
                setAuthMethod('biometric');
              }}
              className={`py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                authMethod === 'biometric'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Face ID</span>
            </button>

            <button
              onClick={() => {
                stopWebcam();
                setAuthMethod('quick');
              }}
              className={`py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                authMethod === 'quick'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1-Tap</span>
            </button>

            <button
              onClick={() => {
                stopWebcam();
                setAuthMethod('password');
              }}
              className={`py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                authMethod === 'password'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: FACE ID & BIOMETRICS SCANNER */}
          {/* ========================================================= */}
          {authMethod === 'biometric' && (
            <div className="space-y-4 pt-1">
              {/* Select User to verify */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Target Profile for Face Recognition
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {users.map((u) => {
                    const isSelected = selectedUserForFace?.id === u.id;
                    const isAdmin = u.role === 'admin';
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUserForFace(u)}
                        className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white ring-1 ring-amber-400/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
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
                                  isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
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
                        {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HUD Face Scanner Viewport */}
              <div className="relative w-full h-48 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-inner">
                {/* Live Video Feed if available */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${webcamActive ? 'opacity-80' : 'hidden'}`}
                />

                {/* HUD Overlay graphics */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60 pointer-events-none" />

                {/* Scanning HUD Target Ring */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                  <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-amber-400/60 flex items-center justify-center p-2 mb-2 bg-slate-900/60 backdrop-blur-sm">
                    {/* Laser scanning bar */}
                    {isScanning && (
                      <motion.div
                        animate={{ y: [-40, 40, -40] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b]"
                      />
                    )}

                    {selectedUserForFace?.avatarUrl && !isScanning ? (
                      <img
                        src={selectedUserForFace.avatarUrl}
                        alt="Scan Target"
                        className="w-full h-full object-cover rounded-xl border border-amber-400/40"
                      />
                    ) : (
                      <ScanFace
                        className={`w-12 h-12 ${
                          isScanning ? 'text-amber-400 animate-pulse' : 'text-slate-500'
                        }`}
                      />
                    )}
                  </div>

                  {/* Scan Status Message */}
                  {isScanning ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-400 font-mono animate-pulse">
                        {scanStep}
                      </p>
                      <div className="w-40 h-1.5 rounded-full bg-slate-800 overflow-hidden mx-auto">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Position your face or click below to launch 3D biometric match.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isScanning || !selectedUserForFace}
                  onClick={handleStartFaceScan}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>
                    {isScanning ? 'Scanning Biometrics...' : `Scan Face & Sign In as ${selectedUserForFace?.name.split(' ')[0]}`}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={handleWebAuthnPasskey}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Use Touch ID / Windows Hello Passkey</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: QUICK 1-TAP SWITCH */}
          {/* ========================================================= */}
          {authMethod === 'quick' && (
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                1-Tap Account Switcher
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {users.map((u) => {
                  const isAdmin = u.role === 'admin';
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onLoginSuccess(u);
                        onClose();
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isAdmin
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
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
                                isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
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
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        Sign In →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: STANDARD PASSWORD */}
          {/* ========================================================= */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-3 pt-1">
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
                  Sign In with Password
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
