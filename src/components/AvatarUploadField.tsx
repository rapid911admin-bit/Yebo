import React, { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';

interface AvatarUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  presetAvatars?: string[];
}

export const AvatarUploadField: React.FC<AvatarUploadFieldProps> = ({
  value,
  onChange,
  label = 'Profile Avatar Photo',
  helperText = 'Upload a real image from your computer or device.',
  presetAvatars,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const targetDim = 512;
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const startX = (img.width - size) / 2;
          const startY = (img.height - size) / 2;
          ctx.drawImage(img, startX, startY, size, size, 0, 0, targetDim, targetDim);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressed);
        }
        setIsProcessing(false);
      };
      img.onerror = () => setIsProcessing(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setIsProcessing(false);
    reader.readAsDataURL(file);
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

  return (
    <div className="space-y-2.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}

      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
          isDragging
            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Avatar Preview */}
        <div className="relative group shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-500/50 shadow-md flex items-center justify-center text-slate-400">
            {value ? (
              <img
                src={value}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-600" />
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-900/90 text-red-200 border border-red-700 shadow hover:bg-red-800 transition-colors"
              title="Remove photo"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upload Button & Drag Hint */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-amber-500/50 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{isProcessing ? 'Processing...' : 'Upload Photo'}</span>
            </button>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              or drag & drop image here
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            JPG, PNG, WebP supported. Automatically optimized.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Preset avatars if provided */}
      {presetAvatars && presetAvatars.length > 0 && (
        <div>
          <span className="text-[10px] text-slate-400 font-medium block mb-1.5">
            Or pick from sample presets:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {presetAvatars.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(url)}
                className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  value === url
                    ? 'border-amber-400 scale-105 shadow-md shadow-amber-950/40 ring-1 ring-amber-400'
                    : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                }`}
              >
                <img
                  src={url}
                  alt={`Preset ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
