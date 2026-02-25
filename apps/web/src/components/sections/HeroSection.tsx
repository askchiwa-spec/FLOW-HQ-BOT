'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { Button } from '../ui/Button';
import { useState, useEffect } from 'react';

const stats = [
  { value: 500, suffix: '+', label: 'Businesses' },
  { value: 50, suffix: 'k+', label: 'Messages' },
  { value: 24, suffix: '/7', label: 'Support' },
];

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="flex gap-1">
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 bg-gray-400 rounded-full"
        />
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          className="w-2 h-2 bg-gray-400 rounded-full"
        />
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          className="w-2 h-2 bg-gray-400 rounded-full"
        />
      </div>
      <span className="text-xs text-gray-400 ml-1">typing...</span>
    </div>
  );
}

export function HeroSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowTyping(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=2000&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Dark Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900/95 via-dark-900/85 to-dark-900/70 z-10" />
      
      {/* Circuit Pattern Overlay */}
      <div className="absolute inset-0 z-20 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 50 30 M 50 70 L 50 100 M 0 50 L 30 50 M 70 50 L 100 50" stroke="rgba(16,185,129,0.3)" strokeWidth="1" fill="none"/>
              <circle cx="50" cy="50" r="5" fill="rgba(16,185,129,0.2)"/>
              <circle cx="50" cy="30" r="3" fill="rgba(16,185,129,0.15)"/>
              <circle cx="50" cy="70" r="3" fill="rgba(16,185,129,0.15)"/>
              <circle cx="30" cy="50" r="3" fill="rgba(16,185,129,0.15)"/>
              <circle cx="70" cy="50" r="3" fill="rgba(16,185,129,0.15)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-10 w-32 h-32 opacity-10"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 90,90 10,90" fill="none" stroke="#10b981" strokeWidth="2"/>
          </svg>
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 right-20 w-24 h-24 opacity-10"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="#8b5cf6" strokeWidth="2"/>
          </svg>
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-1/4 left-1/4 w-40 h-40 opacity-5"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="1"/>
            <circle cx="50" cy="50" r="30" fill="none" stroke="#f59e0b" strokeWidth="1"/>
            <circle cx="50" cy="50" r="20" fill="none" stroke="#f59e0b" strokeWidth="1"/>
          </svg>
        </motion.div>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl z-20" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl z-20" />

      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <span className="text-primary-400 text-sm font-medium">
                Made in Tanzania 🇹🇿
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6">
              <span className="text-white">Your WhatsApp Should</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-300">
                Work for You
              </span>
              <br />
              <span className="text-white">— Not Tire You.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-xl leading-relaxed">
              Never miss a customer. Turn your WhatsApp into a 24/7 assistant that 
              handles bookings, orders, and support — automatically.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <Button href="/app/onboarding" size="lg">
                Get Started Free
              </Button>
              <Button href="#how-it-works" variant="outline" size="lg">
                See How It Works
              </Button>
            </div>

            {/* Stats */}
            <div ref={ref} className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center sm:text-left bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    {inView && (
                      <CountUp end={stat.value} duration={2} suffix={stat.suffix} />
                    )}
                  </div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual - Enhanced WhatsApp Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:flex justify-center"
          >
            {/* Phone Mockup */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-80"
              style={{
                perspective: '1000px',
                transform: 'rotateY(-5deg) rotateX(5deg)',
              }}
            >
              {/* Phone Frame */}
              <div 
                className="relative bg-white rounded-[3rem] shadow-2xl overflow-hidden"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.2)',
                }}
              >
                {/* Screen */}
                <div className="relative m-3 bg-[#0b141a] rounded-[2.5rem] overflow-hidden">
                  {/* WhatsApp Header with Profile */}
                  <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
                    {/* Back Arrow */}
                    <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    
                    {/* Profile Picture */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                        NB
                      </div>
                      {/* Online Status Indicator */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#202c33]" />
                    </div>
                    
                    {/* Business Name & Status */}
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">Nuru Beauty</div>
                      <div className="text-[#8696a0] text-xs flex items-center gap-1">
                        {showTyping ? (
                          <span className="text-primary-400">typing...</span>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            online
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Icons */}
                    <div className="flex gap-4">
                      <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Chat Background */}
                  <div 
                    className="absolute inset-0 top-14 opacity-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />
                  
                  {/* Chat Messages */}
                  <div className="relative p-4 space-y-3 min-h-[400px]">
                    {/* Date Divider */}
                    <div className="flex justify-center">
                      <span className="bg-[#1d282f] text-[#8696a0] text-xs px-3 py-1 rounded-lg">Today</span>
                    </div>

                    {/* Incoming Message */}
                    <div className="flex justify-start">
                      <div className="bg-[#025144] rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                        <p className="text-white text-sm">Hi, I want to book an appointment</p>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className="text-[#8696a0] text-xs">10:30 AM</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Outgoing Message */}
                    <div className="flex justify-end">
                      <div className="bg-[#005c4b] rounded-xl rounded-tr-sm p-3 max-w-[85%]">
                        <p className="text-white text-sm">Karibu! What service would you like?</p>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className="text-[#8696a0] text-xs">10:30 AM</span>
                          {/* Read Receipt - Double Blue Check */}
                          <svg className="w-4 h-4 text-[#53bdeb]" viewBox="0 0 16 15" fill="currentColor">
                            <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-1.88-1.88a.365.365 0 0 0-.517 0l-.423.423a.365.365 0 0 0 0 .516l2.67 2.67a.365.365 0 0 0 .516 0l6.016-6.817a.365.365 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.89 7.72a.365.365 0 0 0-.517 0l-.423.423a.365.365 0 0 0 0 .516l2.67 2.67a.365.365 0 0 0 .516 0l6.016-6.817a.365.365 0 0 0-.063-.51z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Quick Reply Buttons */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      {['Haircut', 'Massage', 'Facial'].map((service) => (
                        <motion.button
                          key={service}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-[#005c4b] rounded-full text-white text-sm border border-[#23a383]"
                        >
                          {service}
                        </motion.button>
                      ))}
                    </div>

                    {/* Incoming Message */}
                    <div className="flex justify-start">
                      <div className="bg-[#025144] rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                        <p className="text-white text-sm">Haircut please 💇</p>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className="text-[#8696a0] text-xs">10:31 AM</span>
                        </div>
                      </div>
                    </div>

                    {/* Outgoing Message with Slots */}
                    <div className="flex justify-end">
                      <div className="bg-[#005c4b] rounded-xl rounded-tr-sm p-3 max-w-[85%]">
                        <p className="text-white text-sm font-medium mb-2">Great! Available slots:</p>
                        <div className="space-y-1.5">
                          {['📅 Tomorrow 10 AM', '📅 Tomorrow 2 PM', '📅 Wed 11 AM'].map((slot, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + i * 0.1 }}
                              className="text-white/90 text-sm bg-white/10 rounded-lg px-3 py-1.5"
                            >
                              {slot}
                            </motion.div>
                          ))}
                        </div>
                        <div className="flex justify-end items-center gap-1 mt-2">
                          <span className="text-[#8696a0] text-xs">10:31 AM</span>
                          {/* Read Receipt */}
                          <svg className="w-4 h-4 text-[#53bdeb]" viewBox="0 0 16 15" fill="currentColor">
                            <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-1.88-1.88a.365.365 0 0 0-.517 0l-.423.423a.365.365 0 0 0 0 .516l2.67 2.67a.365.365 0 0 0 .516 0l6.016-6.817a.365.365 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.89 7.72a.365.365 0 0 0-.517 0l-.423.423a.365.365 0 0 0 0 .516l2.67 2.67a.365.365 0 0 0 .516 0l6.016-6.817a.365.365 0 0 0-.063-.51z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Typing Indicator */}
                    {showTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex justify-start"
                      >
                        <div className="bg-[#025144] rounded-xl rounded-tl-sm px-4 py-3">
                          <div className="flex gap-1">
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 bg-white/60 rounded-full"
                            />
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-white/60 rounded-full"
                            />
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-white/60 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input Bar */}
                  <div className="bg-[#202c33] p-3 flex items-center gap-3">
                    {/* Emoji Icon */}
                    <svg className="w-6 h-6 text-[#8696a0]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.038 1.091-12.129 0-12.129 0zm11.953 0c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.038 1.091-12.129 0-12.129 0zM12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                    </svg>
                    
                    {/* Input Field */}
                    <div className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2">
                      <span className="text-[#8696a0] text-sm">Type a message</span>
                    </div>
                    
                    {/* Attachment Icon */}
                    <svg className="w-6 h-6 text-[#8696a0]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.509-.507.789-1.19.789-1.918s-.28-1.411-.789-1.919l-.004-.003a2.71 2.71 0 0 0-1.915-.789 2.71 2.71 0 0 0-1.918.789l-9.548 9.548a1.088 1.088 0 0 0-.322.778c0 .295.115.571.322.778a1.1 1.1 0 0 0 1.556 0l7.418-7.418a.75.75 0 1 1 1.06 1.06l-7.418 7.418a2.61 2.61 0 0 1-1.848.767 2.61 2.61 0 0 1-1.848-.767 2.61 2.61 0 0 1 0-3.695l9.548-9.548a4.22 4.22 0 0 1 3.005-1.245 4.22 4.22 0 0 1 3.005 1.245l.004.003a4.22 4.22 0 0 1 1.245 3.004 4.22 4.22 0 0 1-1.245 3.005l-9.547 9.548a7.08 7.08 0 0 1-5.032 2.085 7.08 7.08 0 0 1-5.033-2.085C.584 18.468 0 17.058 0 15.556s.584-2.912 1.646-3.972l9.548-9.548a.75.75 0 1 1 1.06 1.06l-9.548 9.548a4.22 4.22 0 0 0-1.245 3.004 4.22 4.22 0 0 0 1.245 3.005l.004.003z"/>
                    </svg>
                    
                    {/* Camera Icon */}
                    <svg className="w-6 h-6 text-[#8696a0]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 15.991a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 1.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zM1.5 7.5a6 6 0 0 1 6-6h9a6 6 0 1 1 0 12h-9a6 6 0 0 1-6-6zm6-4.5a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0z"/>
                    </svg>
                    
                    {/* Send Button */}
                    <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-[4rem] blur-2xl -z-10" />
            </motion.div>

            {/* Floating Notification Cards */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-16 top-20 bg-white rounded-2xl p-4 shadow-xl z-10"
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </div>
                <div>
                  <div className="text-gray-900 text-sm font-medium">Booking Confirmed</div>
                  <div className="text-gray-500 text-xs">Tomorrow, 10:00 AM</div>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 bottom-40 bg-white rounded-2xl p-4 shadow-xl z-10"
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <div className="text-gray-900 text-sm font-medium">Auto-Reply Active</div>
                  <div className="text-gray-500 text-xs">Response time: 2s</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-900 to-transparent z-30" />
    </section>
  );
}
