'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface QRData {
  state: string;
  qr: string | null;
}

export default function WhatsAppPage() {
  const router = useRouter();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await fetch('/api/portal/tenant/current/qr');
        const data = await res.json();
        setQrData(data);
        
        if (data.state === 'CONNECTED') {
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                router.push('/app/status');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          return () => clearInterval(timer);
        }
      } catch (error) {
        console.error('Error fetching QR:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
    const interval = setInterval(fetchQR, 3000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
          WhatsApp <span className="text-primary-400">Connection</span>
        </h1>
        <p className="text-lg text-slate-400">
          Scan the QR code with your WhatsApp to connect
        </p>
      </motion.div>

      {/* QR Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center"
      >
        {qrData?.state === 'QR_READY' && qrData.qr ? (
          <>
            {/* Status Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Waiting for scan...
              </span>
            </div>

            {/* Instructions */}
            <p className="text-slate-300 mb-6">
              Scan this QR code with WhatsApp to connect your business number
            </p>

            {/* QR Code */}
            <div className="bg-white p-4 inline-block rounded-2xl shadow-2xl mb-6">
              <img src={qrData.qr} alt="WhatsApp QR Code" className="w-64 h-64" />
            </div>

            {/* Steps */}
            <div className="bg-dark-700/50 rounded-xl p-4 text-left max-w-sm mx-auto">
              <p className="text-sm text-slate-400 mb-2">How to scan:</p>
              <ol className="text-sm text-slate-300 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">1</span>
                  Open WhatsApp on your phone
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">2</span>
                  Settings → Linked Devices
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">3</span>
                  Link a Device → Scan QR
                </li>
              </ol>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              QR code refreshes automatically. Keep this page open.
            </p>
          </>
        ) : qrData?.state === 'CONNECTED' ? (
          <>
            {/* Success State */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Connected
              </span>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <h3 className="text-xl font-semibold text-white mb-2">Connected!</h3>
            <p className="text-slate-400 mb-4">Your WhatsApp is ready to receive messages</p>
            
            <p className="text-sm text-slate-500">
              Redirecting to status in <span className="text-primary-400">{countdown}</span>...
            </p>
          </>
        ) : qrData?.state === 'CONNECTING' ? (
          <>
            {/* Connecting State */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Connecting...
              </span>
            </div>

            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">Connecting...</h3>
            <p className="text-slate-400">Please wait while we establish the connection</p>
          </>
        ) : (
          <>
            {/* Waiting State */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                Waiting...
              </span>
            </div>

            <div className="w-16 h-16 rounded-full bg-slate-500/20 flex items-center justify-center mx-auto mb-6">
              <div className="animate-pulse rounded-full h-8 w-8 border-2 border-slate-400" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">Waiting for worker...</h3>
            <p className="text-slate-400 mb-4">
              Your setup request has been approved. The worker is starting up.
            </p>
            <p className="text-sm text-slate-500">
              This may take a minute. The page will auto-refresh.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
