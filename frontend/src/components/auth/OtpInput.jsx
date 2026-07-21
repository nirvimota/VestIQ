import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * OTP / Verification code input — renders N individual digit boxes.
 * Props:
 *   length   — number of digits (default 6)
 *   onComplete(code) — called when all digits are filled
 */
export default function OtpInput({ length = 6, onComplete }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const refs = useRef([]);

  useEffect(() => {
    // Auto-focus first input on mount
    refs.current[0]?.focus();
  }, []);

  const handleChange = (index, val) => {
    if (!/^\d?$/.test(val)) return; // Only digits

    const next = [...values];
    next[index] = val;
    setValues(next);

    if (val && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    // Check if all filled
    if (next.every((v) => v !== '')) {
      onComplete?.(next.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const next = [...values];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setValues(next);

    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();

    if (next.every((v) => v !== '')) {
      onComplete?.(next.join(''));
    }
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {values.map((val, i) => (
        <motion.input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="w-12 h-14 rounded-xl bg-ink/60 border border-border text-center
                     text-bone text-xl font-mono outline-none
                     focus:border-teal focus:shadow-[0_0_0_3px_rgba(63,214,192,0.08)]
                     transition-all duration-200"
        />
      ))}
    </div>
  );
}
