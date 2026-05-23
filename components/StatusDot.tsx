import type { DocketStatus } from '@/lib/data';

const COLOR: Record<DocketStatus, string> = {
  green: 'bg-emerald-600',
  amber: 'bg-amber-500',
  gray: 'bg-stone-400',
  red: 'bg-rose-600',
};

export function StatusDot({ color }: { color: DocketStatus }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 rounded-full ${COLOR[color] ?? COLOR.gray}`}
    />
  );
}
