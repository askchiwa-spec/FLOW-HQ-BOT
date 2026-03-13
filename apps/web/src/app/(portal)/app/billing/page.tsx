'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TenantData {
  tenant: {
    name: string;
    status: string;
    created_at: string;
  };
  setupRequest: {
    status: string;
    created_at: string;
  } | null;
}

function formatTZS(amount: number) {
  return new Intl.NumberFormat('sw-TZ').format(amount) + ' TZS';
}

export default function BillingPage() {
  const [data, setData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/me')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  const isActive = data?.tenant?.status === 'ACTIVE';
  const joinedDate = data?.tenant?.created_at
    ? new Date(data.tenant.created_at).toLocaleDateString('en-TZ', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
          Billing & <span className="text-primary-400">Subscription</span>
        </h1>
        <p className="text-slate-400">Your plan details and payment information</p>
      </motion.div>

      <div className="space-y-6">
        {/* Current Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs text-primary-400 uppercase tracking-wider font-medium mb-1">Current Plan</p>
              <h2 className="text-2xl font-bold text-white">Chatisha Business</h2>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                isActive
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isActive ? 'Active' : 'Setup in progress'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-dark-700/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Setup Fee (one-time)</p>
              <p className="text-xl font-bold text-white">{formatTZS(200000)}</p>
            </div>
            <div className="bg-dark-700/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Monthly Subscription</p>
              <p className="text-xl font-bold text-white">{formatTZS(80000)}<span className="text-sm font-normal text-slate-400">/mo</span></p>
            </div>
          </div>
        </motion.div>

        {/* Plan Includes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">What's Included</h3>
          <ul className="space-y-3">
            {[
              '24/7 WhatsApp bot automation',
              'Custom bot template (Booking, Sales, or Support)',
              'Swahili & English language support',
              'Customer lead tracking',
              'Message logs & analytics',
              'Bot setup & configuration by our team',
              'Ongoing hosting & maintenance',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Account Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Business</span>
              <span className="text-white">{data?.tenant?.name || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Member since</span>
              <span className="text-white">{joinedDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Bot status</span>
              <span className={isActive ? 'text-green-400' : 'text-amber-400'}>
                {data?.tenant?.status || '—'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Payment Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-2">Payment</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Payments are handled manually via M-Pesa or bank transfer. Our team will contact you
            with payment details after your setup is approved. For billing questions, contact us on
            WhatsApp or email.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://wa.me/255700000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.534 5.854L0 24l6.336-1.518A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.892.925-3.621-.235-.373A9.818 9.818 0 1112 21.818z"/>
              </svg>
              WhatsApp Support
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
