import type { LucideIcon } from 'lucide-react';
import {
  Brain, Database, Globe, Smartphone, Eye, Server, Shield,
  Link2, Gamepad2, Palette, ClipboardCheck, Tags,
} from 'lucide-react';

export type DomainId =
  | 'ai-ml'
  | 'data-science'
  | 'web-dev'
  | 'mobile'
  | 'ar-vr'
  | 'cloud-devops'
  | 'cybersecurity'
  | 'blockchain'
  | 'game-dev'
  | 'ui-ux'
  | 'api-integrations'
  | 'ai-agents';

export type DomainLayout = 'hero' | 'wide' | 'tall' | 'strip' | 'standard';

export interface DomainItem {
  id: DomainId;
  title: string;
  label: string;
  comment: string;
  description?: string;
  tags: string[];
  icon: LucideIcon;
  grad: string;
  illustBg: string;
  tagBg: string;
  accent: string;
  delay: string;
  layout?: DomainLayout;
}

export const DOMAIN_ITEMS: DomainItem[] = [
  {
    id: 'ai-ml',
    title: 'AI & ML',
    label: 'Production-ready models',
    comment: '// ship to prod',
    description: 'LLMs, vision, NLP, and analytics, built to ship, not just demo.',
    tags: ['PyTorch', 'OpenAI'],
    icon: Brain,
    grad: 'from-violet-600 to-purple-700',
    illustBg: 'from-violet-100/80 via-white to-purple-50/60',
    tagBg: 'bg-violet-100 text-violet-800',
    accent: '#7c3aed',
    delay: '0',
    layout: 'hero',
  },
  {
    id: 'data-science',
    title: 'Data Science',
    label: 'Turn data into decisions',
    comment: '// raw → insight',
    tags: ['Python', 'Spark'],
    icon: Database,
    grad: 'from-cyan-600 to-sky-700',
    illustBg: 'from-cyan-100/80 via-white to-sky-50/60',
    tagBg: 'bg-cyan-100 text-cyan-800',
    accent: '#0891b2',
    delay: '80',
    layout: 'standard',
  },
  {
    id: 'web-dev',
    title: 'Web',
    label: 'Modern apps at scale',
    comment: '// fast & modern',
    tags: ['React', 'Next.js'],
    icon: Globe,
    grad: 'from-green-600 to-emerald-700',
    illustBg: 'from-green-100/80 via-white to-emerald-50/60',
    tagBg: 'bg-green-100 text-green-800',
    accent: '#15803d',
    delay: '120',
    layout: 'standard',
  },
  {
    id: 'mobile',
    title: 'Mobile',
    label: 'iOS, Android & cross-platform',
    comment: '// native + cross',
    description: 'Native performance. One codebase when it counts.',
    tags: ['Flutter', 'Swift'],
    icon: Smartphone,
    grad: 'from-emerald-600 to-green-700',
    illustBg: 'from-emerald-100/80 via-white to-green-50/60',
    tagBg: 'bg-emerald-100 text-emerald-800',
    accent: '#059669',
    delay: '160',
    layout: 'tall',
  },
  {
    id: 'ar-vr',
    title: 'AR / VR',
    label: 'Immersive experiences',
    comment: '// step inside',
    tags: ['Unity XR', 'WebXR'],
    icon: Eye,
    grad: 'from-pink-600 to-fuchsia-700',
    illustBg: 'from-pink-100/80 via-white to-fuchsia-50/60',
    tagBg: 'bg-pink-100 text-pink-800',
    accent: '#db2777',
    delay: '180',
    layout: 'standard',
  },
  {
    id: 'cloud-devops',
    title: 'Cloud & DevOps',
    label: 'Infrastructure that scales',
    comment: '// zero downtime',
    tags: ['AWS', 'Kubernetes'],
    icon: Server,
    grad: 'from-indigo-600 to-blue-700',
    illustBg: 'from-indigo-100/80 via-white to-blue-50/60',
    tagBg: 'bg-indigo-100 text-indigo-800',
    accent: '#4f46e5',
    delay: '200',
    layout: 'wide',
  },
  {
    id: 'cybersecurity',
    title: 'Security',
    label: 'Protect what you build',
    comment: '// secure by default',
    tags: ['OWASP', 'SOC 2'],
    icon: Shield,
    grad: 'from-yellow-600 to-amber-700',
    illustBg: 'from-yellow-100/80 via-white to-amber-50/60',
    tagBg: 'bg-yellow-100 text-yellow-900',
    accent: '#ca8a04',
    delay: '240',
    layout: 'standard',
  },
  {
    id: 'blockchain',
    title: 'Web3',
    label: 'On-chain, production-ready',
    comment: '// mainnet ready',
    tags: ['Solidity', 'Ethereum'],
    icon: Link2,
    grad: 'from-teal-600 to-cyan-700',
    illustBg: 'from-teal-100/80 via-white to-cyan-50/60',
    tagBg: 'bg-teal-100 text-teal-800',
    accent: '#0d9488',
    delay: '280',
    layout: 'standard',
  },
  {
    id: 'game-dev',
    title: 'Games',
    label: 'Worlds people play',
    comment: '// players first',
    tags: ['Unity', 'Unreal'],
    icon: Gamepad2,
    grad: 'from-purple-600 to-violet-700',
    illustBg: 'from-purple-100/80 via-white to-violet-50/60',
    tagBg: 'bg-purple-100 text-purple-800',
    accent: '#9333ea',
    delay: '320',
    layout: 'standard',
  },
  {
    id: 'ui-ux',
    title: 'Design',
    label: 'Interfaces people love',
    comment: '// clarity wins',
    tags: ['Figma', 'Framer'],
    icon: Palette,
    grad: 'from-orange-600 to-amber-700',
    illustBg: 'from-orange-100/80 via-white to-amber-50/60',
    tagBg: 'bg-orange-100 text-orange-800',
    accent: '#ea580c',
    delay: '360',
    layout: 'standard',
  },
  {
    id: 'api-integrations',
    title: 'QA Testing',
    label: 'Ship with confidence',
    comment: '// test before launch',
    tags: ['Playwright', 'Cypress'],
    icon: ClipboardCheck,
    grad: 'from-blue-600 to-indigo-700',
    illustBg: 'from-blue-100/80 via-white to-indigo-50/60',
    tagBg: 'bg-blue-100 text-blue-800',
    accent: '#2563eb',
    delay: '380',
    layout: 'standard',
  },
  {
    id: 'ai-agents',
    title: 'AI Data Labeling',
    label: 'Training data that scales',
    comment: '// label at scale',
    description: 'Image, text, and audio annotation pipelines for model training and evaluation.',
    tags: ['CVAT', 'Label Studio'],
    icon: Tags,
    grad: 'from-fuchsia-600 to-pink-700',
    illustBg: 'from-fuchsia-100/80 via-white to-pink-50/60',
    tagBg: 'bg-fuchsia-100 text-fuchsia-800',
    accent: '#be185d',
    delay: '420',
    layout: 'strip',
  },
];
