'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const templates = [
  {
    id: 'booking',
    title: 'Booking & Appointments',
    description: 'Perfect for salons, clinics, and service businesses. Automate scheduling, reminders, and confirmations.',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    features: ['Auto-scheduling', 'Reminder messages', 'Rescheduling support', 'Multi-service booking'],
    popular: true,
  },
  {
    id: 'sales',
    title: 'Sales & Orders',
    description: 'For retail, e-commerce, and food delivery. Handle orders, track inventory, and process payments.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    features: ['Product catalog', 'Order tracking', 'Payment integration', 'Delivery updates'],
    popular: true,
  },
  {
    id: 'support',
    title: 'Customer Support',
    description: '24/7 automated support for any business. Answer FAQs, escalate issues, and collect feedback.',
    image: 'https://images.unsplash.com/photo-1553775263-80d0c8f0e7a7?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    features: ['FAQ automation', 'Ticket creation', 'Live agent handoff', 'Feedback collection'],
    popular: false,
  },
  {
    id: 'real-estate',
    title: 'Real Estate',
    description: 'Property listings, virtual tours, and appointment scheduling for real estate agents.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    features: ['Property listings', 'Virtual tours', 'Viewing schedules', 'Lead qualification'],
    popular: false,
  },
  {
    id: 'restaurant',
    title: 'Restaurant & Cafe',
    description: 'Table reservations, menu browsing, and delivery orders for food businesses.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    features: ['Table booking', 'Menu showcase', 'Delivery orders', 'Special offers'],
    popular: false,
  },
  {
    id: 'healthcare',
    title: 'Healthcare & Clinics',
    description: 'Patient appointments, prescription reminders, and health tips for medical practices.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    features: ['Appointment booking', 'Reminders', 'Health tips', 'Emergency contacts'],
    popular: false,
  },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent" />
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-secondary-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6">
              Ready-Made <span className="text-primary-400">Templates</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Get started in minutes with pre-built templates designed for African businesses. 
              Customize to match your brand and workflow.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button href="/app/onboarding" size="lg">
                Start Free Trial
              </Button>
              <Button href="#templates" variant="outline" size="lg">
                Browse Templates
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Templates Grid */}
      <section id="templates" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative h-full rounded-2xl overflow-hidden bg-dark-800/50 border border-white/5 hover:border-primary-500/30 transition-all duration-500">
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden">
                    {/* Background Image */}
                    <img 
                      src={template.image}
                      alt={template.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />
                    
                    {/* Popular Badge */}
                    {template.popular && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary-500/90 text-white text-xs font-medium backdrop-blur-sm">
                        Popular
                      </div>
                    )}
                    
                    {/* Vector Icon Overlay */}
                    <div className="absolute bottom-4 left-4 w-14 h-14 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:bg-primary-500/20 group-hover:border-primary-500/30 transition-all duration-300">
                      {template.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                      {template.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {template.features.map((feature) => (
                        <span 
                          key={feature}
                          className="px-2.5 py-1 rounded-full bg-white/5 text-slate-300 text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link 
                      href="/app/onboarding"
                      className="inline-flex items-center gap-2 text-primary-400 text-sm font-medium hover:text-primary-300 transition-colors"
                    >
                      Use this template
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Template CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/90 to-dark-900/80" />
            
            {/* Content */}
            <div className="relative p-8 sm:p-12 lg:p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/20 mb-6">
                <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
                Need a Custom Template?
              </h2>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
                Our team can build a tailored solution for your specific business needs. 
                From complex workflows to unique integrations, we've got you covered.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button href="/contact" size="lg">
                  Contact Sales
                </Button>
                <Button href="/app/onboarding" variant="outline" size="lg">
                  Start Free Trial
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
