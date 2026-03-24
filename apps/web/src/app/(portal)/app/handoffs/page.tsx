'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Handoff {
  contact: string;
  requestedAt: string;
  lastMessage: string | null;
}

export default function HandoffsPage() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHandoffs = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/portal/tenant/current/handoffs');
      const data = await res.json();
      setHandoffs(data.handoffs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching handoffs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resolveHandoff = async (contact: string) => {
    setResolving(contact);
    try {
      const res = await fetch('/api/portal/tenant/current/handoffs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact }),
      });
      if (res.ok) {
        setHandoffs((prev) => prev.filter((h) => h.contact !== contact));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error resolving handoff:', error);
    } finally {
      setResolving(null);
    }
  };

  useEffect(() => {
    fetchHandoffs();
    const interval = setInterval(fetchHandoffs, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPhone = (contact: string) => contact.replace('@c.us', '');

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
            Handoff <span className="text-amber-400">Queue</span>
          </h1>
          <p className="text-slate-400">
            Contacts waiting for a human reply — resolve to let the bot resume
          </p>
        </div>
        <button
          onClick={fetchHandoffs}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </motion.div>

      {/* Count card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-5 border border-amber-500/20">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Awaiting Human Reply</p>
          <p className="text-3xl font-heading font-bold text-amber-400">{total}</p>
        </div>
        <div className="sm:col-span-2 bg-dark-800/50 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">How it works</p>
          <p className="text-sm text-slate-300">
            When a customer asks to speak to a human, the bot goes silent. Reply to them directly from WhatsApp, then click <span className="text-emerald-400 font-medium">Resolve</span> below to let the bot take over again.
          </p>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10 bg-dark-700/30">
          <h2 className="text-base font-semibold text-white font-heading">Pending Handoffs</h2>
        </div>

        {handoffs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">All clear</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              No contacts are waiting for a human reply right now.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-dark-700/20">
              <div className="col-span-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</div>
              <div className="col-span-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Requested</div>
              <div className="col-span-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Message</div>
              <div className="col-span-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Action</div>
            </div>

            <div className="divide-y divide-white/5">
              {handoffs.map((h, index) => (
                <motion.div
                  key={h.contact}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors items-center"
                >
                  <div className="col-span-12 sm:col-span-3 font-mono text-sm text-white">
                    +{formatPhone(h.contact)}
                  </div>
                  <div className="col-span-6 sm:col-span-3 text-xs text-slate-400">
                    {formatTime(h.requestedAt)}
                  </div>
                  <div className="col-span-12 sm:col-span-4 text-sm text-slate-300 truncate">
                    {h.lastMessage ?? <span className="text-slate-600 italic">No message</span>}
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <button
                      onClick={() => resolveHandoff(h.contact)}
                      disabled={resolving === h.contact}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      {resolving === h.contact ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      Resolve
                    </button>
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
