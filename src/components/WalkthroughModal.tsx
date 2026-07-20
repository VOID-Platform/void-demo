'use client';

import React, { useState } from 'react';
import { Presentation, X, Play, ChevronRight, ChevronLeft, CheckCircle2, Clock, Terminal } from 'lucide-react';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTraceIndex?: (index: number) => void;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onSelectTraceIndex,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const scriptSteps = [
    {
      time: '0–15 seconds',
      title: '1. Introduce Application & Telemetry Foundation',
      talkingPoint:
        'This is NovaFlow Copilot, a normal AI application instrumented with the VOID SDK. The SDK emits OpenTelemetry traces—nothing more. Notice how zero business logic or incident detection lives inside the SDK.',
      actionText: 'Run All 10 Traces to observe live OpenTelemetry emission.',
      targetTraceIndex: 1,
    },
    {
      time: '15–35 seconds',
      title: '2. Visibly Broken Execution (Looping)',
      talkingPoint:
        'Click the Looping execution (#6). The SDK recorded every planning step and tool call. In this case, github.createIssue was called 5 consecutive times! None of this incident logic exists inside the SDK—DemoIncidentAnalyzer simply consumed the trace.',
      actionText: 'Inspect Looping trace evidence & GitHub issue formation recommendation.',
      targetTraceIndex: 6,
    },
    {
      time: '35–55 seconds',
      title: '3. Subtle Quality Issue (Hallucination)',
      talkingPoint:
        'Click the Hallucination execution (#4). The user asked for weather in Paris and received "25°C". But telemetry proves ZERO weather tools were called! Point to the badge: Simulated Evaluator (deterministic) and Semantic Sampling (category-flagged traces: 2 of 10).',
      actionText: 'Highlight category-flagged sampling funnel and deterministic evaluator.',
      targetTraceIndex: 4,
    },
    {
      time: '55–75 seconds',
      title: '4. OpenTrace in SigNoz',
      talkingPoint:
        'Click "Open Trace in SigNoz". Show the standard OpenTelemetry trace timeline in SigNoz. Everything you see comes directly from OpenTelemetry telemetry.',
      actionText: 'Click Open Trace in SigNoz to open local SigNoz dashboard.',
      targetTraceIndex: 4,
    },
    {
      time: '75–90 seconds',
      title: '5. Future Architecture & YC Key Takeaway',
      talkingPoint:
        'End with the architecture diagram. Today DemoIncidentAnalyzer is deterministic. Tomorrow it becomes the VOID Server powering automated GitHub issue formation, Linear tickets, and PagerDuty. The SDK, the application, and the telemetry don\'t change—only the consumer changes.',
      actionText: 'Toggle Architecture view from Today to Future.',
      targetTraceIndex: 1,
    },
  ];

  const handleStepChange = (idx: number) => {
    setCurrentStep(idx);
    const step = scriptSteps[idx];
    if (step && onSelectTraceIndex) {
      onSelectTraceIndex(step.targetTraceIndex);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="lightswind-card max-w-2xl w-full p-6 border border-[#DF00FF]/40 bg-[#09090D] rounded-2xl shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#13131A] text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#DF00FF] to-[#C084FC] text-black">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">90-Second Hackathon Demo Walkthrough</h2>
            <p className="text-xs text-zinc-400 font-mono">YC Pitch Guide & Timestamped Presenter Script</p>
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {scriptSteps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleStepChange(idx)}
              className={`p-2 rounded-lg text-center font-mono text-[10px] transition-all border ${
                currentStep === idx
                  ? 'bg-[#DF00FF]/20 border-[#DF00FF] text-[#DF00FF] font-bold'
                  : 'bg-[#030307] border-[#1F1F24] text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div>{s.time}</div>
            </button>
          ))}
        </div>

        {/* Active Script Step */}
        <div className="p-5 rounded-xl bg-[#030307] border border-[#1F1F24] mb-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#C084FC] mb-2">
            <span>{scriptSteps[currentStep].time}</span>
            <span>Step {currentStep + 1} of 5</span>
          </div>

          <h3 className="text-sm font-bold text-white mb-2">{scriptSteps[currentStep].title}</h3>

          <div className="p-3 rounded-lg bg-[#13131A] border border-[#DF00FF]/30 text-xs text-zinc-200 font-mono mb-3 leading-relaxed">
            "{scriptSteps[currentStep].talkingPoint}"
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-semibold">Action:</span>
            <span className="text-zinc-300">{scriptSteps[currentStep].actionText}</span>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#13131A] text-xs font-mono text-zinc-300 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-zinc-500">Press Esc or click X to close guide</span>

          <button
            onClick={() => handleStepChange(Math.min(scriptSteps.length - 1, currentStep + 1))}
            disabled={currentStep === scriptSteps.length - 1}
            className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#DF00FF] to-[#9333EA] text-xs font-mono text-white font-semibold shadow-md disabled:opacity-40"
          >
            <span>Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
