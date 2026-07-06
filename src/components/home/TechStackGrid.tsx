'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DEVICON_STACKS, type DeviconStack } from '@/lib/devicon-stacks';

const COLS = 8;
const VISIBLE_ROWS = 4;
const PAGE_MS = 3200;

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
  const pageCount = Math.max(1, Math.ceil(rows.length / VISIBLE_ROWS));
  const [activePage, setActivePage] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const visibleRows = useMemo(() => {
    const start = activePage * VISIBLE_ROWS;
    const slice = rows.slice(start, start + VISIBLE_ROWS);
    if (slice.length >= VISIBLE_ROWS) return slice;

    const padded = [...slice];
    let i = 0;
    while (padded.length < VISIBLE_ROWS && rows.length > 0) {
      padded.push(rows[i % rows.length]);
      i++;
    }
    return padded;
  }, [rows, activePage]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActivePage((prev) => (prev + 1) % pageCount);
      setAnimKey((prev) => prev + 1);
    }, PAGE_MS);

    return () => window.clearInterval(id);
  }, [pageCount]);

  const effect = ROW_EFFECTS[activePage % ROW_EFFECTS.length];

  return (
    <div className="relative mx-auto max-w-5xl">
      <div
        key={animKey}
        className={cn(
          'flex flex-col gap-1 sm:gap-1.5',
          'min-h-[21rem] sm:min-h-[23rem]',
          effect,
        )}
      >
        {visibleRows.map((row, rowIndex) => (
          <div key={`${activePage}-${rowIndex}-${animKey}`} className="grid grid-cols-8 gap-1 sm:gap-1.5">
            {row.map((stack, index) => (
              <StackCell key={`${stack.id}-${rowIndex}-${index}`} stack={stack} index={index} />
            ))}
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] tabular-nums text-gray-400">
        {activePage + 1} / {pageCount}
      </p>
    </div>
  );
}
