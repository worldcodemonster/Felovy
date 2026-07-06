import type { Metadata } from 'next';
import { buildPageMetadata, truncate, absoluteUrl } from '@/lib/seo';
import { getJobSeo } from '@/lib/seo-server';
import { JsonLd } from '@/components/seo/JsonLd';

type Props = { params: { id: string }; children: React.ReactNode };

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getJobSeo(params.id);

  if (!job) {
    return buildPageMetadata({
      title: 'Job Not Found',
      description: 'This job listing could not be found on Felovy.',
      path: `/jobs/${params.id}`,
      noIndex: true,
    });
  }

  const company = job.employer?.companyName || 'Company';
  const location = job.companyLocation || job.employer?.companyLocation || 'Remote';
  const skills = job.requiredSkills?.slice(0, 5).join(', ');
  const description = truncate(
    job.description ||
      `${job.title} at ${company}. ${location}. ${skills ? `Skills: ${skills}.` : ''} Apply on Felovy.`,
    160,
  );

  return buildPageMetadata({
    title: `${job.title} at ${company}`,
    description,
    path: `/jobs/${job.id}`,
    type: 'article',
    keywords: [
      job.title,
      company,
      ...(job.requiredSkills || []),
      job.industry || 'software',
      'remote job',
      'Felovy',
    ].filter(Boolean),
  });
}

async function JobJsonLd({ id }: { id: string }) {
  const job = await getJobSeo(id);
  if (!job) return null;

  const company = job.employer?.companyName || 'Company';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `${job.title} — apply on Felovy`,
    datePosted: (job.publishedAt || job.updatedAt)?.toISOString(),
    validThrough: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.companyLocation || 'Remote',
      },
    },
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    jobLocationType: job.locationType === 'REMOTE' ? 'TELECOMMUTE' : undefined,
    url: absoluteUrl(`/jobs/${job.id}`),
    ...(job.salaryMin || job.salaryMax
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.currency || 'USD',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMin,
              maxValue: job.salaryMax,
              unitText: job.salaryType || 'YEAR',
            },
          },
        }
      : {}),
    skills: job.requiredSkills?.join(', '),
  };

  return <JsonLd data={data} />;
}

export default async function JobDetailLayout({ params, children }: Props) {
  return (
    <>
      <JobJsonLd id={params.id} />
      {children}
    </>
  );
}
