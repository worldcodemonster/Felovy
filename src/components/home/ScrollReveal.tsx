'use client';

import { useEffect } from 'react';

export function ScrollReveal() {
  useEffect(() => {
    document.documentElement.classList.add('js-reveal');

    const observed = new WeakSet<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    const observeNew = () => {
      document.querySelectorAll('[data-animate]').forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        observer.observe(el);
      });
    };

    observeNew();
    const timer = setTimeout(observeNew, 300);

    const mutation = new MutationObserver(observeNew);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      mutation.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
