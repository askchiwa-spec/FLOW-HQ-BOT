import {
  HeroSection,
  ProblemSection,
  SolutionSection,
  LeadGenSection,
  HowItWorks,
  PricingCards,
  Testimonials,
  FAQSection,
  CTASection,
} from '@/components';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section - The Cold Truth */}
      <ProblemSection />

      {/* Solution Section */}
      <SolutionSection />

      {/* Lead Generation Highlight */}
      <LeadGenSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Pricing */}
      <PricingCards />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <CTASection />
    </>
  );
}
