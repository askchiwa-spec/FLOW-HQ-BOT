'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    const interval = setInterval(fetchStatus, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-50';
      case 'APPROVED':
      case 'QR_PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'SUBMITTED':
      case 'REVIEWING':
        return 'text-blue-600 bg-blue-50';
      case 'ERROR':
      case 'REJECTED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const showQRButton = data?.tenant?.status === 'QR_PENDING' || 
                       data?.tenant?.whatsapp_session?.state === 'QR_READY' ||
                       data?.tenant?.whatsapp_session?.state === 'CONNECTED';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Setup Status</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Setup Request</h2>
        {data?.setupRequest ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.setupRequest.status)}`}>
                {data.setupRequest.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Template:</span>
              <span className="font-medium">{data.setupRequest.template_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">WhatsApp:</span>
              <span className="font-medium">{data.setupRequest.whatsapp_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Submitted:</span>
              <span className="font-medium">{new Date(data.setupRequest.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No setup request submitted yet.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">WhatsApp Connection</h2>
        {data?.tenant ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.tenant.status)}`}>
                {data.tenant.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Session:</span>
              <span className="font-medium">{data.tenant.whatsapp_session?.state || 'Not connected'}</span>
            </div>
            {data.tenant.whatsapp_session?.last_seen_at && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last seen:</span>
                <span className="font-medium">{new Date(data.tenant.whatsapp_session.last_seen_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No tenant configured.</p>
        )}
      </div>

      {showQRButton && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Next Step</h2>
          <p className="text-gray-600 mb-4">
            Your setup has been approved. Connect your WhatsApp to start receiving messages.
          </p>
          <Link
            href="/app/whatsapp"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700"
          >
            Connect WhatsApp →
          </Link>
        </div>
      )}

      {data?.tenant?.status === 'ACTIVE' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">You're All Set!</h2>
          <p className="text-gray-600 mb-4">
            Your WhatsApp automation is active and ready to handle messages.
          </p>
          <Link
            href="/app/logs"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
          >
            View Message Logs →
          </Link>
        </div>
      )}
    </div>
  );
}
