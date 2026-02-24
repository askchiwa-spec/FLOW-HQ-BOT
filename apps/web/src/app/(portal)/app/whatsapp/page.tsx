'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
        
        // Auto-redirect to status when connected
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
    const interval = setInterval(fetchQR, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [router]);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WhatsApp Connection</h1>

      <div className="bg-white p-8 rounded-lg shadow text-center">
        {qrData?.state === 'QR_READY' && qrData.qr ? (
          <>
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Waiting for scan...
              </span>
            </div>
            <p className="mb-4 text-gray-600">
              Scan this QR code with WhatsApp to connect your business number
            </p>
            <div className="bg-white p-4 inline-block rounded-lg shadow-inner">
              <img src={qrData.qr} alt="WhatsApp QR Code" className="mx-auto max-w-xs" />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Open WhatsApp → Settings → Linked Devices → Link a Device
            </p>
            <p className="mt-2 text-xs text-gray-400">
              QR code refreshes automatically. Keep this page open.
            </p>
          </>
        ) : qrData?.state === 'CONNECTED' ? (
          <div className="text-green-600">
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-lg font-medium">Connected!</p>
            <p className="text-gray-600">Your WhatsApp is ready to receive messages</p>
            <p className="mt-4 text-sm text-gray-500">
              Redirecting to status in {countdown}...
            </p>
          </div>
        ) : qrData?.state === 'CONNECTING' ? (
          <div className="text-blue-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Connecting...</p>
            <p className="text-gray-600">Please wait while we establish the connection</p>
          </div>
        ) : (
          <div className="text-gray-500">
            <div className="animate-pulse rounded-full h-12 w-12 border-2 border-gray-300 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Waiting for worker...</p>
            <p className="text-gray-600">Your setup request has been approved. The worker is starting up.</p>
            <p className="mt-4 text-sm text-gray-400">This may take a minute. Please refresh the page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
