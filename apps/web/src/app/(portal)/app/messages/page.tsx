'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface MessageLog {
  id: string;
  direction: 'IN' | 'OUT';
  from_number: string;
  to_number: string;
  message_text: string;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/portal/tenant/current/messages');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
            Message <span className="text-primary-400">Logs</span>
          </h1>
          <p className="text-slate-400">
            View all incoming and outgoing WhatsApp messages
          </p>
        </div>
        
        <button
          onClick={fetchLogs}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </motion.div>

      {logs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-slate-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📭</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Messages will appear here once your WhatsApp is connected and receiving traffic.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-dark-700/50 border-b border-white/10">
            <div className="col-span-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Time
            </div>
            <div className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Direction
            </div>
            <div className="col-span-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Contact
            </div>
            <div className="col-span-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Message
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="col-span-3 text-sm text-slate-400">
                  {new Date(log.created_at).toLocaleString()}
                </div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      log.direction === 'IN'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {log.direction === 'IN' ? '←' : '→'} {log.direction}
                  </span>
                </div>
                <div className="col-span-3 text-sm text-white truncate">
                  {log.direction === 'IN' ? log.from_number : log.to_number}
                </div>
                <div className="col-span-4 text-sm text-slate-300 truncate" title={log.message_text}>
                  {log.message_text}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {logs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-4 mt-6"
        >
          <div className="bg-dark-800/50 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-slate-400">Total Messages</p>
            <p className="text-2xl font-bold text-white">{logs.length}</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-slate-400">Incoming</p>
            <p className="text-2xl font-bold text-green-400">
              {logs.filter(l => l.direction === 'IN').length}
            </p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-slate-400">Outgoing</p>
            <p className="text-2xl font-bold text-blue-400">
              {logs.filter(l => l.direction === 'OUT').length}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
