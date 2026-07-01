'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, Quote } from 'lucide-react';

const devTestimonials = [
  {
    quote: 'Felovy helped me land a $150k/yr fully remote contract from Nigeria. The verification gave the client instant trust. Complete game changer.',
    name: 'Emmanuel O.', role: 'Senior Backend Engineer', location: 'Lagos, Nigeria',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    grad: 'from-violet-500 to-purple-600', earn: '$150k/yr',
  },
  {
    quote: 'After 8 months on Felovy I earned more than my previous 2 years combined. The platform actually values developer expertise.',
    name: 'Carlos M.', role: 'Full Stack Developer', location: 'Bogotá, Colombia',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    grad: 'from-emerald-500 to-teal-600', earn: '3× income',
  },
  {
    quote: 'I got verified in 2 hours and received my first contract offer the same evening. Absolutely incredible experience.',
    name: 'Ivan P.', role: 'ML Engineer', location: 'Kyiv, Ukraine',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    grad: 'from-blue-500 to-indigo-600', earn: 'Hired same day',
  },
  {
    quote: 'No other platform treats developers as first-class citizens. My income tripled and I work fully remote from anywhere.',
    name: 'Tunde A.', role: 'Fullstack Developer', location: 'Lagos, Nigeria',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    grad: 'from-orange-500 to-amber-600', earn: '3× income',
  },
  {
    quote: 'The escrow system is flawless. I\'ve completed 22 projects with zero payment issues across multiple countries.',
    name: 'Fatima Z.', role: 'Mobile Developer', location: 'Casablanca, Morocco',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    grad: 'from-rose-500 to-pink-600', earn: '22 projects',
  },
  {
    quote: 'Felovy connected me with a startup in Berlin. I\'ve been their lead engineer for 14 months now — couldn\'t be happier.',
    name: 'Mei L.', role: 'Frontend Engineer', location: 'Shenzhen, China',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    grad: 'from-sky-500 to-blue-600', earn: '14 months',
  },
];

const clientTestimonials = [
  {
    quote: 'We hired 3 senior developers in under a week. All were exactly as skilled as their profiles showed. No surprises — just exceptional results.',
    name: 'Yuki T.', role: 'CTO, NeonStack', location: 'Tokyo, Japan',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
    grad: 'from-blue-500 to-indigo-600', metric: '3 devs in 1 week',
  },
  {
    quote: 'Building a remote team used to take months. With Felovy we assembled a world-class engineering team in 10 days.',
    name: 'Priya K.', role: 'Founder, CloudPilot', location: 'Bangalore, India',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    grad: 'from-amber-500 to-orange-600', metric: 'Team in 10 days',
  },
  {
    quote: 'The video intro system lets me shortlist in 10 minutes. I know exactly who I\'m hiring before the first call.',
    name: 'Sarah W.', role: 'Engineering Manager', location: 'London, UK',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    grad: 'from-rose-500 to-pink-600', metric: '10 min shortlist',
  },
  {
    quote: 'The escrow system removed all our payment anxiety. We\'ve completed 14 projects with zero disputes.',
    name: 'Marco B.', role: 'Product Lead, Axiom Labs', location: 'Berlin, Germany',
    photo: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=200&q=80',
    grad: 'from-sky-500 to-blue-600', metric: '14 projects',
  },
  {
    quote: 'I\'ve used Upwork, Toptal. Felovy is in a different league for quality. Every developer delivered beyond expectations.',
    name: 'Rachel C.', role: 'VP Engineering, Nexus', location: 'San Francisco, USA',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    grad: 'from-violet-500 to-purple-600', metric: '5★ every hire',
  },
  {
    quote: 'Our Felovy hire shipped our MVP in 6 weeks. The same scope would have taken our in-house team 6 months.',
    name: 'Tom H.', role: 'Founder, BuildFast', location: 'Sydney, Australia',
    photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&q=80',
    grad: 'from-emerald-500 to-teal-600', metric: '6× faster',
  },
];

export function TestimonialsSection() {
  const [tab, setTab] = useState<'devs' | 'clients'>('devs');
  const list = tab === 'devs' ? devTestimonials : clientTestimonials;
  const metricKey = tab === 'devs' ? 'earn' : 'metric';

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex items-center justify-center mb-14">
        <div className="inline-flex rounded-2xl bg-gray-100 p-1.5 gap-1">
          {[
            { key: 'devs', label: '👨‍💻 Developer Stories' },
            { key: 'clients', label: '🏢 Client Reviews' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as 'devs' | 'clients')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                tab === key
                  ? 'bg-white text-felovy-red shadow-md shadow-rose-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((t, i) => {
          const metric = (t as any)[metricKey];
          return (
            <div
              key={t.name}
              className="group relative bg-white rounded-3xl border border-gray-100 p-7 hover:shadow-2xl hover:shadow-rose-100/30 hover:-translate-y-1.5 transition-all duration-500 flex flex-col overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.grad} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Quote icon */}
              <Quote className="h-8 w-8 text-gray-100 mb-4 group-hover:text-rose-100 transition-colors duration-300" />

              {/* Metric badge */}
              <div className={`inline-flex self-start items-center bg-gradient-to-r ${t.grad} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4`}>
                {metric}
              </div>

              {/* Quote */}
              <p className="text-gray-700 leading-relaxed text-sm flex-1 mb-6">"{t.quote}"</p>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="relative h-11 w-11 rounded-full overflow-hidden shrink-0 ring-2 ring-offset-1 ring-gray-100 group-hover:ring-felovy-red/20 transition-all duration-300">
                  <Image src={t.photo} alt={t.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <span>📍</span>{t.location}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
