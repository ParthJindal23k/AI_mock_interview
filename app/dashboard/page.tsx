"use client";
import React from "react";
import { motion } from "framer-motion";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/InterviewList";

function Page() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto max-w-7xl px-6 py-10"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Create and start AI-powered mock interviews tailored to your role.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AddNewInterview />
      </div>

      <div className="mt-14">
        <InterviewList />
      </div>
    </motion.div>
  );
}

export default Page;
