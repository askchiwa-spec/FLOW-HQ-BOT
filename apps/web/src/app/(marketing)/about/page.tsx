'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';

const team = [
  {
    name: 'Amina Mwalimu',
    role: 'Founder & CEO',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    socials: { linkedin: '#', twitter: '#' },
  },
  {
    name: 'David Kimaro',
    role: 'Lead Developer',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    socials: { linkedin: '#', twitter: '#' },
  },
  {
    name: 'Grace Mwakasege',
    role: 'Product Designer',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    socials: { linkedin: '#', twitter: '#' },
  },
  {
    name: 'Joseph Masanja',
    role: 'Operations Lead',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    socials: { linkedin: '#', twitter: '#' },
  },
];

const values = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'African-First',
    description: 'Built for African businesses, with deep understanding of local needs and challenges.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Simplicity',
    description: 'Powerful technology that feels simple. No training needed, just results.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.044-.133-2.05-.382-3.016z" />
      </svg>
    ),
    title: 'Trust',
    description: 'Your data is sacred. Enterprise-grade security with complete transparency.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Community',
    description: 'Growing together. We succeed when our customers thrive.',
  },
];

const stats = [
  { value: 500, suffix: '+', label: 'Active Businesses' },
  { value: 1, suffix: 'M+', label: 'Messages Processed' },
  { value: 98, suffix: '%', label: 'Uptime' },
  { value: 24, suffix: '/7', label: 'Support' },
];

export default function AboutPage() {
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true });

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=2000&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/80 via-dark-900/70 to-dark-900" />
        
        {/* Vector Pattern Overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-white mb-6">
              About <span className="text-primary-400">Flow HQ</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Empowering African businesses with intelligent automation, one conversation at a time.
            </p>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 w-20 h-20 opacity-20"
        >
          <svg viewBox="0 0 100 100">
            <polygon points="50,10 90,90 10,90" fill="none" stroke="#10b981" strokeWidth="2"/>
          </svg>
        </motion.div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-6">
                Our <span className="text-primary-400">Story</span>
              </h2>
              <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
                <p>
                  Flow HQ was born in Dar es Salaam, Tanzania, from a simple observation: 
                  small businesses were missing countless opportunities because they couldn't 
                  keep up with customer messages on WhatsApp.
                </p>
                <p>
                  Our founder, Amina, watched her aunt's salon lose bookings daily — not 
                  because of poor service, but because she couldn't respond to every inquiry 
                  while working with clients.
                </p>
                <p>
                  That's when we realized: what if WhatsApp could respond automatically? 
                  What if every business could have a 24/7 assistant, regardless of their 
                  size or budget?
                </p>
                <p className="text-primary-400 font-medium">
                  Flow HQ is our answer — built in Africa, for Africa, but ready for the world.
                </p>
              </div>
            </motion.div>

            {/* Image with Decorative Elements */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"
                  alt="Flow HQ team working"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 to-transparent" />
              </div>
              
              {/* Decorative Lines */}
              <svg className="absolute -top-4 -left-4 w-24 h-24 text-primary-500/30" viewBox="0 0 100 100">
                <path d="M 10 90 L 10 10 L 90 10" fill="none" stroke="currentColor" strokeWidth="3"/>
              </svg>
              <svg className="absolute -bottom-4 -right-4 w-24 h-24 text-secondary-500/30" viewBox="0 0 100 100">
                <path d="M 90 10 L 90 90 L 10 90" fill="none" stroke="currentColor" strokeWidth="3"/>
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden group"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center blur-sm scale-110 group-hover:scale-125 transition-transform duration-700"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-dark-900/80" />
              
              {/* Content */}
              <div className="relative p-8 sm:p-12">
                {/* Vector Icon */}
                <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-heading font-bold text-white mb-4">Our Mission</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  To democratize AI-powered customer engagement for every African business, 
                  enabling them to compete globally while staying rooted in local excellence.
                </p>
              </div>

              {/* African Pattern Decoration */}
              <svg className="absolute bottom-0 right-0 w-32 h-32 text-primary-500/10" viewBox="0 0 100 100">
                <pattern id="kitenge1" patternUnits="userSpaceOnUse" width="20" height="20">
                  <circle cx="10" cy="10" r="2" fill="currentColor"/>
                </pattern>
                <rect width="100" height="100" fill="url(#kitenge1)"/>
              </svg>
            </motion.div>

            {/* Vision Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden group"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center blur-sm scale-110 group-hover:scale-125 transition-transform duration-700"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-dark-900/80" />
              
              {/* Content */}
              <div className="relative p-8 sm:p-12">
                {/* Vector Icon */}
                <div className="w-16 h-16 rounded-2xl bg-secondary-500/20 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-heading font-bold text-white mb-4">Our Vision</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  A future where every African entrepreneur has access to world-class 
                  automation tools, transforming the continent into a global leader 
                  in digital commerce.
                </p>
              </div>

              {/* African Pattern Decoration */}
              <svg className="absolute bottom-0 right-0 w-32 h-32 text-secondary-500/10" viewBox="0 0 100 100">
                <pattern id="kitenge2" patternUnits="userSpaceOnUse" width="20" height="20">
                  <rect x="5" y="5" width="10" height="10" fill="currentColor" transform="rotate(45 10 10)"/>
                </pattern>
                <rect width="100" height="100" fill="url(#kitenge2)"/>
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
              Our <span className="text-primary-400">Values</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              The principles that guide everything we build and every decision we make.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="relative p-8 rounded-2xl bg-dark-800/50 border border-white/5 hover:border-primary-500/30 transition-all duration-300">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id={`value-pattern-${index}`} width="30" height="30" patternUnits="userSpaceOnUse">
                          <circle cx="15" cy="15" r="1" fill="#10b981"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#value-pattern-${index})`}/>
                    </svg>
                  </div>
                  
                  {/* Icon */}
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center text-primary-400 mb-6">
                    {value.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="relative text-xl font-semibold text-white mb-3">{value.title}</h3>
                  <p className="relative text-slate-400 leading-relaxed">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-800/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
              Meet the <span className="text-primary-400">Team</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              The passionate people behind Flow HQ, working to transform African business communication.
            </p>
          </motion.div>

          {/* Geometric Background */}
          <div className="relative">
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="team-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                    <polygon points="30,5 55,25 45,55 15,55 5,25" fill="none" stroke="#10b981" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#team-pattern)"/>
              </svg>
            </div>

            <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center group"
                >
                  {/* Photo */}
                  <div className="relative mx-auto w-32 h-32 mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary-500/50 transition-colors">
                      <img 
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-primary-400 text-sm mb-4">{member.role}</p>
                  
                  {/* Social Icons */}
                  <div className="flex justify-center gap-3">
                    <a href={member.socials.linkedin} className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary-500/20 flex items-center justify-center text-slate-400 hover:text-primary-400 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                    <a href={member.socials.twitter} className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary-500/20 flex items-center justify-center text-slate-400 hover:text-primary-400 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            ref={statsRef}
            className="relative rounded-3xl bg-gradient-to-br from-primary-500/10 via-dark-800 to-secondary-500/10 p-12 sm:p-16 overflow-hidden"
          >
            {/* Vector Elements */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="stats-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
                    <circle cx="40" cy="40" r="2" fill="#10b981"/>
                    <circle cx="0" cy="0" r="1" fill="#8b5cf6"/>
                    <circle cx="80" cy="80" r="1" fill="#8b5cf6"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#stats-pattern)"/>
              </svg>
            </div>

            <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                    {statsInView && (
                      <CountUp end={stat.value} duration={2.5} suffix={stat.suffix} />
                    )}
                  </div>
                  <div className="text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
