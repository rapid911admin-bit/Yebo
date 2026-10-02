import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  UserCheck,
  Shield,
  X,
  Check,
  UserX,
  AlertCircle,
  Sparkles,
  Building2,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';
import { BusinessCard, User } from '../types';

interface AllocateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BusinessCard | null;
  employees: User[];
  allCards: BusinessCard[];
  onAllocate: (cardId: string, employeeId: string | null, syncContactInfo: boolean) => void;
}

export const AllocateCardModal: React.FC<AllocateCardModalProps> = ({
  isOpen,
  onClose,
  card,
  employees,
  allCards,
  onAllocate,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(card?.id || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    card?.assignedMemberId || ''
  );
  const [syncContactInfo, setSyncContactInfo] = useState<boolean>(true);

  // Sync state if card prop changes
  React.useEffect(() => {
    if (card) {
      setSelectedCardId(card.id);
      setSelectedEmployeeId(card.assignedMemberId || '');
    }
  }, [card]);

  if (!isOpen) return null;

  const currentCard = allCards.find((c) => c.id === selectedCardId) || card;
  const currentAssignedEmployee = employees.find(
    (e) => e.id === currentCard?.assignedMemberId
  );
  const targetEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const handleConfirm = () => {
    if (!currentCard) return;
    onAllocate(
      currentCard.id,
      selectedEmployeeId === 'unassigned' || !selectedEmployeeId
        ? null
        : selectedEmployeeId,
      syncContactInfo
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Allocate Business Card
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Assign company smart communicator to an employee or executive
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Step 1: Select Business Card */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>1. Select Business Card</span>
                {currentCard && (
                  <span className="text-[11px] text-amber-400 font-mono">
                    /{currentCard.slug}
                  </span>
                )}
              </label>

              <select
                value={selectedCardId}
                onChange={(e) => {
                  setSelectedCardId(e.target.value);
                  const newCard = allCards.find((c) => c.id === e.target.value);
                  setSelectedEmployeeId(newCard?.assignedMemberId || '');
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
              >
                {allCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.businessTypeLabel || 'Smart Card'})
                  </option>
                ))}
              </select>
            </div>

            {/* Currently Allocated To Banner */}
            {currentCard && (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold overflow-hidden shrink-0">
                    {currentAssignedEmployee?.avatarUrl ? (
                      <img
                        src={currentAssignedEmployee.avatarUrl}
                        alt="Current"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentAssignedEmployee?.name.charAt(0) || '—'
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Current Allocation
                    </div>
                    <div className="font-bold text-white">
                      {currentAssignedEmployee ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {currentAssignedEmployee.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unallocated (Unassigned)</span>
                      )}
                    </div>
                  </div>
                </div>

                {currentAssignedEmployee && (
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeId('unassigned')}
                    className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Unassign</span>
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Select Employee */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                2. Allocate to Employee / Member
              </label>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeId('unassigned')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedEmployeeId === 'unassigned' || !selectedEmployeeId
                      ? 'bg-amber-500/10 border-amber-500/70 text-white ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Unallocated</div>
                      <div className="text-[10px] text-slate-500">
                        Card is general or not assigned to any specific staff member
                      </div>
                    </div>
                  </div>
                  {(selectedEmployeeId === 'unassigned' || !selectedEmployeeId) && (
                    <Check className="w-4 h-4 text-amber-400" />
                  )}
                </button>

                {employees.map((emp) => {
                  const isSelected = selectedEmployeeId === emp.id;
                  const alreadyHasDifferentCard =
                    emp.assignedCardId && emp.assignedCardId !== currentCard?.id;

                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold overflow-hidden shrink-0">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            emp.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="truncate">{emp.name}</span>
                            <span
                              className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono ${
                                emp.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-sky-500/20 text-sky-300'
                              }`}
                            >
                              {emp.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 truncate">
                            <span>{emp.designation || 'Staff Member'}</span>
                            <span>·</span>
                            <span>{emp.email}</span>
                          </div>
                          {alreadyHasDifferentCard && (
                            <span className="text-[9px] text-amber-400/90 font-mono">
                              (Has another card assigned: will be reallocated)
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Sync Toggle */}
            {selectedEmployeeId && selectedEmployeeId !== 'unassigned' && targetEmployee && (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncContactInfo}
                    onChange={(e) => setSyncContactInfo(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white block">
                      Sync employee details to card contact information
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Updates Contact Person Name to &quot;{targetEmployee.name}&quot;
                      {targetEmployee.designation ? `, Title to "${targetEmployee.designation}"` : ''}
                      {targetEmployee.phone ? `, and Phone to "${targetEmployee.phone}"` : ''}.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Allocation</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
