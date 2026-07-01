'use client';

import { useEffect } from 'react';

export function ScrollReveal() {
  useEffect(() => {
    document.documentElement.classList.add('js-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const observe = () => {
      document.querySelectorAll('[data-animate]').forEach((el) => {
        observer.observe(el);
      });
    };

    observe();
    const timer = setTimeout(observe, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
