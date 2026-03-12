'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  request_type: string;
  lead_status: string;
  created_at: string;
  last_interaction: string;
}

interface Stats {
  total: number;
  new: number;
  pending: number;
  confirmed: number;
}

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CONFIRMED: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const TYPE_STYLES: Record<string, string> = {
  APPOINTMENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ORDER: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ROOM_INQUIRY: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  SERVICE_INQUIRY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  GENERAL: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, pending: 0, confirmed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = async (status?: string) => {
    try {
      setRefreshing(true);
      const url = status ? `/api/portal/customers?status=${status}` : '/api/portal/customers';
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data.customers || []);
      setStats(data.stats || { total: 0, new: 0, pending: 0, confirmed: 0 });
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers(statusFilter || undefined);
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
            Your <span className="text-primary-400">Customers</span>
          </h1>
          <p className="text-slate-400">
            WhatsApp leads automatically captured by your bot
          </p>
        </div>

        <button
          onClick={() => fetchCustomers(statusFilter || undefined)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'Total Leads', value: stats.total, color: 'text-white' },
          { label: 'New', value: stats.new, color: 'text-emerald-400' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-violet-400' },
        ].map((s) => (
          <div key={s.label} className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-3xl font-heading font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Table header with filter */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-700/30 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-white font-heading">Lead List</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-dark-700 border border-white/10 text-slate-300 text-sm focus:outline-none focus:border-primary-500/50"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {customers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No customers yet</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Customers will appear automatically once your bot starts receiving WhatsApp messages.
            </p>
          </div>
        ) : (
          <>
            {/* Column headers — hidden on mobile */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-dark-700/20">
              <div className="col-span-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</div>
              <div className="col-span-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</div>
              <div className="col-span-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Type</div>
              <div className="col-span-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</div>
              <div className="col-span-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Active</div>
            </div>

            <div className="divide-y divide-white/5">
              {customers.map((c, index) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors items-center"
                >
                  <div className="col-span-12 sm:col-span-3">
                    <p className="text-sm font-medium text-white">{c.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 sm:hidden font-mono mt-0.5">{c.phone.replace('@c.us', '')}</p>
                  </div>
                  <div className="hidden sm:block col-span-3 font-mono text-sm text-slate-400">
                    {c.phone.replace('@c.us', '')}
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${TYPE_STYLES[c.request_type] || TYPE_STYLES.GENERAL}`}>
                      {c.request_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[c.lead_status] || STATUS_STYLES.NEW}`}>
                      {c.lead_status}
                    </span>
                  </div>
                  <div className="col-span-12 sm:col-span-2 text-xs text-slate-500">
                    {new Date(c.last_interaction).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
