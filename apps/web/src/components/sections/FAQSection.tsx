'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const faqs = [
  {
    question: 'Do I need a new WhatsApp number?',
    answer: 'No, you can use your existing business WhatsApp number. We connect to your current account so you keep all your contacts and chat history.',
  },
  {
    question: 'Is it difficult to set up?',
    answer: 'Not at all! Our team handles the entire setup process for you. Just provide your business details and we\'ll have you running within 2-3 business days.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, there are no long-term contracts. You can cancel your monthly subscription at any time with no penalties.',
  },
  {
    question: 'Can customers talk to a real person?',
    answer: 'Absolutely! The assistant can transfer conversations to your staff anytime. You stay in full control of when to take over.',
  },
  {
    question: 'Does it support Swahili?',
    answer: 'Yes! Our templates support both English and Swahili. You can choose your preferred language during setup.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept bank transfers, mobile money (M-Pesa, Tigo Pesa, Airtel Money), and major credit cards for monthly subscriptions.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="relative py-20 lg:py-32 bg-dark-900">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            Frequently Asked{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-primary-400">
              Questions
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            Got questions? We've got answers.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.05 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-white pr-4">{faq.question}</span>
                <div
                  className={`w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center transition-transform duration-300 ${
                    openIndex === index ? 'rotate-45' : ''
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-primary-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="px-6 pb-5 text-slate-400 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
