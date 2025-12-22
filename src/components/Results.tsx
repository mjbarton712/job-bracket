"use client";

import { Job } from "@/data/jobs";

interface ResultsProps {
  topJobs: Job[];
  onRestart: () => void;
}

export default function Results({ topJobs, onRestart }: ResultsProps) {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-7xl neo-title mb-12">
        Tournament Complete!
      </h2>
      
      <div className="bg-soft-white neo-border neo-shadow p-12 mb-12">
        <h3 className="text-4xl neo-title mb-8">Your Top Choices</h3>
        <div className="space-y-6">
          {topJobs.map((job, index) => (
            <div
              key={job.id}
              className="flex items-center gap-6 p-6 neo-border bg-sage-green"
            >
              <div className="text-5xl neo-title w-16">
                #{index + 1}
              </div>
              <div className="text-left flex-1">
                <h4 className="text-3xl neo-title">{job.title}</h4>
                <p className="text-xl font-medium">{job.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="neo-button bg-pale-salmon text-2xl uppercase"
      >
        Start New Tournament
      </button>
    </div>
  );
}
