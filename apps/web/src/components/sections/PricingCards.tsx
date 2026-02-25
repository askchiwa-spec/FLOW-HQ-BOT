'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const plans = [
  {
    name: 'Business Assistant',
    subtitle: 'Perfect for small businesses',
    setupPrice: 350000,
    monthlyPrice: 100000,
    currency: 'TZS',
    features: [
      'WhatsApp automation',
      '1 template (Booking, Sales, or Support)',
      'Swahili & English support',
      'Message logs dashboard',
      'Human handoff capability',
      'Email support',
    ],
    popular: true,
    cta: 'Get Started',
  },
  {
    name: 'Premium',
    subtitle: 'For growing businesses',
    setupPrice: null,
    monthlyPrice: null,
    currency: 'TZS',
    features: [
      'Everything in Business Assistant',
      'Multiple templates',
      'Priority support',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    popular: false,
    cta: 'Contact Sales',
  },
];

export function PricingCards() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="pricing" className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            Simple, Transparent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-primary-400">
              Pricing
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            No hidden fees. No long-term contracts. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.2 }}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30'
                  : 'bg-dark-800/50 border border-white/10'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="primary">Most Popular</Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-sm">{plan.subtitle}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                {plan.setupPrice ? (
                  <>
                    <div className="mb-2">
                      <span className="text-slate-400 text-sm">One-time setup:</span>
                      <div className="text-3xl font-bold text-white">
                        {plan.currency} {plan.setupPrice.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Then monthly:</span>
                      <div className="text-3xl font-bold text-white">
                        {plan.currency} {plan.monthlyPrice?.toLocaleString()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-white">Custom Pricing</div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <svg className="w-5 h-5 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                href={plan.popular ? '/app/onboarding' : '/contact'}
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
              >
                {plan.cta}
              </Button>

              {/* Tooltip */}
              <p className="text-center text-slate-500 text-xs mt-4">
                {plan.popular ? (
                  <span title="Bei gani? - How much?">💡 Hover for Swahili translation</span>
                ) : (
                  'Contact us for a custom quote'
                )}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Money-back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-dark-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
            <span className="text-2xl">🛡️</span>
            <span className="text-white font-medium">7-day money-back guarantee</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
