'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const steps = [
  {
    number: '01',
    title: 'Share Your Details',
    description: 'Tell us about your business, your services, and how you want to handle customers.',
    icon: '📝',
  },
  {
    number: '02',
    title: 'We Set Everything Up',
    description: 'Our team configures your assistant, creates templates, and tests everything.',
    icon: '⚙️',
  },
  {
    number: '03',
    title: 'Scan & Go Live',
    description: 'Scan a QR code with your WhatsApp, and your assistant starts working instantly.',
    icon: '📱',
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="how-it-works" className="relative py-20 lg:py-32 bg-dark-950">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            Up and Running in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-primary-400">
              3 Simple Steps
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            No technical knowledge required. We handle the complexity so you can focus on your business.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-accent-500/20 -translate-y-1/2" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {/* Step Card */}
                <div className="relative bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-primary-500/30 transition-all duration-300">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-8 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="text-5xl mb-6 mt-2">{step.icon}</div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>

                {/* Arrow (Mobile) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Time Estimate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-dark-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
            <span className="text-2xl">⏱️</span>
            <span className="text-white font-medium">Average setup time:</span>
            <span className="text-primary-400 font-bold">2-3 business days</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
