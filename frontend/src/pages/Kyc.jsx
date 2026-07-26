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
// vestIQ — KYC v2
// Same six-step flow, moved onto the shared Sidebar/background (fixing the
// same undeclared-`location` bug and the orb divs being placed oddly inside
// the flex row before content). Added: an overall progress bar that fills as
// you move through steps, hover/tap feedback on the stepper dots and upload
// boxes, and a subtle "just uploaded" check animation on file selection.
// ---------------------------------------------------------------------------

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
    <div className="input-group">
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

function UploadBox({ label, hint, file, onChange }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <motion.label whileHover={{ borderColor: 'rgba(63,214,192,0.4)' }} className="auth-input flex items-center gap-3 cursor-pointer !py-3">
        <motion.span
          animate={file ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.35 }}
          className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center shrink-0"
        >
          {file ? <Check size={14} /> : <Upload size={14} />}
        </motion.span>
        <span className="text-sm truncate">
          {file ? file : <span className="text-slate">{hint}</span>}
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
    <div className="min-h-screen bg-ink flex relative">
      <AmbientBackground opacity={0.12} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative px-4 sm:px-6 py-10">
        <div className="orb orb-gold w-80 h-80 -top-24 -right-16" />
        <div className="orb orb-teal w-64 h-64 -bottom-20 -left-16" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl sm:text-3xl text-bone">Complete your KYC</h1>
            <p className="text-slate text-sm mt-2">
              Required before your trading &amp; demat account can be activated — takes about 5 minutes.
            </p>
          </div>

          {/* overall progress */}
          <div className="w-full h-1 rounded-full bg-border overflow-hidden mb-6">
            <motion.div
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-teal to-gold"
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
                    className="flex flex-col items-center gap-1.5"
                    style={{ cursor: i < step ? 'pointer' : 'default' }}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                        done
                          ? 'bg-teal border-teal text-ink'
                          : activeStep
                          ? 'bg-gold border-gold text-ink'
                          : 'bg-transparent border-border text-slate'
                      }`}
                    >
                      {done ? <Check size={15} /> : <Icon size={15} />}
                    </div>
                    <span className={`text-[10px] font-mono hidden sm:block ${activeStep ? 'text-bone' : 'text-slate'}`}>
                      {s.label}
                    </span>
                  </motion.button>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1 relative bg-border overflow-hidden">
                      <motion.div
                        animate={{ width: i < step ? '100%' : '0%' }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-y-0 left-0 bg-teal"
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8">
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
                      <input className="auth-input" value={form.fullName} onChange={set('fullName')} placeholder="John Doe" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Date of birth">
                        <input type="date" className="auth-input" value={form.dob} onChange={set('dob')} />
                      </Field>
                      <Field label="Gender">
                        <select className="auth-input" value={form.gender} onChange={set('gender')}>
                          <option value="">Select</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="PAN number">
                      <input className="auth-input uppercase" value={form.pan} onChange={set('pan')} placeholder="ABCDE1234F" maxLength={10} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Mobile number">
                        <input className="auth-input" value={form.mobile} onChange={set('mobile')} placeholder="+91 98765 43210" />
                      </Field>
                      <Field label="Email address">
                        <input type="email" className="auth-input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                      </Field>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <Field label="Aadhaar number">
                      <input className="auth-input" value={form.aadhaar} onChange={set('aadhaar')} placeholder="XXXX XXXX XXXX" maxLength={14} />
                      <p className="text-slate text-[11px] mt-1.5">Used only for identity verification (e-KYC), never stored in plain text.</p>
                    </Field>
                    <Field label="Address line">
                      <input className="auth-input" value={form.addressLine} onChange={set('addressLine')} placeholder="House no., street, area" />
                    </Field>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="City">
                        <input className="auth-input" value={form.city} onChange={set('city')} />
                      </Field>
                      <Field label="State">
                        <input className="auth-input" value={form.state} onChange={set('state')} />
                      </Field>
                      <Field label="Pincode">
                        <input className="auth-input" value={form.pincode} onChange={set('pincode')} maxLength={6} />
                      </Field>
                    </div>
                    <Field label="Address proof type">
                      <select className="auth-input" value={form.addressProofType} onChange={set('addressProofType')}>
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
                      <input className="auth-input" value={form.accountNumber} onChange={set('accountNumber')} />
                    </Field>
                    <Field label="Confirm account number">
                      <input className="auth-input" value={form.confirmAccountNumber} onChange={set('confirmAccountNumber')} />
                    </Field>
                    <Field label="IFSC code">
                      <input className="auth-input uppercase" value={form.ifsc} onChange={set('ifsc')} placeholder="HDFC0001234" maxLength={11} />
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
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Occupation">
                        <select className="auth-input" value={form.occupation} onChange={set('occupation')}>
                          <option value="">Select</option>
                          {OCCUPATIONS.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Annual income">
                        <select className="auth-input" value={form.incomeRange} onChange={set('incomeRange')}>
                          <option value="">Select</option>
                          {INCOME_RANGES.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Trading experience">
                      <select className="auth-input" value={form.experience} onChange={set('experience')}>
                        <option value="">Select</option>
                        {EXPERIENCE.map((e) => (
                          <option key={e}>{e}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="input-group">
                      <label className="input-label">Segments to activate</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {SEGMENTS.map((seg) => (
                          <motion.label
                            key={seg}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer text-xs transition-colors ${
                              form.segments.includes(seg) ? 'border-teal/50 bg-teal/5 text-bone' : 'border-border text-slate'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 accent-teal"
                              checked={form.segments.includes(seg)}
                              onChange={() => toggleSegment(seg)}
                            />
                            {seg}
                          </motion.label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Nominee full name">
                        <input className="auth-input" value={form.nomineeName} onChange={set('nomineeName')} />
                      </Field>
                      <Field label="Relationship">
                        <select className="auth-input" value={form.nomineeRelation} onChange={set('nomineeRelation')}>
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
                    <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                      {[
                        ['Name', form.fullName || '—'],
                        ['PAN', form.pan || '—'],
                        ['Mobile', form.mobile || '—'],
                        ['Bank account', form.accountNumber ? `•••• ${form.accountNumber.slice(-4)}` : '—'],
                        ['Segments', form.segments.length ? form.segments.join(', ') : '—'],
                        ['Nominee', form.nomineeName || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between px-4 py-2.5 text-xs">
                          <span className="text-slate">{k}</span>
                          <span className="text-bone font-mono truncate max-w-[60%] text-right">{v}</span>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.agreeTerms}
                        onChange={(e) => setForm((f) => ({ ...f, agreeTerms: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded border-border bg-ink accent-teal"
                      />
                      <span className="text-xs text-slate leading-relaxed group-hover:text-bone transition-colors">
                        I confirm the details above are accurate and agree to the{' '}
                        <span className="text-teal hover:underline cursor-pointer">Account Opening Terms</span> and{' '}
                        <span className="text-teal hover:underline cursor-pointer">Risk Disclosure Document</span>.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.agreeEsign}
                        onChange={(e) => setForm((f) => ({ ...f, agreeEsign: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded border-border bg-ink accent-gold"
                      />
                      <span className="text-xs text-slate leading-relaxed group-hover:text-bone transition-colors">
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
                className="auth-btn flex items-center gap-1.5 px-4 py-2.5 text-sm text-slate disabled:opacity-0"
              >
                <ChevronLeft size={15} />
                Back
              </motion.button>
              <motion.button
                onClick={next}
                disabled={isLast && !canSubmit}
                whileHover={!(isLast && !canSubmit) ? { scale: 1.02 } : {}}
                whileTap={!(isLast && !canSubmit) ? { scale: 0.98 } : {}}
                className="auth-btn auth-btn-primary px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLast ? 'Submit for verification' : 'Continue'}
              </motion.button>
            </div>
          </div>

          <p className="text-slate text-[11px] text-center mt-5">
            Step {step + 1} of {STEPS.length} · Your data is encrypted and used only for regulatory verification.
          </p>
        </div>
      </div>
    </div>
  );
}