import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/server/config/database';

const MOCK_DEVELOPERS = [
  {
    email: 'alice.chen@gmail.com',
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
      birthYear: 1994,
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
      languages: [{ name: 'English', level: 'Native' }, { name: 'Mandarin', level: 'C1' }],
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
    email: 'marcus.johnson@outlook.com',
    profile: {
      fullName: 'Marcus Johnson',
      title: 'Mobile Developer',
      country: 'United States',
      location: 'New York, NY',
      phone: '+1 212 000 0002',
      github: 'https://github.com/marcusj',
      summary:
        'Mobile-first engineer with deep expertise in React Native and Flutter. Built apps with 1M+ downloads on both App Store and Google Play.',
      birthYear: 1996,
      skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
      languages: [{ name: 'English', level: 'Native' }, { name: 'Spanish', level: 'B2' }],
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
    email: 'sara.petrov@gmx.de',
    profile: {
      fullName: 'Sara Petrov',
      title: 'Backend Engineer',
      country: 'Germany',
      location: 'Berlin',
      phone: '+49 30 000 0003',
      linkedin: 'https://linkedin.com/in/sarapetrov',
      summary:
        'Backend specialist focused on distributed systems and high-throughput APIs. Comfortable owning the full lifecycle from design to production monitoring.',
      birthYear: 1995,
      skills: ['Python', 'Django', 'FastAPI', 'Redis', 'Kafka', 'Kubernetes'],
      languages: [{ name: 'English', level: 'C1' }, { name: 'German', level: 'Native' }, { name: 'Russian', level: 'B2' }],
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
    email: 'david.kim@icloud.com',
    profile: {
      fullName: 'David Kim',
      title: 'Frontend Developer',
      country: 'South Korea',
      location: 'Seoul',
      phone: '+82 2 000 0004',
      linkedin: 'https://linkedin.com/in/davidkim-dev',
      github: 'https://github.com/davidkim',
      summary:
        'UI-focused developer who cares deeply about accessibility, performance, and pixel-perfect design. Bridging the gap between design and engineering.',
      birthYear: 1997,
      skills: ['Vue.js', 'Nuxt', 'React', 'Tailwind CSS', 'Figma', 'WebGL'],
      languages: [{ name: 'Korean', level: 'Native' }, { name: 'English', level: 'C1' }, { name: 'Japanese', level: 'B2' }],
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
    email: 'aisha.okonkwo@proton.me',
    profile: {
      fullName: 'Aisha Okonkwo',
      title: 'DevOps Engineer',
      country: 'Nigeria',
      location: 'Lagos',
      phone: '+234 1 000 0005',
      linkedin: 'https://linkedin.com/in/aishaokonkwo',
      summary:
        'DevOps engineer passionate about cloud-native infrastructure and developer productivity. I automate everything that can be automated.',
      birthYear: 1998,
      skills: ['AWS', 'Terraform', 'Kubernetes', 'GitHub Actions', 'Prometheus', 'Go'],
      languages: [{ name: 'English', level: 'Native' }, { name: 'Yoruba', level: 'Native' }],
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
      update: {
        country: mock.profile.country,
        location: mock.profile.location,
      },
      create: {
        userId:         user.id,
        fullName:       mock.profile.fullName,
        title:          mock.profile.title,
        birthYear:      mock.profile.birthYear ?? null,
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
