'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Presentation, X, ChevronRight, ChevronLeft, Terminal } from 'lucide-react';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus save and restore
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Keyboard listener: Escape key and Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled'));

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const scriptSteps = [
    {
      time: '0–15s',
      title: '1. Application & Telemetry Foundation',
      talkingPoint:
        'This is NovaFlow Copilot, an AI application instrumented with the VOID SDK. The SDK emits standard OpenTelemetry traces. Notice zero business logic or incident detection lives inside the SDK.',
      actionText: 'Click Run All 10 Traces to observe live OpenTelemetry emission.',
      targetTraceIndex: 1,
    },
    {
      time: '15–35s',
      title: '2. Visibly Broken Execution (Looping)',
      talkingPoint:
        'Select Recursive Loop (#6). The SDK recorded every step and tool call. Here, github.createIssue was called 5 times in a loop. VOID consumed the trace and identified the failure pattern.',
      actionText: 'Inspect Looping trace evidence and recommendation.',
      targetTraceIndex: 6,
    },
    {
      time: '35–55s',
      title: '3. Subtle Quality Issue (Hallucination)',
      talkingPoint:
        'Select Silent Hallucination (#4). The user asked for weather in Paris and got "25°C". Telemetry proves zero weather tools were called!',
      actionText: 'Highlight tool skipping and unverified claim telemetry.',
      targetTraceIndex: 4,
    },
    {
      time: '55–75s',
      title: '4. OpenTrace Verification in SigNoz',
      talkingPoint:
        'Click "Verify with OpenTelemetry spans" or "SigNoz". Everything you see comes directly from OpenTelemetry spans.',
      actionText: 'Click SigNoz link to view raw trace spans.',
      targetTraceIndex: 4,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="walkthrough-modal-title"
        className="max-w-xl w-full p-6 border border-white/[0.08] bg-[#0a0a0f] rounded-2xl shadow-2xl relative space-y-6"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#a78bfa]">
            <Presentation className="w-4 h-4" />
          </div>
          <div>
            <h2 id="walkthrough-modal-title" className="text-base font-bold text-white tracking-tight">
              Presenter Pitch Guide
            </h2>
            <p className="text-xs text-zinc-500 font-mono">Timestamped Walkthrough Script</p>
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 gap-1.5">
          {scriptSteps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleStepChange(idx)}
              className={`p-2 rounded-xl text-center font-mono text-xs transition-all border ${
                currentStep === idx
                  ? 'bg-[#8b5cf6]/15 border-[#8b5cf6]/40 text-[#a78bfa] font-semibold'
                  : 'bg-white/[0.02] border-white/[0.04] text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div>{s.time}</div>
            </button>
          ))}
        </div>

        {/* Active Script Step */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#a78bfa]">
            <span>{scriptSteps[currentStep].time}</span>
            <span>Step {currentStep + 1} of {scriptSteps.length}</span>
          </div>

          <h3 className="text-sm font-semibold text-white">{scriptSteps[currentStep].title}</h3>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
            "{scriptSteps[currentStep].talkingPoint}"
          </p>

          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-semibold font-mono">Action:</span>
            <span className="text-zinc-300">{scriptSteps[currentStep].actionText}</span>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => handleStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] text-xs font-medium text-zinc-300 disabled:opacity-30 btn-tactile"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-zinc-600 font-mono">Press Esc to exit</span>

          <button
            onClick={() => handleStepChange(Math.min(scriptSteps.length - 1, currentStep + 1))}
            disabled={currentStep === scriptSteps.length - 1}
            className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-xs font-semibold text-white shadow-md disabled:opacity-30 btn-tactile"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
