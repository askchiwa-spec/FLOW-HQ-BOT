import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">
                Flow HQ
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/templates" className="text-gray-600 hover:text-gray-900">
                Templates
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                Contact
              </Link>
              <Link
                href="/app/onboarding"
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
