'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Order {
  id: string;
  contact_phone: string;
  customer_name: string | null;
  order_summary: string | null;
  status: 'ACTIVE' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  followup_count: number;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  confirmed: number;
  cancelled: number;
  expired: number;
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  ACTIVE:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CONFIRMED: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  EXPIRED:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, confirmed: 0, cancelled: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const buildParams = (status: string, from: string, to: string) => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return p.toString();
  };

  const fetchOrders = async (status: string, from: string, to: string) => {
    try {
      setRefreshing(true);
      const qs = buildParams(status, from, to);
      const res = await fetch(`/api/portal/orders${qs ? `?${qs}` : ''}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || { total: 0, active: 0, confirmed: 0, cancelled: 0, expired: 0 });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(statusFilter, fromDate, toDate);
  }, [statusFilter, fromDate, toDate]);

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
        className="flex items-center justify-between mb-8 flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
            Your <span className="text-primary-400">Orders</span>
          </h1>
          <p className="text-slate-400">
            Orders automatically captured and tracked by your bot
          </p>
        </div>

        <button
          onClick={() => fetchOrders(statusFilter, fromDate, toDate)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 disabled:opacity-50 transition-colors text-sm"
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
          { label: 'Total Orders', value: stats.total, color: 'text-white' },
          { label: 'Active', value: stats.active, color: 'text-amber-400' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-violet-400' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-400' },
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
        {/* Filters bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-700/30 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-white font-heading">Order List</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-dark-700 border border-white/10 text-slate-300 text-sm focus:outline-none focus:border-primary-500/50"
              title="From date"
            />
            <span className="text-slate-500 text-sm">–</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-dark-700 border border-white/10 text-slate-300 text-sm focus:outline-none focus:border-primary-500/50"
              title="To date"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-dark-700 border border-white/10 text-slate-300 text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
            {(fromDate || toDate || statusFilter) && (
              <button
                onClick={() => { setFromDate(''); setToDate(''); setStatusFilter(''); }}
                className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No orders yet</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Orders will appear here automatically once customers confirm them through your bot.
            </p>
          </div>
        ) : (
          <>
            {/* Column headers — hidden on mobile */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-dark-700/20">
              <div className="col-span-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</div>
              <div className="col-span-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Order Summary</div>
              <div className="col-span-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</div>
              <div className="col-span-1 text-xs font-medium text-slate-500 uppercase tracking-wider">F/U</div>
              <div className="col-span-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</div>
            </div>

            <div className="divide-y divide-white/5">
              {orders.map((o, index) => (
                <motion.a
                  key={o.id}
                  href={`/app/messages?contact=${encodeURIComponent(o.contact_phone)}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors items-center cursor-pointer"
                >
                  <div className="col-span-12 sm:col-span-3">
                    <p className="text-sm font-medium text-white">{o.customer_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{o.contact_phone}</p>
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <p
                      className="text-sm text-slate-300 truncate"
                      title={o.order_summary ?? undefined}
                    >
                      {o.order_summary || <span className="text-slate-600 italic">No summary</span>}
                    </p>
                  </div>
                  <div className="col-span-6 sm:col-span-2 text-xs text-slate-500">
                    {new Date(o.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="col-span-2 sm:col-span-1 text-xs text-slate-400 font-mono">
                    {o.followup_count}/3
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${ORDER_STATUS_STYLES[o.status] || ORDER_STATUS_STYLES.EXPIRED}`}>
                      {o.status}
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
