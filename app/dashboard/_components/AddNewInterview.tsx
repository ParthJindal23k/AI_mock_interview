"use client";

import React, { useState,useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { LoaderCircle, Plus ,Lock} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function AddNewInterview() {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setjobPostion] = useState();
  const [jobDesc, setjobDesc] = useState();
  const [jobExperience, setjobExperience] = useState();
  const [loading, setloading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setloading(true);

  try {
    const response = await axios.post("/api/interview/create", {
      jobPosition,
      jobDesc,
      jobExperience,
    });

    setOpenDialog(false);
    router.push(`/dashboard/interview/${response.data.sessionId}`);

  } catch (error: any) {
    console.error("Interview creation failed:", error);
    const { toast } = await import("sonner");
    toast.error("Failed to create interview. Please try again.");
  } finally {
    setloading(false);
  }
};

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpenDialog(true)}
        className="group cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-white p-10 transition hover:border-indigo-400 hover:shadow-lg"
      >
        <div className="flex flex-col items-center gap-3 text-gray-600 group-hover:text-indigo-600">
          <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
          <h2 className="text-sm font-medium tracking-wide">
            Add New Interview
          </h2>
        </div>
      </motion.div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl rounded-3xl border-none bg-white p-10 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Create a Mock Interview
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Provide role details so we can generate a realistic interview
              experience.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Job Role
              </label>
              <Input
                placeholder="Full Stack Developer"
                className="h-11 rounded-xl focus-visible:ring-indigo-500"
                required
                onChange={(e: any) => setjobPostion(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Tech Stack / Description
              </label>
              <Textarea
                placeholder="React, Node.js, PostgreSQL, System Design"
                className="min-h-[90px] rounded-xl focus-visible:ring-indigo-500"
                required
                onChange={(e: any) => setjobDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Experience (years)
              </label>
              <Input
                type="number"
                placeholder="2"
                max={100}
                className="h-11 rounded-xl focus-visible:ring-indigo-500"
                required
                onChange={(e: any) => setjobExperience(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenDialog(false)}
                className="rounded-full px-6"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="rounded-full px-8 shadow-md transition active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Generating
                  </span>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddNewInterview;
