import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFormattedUser } from '../utils/userUtils';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';

/**
 * Profile — personal details page.
 */

const DEFAULT_USER = {
  name: 'Airlangga Mahesa',
  email: 'airlangga.mahesa@email.com',
  phone: '+91 98765 43210',
  dob: '14 Mar 1990',
  pan: 'ABCDE1234F',
  address: 'Flat 302, Silver Oak Residency, Andheri West, Mumbai, MH 400058',
  kycStatus: 'verified',
  accountId: 'VQ-2291-8842',
  joinedOn: 'Jan 2023',
};

const INK = '#0A0F1A';
const CARD = '#111826';
const BORDER = '#1E2838';
const TEXT = '#ECEEF0';
const SUB = '#8A93A6';
const MUTE = '#4E5A70';
const TEAL = '#2ED9B8';

const KYC_STYLE = {
  verified: 'bg-[#2ED9B8]/15 text-[#2ED9B8] border border-[#2ED9B8]/30',
  pending: 'bg-amber-400/15 text-amber-400 border border-amber-400/30',
  rejected: 'bg-rose-400/15 text-rose-400 border border-rose-400/30',
};

const FIELDS = [
  ['name', 'Full name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['dob', 'Date of birth'],
  ['pan', 'PAN'],
  ['address', 'Address'],
];

export default function Profile({ user: propUser, onSave = () => { } }) {
  const { profile, user: authUser, updateProfile } = useAuth();
  const formattedUser = getFormattedUser(profile, authUser);

  const mergedUser = {
    ...DEFAULT_USER,
    name: formattedUser.name,
    email: profile?.email || authUser?.email || DEFAULT_USER.email,
    phone: profile?.phone || DEFAULT_USER.phone,
    pan: profile?.pan || DEFAULT_USER.pan,
    address: profile?.address || DEFAULT_USER.address,
    ...(propUser || {}),
  };

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(mergedUser);

  useEffect(() => {
    setForm(mergedUser);
  }, [profile, authUser]);

  const initials = formattedUser.initials;

  const handleSave = async () => {
    if (updateProfile && profile) {
      await updateProfile({
        full_name: form.name,
        phone: form.phone,
        pan: form.pan,
        address: form.address,
      });
    }
    onSave(form);
    setEditing(false);
  };

  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
      `}</style>

      <AmbientBackground opacity={0.13} />
      <Sidebar />

      <main className="flex-1 min-w-0 relative">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-8 pb-24 lg:pb-16 animate-none">
          <h1 className="v5-display text-xl mb-6" style={{ color: TEXT }}>Profile</h1>

          {/* Identity card */}
          <div className="v5-card rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0" style={{ background: TEAL, color: INK }}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="v5-body font-semibold text-sm" style={{ color: TEXT }}>{mergedUser.name}</p>
                <p className="v5-mono text-[10px] mt-0.5" style={{ color: MUTE }}>{mergedUser.accountId}</p>
                <p className="v5-body text-[11px] mt-0.5" style={{ color: SUB }}>Member since {mergedUser.joinedOn}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold shrink-0 ${KYC_STYLE[mergedUser.kycStatus]}`}>
              KYC {mergedUser.kycStatus}
            </span>
          </div>

          {/* Details */}
          <div className="v5-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="v5-mono text-[10px] uppercase tracking-wider" style={{ color: MUTE }}>Personal details</p>
              {!editing ? (
                <button
                  onClick={() => {
                    setForm(mergedUser);
                    setEditing(true);
                  }}
                  className="v5-body text-xs font-semibold hover:opacity-80"
                  style={{ color: TEAL }}
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setEditing(false)} className="v5-body text-xs" style={{ color: SUB }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} className="v5-body text-xs font-semibold hover:opacity-80" style={{ color: TEAL }}>
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {FIELDS.map(([key, label]) => (
                <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-3 sm:items-center py-1 sm:py-0 border-b border-white/[0.02]/... pb-3 sm:pb-0">
                  <span className="v5-body text-xs sm:text-sm col-span-1" style={{ color: SUB }}>{label}</span>
                  {editing ? (
                    <input
                      value={form[key] || ''}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="sm:col-span-2 w-full bg-[#0A0F1A] border rounded-lg px-3 py-1.5 text-sm outline-none transition-colors text-[#ECEEF0] focus:border-[#2ED9B8]/60"
                      style={{ borderColor: BORDER }}
                    />
                  ) : (
                    <span className="sm:col-span-2 text-sm text-[#ECEEF0] break-words">{mergedUser[key]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}