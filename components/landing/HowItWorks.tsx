"use client";

import { motion } from "framer-motion";

const steps = [
  {
    title: "Create Interview",
    text: "Define role, experience level, and job description to generate a tailored interview."
  },
  {
    title: "Answer Naturally",
    text: "Respond using video or voice in a distraction-free interview environment."
  },
  {
    title: "AI Feedback",
    text: "Receive structured feedback, ratings, and improvement suggestions instantly."
  }
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-white py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-4xl font-semibold text-gray-900"
        >
          How It Works
        </motion.h2>

        <div className="mt-20 grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-2xl border border-gray-200 bg-white p-8 transition hover:border-indigo-200 hover:shadow-xl"
            >
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-medium">
                {i + 1}
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                {step.title}
              </h3>

              <p className="mt-3 text-gray-600">
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
