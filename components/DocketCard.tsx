import Link from 'next/link';
import type { DocketMeta } from '@/lib/data';
import { StatusDot } from './StatusDot';

export function DocketCard({ docket }: { docket: DocketMeta }) {
  return (
    <Link
      href={`/dockets/${docket.id}`}
      className="block border border-rule rounded-sm p-5 no-underline hover:bg-white transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <StatusDot color={docket.status_color} />
        <span className="ui text-xs uppercase tracking-widest text-muted">
          {docket.court}
        </span>
      </div>
      <h3 className="text-base font-semibold text-ink no-underline mb-1">
        {docket.case_no}
      </h3>
      {docket.judge ? (
        <p className="ui text-sm text-muted mb-3">Judge {docket.judge}</p>
      ) : docket.panel ? (
        <p className="ui text-sm text-muted mb-3">Panel: {docket.panel}</p>
      ) : null}
      <p className="text-sm leading-snug text-ink">{docket.status}</p>
    </Link>
  );
}
