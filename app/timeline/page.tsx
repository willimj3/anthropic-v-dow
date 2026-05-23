import { loadTimeline } from '@/lib/data';
import { TimelineList } from '@/components/TimelineList';
import { PageHeading } from '@/components/PageHeading';

export const metadata = { title: 'Timeline' };

export default function TimelinePage() {
  const events = loadTimeline();
  return (
    <div>
      <PageHeading
        title="Timeline"
        lede="A chronological view of the dispute — from the Usage Policy origins of the contracting impasse through the May 2026 supplemental briefing order in the D.C. Circuit."
      />
      <TimelineList events={events} />
    </div>
  );
}
