import Link from 'next/link';

const templates = [
  {
    name: 'Booking',
    description: 'Perfect for salons, clinics, and service businesses. Handle appointment bookings automatically.',
    features: ['Appointment scheduling', 'Service selection', 'Date/time preferences', 'Confirmation messages'],
    icon: '📅',
  },
  {
    name: 'E-commerce',
    description: 'Sell products directly through WhatsApp. Handle orders, pricing, and delivery inquiries.',
    features: ['Product catalog', 'Price inquiries', 'Order placement', 'Delivery tracking'],
    icon: '🛒',
  },
  {
    name: 'Support',
    description: 'Provide customer support with automated responses and ticket management.',
    features: ['FAQ responses', 'Issue tracking', 'Escalation handling', 'Working hours info'],
    icon: '🎧',
  },
];

export default function TemplatesPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Choose Your Template
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Select the template that best fits your business needs. Each template is customizable and supports both English and Swahili.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.name}
              className="flex flex-col justify-between rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200"
            >
              <div>
                <div className="text-4xl mb-4">{template.icon}</div>
                <h3 className="text-xl font-semibold leading-7 text-gray-900">
                  {template.name}
                </h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  {template.description}
                </p>
                <ul className="mt-6 space-y-2">
                  {template.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-gray-600">
                      <svg className="h-4 w-4 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/app/onboarding"
                className="mt-8 block w-full rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-primary-500"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
