"use client";

import React from "react";

export default function FeedbackSkeleton() {
  return (
    <div className="p-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-6 w-80 rounded bg-gray-200" />
        <div className="h-5 w-56 rounded bg-gray-200" />
        <div className="h-4 w-96 rounded bg-gray-200" />
      </div>

      <div className="mt-10 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-white p-4 space-y-3"
          >
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-3 w-5/6 rounded bg-gray-200" />
            <div className="h-3 w-2/3 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="mt-10 h-10 w-32 rounded bg-gray-200" />
    </div>
  );
}
