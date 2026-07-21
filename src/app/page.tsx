'use client';

import React, { useState } from 'react';
import { IntroHook } from '@/components/IntroHook';
import { DiagnosisStage } from '@/components/DiagnosisStage';

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      {showIntro && (
        <IntroHook onComplete={() => setShowIntro(false)} />
      )}
      {!showIntro && (
        <DiagnosisStage />
      )}
    </>
  );
}
