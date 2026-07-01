'use client';

import { cn } from '@/lib/utils';

// Stack icons using devicon CDN classes
const stacks = [
  { label: 'JavaScript', icon: 'devicon-javascript-plain', skill: 'JavaScript' },
  { label: 'TypeScript', icon: 'devicon-typescript-plain', skill: 'TypeScript' },
  { label: 'React', icon: 'devicon-react-original', skill: 'React' },
  { label: 'Node.js', icon: 'devicon-nodejs-plain', skill: 'Node.js' },
  { label: 'Python', icon: 'devicon-python-plain', skill: 'Python' },
  { label: 'Java', icon: 'devicon-java-plain', skill: 'Java' },
  { label: 'Go', icon: 'devicon-go-plain', skill: 'Go' },
  { label: 'Rust', icon: 'devicon-rust-plain', skill: 'Rust' },
  { label: 'PHP', icon: 'devicon-php-plain', skill: 'PHP' },
  { label: 'Vue', icon: 'devicon-vuejs-plain', skill: 'Vue' },
  { label: 'Angular', icon: 'devicon-angularjs-plain', skill: 'Angular' },
  { label: 'Docker', icon: 'devicon-docker-plain', skill: 'Docker' },
];

interface Props {
  selected: string;
  onSelect: (skill: string) => void;
}

export function StackCategories({ selected, onSelect }: Props) {
  return (
    <>
      {/* Devicon CSS */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
      />
      <div className="bg-white border-b">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            <button
              onClick={() => onSelect('')}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                selected === ''
                  ? 'bg-felovy-light text-felovy-red'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              All
            </button>
            {stacks.map(s => (
              <button
                key={s.skill}
                onClick={() => onSelect(selected === s.skill ? '' : s.skill)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  selected === s.skill
                    ? 'bg-felovy-light text-felovy-red'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <i className={`${s.icon} colored text-base`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
