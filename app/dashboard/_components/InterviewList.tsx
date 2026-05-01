"use client";

import React, { useEffect, useState } from "react";
import InterviewItemSkeleton from "./InterviewItemSkeleton";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import InterviewItemCard from "./InterviewItemCard";

function InterviewList() {
  const { user, isLoaded } = useUser();
  const [interviewList, setInterviewList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      getInterviewList();
    }
  }, [isLoaded, user]);

  const getInterviewList = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/interviews");
      setInterviewList(res.data.result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <h2 className="font-md text-xl font-bold">Previous Mock Interviews</h2>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 my-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <InterviewItemSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && interviewList.length === 0 && (
        <p className="text-sm text-gray-500">No interviews found</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 my-3">
        {interviewList.map((interview, index) => (
          <InterviewItemCard key={index} interview={interview} />
        ))}
      </div>
    </div>
  );
}

export default InterviewList;
