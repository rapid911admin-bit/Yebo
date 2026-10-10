import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  UserCheck,
  Shield,
  X,
  Check,
  UserX,
  Building2,
  Users,
  Search,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { BusinessCard, User } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AllocateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BusinessCard | null;
  employees: User[];
  allCards: BusinessCard[];
  onAllocate: (cardId: string, employeeId: string | null, syncContactInfo: boolean) => void;
  onBulkAllocate?: (companyCardId: string, employeeIds: string[], syncContactInfo: boolean) => Promise<void>;
  initialMode?: 'single' | 'bulk';
}

export const AllocateCardModal: React.FC<AllocateCardModalProps> = ({
  isOpen,
  onClose,
  card,
  employees,
  allCards,
  onAllocate,
  onBulkAllocate,
  initialMode = 'single',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<'single' | 'bulk'>(initialMode);
  const [selectedCardId, setSelectedCardId] = useState<string>(card?.id || allCards[0]?.id || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    card?.assignedMemberId || ''
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [syncContactInfo, setSyncContactInfo] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state if card or mode props change
  useEffect(() => {
    if (card) {
      setSelectedCardId(card.id);
      setSelectedEmployeeId(card.assignedMemberId || '');
    } else if (allCards.length > 0 && !allCards.some(c => c.id === selectedCardId)) {
      setSelectedCardId(allCards[0].id);
    }
  }, [card, allCards]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  // Pre-select employees belonging to the selected company or unallocated
  useEffect(() => {
    if (mode === 'bulk' && selectedCardId) {
      const selectedCompany = allCards.find(c => c.id === selectedCardId);
      const companyId = selectedCompany?.companyId || selectedCompany?.id;
      
      const defaultSelected = employees
        .filter(emp => !companyId || emp.companyId === companyId || !emp.assignedCardId)
        .map(emp => emp.id);
        
      setSelectedEmployeeIds(defaultSelected);
    }
  }, [mode, selectedCardId, employees, allCards]);

  if (!isOpen) return null;

  const currentCard = allCards.find((c) => c.id === selectedCardId) || card || allCards[0];
  const currentAssignedEmployee = employees.find(
    (e) => e.id === currentCard?.assignedMemberId
  );
  const targetEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Filtered employees for bulk selection
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.designation && emp.designation.toLowerCase().includes(q))
    );
  });

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedEmployeeIds(filteredEmployees.map((e) => e.id));
  };

  const handleSelectUnassigned = () => {
    const unassignedIds = filteredEmployees
      .filter((e) => !e.assignedCardId)
      .map((e) => e.id);
    setSelectedEmployeeIds(unassignedIds);
  };

  const handleDeselectAll = () => {
    setSelectedEmployeeIds([]);
  };

  const handleConfirm = async () => {
    if (!currentCard) return;

    if (mode === 'single') {
      onAllocate(
        currentCard.id,
        selectedEmployeeId === 'unassigned' || !selectedEmployeeId
          ? null
          : selectedEmployeeId,
        syncContactInfo
      );
      onClose();
    } else {
      if (selectedEmployeeIds.length === 0) return;
      setIsSubmitting(true);
      try {
        if (onBulkAllocate) {
          await onBulkAllocate(currentCard.id, selectedEmployeeIds, syncContactInfo);
        }
        onClose();
      } catch (err) {
        console.error('Error during bulk allocation:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div key="allocate-card-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`relative w-full max-w-xl ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        } border rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]`}
      >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Allocate Business Cards to Team
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin Only
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {mode === 'single'
                    ? 'Assign a company smart card to a specific team member'
                    : 'Allocate unique company cards to multiple team members simultaneously'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`p-1.5 rounded-xl ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'} transition-colors cursor-pointer`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className={`px-4 sm:px-6 pt-3 pb-2 border-b ${isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-100/50'} flex items-center gap-2`}>
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'single'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : isDark ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-white text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Single Allocation</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'bulk'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : isDark ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-white text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Bulk Team Allocation</span>
            </button>
          </div>

          {/* Form Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Step 1: Select Business Card or Template */}
            <div>
              <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider mb-1.5 flex items-center justify-between`}>
                <span>1. {mode === 'single' ? 'Select Smart Card' : 'Select Master Company Template'}</span>
                {currentCard && (
                  <span className="text-[11px] text-amber-500 font-mono">
                    /{currentCard.slug}
                  </span>
                )}
              </label>

              <select
                value={selectedCardId}
                onChange={(e) => {
                  setSelectedCardId(e.target.value);
                  const newCard = allCards.find((c) => c.id === e.target.value);
                  if (mode === 'single') {
                    setSelectedEmployeeId(newCard?.assignedMemberId || '');
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                } border text-xs focus:outline-none focus:border-amber-500 font-bold`}
              >
                {allCards.map((c, cIdx) => (
                  <option key={`alloc-card-${c.id}-${cIdx}`} value={c.id}>
                    {c.businessName} ({c.businessTypeLabel || 'Smart Card'})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode 1: SINGLE ALLOCATION */}
            {mode === 'single' && (
              <>
                {/* Currently Allocated Banner */}
                {currentCard && (
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between gap-3 text-xs`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold overflow-hidden shrink-0">
                        {currentAssignedEmployee?.avatarUrl ? (
                          <img
                            src={currentAssignedEmployee.avatarUrl || undefined}
                            alt="Current"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          currentAssignedEmployee?.name.charAt(0) || '—'
                        )}
                      </div>
                      <div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider font-semibold`}>
                          Current Allocation
                        </div>
                        <div className="font-bold">
                          {currentAssignedEmployee ? (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              {currentAssignedEmployee.name}
                            </span>
                          ) : (
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Unallocated (Unassigned)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {currentAssignedEmployee && (
                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeId('unassigned')}
                        className="min-h-[34px] px-2.5 py-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-400 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Unassign</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Step 2: Select Single Team Member */}
                <div>
                  <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider mb-1.5`}>
                    2. Allocate to Team Member
                  </label>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeId('unassigned')}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedEmployeeId === 'unassigned' || !selectedEmployeeId
                          ? 'bg-amber-500/10 border-amber-500/70 text-slate-900 dark:text-white ring-1 ring-amber-500/40'
                          : isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                          <UserX className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Unallocated</div>
                          <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Card is general or not assigned to any specific team member
                          </div>
                        </div>
                      </div>
                      {(selectedEmployeeId === 'unassigned' || !selectedEmployeeId) && (
                        <Check className="w-4 h-4 text-amber-500" />
                      )}
                    </button>

                    {employees.map((emp, empIdx) => {
                      const isSelected = selectedEmployeeId === emp.id;
                      const alreadyHasDifferentCard =
                        emp.assignedCardId && emp.assignedCardId !== currentCard?.id;

                      return (
                        <button
                          key={`alloc-emp-${emp.id}-${empIdx}`}
                          type="button"
                          onClick={() => setSelectedEmployeeId(emp.id)}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50'
                              : isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold overflow-hidden shrink-0">
                              {emp.avatarUrl ? (
                                <img
                                  src={emp.avatarUrl || undefined}
                                  alt={emp.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                emp.name.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5`}>
                                <span className="truncate">{emp.name}</span>
                                <span
                                  className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono ${
                                    emp.role === 'admin'
                                      ? 'bg-amber-500/20 text-amber-500'
                                      : 'bg-sky-500/20 text-sky-500'
                                  }`}
                                >
                                  {emp.role}
                                </span>
                              </div>
                              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-2 truncate`}>
                                <span>{emp.designation || 'Team Member'}</span>
                                <span>·</span>
                                <span>{emp.email}</span>
                              </div>
                              {alreadyHasDifferentCard && (
                                <span className="text-[9px] text-amber-500 font-mono">
                                  (Has another card assigned: will be reallocated)
                                </span>
                              )}
                            </div>
                          </div>

                          {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Mode 2: BULK MULTI-TEAM MEMBER ALLOCATION */}
            {mode === 'bulk' && (
              <div className="space-y-4">
                {/* Header & Quick Selection Toolbar */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider flex items-center gap-1.5`}>
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      <span>2. Select Team Members ({selectedEmployeeIds.length} of {employees.length} Selected)</span>
                    </label>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className={`text-[10px] px-2 py-1 rounded-lg border font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <CheckSquare className="w-3 h-3 text-amber-500" />
                        <span>Select All</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSelectUnassigned}
                        className={`text-[10px] px-2 py-1 rounded-lg border font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <UserX className="w-3 h-3 text-sky-400" />
                        <span>Unassigned Only</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className={`text-[10px] px-2 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                          isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Filter / Search Bar */}
                  <div className="relative mb-2.5">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter employees by name, title or email..."
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      } border text-xs focus:outline-none focus:border-amber-500`}
                    />
                  </div>

                  {/* Checkbox Multi-Selection List */}
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {filteredEmployees.map((emp, empIdx) => {
                      const isChecked = selectedEmployeeIds.includes(emp.id);
                      const hasCard = !!emp.assignedCardId;

                      return (
                        <div
                          key={`alloc-femp-${emp.id}-${empIdx}`}
                          onClick={() => handleToggleEmployee(emp.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40'
                              : isDark ? 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 shrink-0" />
                            )}

                            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold overflow-hidden shrink-0 text-xs">
                              {emp.avatarUrl ? (
                                <img
                                  src={emp.avatarUrl || undefined}
                                  alt={emp.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                emp.name.charAt(0)
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5`}>
                                <span className="truncate">{emp.name}</span>
                                <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono ${
                                  emp.role === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-sky-500/20 text-sky-500'
                                }`}>
                                  {emp.role}
                                </span>
                              </div>
                              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>
                                {emp.designation || 'Team Member'} · {emp.email}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {hasCard ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Has Card
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredEmployees.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No team members found matching &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sync Toggle */}
            <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'} border space-y-2`}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncContactInfo}
                  onChange={(e) => setSyncContactInfo(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <div className="text-xs">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} block`}>
                    Sync team member profile picture, job title & direct contact info
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} block mt-0.5`}>
                    Generates unique cards pre-populated with each team member&apos;s direct phone, WhatsApp, email, title, and avatar photo, formatted with full company template branding.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Controls */}
          <div className={`p-4 sm:p-5 border-t ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'} flex items-center justify-between gap-2.5`}>
            <div className="text-xs font-semibold text-amber-500">
              {mode === 'bulk' && (
                <span>{selectedEmployeeIds.length} team member(s) ready for allocation</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`min-h-[40px] px-4 py-2 rounded-xl ${
                  isDark ? 'bg-slate-900 hover:bg-slate-850 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                } text-xs font-semibold transition-colors cursor-pointer`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || (mode === 'bulk' && selectedEmployeeIds.length === 0)}
                className="min-h-[40px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {mode === 'single'
                        ? 'Confirm Allocation'
                        : `Allocate & Save Cards (${selectedEmployeeIds.length})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
};
