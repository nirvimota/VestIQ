import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = ['PAN details', 'Bank account', 'Verification'];

export default function Kyc() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/dashboard');
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8">
        <p className="font-mono text-xs text-slate mb-2">Step {step + 1} of {STEPS.length}</p>
        <h1 className="font-display text-xl text-bone mb-6">{STEPS[step]}</h1>

        <div className="h-1 w-full bg-ink rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-teal transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <p className="text-slate text-sm mb-8">
          This step is a placeholder — wire up the real PAN / bank / e-sign
          verification flow here (e.g. Digilocker, Signzy, or your KYC provider of choice).
        </p>

        <button
          onClick={handleNext}
          className="w-full rounded-full bg-gold text-ink font-medium py-2.5 text-sm hover:bg-[#f0c665] transition-colors"
        >
          {isLast ? 'Finish' : 'Continue'}
        </button>
      </div>
    </div>
  );
}