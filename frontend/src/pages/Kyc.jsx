// C:\nirvi\vestIQ\frontend\src\pages\Kyc.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  MapPin,
  Landmark,
  Briefcase,
  FileText,
  ShieldCheck,
  Upload,
  Check,
  ChevronLeft,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';

// ---------------------------------------------------------------------------
// vestIQ — KYC v3
// Same six-step flow, recoloured off the old glass-card/orb/gold aesthetic
// onto the shared v5.1 token system (INK/CARD/BORDER/TEXT/SUB/MUTE/TEAL/BLUE
// + v5-display/v5-mono/v5-body) so it matches Dashboard, OrderHistory,
// Intraday, and Portfolio. Orb glow divs removed, auth-input/auth-btn/
// glass-card replaced with flat v5-input/v5-btn/v5-card equivalents.
// ---------------------------------------------------------------------------

const INK = '#0A0F1A';
const CARD = '#111826';
const BORDER = '#1E2838';
const TEXT = '#ECEEF0';
const SUB = '#8A93A6';
const MUTE = '#4E5A70';
const TEAL = '#2ED9B8';
const BLUE = '#5B9CFF';

const STEPS = [
  { key: 'personal', label: 'Personal', icon: User },
  { key: 'identity', label: 'Identity', icon: MapPin },
  { key: 'bank', label: 'Bank', icon: Landmark },
  { key: 'trading', label: 'Trading profile', icon: Briefcase },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'review', label: 'Review & e-sign', icon: ShieldCheck },
];

const OCCUPATIONS = ['Salaried', 'Self-employed / Business', 'Professional', 'Student', 'Homemaker', 'Retired'];
const INCOME_RANGES = ['Below ₹1L', '₹1L – 5L', '₹5L – 10L', '₹10L – 25L', 'Above ₹25L'];
const EXPERIENCE = ['New to investing', '< 1 year', '1–3 years', '3–5 years', '5+ years'];
const SEGMENTS = ['Equity (Cash)', 'F&O (Derivatives)', 'Currency', 'Commodity'];
const RELATIONS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Other'];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="v5-body text-xs" style={{ color: SUB }}>{label}</label>
      {children}
    </div>
  );
}

function UploadBox({ label, hint, file, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="v5-body text-xs" style={{ color: SUB }}>{label}</label>
      <motion.label
        whileHover={{ borderColor: `${TEAL}66` }}
        className="v5-input flex items-center gap-3 cursor-pointer !py-3"
      >
        <motion.span
          animate={file ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.35 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${TEAL}1A`, color: TEAL }}
        >
          {file ? <Check size={14} /> : <Upload size={14} />}
        </motion.span>
        <span className="v5-body text-sm truncate" style={{ color: file ? TEXT : MUTE }}>
          {file || hint}
        </span>
        <input type="file" className="hidden" onChange={(e) => onChange(e.target.files?.[0]?.name || '')} />
      </motion.label>
    </div>
  );
}

export default function Kyc() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: '', dob: '', gender: '', pan: '', mobile: '', email: '',
    aadhaar: '', addressLine: '', city: '', state: '', pincode: '', addressProofType: 'Aadhaar',
    accountNumber: '', confirmAccountNumber: '', ifsc: '',
    occupation: '', incomeRange: '', experience: '', segments: [], nomineeName: '', nomineeRelation: '',
    panDoc: '', addressDoc: '', chequeDoc: '', photo: '', signature: '',
    agreeTerms: false, agreeEsign: false,
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleSegment = (seg) =>
    setForm((f) => ({
      ...f,
      segments: f.segments.includes(seg) ? f.segments.filter((s) => s !== seg) : [...f.segments, seg],
    }));

  const isLast = step === STEPS.length - 1;
  const canSubmit = form.agreeTerms && form.agreeEsign;
  const overallProgress = ((step + 1) / STEPS.length) * 100;

  const next = () => {
    if (isLast) {
      if (canSubmit) navigate('/dashboard');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; }
        .v5-input {
          width: 100%;
          background: ${INK};
          border: 1px solid ${BORDER};
          border-radius: 10px;
          padding: 10px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: ${TEXT};
          transition: border-color 0.15s ease;
          outline: none;
        }
        .v5-input:focus { border-color: ${TEAL}66; }
        .v5-input::placeholder { color: ${MUTE}; }
        .v5-btn {
          border-radius: 999px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          transition: opacity 0.15s ease;
        }
        .v5-btn-primary { background: ${TEAL}; color: ${INK}; }
        .v5-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .v5-seg-option { transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease; }
      `}</style>

      <AmbientBackground opacity={0.12} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative px-4 sm:px-6 py-6 lg:py-10 pb-24 lg:pb-10">
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="v5-display text-2xl sm:text-3xl" style={{ color: TEXT }}>Complete your KYC</h1>
            <p className="v5-body text-sm mt-2" style={{ color: SUB }}>
              Required before your trading &amp; demat account can be activated — takes about 5 minutes.
            </p>
          </div>

          {/* overall progress */}
          <div className="w-full h-1 rounded-full overflow-hidden mb-6" style={{ background: BORDER }}>
            <motion.div
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${TEAL}, ${BLUE})` }}
            />
          </div>

          {/* stepper */}
          <div className="flex items-center justify-between mb-8 px-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const activeStep = i === step;
              return (
                <React.Fragment key={s.key}>
                  <motion.button
                    onClick={() => i < step && setStep(i)}
                    whileHover={i < step ? { scale: 1.08 } : {}}
                    whileTap={i < step ? { scale: 0.94 } : {}}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                    style={{ cursor: i < step ? 'pointer' : 'default' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors shrink-0"
                      style={{
                        background: done ? TEAL : activeStep ? BLUE : 'transparent',
                        borderColor: done ? TEAL : activeStep ? BLUE : BORDER,
                        color: done || activeStep ? INK : MUTE,
                      }}
                    >
                      {done ? <Check size={15} /> : <Icon size={15} />}
                    </div>
                    <span className="v5-mono text-[10px] hidden sm:block" style={{ color: activeStep ? TEXT : MUTE }}>
                      {s.label}
                    </span>
                  </motion.button>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 min-w-[8px] h-px mx-1 relative overflow-hidden" style={{ background: BORDER }}>
                      <motion.div
                        animate={{ width: i < step ? '100%' : '0%' }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-y-0 left-0"
                        style={{ background: TEAL }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* card */}
          <div className="v5-card rounded-2xl p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {step === 0 && (
                  <>
                    <Field label="Full name (as per PAN)">
                      <input className="v5-input" value={form.fullName} onChange={set('fullName')} placeholder="John Doe" />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Date of birth">
                        <input type="date" className="v5-input" value={form.dob} onChange={set('dob')} />
                      </Field>
                      <Field label="Gender">
                        <select className="v5-input" value={form.gender} onChange={set('gender')}>
                          <option value="">Select</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="PAN number">
                      <input className="v5-input uppercase" value={form.pan} onChange={set('pan')} placeholder="ABCDE1234F" maxLength={10} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Mobile number">
                        <input className="v5-input" value={form.mobile} onChange={set('mobile')} placeholder="+91 98765 43210" />
                      </Field>
                      <Field label="Email address">
                        <input type="email" className="v5-input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                      </Field>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <Field label="Aadhaar number">
                      <input className="v5-input" value={form.aadhaar} onChange={set('aadhaar')} placeholder="XXXX XXXX XXXX" maxLength={14} />
                      <p className="v5-body text-[11px] mt-1.5" style={{ color: MUTE }}>Used only for identity verification (e-KYC), never stored in plain text.</p>
                    </Field>
                    <Field label="Address line">
                      <input className="v5-input" value={form.addressLine} onChange={set('addressLine')} placeholder="House no., street, area" />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="City">
                        <input className="v5-input" value={form.city} onChange={set('city')} />
                      </Field>
                      <Field label="State">
                        <input className="v5-input" value={form.state} onChange={set('state')} />
                      </Field>
                      <Field label="Pincode">
                        <input className="v5-input" value={form.pincode} onChange={set('pincode')} maxLength={6} />
                      </Field>
                    </div>
                    <Field label="Address proof type">
                      <select className="v5-input" value={form.addressProofType} onChange={set('addressProofType')}>
                        <option>Aadhaar</option>
                        <option>Passport</option>
                        <option>Voter ID</option>
                        <option>Driving licence</option>
                        <option>Utility bill (last 3 months)</option>
                      </select>
                    </Field>
                  </>
                )}

                {step === 2 && (
                  <>
                    <Field label="Bank account number">
                      <input className="v5-input" value={form.accountNumber} onChange={set('accountNumber')} />
                    </Field>
                    <Field label="Confirm account number">
                      <input className="v5-input" value={form.confirmAccountNumber} onChange={set('confirmAccountNumber')} />
                    </Field>
                    <Field label="IFSC code">
                      <input className="v5-input uppercase" value={form.ifsc} onChange={set('ifsc')} placeholder="HDFC0001234" maxLength={11} />
                    </Field>
                    <UploadBox
                      label="Cancelled cheque / bank statement"
                      hint="Upload a scanned copy (PDF, JPG or PNG)"
                      file={form.chequeDoc}
                      onChange={(name) => setForm((f) => ({ ...f, chequeDoc: name }))}
                    />
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Occupation">
                        <select className="v5-input" value={form.occupation} onChange={set('occupation')}>
                          <option value="">Select</option>
                          {OCCUPATIONS.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Annual income">
                        <select className="v5-input" value={form.incomeRange} onChange={set('incomeRange')}>
                          <option value="">Select</option>
                          {INCOME_RANGES.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Trading experience">
                      <select className="v5-input" value={form.experience} onChange={set('experience')}>
                        <option value="">Select</option>
                        {EXPERIENCE.map((e) => (
                          <option key={e}>{e}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="flex flex-col gap-1.5">
                      <label className="v5-body text-xs" style={{ color: SUB }}>Segments to activate</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {SEGMENTS.map((seg) => {
                          const checked = form.segments.includes(seg);
                          return (
                            <motion.label
                              key={seg}
                              whileTap={{ scale: 0.97 }}
                              className="v5-seg-option v5-body flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer text-xs"
                              style={{
                                borderColor: checked ? `${TEAL}80` : BORDER,
                                background: checked ? `${TEAL}0D` : 'transparent',
                                color: checked ? TEXT : SUB,
                              }}
                            >
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5"
                                style={{ accentColor: TEAL }}
                                checked={checked}
                                onChange={() => toggleSegment(seg)}
                              />
                              {seg}
                            </motion.label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Nominee full name">
                        <input className="v5-input" value={form.nomineeName} onChange={set('nomineeName')} />
                      </Field>
                      <Field label="Relationship">
                        <select className="v5-input" value={form.nomineeRelation} onChange={set('nomineeRelation')}>
                          <option value="">Select</option>
                          {RELATIONS.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <UploadBox label="PAN card" hint="Clear photo or scan of your PAN card" file={form.panDoc} onChange={(name) => setForm((f) => ({ ...f, panDoc: name }))} />
                    <UploadBox
                      label="Address proof"
                      hint={`Matching your selected proof: ${form.addressProofType || 'Aadhaar'}`}
                      file={form.addressDoc}
                      onChange={(name) => setForm((f) => ({ ...f, addressDoc: name }))}
                    />
                    <UploadBox label="Photograph" hint="A recent passport-size photo or live selfie" file={form.photo} onChange={(name) => setForm((f) => ({ ...f, photo: name }))} />
                    <UploadBox label="Signature" hint="Signature on white paper, or use the signature pad" file={form.signature} onChange={(name) => setForm((f) => ({ ...f, signature: name }))} />
                  </>
                )}

                {step === 5 && (
                  <>
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                      {[
                        ['Name', form.fullName || '—'],
                        ['PAN', form.pan || '—'],
                        ['Mobile', form.mobile || '—'],
                        ['Bank account', form.accountNumber ? `•••• ${form.accountNumber.slice(-4)}` : '—'],
                        ['Segments', form.segments.length ? form.segments.join(', ') : '—'],
                        ['Nominee', form.nomineeName || '—'],
                      ].map(([k, v], idx, arr) => (
                        <div
                          key={k}
                          className="flex items-center justify-between px-4 py-2.5 text-xs"
                          style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BORDER}` }}
                        >
                          <span className="v5-body" style={{ color: SUB }}>{k}</span>
                          <span className="v5-mono truncate max-w-[60%] text-right" style={{ color: TEXT }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.agreeTerms}
                        onChange={(e) => setForm((f) => ({ ...f, agreeTerms: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded"
                        style={{ background: INK, border: `1px solid ${BORDER}`, accentColor: TEAL }}
                      />
                      <span className="v5-body text-xs leading-relaxed" style={{ color: SUB }}>
                        I confirm the details above are accurate and agree to the{' '}
                        <span style={{ color: TEAL }} className="hover:underline cursor-pointer">Account Opening Terms</span> and{' '}
                        <span style={{ color: TEAL }} className="hover:underline cursor-pointer">Risk Disclosure Document</span>.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.agreeEsign}
                        onChange={(e) => setForm((f) => ({ ...f, agreeEsign: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded"
                        style={{ background: INK, border: `1px solid ${BORDER}`, accentColor: BLUE }}
                      />
                      <span className="v5-body text-xs leading-relaxed" style={{ color: SUB }}>
                        I authorise vestIQ to verify my Aadhaar via UIDAI and e-sign my KYC form using an
                        OTP sent to my registered mobile number.
                      </span>
                    </label>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8">
              <motion.button
                onClick={back}
                disabled={step === 0}
                whileHover={step !== 0 ? { x: -2 } : {}}
                className="v5-btn flex items-center gap-1.5 px-4 py-2.5"
                style={{ color: SUB, opacity: step === 0 ? 0 : 1 }}
              >
                <ChevronLeft size={15} />
                Back
              </motion.button>
              <motion.button
                onClick={next}
                disabled={isLast && !canSubmit}
                whileHover={!(isLast && !canSubmit) ? { scale: 1.02 } : {}}
                whileTap={!(isLast && !canSubmit) ? { scale: 0.98 } : {}}
                className="v5-btn v5-btn-primary px-6 py-2.5"
              >
                {isLast ? 'Submit for verification' : 'Continue'}
              </motion.button>
            </div>
          </div>

          <p className="v5-body text-[11px] text-center mt-5" style={{ color: MUTE }}>
            Step {step + 1} of {STEPS.length} · Your data is encrypted and used only for regulatory verification.
          </p>
        </div>
      </div>
    </div>
  );
}