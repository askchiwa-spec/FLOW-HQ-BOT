'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const faqs = [
  {
    question: 'Do I need a new WhatsApp number?',
    answer: 'No, you can use your existing business WhatsApp number. We connect to your current account so you keep all your contacts and chat history. There\'s no need to inform your customers about any changes.',
  },
  {
    question: 'Is it difficult to set up?',
    answer: 'Not at all! Our team handles the entire setup process for you. Just provide your business details and we\'ll have you running within 2-3 business days. You just need to scan a QR code with your WhatsApp to activate.',
  },
  {
    question: 'How much does it cost?',
    answer: 'Our Business Assistant plan is 350,000 TZS one-time setup plus 100,000 TZS monthly. This includes WhatsApp automation, 1 template, Swahili & English support, message logs, and email support. We also offer Premium plans for larger businesses.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, there are no long-term contracts. You can cancel your monthly subscription at any time with no penalties. We also offer a 7-day money-back guarantee if you\'re not satisfied.',
  },
  {
    question: 'Can customers talk to a real person?',
    answer: 'Absolutely! The assistant can transfer conversations to your staff anytime. You stay in full control of when to take over. Complex queries are automatically flagged for human attention.',
  },
  {
    question: 'Does it support Swahili?',
    answer: 'Yes! Our templates support both English and Swahili. The system can auto-detect the language your customer is using and respond appropriately. You can also set a default language for your business.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept bank transfers, mobile money (M-Pesa, Tigo Pesa, Airtel Money), and major credit cards for monthly subscriptions. We\'re adding more payment options regularly.',
  },
  {
    question: 'How does the WhatsApp connection work?',
    answer: 'We use the official WhatsApp Business API through a secure connection. You simply scan a QR code with your WhatsApp to link your account. Your data remains private and secure.',
  },
  {
    question: 'What if I have multiple business locations?',
    answer: 'Our Premium plan supports multiple WhatsApp numbers and locations. Each location can have its own template and settings. Contact us for custom pricing.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we take security seriously. All data is encrypted in transit and at rest. We never share your customer data with third parties. Our infrastructure is hosted on secure cloud servers with regular backups.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />
      
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 text-sm font-medium mb-4">
            FAQ
          </span>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4">
            Frequently Asked{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-primary-400">
              Questions
            </span>
          </h1>
          <p className="text-lg text-slate-400">
            Got questions? We've got answers. If you don't find what you're looking for, 
            feel free to <a href="/contact" className="text-primary-400 hover:text-primary-300">contact us</a>.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-white pr-4">{faq.question}</span>
                <div
                  className={`w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center transition-transform duration-300 flex-shrink-0 ${
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

        {/* Still Have Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
            <p className="text-slate-400 mb-6">
              Can't find the answer you're looking for? Our team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact">Contact Support</Button>
              <Button href="https://wa.me/255712345678" variant="outline">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
