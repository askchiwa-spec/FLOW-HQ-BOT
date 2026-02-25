'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />
      
      <div className="relative max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* 404 Number */}
          <div className="text-9xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400 mb-4">
            404
          </div>

          {/* Message */}
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-slate-400 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Illustration */}
          <div className="text-8xl mb-8">
            🔍
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/">
              Go Home
            </Button>
            <Button href="/contact" variant="outline">
              Contact Support
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-slate-500 mb-4">Looking for something specific?</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/templates" className="text-primary-400 hover:text-primary-300 transition-colors">
                Templates
              </Link>
              <Link href="/pricing" className="text-primary-400 hover:text-primary-300 transition-colors">
                Pricing
              </Link>
              <Link href="/faq" className="text-primary-400 hover:text-primary-300 transition-colors">
                FAQ
              </Link>
              <Link href="/about" className="text-primary-400 hover:text-primary-300 transition-colors">
                About Us
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
