export interface FaqItem {
  question: string;
  answer: string;
}

/** Shared FAQ copy — used on homepage and FAQ structured data */
export const FELOVY_FAQS: FaqItem[] = [
  {
    question: 'What is Felovy?',
    answer:
      'Felovy is a global software outsourcing platform that connects verified developers with companies hiring remote talent. Developers find high-paying jobs; employers access a vetted global bench.',
  },
  {
    question: 'How do developers get verified?',
    answer:
      'Developers complete their profile, submit portfolio and skills, and pass our verification review. Verified badges help you stand out to employers and unlock premium job opportunities.',
  },
  {
    question: 'How does hiring work for employers?',
    answer:
      'Create an employer account, post a job or browse developer profiles, and connect directly with candidates. Felovy handles discovery and trust — you choose who to hire.',
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
  {
    question: 'What tech stacks and services does Felovy cover?',
    answer:
      'Felovy covers twelve software domains including AI/ML, web and mobile development, cloud & DevOps, cybersecurity, Web3, games, UI/UX, QA testing, and AI data labeling — with 400+ technologies represented on our platform.',
  },
  {
    question: 'Why do employers need a company email to sign up?',
    answer:
      'Company email verification helps confirm that employer accounts represent real organizations, which keeps job listings trustworthy for developers.',
  },
];
