'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const features = [
  {
    icon: '📅',
    title: 'Instant Booking',
    description: 'Customers book appointments 24/7. No back-and-forth. No missed slots.',
  },
  {
    icon: '🛒',
    title: 'Order Processing',
    description: 'Take orders automatically. Send payment links. Track deliveries.',
  },
  {
    icon: '💬',
    title: 'Smart Responses',
    description: 'Answer FAQs instantly. Handle common questions without human intervention.',
  },
  {
    icon: '🌍',
    title: 'Swahili & English',
    description: 'Speak your customers\' language. Auto-detect and respond appropriately.',
  },
  {
    icon: '📊',
    title: 'Message Logs',
    description: 'See every conversation. Know what your customers are asking.',
  },
  {
    icon: '🔄',
    title: 'Human Handoff',
    description: 'Complex questions? Transfer to your team with full context.',
  },
];

export function SolutionSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 to-dark-950" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary-500/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-4">
            The Solution
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            Your WhatsApp,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
              Supercharged
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            All on your WhatsApp. All automatic. No new apps to learn. No complicated setup.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-primary-500/30 transition-all duration-300"
            >
              {/* Gradient on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Emphasis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-xl text-white font-medium">
            ✨ All on your WhatsApp. All automatic.
          </p>
          <p className="text-slate-400 mt-2">
            No new apps. No complicated setup. We handle everything.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
