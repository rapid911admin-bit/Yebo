import React, { useState, useEffect } from 'react';
import { Clock, Check, Sparkles, AlertCircle, Sun, Moon, Shield, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface OperatingScheduleEditorProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  subtitle?: string;
}

interface DaySchedule {
  day: string;
  shortDay: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  note?: string;
}

const DEFAULT_DAYS: DaySchedule[] = [
  { day: 'Monday', shortDay: 'Mon', isOpen: true, openTime: '08:00', closeTime: '17:00' },
  { day: 'Tuesday', shortDay: 'Tue', isOpen: true, openTime: '08:00', closeTime: '17:00' },
  { day: 'Wednesday', shortDay: 'Wed', isOpen: true, openTime: '08:00', closeTime: '17:00' },
  { day: 'Thursday', shortDay: 'Thu', isOpen: true, openTime: '08:00', closeTime: '17:00' },
  { day: 'Friday', shortDay: 'Fri', isOpen: true, openTime: '08:00', closeTime: '17:00' },
  { day: 'Saturday', shortDay: 'Sat', isOpen: false, openTime: '09:00', closeTime: '13:00' },
  { day: 'Sunday', shortDay: 'Sun', isOpen: false, openTime: '09:00', closeTime: '13:00' },
];

const PRESETS = [
  {
    label: 'Standard Office',
    desc: 'Mon - Fri: 08:00 - 17:00',
    value: 'Mon - Fri: 08:00 - 17:00',
    icon: Clock,
  },
  {
    label: 'Corporate + 24/7 Digital',
    desc: 'Mon - Fri: 08:00 - 18:00 (24/7 Digital Card Sharing)',
    value: 'Mon - Fri: 08:00 - 18:00 (24/7 Digital Card Sharing)',
    icon: Sparkles,
  },
  {
    label: '24/7 Armed Response',
    desc: '24/7/365 Armed Control Room Always Active',
    value: '24/7/365 Armed Control Room Always Active',
    icon: Shield,
  },
  {
    label: 'Extended Retail & Sat',
    desc: 'Mon - Fri: 08:00 - 17:30 | Sat: 08:30 - 13:00',
    value: 'Mon - Fri: 08:00 - 17:30 | Sat: 08:30 - 13:00',
    icon: Sun,
  },
  {
    label: 'Restaurant & Dining',
    desc: 'Tue - Sun: 11:30 - 22:30 (Kitchen closes 21:45)',
    value: 'Tue - Sun: 11:30 - 22:30 (Kitchen closes 21:45)',
    icon: Moon,
  },
  {
    label: 'By Appointment Only',
    desc: 'Mon - Fri: 08:30 - 17:00 (Consultations by Appointment)',
    value: 'Mon - Fri: 08:30 - 17:00 (Consultations by Appointment)',
    icon: Calendar,
  },
];

export const OperatingScheduleEditor: React.FC<OperatingScheduleEditorProps> = ({
  value,
  onChange,
  title = 'Operation Schedule & Hours',
  subtitle = 'Set business trading hours, emergency response availability, and daily operating timetable.',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<'visual' | 'custom'>('visual');
  const [days, setDays] = useState<DaySchedule[]>(DEFAULT_DAYS);
  const [extraNote, setExtraNote] = useState('');

  // Parse existing string value into days if possible
  useEffect(() => {
    if (!value) return;
    if (value.includes('24/7') || value.includes('24 Hours')) {
      setDays((prev) => prev.map((d) => ({ ...d, isOpen: true, openTime: '00:00', closeTime: '23:59' })));
    }
  }, []);

  const handleDayToggle = (index: number) => {
    const updated = [...days];
    updated[index] = { ...updated[index], isOpen: !updated[index].isOpen };
    setDays(updated);
    generateAndPropagate(updated, extraNote);
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', timeVal: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: timeVal };
    setDays(updated);
    generateAndPropagate(updated, extraNote);
  };

  const handleApplyToAllWeekdays = (sourceIndex: number) => {
    const src = days[sourceIndex];
    const updated = days.map((d, i) => {
      if (i < 5) {
        return { ...d, isOpen: src.isOpen, openTime: src.openTime, closeTime: src.closeTime };
      }
      return d;
    });
    setDays(updated);
    generateAndPropagate(updated, extraNote);
  };

  const generateAndPropagate = (currentDays: DaySchedule[], note: string) => {
    // Generate clean concise summary
    const weekdaysOpen = currentDays.slice(0, 5).every((d) => d.isOpen && d.openTime === currentDays[0].openTime && d.closeTime === currentDays[0].closeTime);
    const satOpen = currentDays[5].isOpen;
    const sunOpen = currentDays[6].isOpen;

    let result = '';

    if (currentDays.every((d) => d.isOpen && d.openTime === '00:00' && d.closeTime === '23:59')) {
      result = '24/7/365 Always Active';
    } else if (weekdaysOpen) {
      result = `Mon - Fri: ${currentDays[0].openTime} - ${currentDays[0].closeTime}`;
      if (satOpen && sunOpen && currentDays[5].openTime === currentDays[6].openTime && currentDays[5].closeTime === currentDays[6].closeTime) {
        result += ` | Sat - Sun: ${currentDays[5].openTime} - ${currentDays[5].closeTime}`;
      } else {
        if (satOpen) {
          result += ` | Sat: ${currentDays[5].openTime} - ${currentDays[5].closeTime}`;
        }
        if (sunOpen) {
          result += ` | Sun: ${currentDays[6].openTime} - ${currentDays[6].closeTime}`;
        }
      }
    } else {
      const openParts = currentDays
        .filter((d) => d.isOpen)
        .map((d) => `${d.shortDay}: ${d.openTime} - ${d.closeTime}`);
      result = openParts.join(' | ') || 'Closed';
    }

    if (note.trim()) {
      result += ` (${note.trim()})`;
    }

    onChange(result);
  };

  const handleNoteChange = (newNote: string) => {
    setExtraNote(newNote);
    generateAndPropagate(days, newNote);
  };

  const handlePresetSelect = (presetVal: string) => {
    onChange(presetVal);
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-tight`}>
              {title}
            </h4>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Visual / Custom Mode Selector */}
        <div className={`p-0.5 rounded-xl border flex items-center gap-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'visual'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day-by-Day
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'custom'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Text
          </button>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div>
        <label className={`block text-[11px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
          Instant Schedule Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESETS.map((p, pIdx) => {
            const isSelected = value === p.value;
            const Icon = p.icon;
            return (
              <button
                key={`preset-${p.label}-${pIdx}`}
                type="button"
                onClick={() => handlePresetSelect(p.value)}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/50'
                    : isDark
                    ? 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 hover:border-amber-500/50 text-slate-300'
                    : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-amber-400 text-slate-700 shadow-sm'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">{p.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block truncate mt-0.5 font-mono`}>
                    {p.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: DAY BY DAY BUILDER */}
      {mode === 'visual' && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Weekly Timetable
            </span>
            <button
              type="button"
              onClick={() => handleApplyToAllWeekdays(0)}
              className="text-[11px] font-bold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>Apply Monday times to Mon - Fri</span>
            </button>
          </div>

          <div className="space-y-2">
            {days.map((day, idx) => (
              <div
                key={`day-${day.day}-${idx}`}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 ${
                  day.isOpen
                    ? isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    : isDark ? 'bg-slate-950/40 border-slate-800/40 opacity-60' : 'bg-slate-100/60 border-slate-200/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-[120px]">
                  <input
                    type="checkbox"
                    id={`day-toggle-${idx}`}
                    checked={day.isOpen}
                    onChange={() => handleDayToggle(idx)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label
                    htmlFor={`day-toggle-${idx}`}
                    className={`text-xs font-bold cursor-pointer select-none ${
                      day.isOpen
                        ? isDark ? 'text-white' : 'text-slate-900'
                        : isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {day.day}
                  </label>
                </div>

                {day.isOpen ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Open:</span>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleTimeChange(idx, 'openTime', e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        } border focus:outline-none focus:border-amber-500`}
                      />
                    </div>

                    <span className="text-slate-500 text-xs">-</span>

                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Close:</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleTimeChange(idx, 'closeTime', e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        } border focus:outline-none focus:border-amber-500`}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 italic">
                    Closed all day
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Optional Note / Special Schedule description */}
          <div className="pt-1">
            <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
              Special Schedule Note / Hotline (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 24/7 Digital Card Sharing, Support Helpdesk: 24/7, or Emergency on call"
              value={extraNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs ${
                isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              } border focus:outline-none focus:border-amber-500`}
            />
          </div>
        </div>
      )}

      {/* MODE 2: CUSTOM TEXT INPUT */}
      {mode === 'custom' && (
        <div className="space-y-2 pt-2">
          <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Direct Custom Schedule String
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Mon - Fri: 08:00 - 18:00 (24/7 Digital Card Sharing)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono ${
              isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            } border focus:outline-none focus:border-amber-500`}
          />
          <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            This text is formatted directly and displayed on employee smart cards, company templates, and vCard downloads.
          </p>
        </div>
      )}

      {/* Live Preview Pill */}
      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${isDark ? 'bg-slate-950/70 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} shrink-0`}>
            Formatted Output:
          </span>
          <span className="text-xs font-bold font-mono text-amber-500 truncate">
            {value || 'No operating schedule specified'}
          </span>
        </div>
      </div>
    </div>
  );
};
