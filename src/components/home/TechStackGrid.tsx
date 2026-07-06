'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DEVICON_STACKS, type DeviconStack } from '@/lib/devicon-stacks';

const COLS = 8;
const ROW_MS = 2800;

const ROW_EFFECTS = [
  'tech-stack-fx-up',
  'tech-stack-fx-left',
  'tech-stack-fx-scale',
  'tech-stack-fx-blur',
] as const;

function chunkRows(stacks: DeviconStack[], cols: number) {
  const rows: DeviconStack[][] = [];
  for (let i = 0; i < stacks.length; i += cols) {
    const row = stacks.slice(i, i + cols);
    while (row.length < cols) {
      row.push({ id: `pad-${i}-${row.length}`, label: '', iconClass: '' });
    }
    rows.push(row);
  }
  return rows;
}

function StackCell({ stack, index }: { stack: DeviconStack; index: number }) {
  if (!stack.iconClass) {
    return <div aria-hidden className="min-w-0" />;
  }

  return (
    <div
      className="tech-stack-cell flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl bg-white px-1 py-2.5 shadow-sm shadow-gray-200/50 sm:rounded-2xl sm:px-1.5 sm:py-3"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <i
        className={`${stack.iconClass} colored text-lg leading-none sm:text-2xl md:text-[1.65rem]`}
        aria-hidden
      />
      <span className="w-full text-center text-[8px] font-medium leading-tight text-gray-600 line-clamp-2 sm:text-[10px] md:text-[11px]">
        {stack.label}
      </span>
    </div>
  );
}

export function TechStackGrid() {
  const rows = useMemo(() => chunkRows(DEVICON_STACKS, COLS), []);
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % rows.length);
      setAnimKey((prev) => prev + 1);
    }, ROW_MS);

    return () => window.clearInterval(id);
  }, [rows.length]);

  const row = rows[active];
  const effect = ROW_EFFECTS[active % ROW_EFFECTS.length];

  return (
    <div className="relative mx-auto max-w-5xl">
      <div
        key={animKey}
        className={cn(
          'grid grid-cols-8 gap-1 sm:gap-1.5',
          'min-h-[5.25rem] sm:min-h-[5.75rem]',
          effect,
        )}
      >
        {row.map((stack, index) => (
          <StackCell key={`${stack.id}-${animKey}`} stack={stack} index={index} />
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] tabular-nums text-gray-400">
        {active + 1} / {rows.length}
      </p>
    </div>
  );
}
