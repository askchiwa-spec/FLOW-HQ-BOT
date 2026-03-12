'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProfileData {
  businessName: string;
  whatsappNumber: string;
  language: string;
  templateType: string;
}

const TEMPLATE_OPTIONS = [
  { value: 'BOOKING', label: 'Booking & Appointments', desc: 'For clinics, salons, restaurants' },
  { value: 'ECOMMERCE', label: 'Sales & E-commerce', desc: 'For shops and product businesses' },
  { value: 'SUPPORT', label: 'Customer Support', desc: 'General FAQ and support' },
];

const LANGUAGE_OPTIONS = [
  { value: 'SW', label: 'Swahili' },
  { value: 'EN', label: 'English' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    businessName: '',
    whatsappNumber: '',
    language: 'SW',
    templateType: 'SUPPORT',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/portal/me')
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          businessName: data.tenant?.name || '',
          whatsappNumber: data.tenant?.phone_number || '',
          language: data.tenant?.config?.language || 'SW',
          templateType: data.tenant?.config?.template_type || 'SUPPORT',
        });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
          Business <span className="text-primary-400">Profile</span>
        </h1>
        <p className="text-slate-400">Update your business details and bot configuration</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSave}
        className="space-y-6"
      >
        {/* Business Name */}
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Business Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
              <input
                type="text"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-colors"
                placeholder="e.g. Mama Pima Clinic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">WhatsApp Number</label>
              <input
                type="text"
                value={profile.whatsappNumber}
                onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-colors"
                placeholder="e.g. +255712345678"
              />
              <p className="mt-1.5 text-xs text-slate-500">Include country code (e.g. +255 for Tanzania)</p>
            </div>
          </div>
        </div>

        {/* Bot Configuration */}
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Bot Configuration</h2>
          <div className="space-y-4">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bot Language</label>
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setProfile({ ...profile, language: lang.value })}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      profile.language === lang.value
                        ? 'bg-primary-500/10 border-primary-500/40 text-primary-400'
                        : 'bg-dark-700/50 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bot Template</label>
              <div className="space-y-2">
                {TEMPLATE_OPTIONS.map((tmpl) => (
                  <button
                    key={tmpl.value}
                    type="button"
                    onClick={() => setProfile({ ...profile, templateType: tmpl.value })}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border text-left transition-all ${
                      profile.templateType === tmpl.value
                        ? 'bg-primary-500/10 border-primary-500/40'
                        : 'bg-dark-700/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        profile.templateType === tmpl.value ? 'border-primary-400' : 'border-slate-600'
                      }`}
                    >
                      {profile.templateType === tmpl.value && (
                        <div className="w-2 h-2 rounded-full bg-primary-400" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${profile.templateType === tmpl.value ? 'text-primary-400' : 'text-white'}`}>
                        {tmpl.label}
                      </p>
                      <p className="text-xs text-slate-500">{tmpl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {saved && (
          <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            Profile saved successfully!
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-6 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.form>
    </div>
  );
}
