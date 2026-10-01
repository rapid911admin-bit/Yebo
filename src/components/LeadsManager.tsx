import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, CheckCircle, Clock, Trash2, Search, ExternalLink } from 'lucide-react';
import { LeadInquiry } from '../types';

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
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'resolved'>('all');
  const [search, setSearch] = useState('');

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
    <div className="max-w-5xl mx-auto p-4 sm:p-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            Direct Leads & Customer Inquiries
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time callback requests, quote queries, and bookings submitted through YeboCard profiles.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({leads.length})
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'new' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            New ({leads.filter((l) => l.status === 'new').length})
          </button>
          <button
            onClick={() => setFilter('contacted')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'contacted' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contacted ({leads.filter((l) => l.status === 'contacted').length})
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by prospect name, email, phone, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-500 text-xs">
          No inquiries found matching your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{lead.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      lead.status === 'new'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : lead.status === 'contacted'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {lead.status}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    via {lead.cardName}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  "{lead.message}"
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1 text-emerald-400 hover:underline font-mono"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lead.phone}</span>
                  </a>
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-1 text-sky-400 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{lead.email}</span>
                    </a>
                  )}
                  <span className="text-[11px] text-slate-500">
                    {new Date(lead.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status change actions */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <select
                  value={lead.status}
                  onChange={(e) => onUpdateStatus(lead.id, e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="new">Mark as New</option>
                  <option value="contacted">Mark Contacted</option>
                  <option value="resolved">Mark Resolved</option>
                </select>

                <button
                  onClick={() => onDeleteLead(lead.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                  title="Delete lead"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
