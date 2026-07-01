import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { FloatingAIGuide } from '@/components/home/FloatingAIGuide';
import {
  Code2, Globe, Shield, Star, Users, Briefcase, ArrowRight, Sparkles,
  UserPlus, ShieldCheck, Rocket, CheckCircle2, Zap,
  MapPin, Clock, DollarSign, Lock,
  Database, Server, Smartphone, Brain,
  Terminal, Play, ChevronDown,
  Cpu, Gamepad2, Palette, Link2, Eye,
} from 'lucide-react';

const WorldMap = dynamic(() => import('@/components/home/WorldMap'), { ssr: false });
const AnimatedSectionBg = dynamic(
  () => import('@/components/home/AnimatedSectionBg').then(m => ({ default: m.AnimatedSectionBg })),
  { ssr: false }
);
const DeveloperCarousel = dynamic(
  () => import('@/components/home/DeveloperCarousel').then(m => ({ default: m.DeveloperCarousel })),
  { ssr: false }
);
const TestimonialsSection = dynamic(
  () => import('@/components/home/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })),
  { ssr: false }
);
const TechCarousel = dynamic(
  () => import('@/components/home/TechCarousel').then(m => ({ default: m.TechCarousel })),
  { ssr: false }
);
const LogoCarousel = dynamic(
  () => import('@/components/home/LogoCarousel').then(m => ({ default: m.LogoCarousel })),
  { ssr: false }
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const heroStats = [
  { label: 'Verified Developers', value: '5,000+', icon: Users },
  { label: 'Global Clients',      value: '1,200+', icon: Globe },
  { label: 'Jobs Posted',         value: '8,400+', icon: Briefcase },
  { label: 'Success Rate',        value: '97%',    icon: Star },
];

const TECH_TAGS_ROW1 = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust', 'AWS', 'Docker',
  'Kubernetes', 'GraphQL', 'PostgreSQL', 'MongoDB', 'Swift', 'Kotlin', 'Flutter',
];
const TECH_TAGS_ROW2 = [
  'Vue.js', 'Next.js', 'FastAPI', 'Spring Boot', 'Terraform', 'Redis', 'Solidity',
  'TensorFlow', 'PyTorch', 'WebGL', 'Svelte', 'Angular', 'Deno', 'Bun', 'Tauri',
];

// Bento grid data replaced by inline JSX in the section below

const featuredJobs = [
  {
    title: 'Senior React Developer',
    company: 'TechVision Inc.',
    location: 'Remote · USA',
    salary: '$120k – $160k / yr',
    type: 'Full-time',
    tags: ['React', 'TypeScript', 'GraphQL'],
    emoji: '🏢',
    badge: 'Hot',
    badgeColor: 'bg-rose-100 text-rose-600',
    time: '2 h ago',
  },
  {
    title: 'Python Backend Engineer',
    company: 'DataFlow Systems',
    location: 'Remote · Europe',
    salary: '$100k – $140k / yr',
    type: 'Full-time',
    tags: ['Python', 'FastAPI', 'PostgreSQL'],
    emoji: '⚡',
    badge: 'New',
    badgeColor: 'bg-emerald-100 text-emerald-600',
    time: '5 h ago',
  },
  {
    title: 'Flutter Mobile Developer',
    company: 'AppCraft Studio',
    location: 'Remote · Global',
    salary: '$90k – $130k / yr',
    type: 'Contract',
    tags: ['Flutter', 'Dart', 'Firebase'],
    emoji: '📱',
    badge: 'Featured',
    badgeColor: 'bg-blue-100 text-blue-600',
    time: '1 d ago',
  },
];


const features = [
  {
    icon: ShieldCheck,
    title: 'Rigorously Verified',
    desc: 'Every developer passes ID verification, skill assessment, and video introduction. No imposters — ever.',
    bg: 'bg-emerald-50', text: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-200', hoverShadow: 'hover:shadow-emerald-100/80',
  },
  {
    icon: Globe,
    title: 'Truly Global',
    desc: 'Source talent from 80+ countries or find opportunities worldwide. We bridge time zones, cultures, and borders.',
    bg: 'bg-blue-50', text: 'text-blue-600',
    hoverBorder: 'hover:border-blue-200', hoverShadow: 'hover:shadow-blue-100/80',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Post a job and get matched in under 24 hours. Our system surfaces the right talent instantly — not in weeks.',
    bg: 'bg-felovy-light', text: 'text-felovy-red',
    hoverBorder: 'hover:border-rose-200', hoverShadow: 'hover:shadow-rose-100/80',
  },
];

const services = [
  {
    icon: Code2,
    title: 'Software Development',
    desc: 'Expert developers across every stack — web, mobile, AI, cloud, and more. MVPs to enterprise systems.',
    tags: ['React', 'Node.js', 'Python', 'AI/ML'],
  },
  {
    icon: Globe,
    title: 'Global Outsourcing',
    desc: 'Source elite talent from 80+ countries. Every developer vetted so you only meet those ready to deliver.',
    tags: ['80+ Countries', 'Time-zone Match', 'Remote'],
  },
  {
    icon: Shield,
    title: 'Verified Talent',
    desc: 'Multi-layer verification — ID checks, skills assessments, live coding tests, and video introductions.',
    tags: ['ID Verified', 'Skill Tested', 'Background Check'],
  },
  {
    icon: Sparkles,
    title: 'Freelance Marketplace',
    desc: 'The fair marketplace where developers earn what they deserve and clients get extraordinary value.',
    tags: ['No Hidden Fees', 'Instant Pay', 'Escrow'],
  },
];

const devBenefits = [
  'Access 8,400+ high-paying remote jobs worldwide',
  'Earn your Verified badge and stand above the crowd',
  'Competitive rates — up to 3× your local market',
  'Build your portfolio with global brands',
  'Direct messaging with hiring managers',
];

const empBenefits = [
  'Browse 5,000+ pre-vetted, verified developers',
  'Post a job and get matched candidates in 24 h',
  'View ID-verified profiles with video introductions',
  'Hire for projects, part-time, or full-time',
  'Dedicated support throughout every hire',
];

const howItWorks = [
  {
    step: '01', icon: UserPlus, title: 'Create Your Profile',
    desc: 'Sign up as a developer or employer in minutes. Showcase your skills, experience, and portfolio with ease.',
    gradient: 'from-felovy-red to-felovy-pink', shadow: 'shadow-rose-200',
  },
  {
    step: '02', icon: ShieldCheck, title: 'Get Verified',
    desc: 'Complete our multi-step verification — ID check, skill assessment, video intro — to earn your Trusted badge.',
    gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-200',
  },
  {
    step: '03', icon: Rocket, title: 'Connect & Thrive',
    desc: 'Land high-paying contracts, hire world-class talent, and build the future of software — together.',
    gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200',
  },
];


const trustPillars = [
  {
    icon: Shield,    title: 'ID Verified',
    desc: 'Government-issued ID validation on every account. Real people, real identities, always.',
    color: 'text-emerald-600', bg: 'bg-emerald-50',
  },
  {
    icon: Terminal,  title: 'Skill Tested',
    desc: 'Live coding challenges and technical assessments graded by senior engineers.',
    color: 'text-blue-600', bg: 'bg-blue-50',
  },
  {
    icon: Play,      title: 'Video Intro',
    desc: 'Authentic recorded introductions — know your hire before the first call.',
    color: 'text-violet-600', bg: 'bg-violet-50',
  },
  {
    icon: Lock,      title: 'Secure Escrow',
    desc: 'Protected payments. Funds release only when approved milestones are delivered.',
    color: 'text-amber-600', bg: 'bg-amber-50',
  },
];


const faqs = [
  {
    q: 'How does developer verification work?',
    a: 'Every developer completes a 4-step process: government ID scan, live coding challenge, technical skills assessment, and a recorded video introduction. Our team reviews each submission manually before granting the Verified badge.',
  },
  {
    q: 'How quickly can I hire a developer?',
    a: 'Most employers receive their first matched candidates within 24 hours of posting a job. The full process from job post to signed contract typically takes 3–5 business days.',
  },
  {
    q: 'Is Felovy free to join?',
    a: 'Yes — creating an account and browsing profiles or jobs is completely free. We charge a small platform fee only when a hire is made or a contract is signed.',
  },
  {
    q: 'What types of work are available?',
    a: 'Full-time remote positions, part-time contracts, project-based freelance work, and long-term retainer engagements. Every listing is available globally unless otherwise specified by the employer.',
  },
  {
    q: 'How does payment security work?',
    a: 'All payments go through our escrow system. Clients fund milestones upfront, and developers receive payment upon milestone approval. Both parties are fully protected at every step.',
  },
  {
    q: 'Can developers from any country join?',
    a: 'Absolutely. Felovy is built for global talent. We currently have verified developers from 80+ countries, with full support for international bank transfers and popular payment platforms.',
  },
];




const developerCommunity = [
  { src: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80', name: 'Aisha M.', role: 'AI Engineer', country: 'Kenya', grad: 'from-rose-500 to-pink-600', quote: 'Building AI that serves African markets felt impossible — Felovy connected me with teams who share that vision.' },
  { src: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=600&q=80', name: 'Marco V.', role: 'Full Stack Dev', country: 'Spain', grad: 'from-blue-500 to-indigo-600', quote: 'I went from local freelancing to working with three US startups simultaneously. The platform just works.' },
  { src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80', name: 'James L.', role: 'Cloud Architect', country: 'Canada', grad: 'from-emerald-500 to-teal-600', quote: 'The verified badge was the turning point. Enterprise clients reached out to me, not the other way around.' },
  { src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', name: 'Priya S.', role: 'UX Designer', country: 'India', grad: 'from-purple-500 to-violet-600', quote: 'Felovy understood that great design knows no geography. My client roster spans 6 countries now.' },
  { src: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80', name: 'Daniel M.', role: 'Backend Engineer', country: 'Philippines', grad: 'from-amber-500 to-orange-600', quote: 'In 18 months I doubled my income while working on projects I actually care about.' },
  { src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80', name: 'Emma R.', role: 'Mobile Developer', country: 'Germany', grad: 'from-cyan-500 to-blue-600', quote: 'No games, no middlemen — just real work and real pay. Exactly what I was looking for.' },
  { src: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=600&q=80', name: 'Kwame A.', role: 'ML Researcher', country: 'Ghana', grad: 'from-amber-500 to-yellow-600', quote: 'I now collaborate with researchers at top US universities from my home in Accra.' },
  { src: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=600&q=80', name: 'Alex T.', role: 'DevOps Engineer', country: 'Brazil', grad: 'from-sky-500 to-blue-600', quote: 'Automated infrastructure for a fintech serving 2M users. Felovy made the connection possible.' },
  { src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80', name: 'Yuna K.', role: 'Frontend Lead', country: 'Japan', grad: 'from-pink-500 to-rose-600', quote: 'Japanese engineers are in high demand globally. Felovy helped me reach that market on my own terms.' },
  { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80', name: 'Fatou D.', role: 'Mobile Dev', country: 'Senegal', grad: 'from-violet-500 to-purple-600', quote: 'My code runs on apps used by millions. That is the scale Felovy opened up for me.' },
  { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', name: 'Rafi O.', role: 'Backend Dev', country: 'Israel', grad: 'from-teal-500 to-emerald-600', quote: 'Security-first development is rare to find. Felovy matched me with clients who genuinely value it.' },
  { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80', name: 'Sofia C.', role: 'UX Designer', country: 'Argentina', grad: 'from-indigo-500 to-violet-600', quote: 'I design for global audiences from Buenos Aires. Felovy made that completely normal.' },
  { src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80', name: 'Hans M.', role: 'Cloud Architect', country: 'Netherlands', grad: 'from-orange-500 to-amber-600', quote: 'Cloud migrations used to mean relocating. Now I lead them from Amsterdam for clients worldwide.' },
  { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', name: 'Nadia B.', role: 'Security Expert', country: 'Morocco', grad: 'from-red-500 to-rose-600', quote: 'Penetration testing for Fortune 500s, remotely, at rates that reflect my actual expertise.' },
  { src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80', name: 'Lena V.', role: 'Data Engineer', country: 'Ukraine', grad: 'from-blue-500 to-cyan-600', quote: 'Data pipelines I built here power decisions for 50,000+ businesses every single day.' },
  { src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', name: 'Tariq N.', role: 'Blockchain Dev', country: 'Nigeria', grad: 'from-green-500 to-emerald-600', quote: 'Web3 expertise should not be locked to Silicon Valley. Felovy made sure of that.' },
];


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <ScrollReveal />
      <FloatingAIGuide />
      <Navbar />

      {/* ── 1. HERO — world map + title (KEPT INTACT) ── */}
      <section id="hero" className="relative min-h-[92vh] flex items-center overflow-hidden -mt-16 pt-16">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute top-1/2 left-0 right-0 -translate-y-[46%] -translate-x-[4%] opacity-90">
            <WorldMap mode="hero" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/50" />
        </div>

        <div className="relative z-10 container mx-auto max-w-7xl px-4 py-24 text-center">
          <Badge className="mb-6 gap-2 px-4 py-2 text-sm" variant="outline">
            <Sparkles className="h-3.5 w-3.5 text-felovy-red" />
            The Future of Software Outsourcing
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="gradient-text">For Every Life,</span>
            <br />
            <span className="text-gray-900">Our Value Yields</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
            Felovy is the premier software development outsourcing platform — connecting global
            clients with verified developers and helping talent find high-paying opportunities.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup?role=developer">
              <Button size="xl" variant="gradient" className="gap-2 w-full sm:w-auto shadow-xl shadow-rose-200/60">
                Find Jobs as Developer <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup?role=employer">
              <Button size="xl" variant="outline" className="gap-2 w-full sm:w-auto bg-white/80 backdrop-blur-sm">
                Hire Developers <Briefcase className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {heroStats.map(({ label, value, icon: Icon }, i) => (
              <div key={label} data-animate="bounce-in" data-delay={String(i * 100 + 200)} className="group rounded-2xl p-4 text-center border border-gray-200/80 bg-white/70 backdrop-blur-sm hover:border-felovy-red/30 hover:bg-white hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-rose-100/50 card-3d-mild">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-felovy-light mb-2 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-4 w-4 text-felovy-red" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-felovy-light/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-purple-100/40 blur-3xl pointer-events-none" />
      </section>

      {/* ── 2. TRUSTED BY — company logos ── */}
      <section className="py-16 border-y border-gray-100 bg-white relative overflow-hidden">
        <AnimatedSectionBg variant="constellation" opacity={0.03} color="#e11d48" secondary="#a855f7" />
        <div className="container mx-auto max-w-6xl px-4 text-center relative">
          <p data-animate="fade-down" className="text-xs font-bold tracking-[0.24em] uppercase text-gray-400 mb-10">
            Trusted by teams building the future
          </p>
          <LogoCarousel />
        </div>
      </section>

      {/* ── 11. HOW IT WORKS ── */}
      <section className="py-28 bg-gray-50/60 border-y border-gray-100 relative overflow-hidden">
        <AnimatedSectionBg variant="constellation" opacity={0.04} color="#6366f1" secondary="#e11d48" />
        {/* SVG dotted road path */}
        <svg className="absolute top-1/2 left-0 right-0 w-full -translate-y-1/2 opacity-[0.05] pointer-events-none" viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,50 C360,10 720,90 1080,50 C1260,30 1380,70 1440,50" stroke="#e11d48" strokeWidth="2" fill="none" strokeDasharray="12 8"/>
        </svg>
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-20">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">Process</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              How <span className="gradient-text">Felovy</span> works
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500 max-w-md mx-auto">
              Three simple steps to unlock a world of opportunity — whether you're building or hiring.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-[38px] left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px bg-gradient-to-r from-rose-300 via-violet-300 to-blue-300 pointer-events-none" />
            <div className="grid md:grid-cols-3 gap-10 md:gap-6">
              {howItWorks.map(({ step, icon: Icon, title, desc, gradient, shadow }, i) => (
                <div key={step} data-animate="flip-up" data-delay={String(i * 150)} className="group flex flex-col items-center text-center">
                  <div className="relative mb-7">
                    <div className={`h-20 w-20 rounded-[22px] bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl ${shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="h-9 w-9 text-white" />
                    </div>
                    <span className="absolute -top-2.5 -right-2.5 h-7 w-7 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-[11px] font-black text-gray-400 shadow-sm">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-[10px] font-black tracking-[0.22em] uppercase text-gray-300 mb-2">Step {step}</p>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href="/signup">
              <Button variant="gradient" size="lg" className="gap-2 shadow-lg shadow-rose-200/50">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. WHY FELOVY ── */}
      <section className="py-28 bg-white relative overflow-hidden">
        <AnimatedSectionBg variant="waves" opacity={0.04} color="#e11d48" secondary="#a855f7" />
        {/* SVG flowing curves decoration */}
        <svg className="absolute bottom-0 left-0 right-0 w-full opacity-[0.06] pointer-events-none" viewBox="0 0 1440 180" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,90 C360,20 720,160 1080,80 C1260,40 1350,120 1440,90 L1440,180 L0,180 Z" fill="#e11d48"/>
          <path d="M0,120 C240,60 600,180 960,100 C1200,40 1380,140 1440,120 L1440,180 L0,180 Z" fill="#a855f7" opacity="0.5"/>
        </svg>
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-16">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">Why Felovy</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Built different,{' '}
              <span className="gradient-text">by design</span>
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500 max-w-xl mx-auto leading-relaxed">
              We don't just list developers. We build trust, verify identity, and connect talent
              with opportunity across every corner of the globe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, bg, text, hoverBorder, hoverShadow }, i) => (
              <div key={title} data-animate="fade-up" data-delay={String(i * 150)} className={`group relative rounded-3xl border border-gray-100 p-8 bg-white ${hoverBorder} hover:-translate-y-2 hover:shadow-2xl ${hoverShadow} transition-all duration-500 cursor-default card-3d`}>
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${bg} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <Icon className={`h-8 w-8 ${text}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed text-[15px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. SECURITY & TRUST ── */}
      <section id="trust" className="py-24 bg-gray-50/70 border-y border-gray-100 relative overflow-hidden">
        <AnimatedSectionBg variant="rings" opacity={0.05} color="#10b981" secondary="#e11d48" />
        {/* SVG radial shield lines */}
        <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.05] pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <polygon points="100,10 170,45 170,155 100,190 30,155 30,45" fill="none" stroke="#e11d48" strokeWidth="2"/>
          <polygon points="100,30 155,58 155,142 100,170 45,142 45,58" fill="none" stroke="#a855f7" strokeWidth="1.5"/>
          <polygon points="100,55 135,73 135,127 100,145 65,127 65,73" fill="none" stroke="#e11d48" strokeWidth="1"/>
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => (
            <line key={a} x1="100" y1="100" x2={100+80*Math.cos(a*Math.PI/180)} y2={100+80*Math.sin(a*Math.PI/180)} stroke="#e11d48" strokeWidth="0.5" opacity="0.6"/>
          ))}
        </svg>
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-14">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">Trust & Safety</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Your safety is our{' '}
              <span className="gradient-text">priority</span>
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500 max-w-xl mx-auto">
              Every layer of Felovy is built with trust at its core — from the first profile view to the final payment.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trustPillars.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <div key={title} data-animate="bounce-in" data-delay={String(i * 100)} className="group rounded-2xl border border-gray-100 bg-white p-6 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 cursor-default card-3d">
                <div className={`inline-flex h-12 w-12 rounded-xl ${bg} items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className={`font-bold ${color} mb-2`}>{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. BENTO PLATFORM GRID ── */}
      <section className="py-24 bg-gray-50/70 border-y border-gray-100 relative overflow-hidden">
        <AnimatedSectionBg variant="neural" opacity={0.04} color="#6366f1" secondary="#e11d48" />
        {/* SVG circuit-board lines decoration */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="circuit" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M10 30 L50 30 M30 10 L30 50 M10 10 L50 50" stroke="#e11d48" strokeWidth="0.8" fill="none"/>
            <circle cx="10" cy="30" r="2" fill="#e11d48"/><circle cx="50" cy="30" r="2" fill="#e11d48"/>
            <circle cx="30" cy="10" r="2" fill="#a855f7"/><circle cx="30" cy="50" r="2" fill="#a855f7"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-14">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">Platform</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              Everything in one place
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500 max-w-xl mx-auto">
              A complete ecosystem where verified talent meets the companies that need them most.
            </p>
          </div>

          {/* Redesigned Bento: 3-column asymmetric grid */}
          <div className="grid md:grid-cols-3 gap-4 auto-rows-auto">

            {/* Card 1: Big hero stat — verified devs */}
            <div data-animate="flip-up" data-delay="0" className="group md:row-span-2 rounded-3xl bg-white border border-gray-100 p-8 bento-hover hover:border-rose-200 flex flex-col justify-between relative overflow-hidden cursor-default shadow-sm">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-rose-50 group-hover:bg-rose-100 transition-colors duration-500" />
              <div>
                <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-felovy-red to-felovy-pink items-center justify-center mb-6 shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="text-6xl font-black text-gray-900 mb-1 relative z-10 leading-none">5,000+</div>
                <div className="text-xl font-bold text-gray-800 mb-3 relative z-10">Verified Developers</div>
                <p className="text-sm text-gray-500 leading-relaxed relative z-10">ID-checked, skill-tested, video-introduced professionals — the top 5% of global applicants.</p>
              </div>
              <div className="mt-8 flex gap-2 flex-wrap relative z-10">
                {['React', 'Python', 'Go', 'Flutter'].map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-100">{t}</span>
                ))}
              </div>
            </div>

            {/* Card 2: Countries */}
            <div data-animate="flip-up" data-delay="100" className="group rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-7 bento-hover cursor-default shadow-lg shadow-blue-100 flex flex-col relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
              <div className="inline-flex h-12 w-12 rounded-2xl bg-white/20 items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div className="text-5xl font-black text-white mb-1 leading-none">80+</div>
              <div className="text-base font-bold text-white mb-1">Countries</div>
              <p className="text-blue-100/80 text-sm leading-relaxed">Truly global talent. Hire from anywhere, work from anywhere.</p>
              <div className="mt-auto pt-4 flex gap-1 text-lg">
                {['🇳🇬', '🇮🇳', '🇧🇷', '🇵🇭', '🇩🇪', '🇬🇭', '🇲🇦', '🇨🇴'].map((f, i) => (
                  <span key={i} className="text-xl">{f}</span>
                ))}
              </div>
            </div>

            {/* Card 3: Speed */}
            <div data-animate="flip-up" data-delay="200" className="group rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-7 bento-hover cursor-default shadow-lg shadow-amber-100 flex flex-col relative overflow-hidden">
              <div className="absolute -top-4 -left-4 h-20 w-20 rounded-full bg-white/15" />
              <div className="inline-flex h-12 w-12 rounded-2xl bg-white/20 items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-5xl font-black text-white mb-1 leading-none">&lt;24h</div>
              <div className="text-base font-bold text-white mb-1">Match Time</div>
              <p className="text-amber-100/80 text-sm">Post a job, receive matched candidates by tomorrow morning.</p>
            </div>

            {/* Card 4: Wide — Video + Escrow side by side */}
            <div data-animate="flip-up" data-delay="300" className="group md:col-span-2 rounded-3xl bg-white border border-gray-100 p-7 bento-hover hover:border-violet-200 cursor-default shadow-sm flex gap-6 items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 to-transparent pointer-events-none" />
              {/* Video intros */}
              <div className="flex-1 relative z-10">
                <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 items-center justify-center mb-4 shadow-md shadow-violet-200 group-hover:scale-110 transition-transform duration-300">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-black text-gray-900 mb-1">Video Intros</div>
                <p className="text-sm text-gray-500 leading-relaxed">Know your hire before the first call. Authentic recorded profiles from every developer.</p>
              </div>
              <div className="w-px h-16 bg-gray-100 shrink-0" />
              {/* Escrow */}
              <div className="flex-1 relative z-10">
                <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center mb-4 shadow-md shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-black text-gray-900 mb-1">Escrow Payments</div>
                <p className="text-sm text-gray-500 leading-relaxed">Funds locked until milestones approved. Zero financial risk for both sides.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. SERVICES ── */}
      <section id="services" className="py-28 bg-white relative overflow-hidden">
        <AnimatedSectionBg variant="hex" opacity={0.04} color="#a855f7" secondary="#e11d48" />
        {/* SVG zigzag border decoration */}
        <svg className="absolute top-0 left-0 right-0 w-full opacity-[0.06] pointer-events-none" viewBox="0 0 1440 30" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <polyline points="0,30 60,0 120,30 180,0 240,30 300,0 360,30 420,0 480,30 540,0 600,30 660,0 720,30 780,0 840,30 900,0 960,30 1020,0 1080,30 1140,0 1200,30 1260,0 1320,30 1380,0 1440,30" fill="none" stroke="#e11d48" strokeWidth="2"/>
        </svg>
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-16">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">Our Services</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Everything you need to{' '}
              <span className="gradient-text">succeed</span>
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500 max-w-xl mx-auto">
              From verified talent pools to global outsourcing infrastructure — Felovy covers every angle.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map(({ icon: Icon, title, desc, tags }, i) => (
              <div key={title} data-animate="rotate-in" data-delay={String(i * 100)} className="group glass-card rounded-3xl p-6 flex flex-col gap-4 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-100/40 transition-all duration-500 overflow-hidden relative cursor-default card-3d">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-felovy-red to-felovy-purple -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-felovy-light group-hover:opacity-0 transition-opacity duration-300" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-felovy-red to-felovy-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg shadow-felovy-red/30" />
                  <Icon className="relative z-10 h-5 w-5 text-felovy-red group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-felovy-red transition-colors duration-300">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100/80">
                  {tags.map(t => (
                    <span key={t} className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 group-hover:bg-felovy-light group-hover:text-felovy-red transition-colors duration-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOMAINS — creative image gallery with overlay ── */}
      <section id="domains" className="py-28 bg-white relative overflow-hidden">
        <AnimatedSectionBg variant="hex" opacity={0.04} color="#e11d48" secondary="#a855f7" />
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-16">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">Industries & Domains</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Software expertise across{' '}
              <span className="text-shimmer">every domain</span>
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500 max-w-xl mx-auto">
              From AI research labs to mobile-first startups — Felovy delivers elite developers
              for every technology vertical and industry category.
            </p>
          </div>

          {/* Creative masonry gallery grid */}
          <div className="grid grid-cols-4 grid-rows-[200px_200px_200px] gap-3 auto-rows-[200px]">

            {/* AI/ML — 2×2 large hero */}
            <div data-animate="fade-up" className="col-span-2 row-span-2 group gallery-cell rounded-3xl overflow-hidden relative cursor-default shadow-sm">
              <Image src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=900&q=80" alt="AI & ML" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7">
                <div className="inline-flex h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 items-center justify-center mb-4 shadow-lg">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-white font-extrabold text-2xl mb-2">AI & Machine Learning</h3>
                <p className="text-white/65 text-sm leading-relaxed mb-3">LLMs, computer vision, NLP, predictive analytics at scale</p>
                <div className="flex gap-2">
                  {['TensorFlow', 'PyTorch', 'OpenAI'].map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Science — 1×1 */}
            <div data-animate="fade-up" data-delay="80" className="col-span-1 row-span-1 group gallery-cell rounded-3xl overflow-hidden relative cursor-default shadow-sm">
              <Image src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" alt="Data Science" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Database className="h-4 w-4 text-blue-300 mb-1.5" />
                <h3 className="text-white font-bold text-sm">Data Science</h3>
                <p className="text-white/55 text-[10px] mt-0.5">Python · Pandas · Spark</p>
              </div>
            </div>

            {/* Web Dev — 1×1 */}
            <div data-animate="fade-up" data-delay="120" className="col-span-1 row-span-1 group gallery-cell rounded-3xl overflow-hidden relative cursor-default shadow-sm">
              <Image src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80" alt="Web Development" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Globe className="h-4 w-4 text-emerald-300 mb-1.5" />
                <h3 className="text-white font-bold text-sm">Web Development</h3>
                <p className="text-white/55 text-[10px] mt-0.5">React · Next.js · Node.js</p>
              </div>
            </div>

            {/* Mobile — 1×2 tall */}
            <div data-animate="fade-up" data-delay="160" className="col-span-1 row-span-2 group gallery-cell rounded-3xl overflow-hidden relative cursor-default shadow-sm">
              <Image src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80" alt="Mobile Dev" fill className="object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <Smartphone className="h-5 w-5 text-violet-300 mb-2" />
                <h3 className="text-white font-bold text-base">Mobile Development</h3>
                <p className="text-white/60 text-xs mt-1 leading-relaxed">iOS, Android & cross-platform apps</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {['Flutter', 'Swift', 'Kotlin'].map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/15 text-white">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cloud — 2×1 wide */}
            <div data-animate="fade-up" data-delay="200" className="col-span-2 row-span-1 group gallery-cell rounded-3xl overflow-hidden relative cursor-default shadow-sm">
              <Image src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80" alt="Cloud & DevOps" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/50 to-transparent" />
              <div className="absolute inset-0 flex items-center p-6">
                <div>
                  <Server className="h-5 w-5 text-orange-300 mb-2" />
                  <h3 className="text-white font-bold text-lg">Cloud & DevOps</h3>
                  <p className="text-white/60 text-xs mt-1">AWS · Docker · Kubernetes · Terraform</p>
                </div>
              </div>
            </div>

            {/* Row 3: Cybersecurity, Blockchain, Game Dev, UI/UX */}
            <div data-animate="fade-up" data-delay="240" className="col-span-1 row-span-1 group gallery-cell rounded-3xl overflow-hidden relative cursor-default shadow-sm">
              <Image src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80" alt="Cybersecurity" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Shield className="h-4 w-4 text-red-300 mb-1.5" />
                <h3 className="text-white font-bold text-sm">Cybersecurity</h3>
                <p className="text-white/55 text-[10px] mt-0.5">OWASP · SOC 2 · Zero Trust</p>
              </div>
            </div>

            <div data-animate="fade-up" data-delay="280" className="col-span-1 row-span-1 group gallery-cell rounded-3xl overflow-hidden relative cursor-default shadow-sm">
              <Image src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80" alt="Blockchain" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Link2 className="h-4 w-4 text-amber-300 mb-1.5" />
                <h3 className="text-white font-bold text-sm">Blockchain & Web3</h3>
                <p className="text-white/55 text-[10px] mt-0.5">Solidity · Ethereum · Rust</p>
              </div>
            </div>

            <div data-animate="fade-up" data-delay="320" className="col-span-1 row-span-1 group gallery-cell rounded-3xl overflow-hidden relative cursor-default shadow-sm">
              <Image src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80" alt="Game Dev" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Gamepad2 className="h-4 w-4 text-green-300 mb-1.5" />
                <h3 className="text-white font-bold text-sm">Game Development</h3>
                <p className="text-white/55 text-[10px] mt-0.5">Unity · Unreal · WebGL</p>
              </div>
            </div>

            <div data-animate="fade-up" data-delay="360" className="col-span-1 row-span-1 group gallery-cell rounded-3xl overflow-hidden relative cursor-default shadow-sm">
              <Image src="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80" alt="UI/UX" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Palette className="h-4 w-4 text-purple-300 mb-1.5" />
                <h3 className="text-white font-bold text-sm">UI/UX Design</h3>
                <p className="text-white/55 text-[10px] mt-0.5">Figma · Framer · Tailwind</p>
              </div>
            </div>

          </div>

          {/* Additional domains row */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            {[
              { title: 'AR / VR', icon: Eye, grad: 'from-cyan-500 to-blue-600', tags: 'Unity XR · WebXR', src: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&w=500&q=80' },
              { title: 'Embedded & IoT', icon: Cpu, grad: 'from-teal-500 to-cyan-600', tags: 'C/C++ · RTOS · Arduino', src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80' },
              { title: 'API & Integrations', icon: Code2, grad: 'from-indigo-500 to-violet-600', tags: 'GraphQL · REST · gRPC', src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=500&q=80' },
              { title: 'AI Agents & LLMs', icon: Sparkles, grad: 'from-purple-500 to-pink-600', tags: 'OpenAI · LangChain · RAG', src: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=500&q=80' },
            ].map(({ title, icon: Icon, tags, src }, i) => (
              <div key={title} data-animate="fade-up" data-delay={String(i * 80 + 400)} className="group gallery-cell rounded-2xl overflow-hidden relative h-36 cursor-default shadow-sm">
                <Image src={src} alt={title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-bold text-sm leading-tight">{title}</h3>
                  <p className="text-white/55 text-[10px] mt-0.5">{tags}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACKS CAROUSEL — two rows scrolling opposite directions ── */}
      <section className="py-16 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.15),transparent_70%)] pointer-events-none" />
        <div className="container mx-auto max-w-7xl px-4 mb-10 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-2">Technology</p>
              <h2 className="text-3xl font-extrabold text-white">All the stacks you need</h2>
            </div>
            <p className="text-gray-500 text-sm max-w-xs text-right">Developers verified across 50+ technologies — front, back, cloud, mobile, and AI.</p>
          </div>
        </div>

        <TechCarousel row1={TECH_TAGS_ROW1} row2={TECH_TAGS_ROW2} />
      </section>

      {/* ── 6. FEATURED JOBS ── */}
      <section id="jobs" className="py-24 bg-gray-50/70 border-y border-gray-100 relative overflow-hidden">
        <AnimatedSectionBg variant="grid" opacity={0.04} color="#e11d48" secondary="#6366f1" />
        {/* SVG diagonal grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="diag" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 40 L40 0 M-10 10 L10 -10 M30 50 L50 30" stroke="#e11d48" strokeWidth="0.8" fill="none"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#diag)"/>
        </svg>
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-2">Live Opportunities</p>
              <h2 data-animate="fade-up" className="text-4xl font-extrabold text-gray-900 leading-tight">Featured Jobs</h2>
              <p data-animate="fade-up" data-delay="100" className="text-gray-500 mt-2 text-sm">Hand-picked openings updated daily from verified employers.</p>
            </div>
            <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-felovy-red hover:underline shrink-0">
              Browse all 8,400+ jobs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {featuredJobs.map(({ title, company, location, salary, type, tags, emoji, badge, badgeColor, time }, i) => (
              <Link key={title} href="/jobs" data-animate="fade-up" data-delay={String(i * 120)} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-4 card-3d-mild">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                      {emoji}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-felovy-red transition-colors text-[15px] leading-tight line-clamp-1">{title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{company}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>{badge}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{type}</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{salary}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <span key={t} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">{time}</span>
                  <span className="text-xs font-semibold text-felovy-red flex items-center gap-1">
                    Apply now <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. DEVELOPER COMMUNITY — infinite carousel ── */}
      <section className="py-20 bg-gray-50/60 border-y border-gray-100 relative overflow-hidden">
        <AnimatedSectionBg variant="particles" opacity={0.04} color="#e11d48" secondary="#a855f7" />
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-12">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">Global Community</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              Meet the people behind{' '}
              <span className="gradient-text">the code</span>
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500 max-w-xl mx-auto">
              Brilliant engineers from every corner of the world — verified, passionate, and ready to build your next breakthrough.
            </p>
          </div>
        </div>

        {/* Full-width carousel */}
        <DeveloperCarousel people={developerCommunity} />

        <div className="mt-8 flex justify-center gap-6 flex-wrap px-4">
          {['🇳🇬 Nigeria', '🇯🇵 Japan', '🇧🇷 Brazil', '🇮🇳 India', '🇩🇪 Germany', '🇺🇸 USA', '🇨🇦 Canada', '🇵🇭 Philippines', '🇬🇧 UK', '🇫🇷 France'].map((c, i) => (
            <span key={c} data-animate="scale-in" data-delay={String(i * 40)} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-default">{c}</span>
          ))}
        </div>
      </section>

      {/* ── 9. DEVELOPER / EMPLOYER — unified gradient cards ── */}
      <section id="about" className="py-20 relative overflow-hidden split-section">
        <AnimatedSectionBg variant="rings" opacity={0.04} color="#e11d48" secondary="#a855f7" />
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-14">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">Built for everyone</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              One platform, <span className="gradient-text">two superpowers</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Developers card */}
            <div data-animate="fade-left" className="group relative rounded-3xl overflow-hidden p-10 lg:p-12 flex flex-col justify-between min-h-[480px] cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-felovy-red to-purple-700" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_55%)]" />
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%"><defs><pattern id="d-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#d-dots)"/></svg>
              </div>
              <div className="absolute top-4 right-4 h-56 w-56 rounded-full border border-white/10 pointer-events-none" />
              <div className="absolute bottom-8 right-8 h-28 w-28 rounded-full border border-white/15 pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-white/60 mb-7">
                  <span className="h-px w-8 bg-white/40" /> For Developers
                </div>
                <h2 className="text-3xl xl:text-4xl font-extrabold text-white mb-5 leading-tight">
                  Find work that matches<br />
                  <span className="text-yellow-200">your ambition</span>
                </h2>
                <p className="text-white/70 mb-8 leading-relaxed max-w-md text-[15px]">
                  Get verified, showcase your skills, and land high-paying remote contracts
                  from companies that truly value your craft.
                </p>
                <ul className="space-y-3 mb-8">
                  {devBenefits.map(b => (
                    <li key={b} className="flex items-center gap-3 text-sm text-white/80">
                      <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/signup?role=developer" className="relative z-10 self-start">
                <Button size="lg" className="gap-2 bg-white text-felovy-red hover:bg-rose-50 border-0 shadow-xl shadow-rose-900/25 hover:shadow-2xl transition-all duration-300">
                  Start as Developer <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Employers card */}
            <div data-animate="fade-right" className="group relative rounded-3xl overflow-hidden p-10 lg:p-12 flex flex-col justify-between min-h-[480px] cursor-default bg-white border border-gray-100 hover:border-rose-200/50 hover:shadow-2xl hover:shadow-rose-100/30 transition-all duration-500">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(254,205,211,0.4),transparent_60%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(233,213,255,0.3),transparent_60%)] pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-felovy-red mb-7">
                  <span className="h-px w-8 bg-felovy-red/30" /> For Employers
                </div>
                <h2 className="text-3xl xl:text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
                  Build your team with<br />
                  <span className="gradient-text">verified talent</span>
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed max-w-md text-[15px]">
                  Browse thousands of vetted developers, post jobs instantly, and find your
                  perfect match — faster and more reliably than anywhere else.
                </p>
                <ul className="space-y-3 mb-8">
                  {empBenefits.map(b => (
                    <li key={b} className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="h-5 w-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-felovy-red" />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/signup?role=employer" className="relative z-10 self-start">
                <Button variant="gradient" size="lg" className="gap-2 shadow-lg shadow-rose-200/50 hover:shadow-2xl hover:shadow-rose-200/60 transition-all duration-300">
                  Hire Top Developers <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEW: TEAM & COMPANY PHOTO ── */}
      <section id="team" className="relative overflow-hidden">
        {/* Full-width hero team photo */}
        <div data-animate="zoom-out" className="relative h-[500px] lg:h-[580px] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85"
            alt="Felovy team collaboration"
            fill
            className="object-cover object-center"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-900/60 to-gray-900/20" />
          {/* Diagonal SVG overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="crosshatch" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 20 L20 0 M-5 5 L5 -5 M15 25 L25 15" stroke="white" strokeWidth="0.5" fill="none"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#crosshatch)"/>
          </svg>
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="max-w-xl">
                <p data-animate="fade-right" className="text-[10px] font-black tracking-[0.28em] uppercase text-felovy-rose mb-5">Our Story</p>
                <h2 data-animate="fade-right" data-delay="100" className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
                  Built by people who care{' '}
                  <span className="text-yellow-300">about your success</span>
                </h2>
                <p data-animate="fade-right" data-delay="200" className="text-white/70 text-lg leading-relaxed mb-8">
                  Felovy was founded by engineers and talent specialists who lived both sides
                  of the hiring struggle. We built the platform we always wanted — and opened
                  it to the world.
                </p>
                <div data-animate="fade-right" data-delay="300" className="flex gap-10">
                  <div><p className="text-4xl font-extrabold text-white">12+</p><p className="text-white/50 text-sm mt-1">Team Members</p></div>
                  <div><p className="text-4xl font-extrabold text-white">3</p><p className="text-white/50 text-sm mt-1">Continents</p></div>
                  <div><p className="text-4xl font-extrabold text-white">80+</p><p className="text-white/50 text-sm mt-1">Countries Served</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── 10. TESTIMONIALS — tabbed dev / client with profile photos ── */}
      <section className="py-28 bg-gray-50/60 border-y border-gray-100 relative overflow-hidden">
        <AnimatedSectionBg variant="spiral" opacity={0.04} color="#e11d48" secondary="#a855f7" />
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-6">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">Real Voices</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Loved by{' '}
              <span className="gradient-text">builders worldwide</span>
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500 max-w-xl mx-auto">
              Real voices from developers and companies who transformed their careers and products with Felovy.
            </p>
          </div>
          <TestimonialsSection />
        </div>
      </section>

      {/* ── 16. FAQ ── */}
      <section id="faq" className="py-28 bg-white relative overflow-hidden">
        <AnimatedSectionBg variant="bubbles" opacity={0.04} color="#e11d48" secondary="#a855f7" />
        {/* SVG zigzag lines top + bottom */}
        <svg className="absolute top-0 left-0 right-0 w-full opacity-[0.05] pointer-events-none" viewBox="0 0 1440 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <polyline points="0,20 30,0 60,20 90,0 120,20 150,0 180,20 210,0 240,20 270,0 300,20 330,0 360,20 390,0 420,20 450,0 480,20 510,0 540,20 570,0 600,20 630,0 660,20 690,0 720,20 750,0 780,20 810,0 840,20 870,0 900,20 930,0 960,20 990,0 1020,20 1050,0 1080,20 1110,0 1140,20 1170,0 1200,20 1230,0 1260,20 1290,0 1320,20 1350,0 1380,20 1410,0 1440,20" fill="none" stroke="#a855f7" strokeWidth="1.5"/>
        </svg>
        <div className="container mx-auto max-w-3xl px-4 relative">
          <div className="text-center mb-16">
            <p data-animate="fade-down" className="text-xs font-bold tracking-[0.28em] uppercase text-felovy-red/70 mb-3">FAQ</p>
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Questions,{' '}
              <span className="gradient-text">answered</span>
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500">Everything you need to know before you start.</p>
          </div>

          <div data-animate="fade-up" data-delay="150" className="rounded-3xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group/faq border-b border-gray-100 last:border-0">
                <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-6 px-7 py-5 hover:bg-gray-50/70 transition-colors">
                  <span className="font-semibold text-gray-900 text-[15px] leading-snug">{q}</span>
                  <ChevronDown className="h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200 group-open/faq:rotate-180" />
                </summary>
                <p className="px-7 pb-6 pt-1 text-sm text-gray-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>

          <p className="text-center mt-8 text-sm text-gray-400">
            Still have questions?{' '}
            <Link href="/signup" className="text-felovy-red hover:underline font-semibold">
              Create a free account
            </Link>
            {' '}and we'll be in touch.
          </p>
        </div>
      </section>

      {/* ── 17. CTA BANNER ── */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-br from-felovy-red via-rose-500 to-felovy-purple">
        {/* SVG starburst radial lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {Array.from({length: 24},(_,i) => {
            const a = (i/24)*360; const x2=400+500*Math.cos(a*Math.PI/180); const y2=200+500*Math.sin(a*Math.PI/180);
            return <line key={i} x1="400" y1="200" x2={x2} y2={y2} stroke="white" strokeWidth="0.8" opacity="0.6"/>;
          })}
          {[60,120,180,240].map((r,i)=><circle key={i} cx="400" cy="200" r={r} fill="none" stroke="white" strokeWidth="0.5" opacity="0.4"/>)}
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute top-12 right-12 h-72 w-72 rounded-full border border-white/15 pointer-events-none" />
        <div className="absolute bottom-12 left-12 h-56 w-56 rounded-full border border-white/15 pointer-events-none" />

        <div className="relative z-10 container mx-auto max-w-4xl px-4 text-center">
          <Badge data-animate="scale-in" className="mb-8 gap-2 px-4 py-2 text-sm border-white/25 text-white/80 bg-white/10" variant="outline">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            Join 6,200+ professionals worldwide
          </Badge>
          <h2 data-animate="fade-up" className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Ready to shape the{' '}
            <span className="text-yellow-200">
              future of work?
            </span>
          </h2>
          <p data-animate="fade-up" data-delay="150" className="text-white/75 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            Whether you're a developer looking for your next big break, or a company building
            a breakthrough product — Felovy is where it happens.
          </p>
          <div data-animate="fade-up" data-delay="300" className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup?role=developer">
              <Button size="xl" className="gap-2 w-full sm:w-auto bg-white text-felovy-red hover:bg-rose-50 border-0 shadow-2xl shadow-rose-900/20">
                Start as Developer <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup?role=employer">
              <Button size="xl" className="gap-2 w-full sm:w-auto bg-white/15 text-white hover:bg-white/25 border border-white/25 shadow-xl">
                Hire Top Talent <Briefcase className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 18. FOOTER ── */}
      <footer className="bg-gray-50 border-t border-gray-200 text-gray-500">
        <div className="container mx-auto max-w-7xl px-4 pt-16 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <Link href="/" className="flex items-center gap-2 mb-1">
                <Image src="/logo.png" alt="Felovy" width={32} height={32} className="rounded-lg" />
                <span className="text-lg font-bold gradient-text">Felovy</span>
              </Link>
              <p className="text-sm leading-relaxed text-gray-500">
                For Every Life, Our Value Yields. The premier platform connecting global software talent
                with world-class opportunities.
              </p>
              <div className="flex gap-2 pt-1">
                {[
                  { label: 'Twitter',  path: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' },
                  { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                  { label: 'GitHub',   path: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' },
                ].map(({ label, path }) => (
                  <a key={label} href="#" aria-label={label} className="h-9 w-9 rounded-xl bg-gray-200 hover:bg-felovy-red/10 flex items-center justify-center transition-colors group">
                    <svg className="h-4 w-4 text-gray-500 group-hover:text-felovy-red transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d={path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-[0.14em] uppercase text-gray-700 mb-5">Platform</h4>
              <ul className="space-y-3">
                {[['Browse Jobs', '/jobs'], ['Find Developers', '/developers'], ['Post a Job', '/signup?role=employer'], ['How It Works', '/#services']].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-sm hover:text-gray-900 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-[0.14em] uppercase text-gray-700 mb-5">For Developers</h4>
              <ul className="space-y-3">
                {[
                  ['Create Account', '/signup?role=developer'],
                  ['Complete Profile', '/dashboard/developer/profile'],
                  ['Browse Jobs', '/jobs'],
                  ['Get Verified', '/dashboard/developer/profile?step=4'],
                ].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-sm hover:text-gray-900 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-[0.14em] uppercase text-gray-700 mb-5">For Employers</h4>
              <ul className="space-y-3">
                {[
                  ['Create Account', '/signup?role=employer'],
                  ['Browse Developers', '/developers'],
                  ['Post a Job', '/dashboard/employer'],
                  ['Sign In', '/signin'],
                ].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-sm hover:text-gray-900 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-400">© {new Date().getFullYear()} Felovy. All rights reserved.</span>
            <div className="flex gap-6 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
