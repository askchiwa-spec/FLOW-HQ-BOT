'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    templateType: 'BOOKING',
    whatsappNumber: '',
    language: 'SW',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/portal/setup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/app/status');
      }
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Complete Your Setup</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Name</label>
          <input
            type="text"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Business Type</label>
          <input
            type="text"
            required
            placeholder="e.g., Salon, Clinic, Store"
            value={formData.businessType}
            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Template</label>
          <select
            value={formData.templateType}
            onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="BOOKING">Booking (Appointments)</option>
            <option value="ECOMMERCE">E-commerce (Sales)</option>
            <option value="SUPPORT">Support (Customer Service)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
          <input
            type="tel"
            required
            placeholder="+255XXXXXXXXX"
            value={formData.whatsappNumber}
            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="SW">Swahili</option>
            <option value="EN">English</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Setup Request'}
        </button>
      </form>
    </div>
  );
}
