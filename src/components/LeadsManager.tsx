import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, CheckCircle, Clock, Trash2, Search, ExternalLink, Filter } from 'lucide-react';
import { LeadInquiry } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { useTheme } from '../context/ThemeContext';

interface LeadsManagerProps {
  leads: LeadInquiry[];
  onUpdateStatus: (id: string, status: 'new' | 'contacted' | 'resolved') => void;
  onDeleteLead: (id: string) => void;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({
  leads,
  onUpdateStatus,
  onDeleteLead,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [leadToDelete, setLeadToDelete] = useState<LeadInquiry | null>(null);

  const filtered = leads.filter((l) => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.cardName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 dark:border-slate-800/80 border-slate-200 mb-6">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            <span>Direct Leads & Inquiries</span>
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            Real-time callback requests, queries, and bookings captured through B-Smart digital cards.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className={`flex items-center gap-1 p-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border rounded-xl text-xs font-semibold overflow-x-auto max-w-full`}>
          <button
            onClick={() => setFilter('all')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({leads.length})
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === 'new' ? 'bg-amber-500 text-slate-950 font-bold' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>New</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filter === 'new' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-amber-500/20 text-amber-400'}`}>
              {leads.filter((l) => l.status === 'new').length}
            </span>
          </button>
          <button
            onClick={() => setFilter('contacted')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'contacted' ? 'bg-amber-500 text-slate-950 font-bold' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contacted ({leads.filter((l) => l.status === 'contacted').length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by prospect name, email, phone, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-amber-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 shadow-sm'
          } border text-xs focus:outline-none transition-colors`}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500'} border text-xs`}>
          No inquiries found matching your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead, lIdx) => (
            <div
              key={`lead-${lead.id}-${lIdx}`}
              className={`p-4 sm:p-5 rounded-2xl ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              } border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4`}
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{lead.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      lead.status === 'new'
                        ? isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        : lead.status === 'contacted'
                        ? isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-sky-50 text-sky-700 border border-sky-200'
                        : isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {lead.status}
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>
                    via {lead.cardName}
                  </span>
                </div>

                <p className={`text-xs ${isDark ? 'text-slate-300 bg-slate-950/70 border-slate-800/80' : 'text-slate-700 bg-slate-50 border-slate-200'} leading-relaxed p-3 rounded-xl border break-words`}>
                  "{lead.message}"
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <a
                    href={`tel:${lead.phone}`}
                    className="min-h-[32px] flex items-center gap-1.5 text-emerald-500 hover:underline font-mono font-semibold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lead.phone}</span>
                  </a>
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="min-h-[32px] flex items-center gap-1.5 text-sky-500 hover:underline break-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{lead.email}</span>
                    </a>
                  )}
                  <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-auto font-mono`}>
                    {new Date(lead.createdAt).toLocaleDateString()} · {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                <select
                  value={lead.status}
                  onChange={(e) => onUpdateStatus(lead.id, e.target.value as any)}
                  aria-label="Update lead status"
                  className={`min-h-[38px] ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  } border rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-500`}
                >
                  <option value="new">Mark as New</option>
                  <option value="contacted">Mark Contacted</option>
                  <option value="resolved">Mark Resolved</option>
                </select>

                <button
                  onClick={() => setLeadToDelete(lead)}
                  className={`min-h-[38px] min-w-[38px] p-2 rounded-xl ${
                    isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                  } transition-colors flex items-center justify-center`}
                  title="Delete lead inquiry"
                  aria-label="Delete inquiry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Lead Deletion */}
      <ConfirmationModal
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={() => {
          if (leadToDelete) {
            onDeleteLead(leadToDelete.id);
            setLeadToDelete(null);
          }
        }}
        title="Delete Customer Lead?"
        message="Are you sure you want to permanently delete this inquiry record? This action cannot be reversed."
        highlightText={leadToDelete ? `${leadToDelete.name} (${leadToDelete.cardName})` : ''}
        confirmLabel="Delete Inquiry"
        cancelLabel="Keep Lead"
        type="danger"
      />
    </div>
  );
};
