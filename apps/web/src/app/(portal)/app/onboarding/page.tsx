'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { validateWhatsAppNumber, getSupportedCountries } from '@/lib/validators';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const templateFromUrl = searchParams.get('template');
  const validTemplates = ['SALON', 'RESTAURANT', 'HOTEL', 'HEALTHCARE', 'ECOMMERCE', 'BOOKING', 'SUPPORT', 'REAL_ESTATE'];
  const initialTemplate = templateFromUrl && validTemplates.includes(templateFromUrl)
    ? templateFromUrl
    : 'SALON';

  useEffect(() => {
    if (status === 'loading') return;
    if ((session?.user as any)?.hasSetupRequest) {
      router.replace('/app/status');
    }
  }, [session, status, router]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    templateType: initialTemplate,
    whatsappNumber: '',
    language: 'SW',
  });

  const supportedCountries = getSupportedCountries();

  const handlePhoneChange = (value: string) => {
    if (value.length > 4) {
      const result = validateWhatsAppNumber(value);
      if (!result.isValid) {
        setPhoneError(result.error || 'Invalid number');
        setFormData((prev) => ({ ...prev, whatsappNumber: value }));
      } else {
        setPhoneError(null);
        setFormData((prev) => ({ ...prev, whatsappNumber: result.formatted || value }));
      }
    } else {
      setPhoneError(null);
      setFormData((prev) => ({ ...prev, whatsappNumber: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate phone before submit
    const phoneValidation = validateWhatsAppNumber(formData.whatsappNumber);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/portal/setup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          whatsappNumber: phoneValidation.formatted,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/app/status');
      } else {
        setError(data.error || 'Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
          Complete Your <span className="text-primary-400">Setup</span>
        </h1>
        <p className="text-lg text-slate-400">
          Tell us about your business and we'll get your WhatsApp automation ready.
        </p>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Business Name
            </label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              placeholder="e.g., Nuru Beauty Salon"
            />
          </div>

          {/* Template Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              What do you need?
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { value: 'SALON', label: 'Salon & Beauty', icon: '💇', desc: 'Booking appointments & reminders' },
                { value: 'RESTAURANT', label: 'Restaurant', icon: '🍽️', desc: 'Menu, orders & table reservations' },
                { value: 'HOTEL', label: 'Hotel & Lodge', icon: '🏨', desc: 'Room inquiries & booking requests' },
                { value: 'HEALTHCARE', label: 'Clinic & Healthcare', icon: '🏥', desc: 'Patient appointments & reminders' },
                { value: 'ECOMMERCE', label: 'Shop & E-Commerce', icon: '🛒', desc: 'Products, orders & delivery' },
                { value: 'SUPPORT', label: 'General Support', icon: '💬', desc: 'FAQ, enquiries & customer service' },
                { value: 'REAL_ESTATE', label: 'Real Estate', icon: '🏠', desc: 'Property listings & viewing bookings' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, templateType: option.value })}
                  className={`
                    p-4 rounded-xl border text-left transition-all
                    ${formData.templateType === option.value
                      ? 'bg-primary-500/10 border-primary-500/30 text-white'
                      : 'bg-dark-700/30 border-white/5 text-slate-400 hover:border-white/20'
                    }
                  `}
                >
                  <span className="text-2xl mb-2 block">{option.icon}</span>
                  <span className="font-medium block">{option.label}</span>
                  <span className="text-xs opacity-70">{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              WhatsApp Number
            </label>
            <input
              type="tel"
              required
              value={formData.whatsappNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`w-full bg-dark-700/50 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 transition-colors ${
                phoneError ? 'border-red-500/50' : 'border-white/10 focus:border-primary-500'
              }`}
              placeholder="+255712345678"
            />
            {phoneError && (
              <p className="mt-2 text-sm text-red-400">{phoneError}</p>
            )}
            <p className="mt-2 text-sm text-slate-500">
              Supported: {supportedCountries.slice(0, 5).map(c => c.country).join(', ')}, etc.
            </p>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Response Language
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { value: 'SW', label: 'Swahili', flag: '🇹🇿', desc: 'Jibu kwa Kiswahili' },
                { value: 'EN', label: 'English', flag: '🇬🇧', desc: 'Reply in English' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, language: option.value })}
                  className={`
                    p-4 rounded-xl border text-left transition-all flex items-center gap-3
                    ${formData.language === option.value
                      ? 'bg-primary-500/10 border-primary-500/30 text-white'
                      : 'bg-dark-700/30 border-white/5 text-slate-400 hover:border-white/20'
                    }
                  `}
                >
                  <span className="text-2xl">{option.flag}</span>
                  <div>
                    <span className="font-medium block">{option.label}</span>
                    <span className="text-xs opacity-70">{option.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!phoneError}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Setup Request'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
