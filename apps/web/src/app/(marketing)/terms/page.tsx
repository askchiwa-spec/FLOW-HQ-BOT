import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Chatisha',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-heading font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: March 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account and using Chatisha, you agree to these Terms of Service. If you do not agree,
              please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Use of Service</h2>
            <p>
              Chatisha provides WhatsApp automation tools for businesses. You are responsible for ensuring your use
              complies with WhatsApp's Terms of Service and applicable laws in your jurisdiction. You may not use
              Chatisha to send spam, engage in fraud, or harass users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account Responsibility</h2>
            <p>
              You are responsible for maintaining the security of your account credentials and for all activity
              that occurs under your account. Notify us immediately at{' '}
              <a href="mailto:business@chatisha.io" className="text-primary-400 hover:text-primary-300">
                business@chatisha.io
              </a>{' '}
              if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Service Availability</h2>
            <p>
              We aim to provide a reliable service but cannot guarantee 100% uptime. We may perform maintenance
              or experience outages. We are not liable for losses resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. AI-Generated Content</h2>
            <p>
              Chatisha uses AI to generate responses sent via your WhatsApp bot. You are responsible for reviewing
              the quality and accuracy of AI responses. Chatisha is not liable for incorrect or inappropriate
              AI-generated content sent to your customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms. You may cancel your
              account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the service after changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact</h2>
            <p>
              Questions about these terms? Contact us at{' '}
              <a href="mailto:business@chatisha.io" className="text-primary-400 hover:text-primary-300">
                business@chatisha.io
              </a>{' '}
              or via our{' '}
              <Link href="/contact" className="text-primary-400 hover:text-primary-300">
                contact page
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
