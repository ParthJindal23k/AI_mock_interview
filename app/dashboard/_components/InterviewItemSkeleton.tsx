"use client";

import React from "react";

function InterviewItemSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4 animate-pulse">
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="h-3 w-full rounded bg-gray-200" />
      <div className="h-3 w-5/6 rounded bg-gray-200" />

      <div className="mt-4 flex justify-between items-center">
        <div className="h-8 w-24 rounded bg-gray-200" />
        <div className="h-8 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default InterviewItemSkeleton;
