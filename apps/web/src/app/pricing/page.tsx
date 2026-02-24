'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: 'Do I need a new WhatsApp number?',
      answer: 'No. We use your existing business WhatsApp. You keep your current number and all your contacts.',
    },
    {
      question: 'Is this difficult to manage?',
      answer: 'No. We handle setup for you. Once activated, the assistant runs automatically. You only respond when you want to.',
    },
    {
      question: 'Can I stop anytime?',
      answer: 'Yes. You can cancel your monthly subscription anytime. No long-term contracts.',
    },
    {
      question: 'Can it connect customers to a real person?',
      answer: 'Yes. It can transfer conversations to your staff anytime. You stay in control.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-slate-900 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Simple Pricing.
            <br />
            <span className="text-emerald-400">Serious Business Results.</span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            We don&apos;t sell software.
          </p>
          <p className="mt-4 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            We install and manage your WhatsApp Business Assistant for you.
          </p>
          <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
            Everything is handled professionally from setup to activation.
          </p>
        </div>
      </section>

      {/* Main Pricing Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="max-w-5xl mx-auto">
          {/* Business Assistant Plan */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Plan Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Business Assistant Plan
              </h2>
              <p className="mt-2 text-emerald-100">
                Complete WhatsApp automation for your business
              </p>
            </div>

            {/* Pricing Display */}
            <div className="px-8 py-8 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-bold text-slate-900">
                    350,000
                  </span>
                  <span className="text-xl text-slate-600">TZS</span>
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-900">Setup</span> (One-Time)
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-6 border-t border-slate-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-bold text-emerald-600">
                    100,000
                  </span>
                  <span className="text-xl text-slate-600">TZS</span>
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-900">Per Month</span>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="px-8 py-8 grid md:grid-cols-3 gap-8">
              {/* Setup Includes */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">
                    1
                  </span>
                  Setup Includes
                </h3>
                <ul className="space-y-3">
                  {[
                    'Full WhatsApp assistant installation on your number',
                    'Business information configuration',
                    'Booking or sales workflow setup',
                    'Swahili & English responses',
                    'Testing and activation',
                    'Initial support during onboarding',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600">
                      <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Monthly Includes */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">
                    2
                  </span>
                  Monthly Includes
                </h3>
                <ul className="space-y-3">
                  {[
                    '24/7 automatic replies',
                    'Booking or sales automation',
                    'AI-powered customer responses',
                    'System monitoring',
                    'Ongoing updates',
                    'Technical support',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600">
                      <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best For */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">
                    3
                  </span>
                  Best For
                </h3>
                <ul className="space-y-3">
                  {[
                    'Salons & spas',
                    'Spare parts shops',
                    'Restaurants',
                    'Clinics',
                    'Real estate agents',
                    'Growing small businesses',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600">
                      <svg className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="px-8 py-8 bg-slate-50">
              <Link
                href="/contact"
                className="block w-full sm:w-auto sm:inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Get Started Today
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <p className="mt-4 text-sm text-slate-500">
                No commitment required. Setup takes 2-3 business days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Plan Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-12">
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-1 bg-slate-900 text-white text-sm font-medium rounded-full mb-4">
                Premium
              </span>
              <h2 className="text-3xl font-bold text-slate-900">
                Premium Business Automation
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                Custom Pricing – Let&apos;s Discuss Your Needs
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                'Advanced automation flows',
                'Payment integrations',
                'CRM integration',
                'Multiple branches',
                'High-volume message handling',
                'Fully customized AI training',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Request Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Calculation Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 md:p-12 border border-amber-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-8">
              How Much Is One Missed Customer Worth?
            </h2>

            <div className="space-y-6 text-center">
              <p className="text-lg text-slate-700">
                If you miss <span className="font-bold text-amber-700">3 customers per day</span>
              </p>
              <p className="text-lg text-slate-700">
                And each customer spends <span className="font-bold text-amber-700">20,000 TZS</span>
              </p>

              <div className="py-6 border-y border-amber-200 my-6">
                <p className="text-xl text-slate-800 font-medium">
                  That is <span className="text-2xl font-bold text-red-600">60,000 TZS</span> per day lost.
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">
                  1,800,000 TZS per month.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-lg text-slate-800 font-medium">
                  Your WhatsApp assistant works <span className="text-emerald-600 font-bold">24 hours</span>.
                </p>
                <p className="text-lg text-slate-800 font-medium mt-2">
                  It never sleeps.
                </p>
                <p className="text-lg text-slate-800 font-medium">
                  It never delays.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    openFaq === index ? 'max-h-40' : 'max-h-0'
                  }`}
                >
                  <p className="px-6 pb-5 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Never Miss a Customer Again?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Join hundreds of Tanzanian businesses using Flow HQ to grow their customer service.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Your Setup Today
          </Link>
        </div>
      </section>
    </div>
  );
}
