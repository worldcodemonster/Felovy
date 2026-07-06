import { FELOVY_FAQS } from '@/lib/faqs';
import { SITE_NAME, SITE_TAGLINE, SITE_URL, absoluteUrl, DEFAULT_DESCRIPTION } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export function HomeStructuredData() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    description: DEFAULT_DESCRIPTION,
    slogan: SITE_TAGLINE,
    sameAs: [] as string[],
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/jobs')}?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FELOVY_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const professionalService = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    areaServed: 'Worldwide',
    serviceType: [
      'Software Development Outsourcing',
      'Remote Developer Hiring',
      'Software Job Board',
    ],
  };

  return (
    <>
      <JsonLd data={[organization, website, faqPage, professionalService]} />
    </>
  );
}
