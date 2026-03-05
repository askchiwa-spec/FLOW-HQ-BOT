'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface StatusData {
  tenant?: {
    id: string;
    name: string;
    status: string;
    whatsapp_session?: {
      state: string;
      last_seen_at?: string;
    };
  };
  setupRequest?: {
    status: string;
    template_type: string;
    whatsapp_number: string;
    created_at: string;
  };
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/portal/tenant/current/status');
        const statusData = await res.json();
        setData(statusData);
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '✓' };
      case 'APPROVED':
      case 'QR_PENDING':
        return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '⏳' };
      case 'SUBMITTED':
      case 'REVIEWING':
        return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '📋' };
      case 'ERROR':
      case 'REJECTED':
        return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '✗' };
      default:
        return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: '○' };
    }
  };

  const showQRButton = data?.tenant?.status === 'QR_PENDING' || 
                       data?.tenant?.whatsapp_session?.state === 'QR_READY' ||
                       data?.tenant?.whatsapp_session?.state === 'CONNECTED';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
          Setup <span className="text-primary-400">Status</span>
        </h1>
        <p className="text-lg text-slate-400">
          Track your WhatsApp automation setup progress
        </p>
      </motion.div>

      {/* Setup Request Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400">
            📋
          </span>
          Setup Request
        </h2>
        
        {data?.setupRequest ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-slate-400">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(data.setupRequest.status).bg} ${getStatusConfig(data.setupRequest.status).color} ${getStatusConfig(data.setupRequest.status).border} border`}>
                {getStatusConfig(data.setupRequest.status).icon} {data.setupRequest.status}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-slate-400">Template</span>
              <span className="text-white font-medium">{data.setupRequest.template_type}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-slate-400">WhatsApp</span>
              <span className="text-white font-medium">{data.setupRequest.whatsapp_number}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-400">Submitted</span>
              <span className="text-white font-medium">{new Date(data.setupRequest.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No setup request submitted yet.</p>
            <Link
              href="/app/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 transition-colors"
            >
              Start Setup →
            </Link>
          </div>
        )}
      </motion.div>

      {/* WhatsApp Connection Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            💬
          </span>
          WhatsApp Connection
        </h2>
        
        {data?.tenant ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-slate-400">Tenant Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(data.tenant.status).bg} ${getStatusConfig(data.tenant.status).color} ${getStatusConfig(data.tenant.status).border} border`}>
                {getStatusConfig(data.tenant.status).icon} {data.tenant.status}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-slate-400">Session State</span>
              <span className="text-white font-medium">{data.tenant.whatsapp_session?.state || 'Not connected'}</span>
            </div>
            {data.tenant.whatsapp_session?.last_seen_at && (
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Last Seen</span>
                <span className="text-white font-medium">{new Date(data.tenant.whatsapp_session.last_seen_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-4">No tenant configured.</p>
        )}
      </motion.div>

      {/* Action Cards */}
      {showQRButton && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl p-6 border border-amber-500/20"
        >
          <h2 className="text-lg font-semibold text-white mb-2">Next Step</h2>
          <p className="text-slate-400 mb-4">
            Your setup has been approved. Connect your WhatsApp to start receiving messages.
          </p>
          <Link
            href="/app/whatsapp"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/20"
          >
            <span>Connect WhatsApp</span>
            <span>→</span>
          </Link>
        </motion.div>
      )}

      {data?.tenant?.status === 'ACTIVE' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 border border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎉</span>
            <h2 className="text-lg font-semibold text-white">You're All Set!</h2>
          </div>
          <p className="text-slate-400 mb-4">
            Your WhatsApp automation is active and ready to handle messages.
          </p>
          <Link
            href="/app/logs"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/20"
          >
            <span>View Message Logs</span>
            <span>→</span>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
