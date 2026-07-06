export type WorkplaceCategory =
  | 'contract'
  | 'interview-inperson'
  | 'interview-remote'
  | 'team-meeting';

export interface WorkplaceImage {
  id: string;
  src: string;
  alt: string;
  category: WorkplaceCategory;
}

function buildImages(
  folder: string,
  category: WorkplaceCategory,
  filenames: string[],
  alt: string,
): WorkplaceImage[] {
  return filenames.map((file) => {
    const base = file.replace(/\.[^.]+$/, '');
    return {
      id: `${category}-${base}`,
      src: `/${folder}/${file}`,
      alt,
      category,
    };
  });
}

export const WORKPLACE_IMAGES: WorkplaceImage[] = [
  ...buildImages('contract', 'contract', ['2.jpg', '3.jpg', '1.jpg'], 'Business contract signing'),
  ...buildImages(
    'interview-inperson',
    'interview-inperson',
    ['1.jpg', '2.jpg', '3.jpg', '4.jpg'],
    'In-person developer interview',
  ),
  ...buildImages(
    'interview-remote',
    'interview-remote',
    ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg', '11.jpg', '12.jpg'],
    'Remote developer interview',
  ),
  ...buildImages(
    'team-meeting',
    'team-meeting',
    ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg'],
    'Team meeting',
  ),
];

export const WORKPLACE_GROUPS = [
  {
    key: 'contract' as const,
    label: 'Business contracts',
    description:
      'Felovy and client companies sign formal agreements that define terms, scope, and trust before any hire.',
  },
  {
    key: 'interview-inperson' as const,
    label: 'In-person interviews',
    description:
      'Hiring managers meet developer candidates face to face, ask questions, and evaluate answers onsite.',
  },
  {
    key: 'interview-remote' as const,
    label: 'Remote interviews',
    description:
      'Recruiters interview verified developers over laptop video calls. Developers join with headset or webcam from anywhere.',
  },
  {
    key: 'team-meeting' as const,
    label: 'Team meetings',
    description:
      'Felovy teams and client hiring groups meet to review candidates, plan roles, and coordinate next steps.',
  },
];
