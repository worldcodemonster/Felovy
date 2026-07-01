import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/database';

const MOCK_DEVELOPERS = [
  {
    email: 'alice.chen@felovy.dev',
    profile: {
      fullName: 'Alice Chen',
      title: 'Full Stack Developer',
      country: 'United States',
      location: 'San Francisco, CA',
      phone: '+1 415 000 0001',
      linkedin: 'https://linkedin.com/in/alicechen',
      github: 'https://github.com/alicechen',
      summary:
        'Passionate full-stack developer with 6 years building scalable web applications. I thrive on clean architecture, thoughtful APIs, and seamless user experiences.',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
      languages: ['English', 'Mandarin'],
      profileStep: 4,
      isVerified: true,
      workExperience: [
        {
          company: 'Stripe',
          role: 'Senior Software Engineer',
          startDate: '2021-03',
          current: true,
          description: 'Building payment infrastructure used by millions of businesses worldwide.',
        },
        {
          company: 'Airbnb',
          role: 'Software Engineer',
          startDate: '2018-06',
          endDate: '2021-02',
          current: false,
          description: 'Developed core booking flow features and improved API response times by 40%.',
        },
      ],
      education: [
        {
          institution: 'Stanford University',
          degree: 'B.S.',
          field: 'Computer Science',
          startDate: '2014-09',
          endDate: '2018-05',
          current: false,
        },
      ],
    },
  },
  {
    email: 'marcus.johnson@felovy.dev',
    profile: {
      fullName: 'Marcus Johnson',
      title: 'Mobile Developer',
      country: 'United States',
      location: 'New York, NY',
      phone: '+1 212 000 0002',
      github: 'https://github.com/marcusj',
      summary:
        'Mobile-first engineer with deep expertise in React Native and Flutter. Built apps with 1M+ downloads on both App Store and Google Play.',
      skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
      languages: ['English', 'Spanish'],
      profileStep: 4,
      isVerified: false,
      workExperience: [
        {
          company: 'Spotify',
          role: 'Mobile Engineer',
          startDate: '2020-01',
          current: true,
          description: 'Working on the iOS and Android client apps, improving streaming performance and offline mode.',
        },
      ],
      education: [
        {
          institution: 'NYU Tandon',
          degree: 'B.S.',
          field: 'Software Engineering',
          startDate: '2015-09',
          endDate: '2019-05',
          current: false,
        },
      ],
    },
  },
  {
    email: 'sara.petrov@felovy.dev',
    profile: {
      fullName: 'Sara Petrov',
      title: 'Backend Engineer',
      country: 'Germany',
      location: 'Berlin, Germany',
      phone: '+49 30 000 0003',
      linkedin: 'https://linkedin.com/in/sarapetrov',
      summary:
        'Backend specialist focused on distributed systems and high-throughput APIs. Comfortable owning the full lifecycle from design to production monitoring.',
      skills: ['Python', 'Django', 'FastAPI', 'Redis', 'Kafka', 'Kubernetes'],
      languages: ['English', 'German', 'Russian'],
      profileStep: 3,
      isVerified: false,
      workExperience: [
        {
          company: 'Zalando',
          role: 'Backend Engineer',
          startDate: '2022-04',
          current: true,
          description: 'Designing microservices for the catalog and search platform.',
        },
      ],
      education: [
        {
          institution: 'TU Berlin',
          degree: 'M.Sc.',
          field: 'Computer Science',
          startDate: '2017-10',
          endDate: '2020-03',
          current: false,
        },
      ],
    },
  },
  {
    email: 'david.kim@felovy.dev',
    profile: {
      fullName: 'David Kim',
      title: 'Frontend Developer',
      country: 'South Korea',
      location: 'Seoul, South Korea',
      phone: '+82 2 000 0004',
      linkedin: 'https://linkedin.com/in/davidkim-dev',
      github: 'https://github.com/davidkim',
      summary:
        'UI-focused developer who cares deeply about accessibility, performance, and pixel-perfect design. Bridging the gap between design and engineering.',
      skills: ['Vue.js', 'Nuxt', 'React', 'Tailwind CSS', 'Figma', 'WebGL'],
      languages: ['Korean', 'English', 'Japanese'],
      profileStep: 4,
      isVerified: true,
      workExperience: [
        {
          company: 'Kakao',
          role: 'Frontend Developer',
          startDate: '2019-07',
          current: true,
          description: 'Building consumer-facing web products for 50M+ active users.',
        },
      ],
      education: [
        {
          institution: 'KAIST',
          degree: 'B.S.',
          field: 'Computer Science',
          startDate: '2015-03',
          endDate: '2019-02',
          current: false,
        },
      ],
    },
  },
  {
    email: 'aisha.okonkwo@felovy.dev',
    profile: {
      fullName: 'Aisha Okonkwo',
      title: 'DevOps Engineer',
      country: 'Nigeria',
      location: 'Lagos, Nigeria',
      phone: '+234 1 000 0005',
      linkedin: 'https://linkedin.com/in/aishaokonkwo',
      summary:
        'DevOps engineer passionate about cloud-native infrastructure and developer productivity. I automate everything that can be automated.',
      skills: ['AWS', 'Terraform', 'Kubernetes', 'GitHub Actions', 'Prometheus', 'Go'],
      languages: ['English', 'Yoruba'],
      profileStep: 2,
      isVerified: false,
      workExperience: [
        {
          company: 'Flutterwave',
          role: 'DevOps Engineer',
          startDate: '2023-01',
          current: true,
          description: 'Managing cloud infrastructure supporting payment processing across Africa.',
        },
      ],
      education: [
        {
          institution: 'University of Lagos',
          degree: 'B.Sc.',
          field: 'Computer Engineering',
          startDate: '2017-09',
          endDate: '2021-06',
          current: false,
        },
      ],
    },
  },
];

async function main() {
  const password = await bcrypt.hash('Dev@1234', 10);

  for (const mock of MOCK_DEVELOPERS) {
    const user = await prisma.user.upsert({
      where:  { email: mock.email },
      update: {},
      create: { email: mock.email, password, role: 'DEVELOPER' },
    });

    await prisma.developer.upsert({
      where:  { userId: user.id },
      update: { country: mock.profile.country },
      create: {
        userId:         user.id,
        fullName:       mock.profile.fullName,
        title:          mock.profile.title,
        country:        mock.profile.country,
        location:       mock.profile.location,
        phone:          mock.profile.phone,
        linkedin:       mock.profile.linkedin ?? null,
        github:         mock.profile.github ?? null,
        summary:        mock.profile.summary,
        skills:         mock.profile.skills,
        languages:      mock.profile.languages,
        profileStep:    mock.profile.profileStep,
        isVerified:     mock.profile.isVerified,
        verifiedAt:     mock.profile.isVerified ? new Date() : null,
        workExperience: mock.profile.workExperience,
        education:      mock.profile.education,
      },
    });

    console.log(`✓ ${mock.profile.fullName} (${mock.email})`);
  }

  console.log('\n✅ Seed complete — 5 mock developers added.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
