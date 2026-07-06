'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FELOVY_FAQS } from '@/lib/faqs';

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
          {FELOVY_FAQS.map(({ question, answer }, i) => {
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
