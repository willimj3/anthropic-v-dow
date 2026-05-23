import StudyGuide from '@/data/study-guide.mdx';
import { PageHeading } from '@/components/PageHeading';

export const metadata = { title: 'Study guide' };

export default function StudyGuidePage() {
  return (
    <div className="prose-page">
      <PageHeading
        eyebrow="Self-paced review"
        title="Study guide"
        lede="Question-and-answer review of every doctrinal and factual point in the case. Generated from the underlying Anki deck."
      />
      <StudyGuide />
    </div>
  );
}
