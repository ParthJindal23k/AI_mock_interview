"use client";

import dynamic from "next/dynamic";
import FeedbackSkeleton from "./_components/FeedbackSkeleton";

const ShowFeedback = dynamic(() => import("./ShowFeedback"), {
  ssr: false,
  loading: () => <FeedbackSkeleton />,
});

export default function FeedbackClient({
  mockId,
  result,
  summary,
  overallRating,
}: {
  mockId: string;
  result: any[];
  summary: any;
  overallRating: string | null;
}) {
  return (
    <ShowFeedback
      mockId={mockId}
      result={result}
      summary={summary}
      overallRating={overallRating}
    />
  );
}
