import type { Metadata } from 'next';
import { buildPageMetadata, truncate, absoluteUrl } from '@/lib/seo';
import { getDeveloperSeo } from '@/lib/seo-server';
import { JsonLd } from '@/components/seo/JsonLd';

type Props = { params: { id: string }; children: React.ReactNode };

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const dev = await getDeveloperSeo(params.id);

  if (!dev) {
    return buildPageMetadata({
      title: 'Developer Not Found',
      description: 'This developer profile could not be found on Felovy.',
      path: `/developers/${params.id}`,
      noIndex: true,
    });
  }

  const name = dev.fullName || 'Developer';
  const title = dev.title || 'Software Developer';
  const location = [dev.location, dev.country].filter(Boolean).join(', ');
  const skills = dev.skills?.slice(0, 6).join(', ');
  const description = truncate(
    dev.summary ||
      `${name} — ${title}${location ? ` based in ${location}` : ''}. ${skills ? `Skills: ${skills}.` : ''} View profile on Felovy.`,
    160,
  );

  return buildPageMetadata({
    title: `${name} — ${title}`,
    description,
    path: `/developers/${dev.id}`,
    type: 'website',
    image: dev.photoUrl || '/logo.png',
    keywords: [name, title, ...(dev.skills || []), 'Felovy developer', 'remote developer'].filter(
      Boolean,
    ),
  });
}

async function DeveloperJsonLd({ id }: { id: string }) {
  const dev = await getDeveloperSeo(id);
  if (!dev || !dev.fullName) return null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: dev.fullName,
    jobTitle: dev.title || 'Software Developer',
    description: dev.summary,
    url: absoluteUrl(`/developers/${dev.id}`),
    ...(dev.photoUrl ? { image: dev.photoUrl } : {}),
    knowsAbout: dev.skills,
    ...(dev.location || dev.country
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: dev.location,
            addressCountry: dev.country,
          },
        }
      : {}),
  };

  return <JsonLd data={data} />;
}

export default async function DeveloperDetailLayout({ params, children }: Props) {
  return (
    <>
      <DeveloperJsonLd id={params.id} />
      {children}
    </>
  );
}
