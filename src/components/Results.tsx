"use client";

import { useState, useRef } from "react";
import { Job } from "@/data/jobs";
import { toPng } from "html-to-image";

interface ResultsProps {
  topJobs: Job[];
  onRestart: () => void;
}

export default function Results({ topJobs, onRestart }: ResultsProps) {
  const [name, setName] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const date = new Date().toLocaleDateString();

  const handleExport = async () => {
    if (resultsRef.current === null) return;

    try {
      const dataUrl = await toPng(resultsRef.current, {
        cacheBust: true,
        backgroundColor: "#fdf6e3", // Match the background color
        style: {
          padding: "40px",
        },
      });
      const link = document.createElement("a");
      link.download = `job-bracket-results-${name || "user"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-7xl neo-title mb-12">
        Tournament Complete!
      </h2>

      <div className="mb-8 bg-soft-white neo-border neo-shadow p-8 max-w-md mx-auto">
        <label className="block text-xl font-bold mb-4 uppercase tracking-wide">
          Enter your name for the certificate:
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          className="w-full p-4 neo-border bg-white text-xl focus:outline-none focus:ring-2 focus:ring-sage-green"
        />
      </div>
      
      <div ref={resultsRef} className="bg-soft-white neo-border neo-shadow p-12 mb-12">
        <div className="flex justify-between items-start mb-8">
          <div className="text-left">
            <h3 className="text-4xl neo-title mb-2">Your Top Choices</h3>
            {name && <p className="text-2xl font-bold text-sage-green">Prepared for: {name}</p>}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{date}</p>
            <p className="text-sm font-bold uppercase tracking-widest">Job Bracket Challenge</p>
          </div>
        </div>

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

      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <button
          onClick={handleExport}
          className="neo-button bg-sage-green text-2xl uppercase"
        >
          Download PNG
        </button>
        <button
          onClick={onRestart}
          className="neo-button bg-pale-salmon text-2xl uppercase"
        >
          Start New Tournament
        </button>
      </div>
    </div>
  );
}
