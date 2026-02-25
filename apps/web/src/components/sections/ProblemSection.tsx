'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';

const problems = [
  {
    icon: '😔',
    title: 'Missed Customers',
    description: 'Every unanswered message is a lost sale. Customers move on when they don\'t get instant responses.',
  },
  {
    icon: '😫',
    title: 'Overwhelmed Staff',
    description: 'Your team is tired of answering the same questions over and over. Burnout is real.',
  },
  {
    icon: '😴',
    title: 'After-Hours Silence',
    description: 'Business stops when you close. But customers don\'t stop messaging at 9 PM.',
  },
  {
    icon: '📈',
    title: 'No Time to Grow',
    description: 'You\'re stuck replying to messages instead of building your business.',
  },
];

export function ProblemSection() {
  const [missedCustomers, setMissedCustomers] = useState(3);
  const [avgValue, setAvgValue] = useState(15000);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const dailyLoss = missedCustomers * avgValue;
  const monthlyLoss = dailyLoss * 30;

  return (
    <section className="relative py-20 lg:py-32 bg-dark-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-900" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-4">
            The Cold Truth
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            Every Missed Message{' '}
            <span className="text-red-400">Costs You Money</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            You're losing customers while you sleep, eat, or focus on other work.
            Here's what that looks like in real numbers.
          </p>
        </motion.div>

        {/* Value Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-dark-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6 lg:p-8 mb-16"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Sliders */}
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Missed customers per day: <span className="text-primary-400">{missedCustomers}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={missedCustomers}
                  onChange={(e) => setMissedCustomers(Number(e.target.value))}
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Average customer value (TZS): <span className="text-primary-400">{avgValue.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min="5000"
                  max="50000"
                  step="5000"
                  value={avgValue}
                  onChange={(e) => setAvgValue(Number(e.target.value))}
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5,000</span>
                  <span>27,500</span>
                  <span>50,000</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl p-6 border border-red-500/20">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">You're losing every month:</p>
                <div className="text-4xl lg:text-5xl font-bold text-red-400 mb-4">
                  TZS {inView && (
                    <CountUp
                      key={monthlyLoss}
                      end={monthlyLoss}
                      duration={1}
                      separator=","
                    />
                  )}
                </div>
                <p className="text-slate-500 text-sm">
                  That's <span className="text-white font-medium">{missedCustomers * 30} missed customers</span> per month
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-red-500/20 transition-colors"
            >
              <div className="text-4xl mb-4">{problem.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{problem.title}</h3>
              <p className="text-slate-400 text-sm">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
