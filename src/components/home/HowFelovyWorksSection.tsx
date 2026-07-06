'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storysetWorkflowSrc } from '@/lib/storyset';
import { Button } from '@/components/ui/button';
import { HOME_IMAGE_SIZES } from '@/lib/home-image';
import { HomeStorysetIllustration } from '@/components/home/HomeStorysetIllustration';

interface WorkflowStep {
  id: string;
  step: string;
  title: string;
  body: string;
  illustration: string;
}

const DEVELOPER_STEPS: WorkflowStep[] = [
  {
    id: 'dev-01-verify-email',
    step: '01',
    title: 'Sign up & verify email',
    body: 'Create your account and confirm with the 6-digit OTP sent to your inbox.',
    illustration: storysetWorkflowSrc('dev-01-verify-email'),
  },
  {
    id: 'dev-02-complete-profile',
    step: '02',
    title: 'Complete your profile',
    body: 'Four guided steps: personal info, skills & experience, photo or video, and ID upload.',
    illustration: storysetWorkflowSrc('dev-02-complete-profile'),
  },
  {
    id: 'dev-03-get-verified',
    step: '03',
    title: 'Get verified',
    body: 'Submit for Felovy review. Verified developers unlock the ability to apply for jobs.',
    illustration: storysetWorkflowSrc('dev-03-get-verified'),
  },
  {
    id: 'dev-04-apply-jobs',
    step: '04',
    title: 'Apply & get hired',
    body: 'Browse approved listings, apply with a cover letter, and track status through acceptance.',
    illustration: storysetWorkflowSrc('dev-04-apply-jobs'),
  },
];

const EMPLOYER_STEPS: WorkflowStep[] = [
  {
    id: 'emp-01-company-email',
    step: '01',
    title: 'Register with company email',
    body: 'Use your work email, personal addresses aren’t accepted. Verify ownership with an OTP.',
    illustration: storysetWorkflowSrc('emp-01-company-email'),
  },
  {
    id: 'emp-02-company-profile',
    step: '02',
    title: 'Complete company profile',
    body: 'Add company details, intro media, and ID across four profile steps, same trust bar as developers.',
    illustration: storysetWorkflowSrc('emp-02-company-profile'),
  },
  {
    id: 'emp-03-post-job',
    step: '03',
    title: 'Post a job listing',
    body: 'Verified employers publish roles with skills and salary. Listings are reviewed before going live.',
    illustration: storysetWorkflowSrc('emp-03-post-job'),
  },
  {
    id: 'emp-04-review-applicants',
    step: '04',
    title: 'Review applicants & hire',
    body: 'Move candidates through pending → reviewing → shortlisted → accepted in your dashboard.',
    illustration: storysetWorkflowSrc('emp-04-review-applicants'),
  },
];

function StepCard({
  step,
  index,
  className,
}: {
  step: WorkflowStep;
  index: number;
  className?: string;
}) {
  return (
    <article
      data-animate="fade-up"
      data-delay={String(index * 70)}
      className={cn(
        'group flex flex-col min-w-0 transition-transform duration-300 hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="relative">
        <HomeStorysetIllustration
          src={step.illustration}
          sizes={HOME_IMAGE_SIZES.workflowTile}
          aspectClass="aspect-[5/4]"
          imagePadding="p-1.5 sm:p-2"
        />
        <span className="absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[9px] font-bold text-white shadow-sm">
          {step.step}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="text-xs font-bold text-gray-900 mb-1 leading-snug">{step.title}</h3>
        <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-3">{step.body}</p>
      </div>
    </article>
  );
}

function FlowArrow({ direction }: { direction: 'right' | 'down' }) {
  const Icon = direction === 'right' ? ArrowRight : ArrowDown;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center self-center text-gray-300/90',
        direction === 'right' && 'px-0.5',
      )}
      aria-hidden
    >
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" strokeWidth={2.25} />
    </div>
  );
}

function StepFlow({ steps }: { steps: WorkflowStep[] }) {
  return (
    <>
      {/* Mobile: stack */}
      <div className="flex flex-col items-center gap-1 mb-8 md:hidden max-w-xs mx-auto">
        {steps.map((step, i) => (
          <div key={step.id} className="w-full flex flex-col items-center gap-1">
            <StepCard step={step} index={i} />
            {i < steps.length - 1 && <FlowArrow direction="down" />}
          </div>
        ))}
      </div>

      {/* md–lg: 2×2 */}
      <div className="hidden md:grid xl:hidden grid-cols-2 gap-3 mb-8 max-w-2xl mx-auto">
        {steps.map((step, i) => (
          <StepCard key={step.id} step={step} index={i} />
        ))}
      </div>

      {/* xl+: 1 × 4 */}
      <div className="hidden xl:flex items-stretch gap-1 mb-8">
        {steps.map((step, i) => (
          <Fragment key={step.id}>
            <StepCard step={step} index={i} className="flex-1 min-w-0" />
            {i < steps.length - 1 && <FlowArrow direction="right" />}
          </Fragment>
        ))}
      </div>
    </>
  );
}

interface WorkflowBlockProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: WorkflowStep[];
  ctaHref: string;
  ctaLabel: string;
  bordered?: boolean;
  /** Tighter top padding when stacked below another workflow block */
  compactTop?: boolean;
}

function WorkflowBlock({
  id,
  eyebrow,
  title,
  subtitle,
  steps,
  ctaHref,
  ctaLabel,
  bordered,
  compactTop,
}: WorkflowBlockProps) {
  return (
    <section
      id={id}
      className={cn(
        'bg-white',
        compactTop
          ? 'pt-6 md:pt-8 pb-10 md:pb-12'
          : 'pt-10 md:pt-12 pb-6 md:pb-8',
        bordered && 'border-t border-gray-100',
      )}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-felovy-red mb-3">
            {eyebrow}
          </p>
          <h2
            data-animate="fade-up"
            className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 leading-[1.15]"
          >
            {title}
          </h2>
          <div className="flex items-center justify-between gap-4 sm:gap-6">
            <p
              data-animate="fade-up"
              data-delay="80"
              className="max-w-2xl flex-1 min-w-0 text-gray-500 text-sm md:text-base leading-relaxed"
            >
              {subtitle}
            </p>
            <div data-animate="fade-up" data-delay="120" className="shrink-0">
              <Link href={ctaHref}>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-gray-900/20 text-gray-900 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors whitespace-nowrap text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-6"
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <StepFlow steps={steps} />
      </div>
    </section>
  );
}

export function HowFelovyWorksSection() {
  return (
    <div id="how-it-works" className="border-t border-gray-100">
      <WorkflowBlock
        id="for-developers"
        eyebrow="For developers"
        title="From signup to your next role"
        subtitle="Four clear steps built around how Felovy actually works: verify your profile, then apply to real jobs posted by verified companies."
        steps={DEVELOPER_STEPS}
        ctaHref="/signup?role=developer"
        ctaLabel="Create developer account"
      />

      <WorkflowBlock
        id="for-employers"
        eyebrow="For employers"
        title="Hire verified talent with confidence"
        subtitle="Company email in, verified profile out then post roles, review applications, and build your remote team on Felovy."
        steps={EMPLOYER_STEPS}
        ctaHref="/signup?role=employer"
        ctaLabel="Create employer account"
        bordered
        compactTop
      />
    </div>
  );
}
