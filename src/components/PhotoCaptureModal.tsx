import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Upload,
  X,
  Check,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (dataUrl: string) => void;
  currentPhotoUrl?: string;
  title?: string;
}

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoSelected,
  currentPhotoUrl,
  title = 'Upload or Take Profile Picture',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when closing or switching tabs
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setPreviewUrl(null);
      setCameraError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !previewUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, isOpen, previewUrl, facingMode]);

  // Start live webcam stream
  const startCamera = async () => {
    stopCamera();
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        'Unable to access camera directly. You can use your mobile camera or upload from files below.'
      );
      setCameraActive(false);
    }
  };

  // Process and resize image file to optimized square Base64 JPEG (~40KB)
  const processImageFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const targetDim = 512;
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        // Center crop square
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        ctx.drawImage(img, startX, startY, size, size, 0, 0, targetDim, targetDim);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewUrl(compressedDataUrl);
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Capture snapshot from live video
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    const targetDim = 512;
    canvas.width = targetDim;
    canvas.height = targetDim;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera for natural mirror reflection
    if (facingMode === 'user') {
      ctx.translate(targetDim, 0);
      ctx.scale(-1, 1);
    }

    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, targetDim, targetDim);

    const snapshotUrl = canvas.toDataURL('image/jpeg', 0.88);
    stopCamera();
    setPreviewUrl(snapshotUrl);
  };

  const handleApply = () => {
    if (previewUrl) {
      onPhotoSelected(previewUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="text-[11px] text-slate-400">Real camera snapshot or photo upload</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switch Tabs */}
          {!previewUrl && (
            <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'upload'
                    ? 'bg-slate-800 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'camera'
                    ? 'bg-slate-800 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>Take Photo</span>
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-center">
            {previewUrl ? (
              /* Review / Crop Preview */
              <div className="flex flex-col items-center w-full space-y-4">
                <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-amber-500 shadow-2xl ring-4 ring-amber-500/20 bg-slate-950">
                  <img
                    src={previewUrl}
                    alt="Captured preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold text-white flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Photo Ready</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Optimized for high-resolution digital smart cards & profiles.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      if (activeTab === 'camera') startCamera();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake / Choose Another</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Use This Photo</span>
                  </button>
                </div>
              </div>
            ) : activeTab === 'upload' ? (
              /* File Upload View */
              <div className="w-full space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-700 hover:border-amber-500/70 bg-slate-950/50 hover:bg-slate-850/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">
                    Click or Drag to Upload Picture
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Supports JPG, PNG, WEBP from your phone or computer
                  </p>
                  <span className="mt-3 px-3 py-1 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    Browse Photos
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Mobile Camera Direct Button */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Phone Camera Directly</span>
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              /* Live Camera Capture View */
              <div className="w-full flex flex-col items-center space-y-3">
                {cameraError ? (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs text-center space-y-3 w-full">
                    <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                    <p>{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo with Mobile Camera</span>
                    </button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <>
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-slate-700 bg-black shadow-2xl flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${
                          facingMode === 'user' ? 'scale-x-[-1]' : ''
                        }`}
                      />

                      {/* Viewfinder Target Overlay */}
                      <div className="absolute inset-0 border-2 border-white/20 rounded-full pointer-events-none" />
                      <div className="absolute w-32 h-32 border border-dashed border-amber-400/60 rounded-full pointer-events-none" />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      {/* Flip Camera */}
                      <button
                        type="button"
                        onClick={() =>
                          setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
                        }
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                        title="Switch Camera (Front/Rear)"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Flip</span>
                      </button>

                      {/* Shutter Button */}
                      <button
                        type="button"
                        onClick={handleSnapPhoto}
                        className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Snap Photo</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
