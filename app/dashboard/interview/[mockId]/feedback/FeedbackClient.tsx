"use client";

import dynamic from "next/dynamic";
import FeedbackSkeleton from "./_components/FeedbackSkeleton";

const ShowFeedback = dynamic(() => import("./ShowFeedback"), {
  ssr: false,
  loading: () => <FeedbackSkeleton />,
});

export default function FeedbackClient({
  result,
  summary,
  overallRating,
}: {
  result: any[];
  summary: any;
  overallRating: string | null;
}) {
  return (
    <ShowFeedback
      result={result}
      summary={summary}
      overallRating={overallRating}
    />
  );
}
