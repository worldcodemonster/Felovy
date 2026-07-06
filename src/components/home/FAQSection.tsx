'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    question: 'What is Felovy?',
    answer:
      'Felovy is a global software outsourcing platform that connects verified developers with companies looking to hire remote talent. Developers find high-paying jobs; employers access a vetted global bench.',
  },
  {
    question: 'How do developers get verified?',
    answer:
      'Developers complete their profile, submit portfolio and skills, and pass our verification review. Verified badges help you stand out to employers and unlock premium job opportunities.',
  },
  {
    question: 'How does hiring work for employers?',
    answer:
      'Create an employer account, post a job or browse developer profiles, and connect directly with candidates. Felovy handles discovery and trust. You choose who to hire.',
  },
  {
    question: 'Is Felovy free to join?',
    answer:
      'Yes. Creating an account is free for both developers and employers. Developers can browse and apply to jobs at no cost. Employers pay when they post jobs or engage talent, depending on their plan.',
  },
  {
    question: 'Can I work remotely from any country?',
    answer:
      'Yes. Felovy is built for global remote work. Developers and employers collaborate across time zones. Our platform spans 50+ countries and growing.',
  },
  {
    question: 'How are payments handled?',
    answer:
      'Payment terms are agreed between developers and employers. Felovy provides the platform for discovery, hiring, and project management. Billing details are set per contract or job posting.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" className="py-12 md:py-16 bg-white border-t border-gray-100">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-felovy-red mb-3">
          Frequently asked questions
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            FAQS
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map(({ question, answer }, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={question}
                className={cn(
                  'rounded-2xl bg-white shadow-sm transition-shadow duration-200',
                  isOpen && 'shadow-md',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{question}</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200',
                      isOpen && 'rotate-180 text-felovy-red',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
