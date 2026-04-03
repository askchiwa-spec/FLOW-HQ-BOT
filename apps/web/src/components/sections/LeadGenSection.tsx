'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const steps = [
  {
    icon: '💬',
    label: 'Customer sends a WhatsApp message',
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    icon: '🤖',
    label: 'Bot replies instantly & captures their info',
    color: 'from-primary-500/20 to-primary-500/5 border-primary-500/30',
    iconBg: 'bg-primary-500/20 text-primary-400',
  },
  {
    icon: '👤',
    label: 'Lead saved to your dashboard automatically',
    color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
    iconBg: 'bg-violet-500/20 text-violet-400',
  },
  {
    icon: '📥',
    label: 'Download your contact list anytime as Excel',
    color: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
];

const benefits = [
  { value: '0', label: 'Manual work required', sub: 'It all happens automatically' },
  { value: '100%', label: 'Contacts captured', sub: 'Every person who messages you' },
  { value: '1-click', label: 'Export to Excel', sub: 'Your leads, ready to use' },
];

export function LeadGenSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-dark-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-900" />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
            Lead Generation
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            Your Bot Builds Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary-400">
              Customer List
            </span>{' '}
            For You
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Every WhatsApp conversation is a lead. Chatisha captures them automatically —
            name, phone number, and what they want — so you never lose a contact again.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.12 }}
                className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r border ${step.color}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${step.iconBg}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{step.label}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-400 text-sm font-bold">{index + 1}</span>
                </div>
              </motion.div>
            ))}

            {/* Arrow down indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="flex justify-center pt-2"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-px h-6 bg-gradient-to-b from-primary-500/40 to-transparent" />
                <svg className="w-4 h-4 text-primary-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Right: Mock dashboard card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-dark-800/80 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center"
                >
                  <div className="text-2xl font-bold text-white mb-1">{b.value}</div>
                  <div className="text-xs text-primary-400 font-medium mb-1">{b.label}</div>
                  <div className="text-xs text-slate-500">{b.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Mock lead table */}
            <div className="bg-dark-800/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-dark-700/30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white text-sm font-semibold">Live Lead List</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Export CSV
                </div>
              </div>
              {[
                { name: 'Amina Hassan', phone: '255712 345 678', type: 'Booking', status: 'NEW', time: '2 min ago' },
                { name: 'John Msangi', phone: '255754 891 234', type: 'Order', status: 'CONFIRMED', time: '14 min ago' },
                { name: 'Fatuma Ali', phone: '255789 012 345', type: 'Support', status: 'PENDING', time: '1h ago' },
                { name: 'David Ochieng', phone: '254712 567 890', type: 'Booking', status: 'NEW', time: '2h ago' },
              ].map((lead, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-center gap-3 px-5 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {lead.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{lead.name}</p>
                    <p className="text-slate-500 text-xs font-mono">{lead.phone}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    lead.status === 'NEW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    lead.status === 'CONFIRMED' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {lead.status}
                  </span>
                  <span className="text-slate-600 text-xs flex-shrink-0 hidden sm:block">{lead.time}</span>
                </motion.div>
              ))}
            </div>

            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 to-violet-500/10 rounded-3xl blur-2xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
