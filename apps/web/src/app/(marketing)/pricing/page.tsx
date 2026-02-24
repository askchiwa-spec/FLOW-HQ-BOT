import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for small businesses getting started.',
    features: [
      '1 WhatsApp number',
      'Up to 500 messages/month',
      'Booking template',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Business',
    price: '$79',
    period: '/month',
    description: 'For growing businesses with higher volume.',
    features: [
      '3 WhatsApp numbers',
      'Up to 2,000 messages/month',
      'All templates',
      'Advanced analytics',
      'Priority support',
      'Custom responses',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with custom needs.',
    features: [
      'Unlimited WhatsApp numbers',
      'Unlimited messages',
      'All templates + Custom',
      'Full analytics suite',
      '24/7 dedicated support',
      'API access',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Choose the plan that fits your business. All plans include a 14-day free trial.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 ring-1 ${
                plan.popular ? 'ring-primary-600 bg-primary-50' : 'ring-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <p className="rounded-full bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white w-fit mb-4">
                  Most Popular
                </p>
              )}
              <h3 className="text-lg font-semibold leading-8 text-gray-900">{plan.name}</h3>
              <p className="mt-4 text-sm leading-6 text-gray-600">{plan.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">{plan.price}</span>
                <span className="text-sm font-semibold leading-6 text-gray-600">{plan.period}</span>
              </p>
              <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.name === 'Enterprise' ? '/contact' : '/app/onboarding'}
                className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 ${
                  plan.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-500'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
