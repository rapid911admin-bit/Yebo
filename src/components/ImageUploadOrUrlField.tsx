import React, { useRef, useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Trash2, Image as ImageIcon, Sparkles, Check, ShieldCheck, AlertCircle, Maximize2, X } from 'lucide-react';
import {
  processImageAt300Dpi,
  calculateEffectiveDpi,
  inject300DpiJpeg,
  ImageQualityInfo,
} from '../utils/imageDpi';

interface PresetItem {
  name?: string;
  url: string;
}

interface ImageUploadOrUrlFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  presets?: PresetItem[];
  placeholderUrl?: string;
}

export const ImageUploadOrUrlField: React.FC<ImageUploadOrUrlFieldProps> = ({
  value,
  onChange,
  label,
  helperText,
  aspectRatio = 'landscape',
  presets,
  placeholderUrl = 'https://...',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const [qualityInfo, setQualityInfo] = useState<ImageQualityInfo | null>(null);
  const [showLightboxModal, setShowLightboxModal] = useState(false);

  // Measure and analyze image dimensions & DPI whenever value changes
  useEffect(() => {
    setUrlInput(value || '');
    if (!value) {
      setQualityInfo(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const type = aspectRatio === 'square' ? 'logo' : 'banner';
      const dpiResult = calculateEffectiveDpi(w, h, type);
      const estFilesizeKb = value.startsWith('data:')
        ? Math.round((value.length * 3) / 4 / 1024)
        : 0;

      setQualityInfo({
        width: w,
        height: h,
        aspectRatio: w / (h || 1),
        dpi: dpiResult.dpi,
        is300Dpi: dpiResult.is300Dpi,
        qualityBadge: dpiResult.qualityBadge,
        qualityLabel: dpiResult.qualityLabel,
        filesizeKb: estFilesizeKb,
      });
    };
    img.onerror = () => {
      setQualityInfo(null);
    };
    img.src = value;
  }, [value, aspectRatio]);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsProcessing(true);
    try {
      const type = aspectRatio === 'square' ? 'logo' : 'banner';
      // Automatically preserve full natural image without cropping, and enforce 300+ DPI
      const result = await processImageAt300Dpi(file, {
        type,
        fitFullImage: true,
        forceSquareCrop: false, // Preserves complete banner image!
        quality: 0.88,
      });

      onChange(result.dataUrl);
      setUrlInput(result.dataUrl);
      setQualityInfo(result.info);
    } catch (err) {
      console.error('Failed to process image at 300 DPI:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    onChange(trimmed);
  };

  // Enhance / upscale an existing image to 300 DPI
  const handleEnhanceTo300Dpi = () => {
    if (!value) return;
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const ratio = origW / (origH || 1);
      const minW = aspectRatio === 'square' ? 600 : 1200;
      const targetW = Math.max(origW, minW);
      const targetH = Math.round(targetW / ratio);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const rawData = canvas.toDataURL('image/jpeg', 0.94);
        const enhanced = inject300DpiJpeg(rawData);
        onChange(enhanced);
        setUrlInput(enhanced);
      }
      setIsProcessing(false);
    };
    img.onerror = () => setIsProcessing(false);
    img.src = value;
  };

  // Preview sizing classes
  const previewAspectClass =
    aspectRatio === 'square'
      ? 'w-18 h-18 rounded-xl'
      : aspectRatio === 'portrait'
      ? 'w-18 h-24 rounded-xl'
      : 'w-28 sm:w-32 h-20 rounded-xl';

  return (
    <div className="space-y-2.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300">
            {label}
          </label>
          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                mode === 'upload'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Upload 300 DPI</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                mode === 'url'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              <span>Web Link URL</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-3 rounded-2xl border transition-all ${
          isDragging
            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Visual Preview Box with Full Image Auto-Fit & Zero Top Cropping */}
          <div className="relative group shrink-0">
            <div
              onClick={() => value && setShowLightboxModal(true)}
              className={`${previewAspectClass} p-1.5 overflow-hidden bg-slate-950 border-2 border-amber-500/50 shadow-md flex items-center justify-center text-slate-400 relative ${
                value ? 'cursor-pointer hover:border-amber-400 transition-colors' : ''
              }`}
              title={value ? 'Click to inspect full 300 DPI image' : 'Full image auto-fit preview'}
            >
              {value ? (
                <>
                  {/* Ambient backdrop */}
                  <img
                    src={value || undefined}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-sm opacity-25 scale-110 pointer-events-none"
                  />
                  {/* Foreground auto-fitted full image with safe margin so top edge is never cut */}
                  <img
                    src={value || undefined}
                    alt="Preview"
                    className="relative max-w-full max-h-full w-auto h-auto object-contain object-center z-10 drop-shadow rounded-sm select-none"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center z-15 opacity-0 group-hover:opacity-100">
                    <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                  </div>
                </>
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-600" />
              )}
            </div>
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setUrlInput('');
                  setQualityInfo(null);
                }}
                className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-900/90 text-red-200 border border-red-700 shadow hover:bg-red-800 transition-colors cursor-pointer z-20"
                title="Remove image"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Interactive Input based on selected Mode */}
          <div className="flex-1 min-w-0">
            {mode === 'upload' ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => fileInputRef.current?.click()}
                    className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isProcessing ? 'Processing at 300 DPI...' : 'Choose Device Image'}</span>
                  </button>

                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    or drag & drop here
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> 300 DPI Auto-Optimization
                  </span>
                  <span>·</span>
                  <span>Full image auto-fits display with zero edge cropping</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onBlur={handleUrlSubmit}
                    placeholder={placeholderUrl}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Paste any direct HTTPS image link or Unsplash photo URL.
                </p>
              </div>
            )}

            {/* 300 DPI Quality Inspection & Resolution Indicator */}
            {qualityInfo && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold ${
                      qualityInfo.dpi >= 300 || qualityInfo.is300Dpi
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>{qualityInfo.dpi >= 300 ? '✓ 300 DPI HD Quality' : `${qualityInfo.dpi} DPI`}</span>
                  </span>
                  <span className="text-slate-400 font-mono">
                    {qualityInfo.width} × {qualityInfo.height} px
                  </span>
                  <span className="text-slate-500 hidden sm:inline">
                    (Auto-Fit Full Image)
                  </span>
                </div>

                {qualityInfo.dpi < 300 && (
                  <button
                    type="button"
                    onClick={handleEnhanceTo300Dpi}
                    disabled={isProcessing}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Upscale and embed 300 DPI headers into image"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Upscale to 300 DPI</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Presets Gallery (if provided) */}
        {presets && presets.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-medium block mb-1.5">
              Or pick from curated 300 DPI styles:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={`preset-style-${preset.name || idx}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(preset.url);
                    setUrlInput(preset.url);
                  }}
                  className={`relative aspect-[3/2] rounded-lg overflow-hidden border-2 transition-all group cursor-pointer ${
                    value === preset.url
                      ? 'border-amber-400 shadow-md shadow-amber-950/50 scale-102 ring-1 ring-amber-400'
                      : 'border-slate-800 hover:border-slate-600 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url || undefined}
                    alt={preset.name || `Preset ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {preset.name && (
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-end p-1 text-[8px] font-bold text-white leading-tight">
                      {preset.name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-[10px] text-slate-500 mt-1">{helperText}</p>
      )}

      {/* Full HD 300 DPI Inspection Lightbox Modal */}
      {showLightboxModal && value && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 animate-in fade-in duration-200"
          onClick={() => setShowLightboxModal(false)}
        >
          <div
            className="flex items-center justify-between pb-3 border-b border-slate-800 max-w-5xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full Image 300 DPI Inspection (Complete Fit · Zero Crop)</span>
              {qualityInfo && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {qualityInfo.width} × {qualityInfo.height} px · {qualityInfo.dpi} DPI
                </span>
              )}
            </div>
            <button
              onClick={() => setShowLightboxModal(false)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div
            className="flex-1 flex items-center justify-center p-4 max-w-5xl w-full mx-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={value || undefined}
              alt="Full view"
              className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/10 select-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

