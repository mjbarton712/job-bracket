"use client";

import { Job } from "@/data/jobs";

interface JobCardProps {
  job: Job;
  onSelect: () => void;
  isSelected?: boolean;
}

export default function JobCard({ job, onSelect, isSelected = false }: JobCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-8 neo-card
        ${
          isSelected
            ? "bg-pale-salmon"
            : "bg-soft-white hover:bg-warm-tan"
        }
      `}
    >
      <h3 className="text-4xl neo-title mb-3">{job.title}</h3>
      <p className="text-xl font-medium">{job.description}</p>
    </button>
  );
}
