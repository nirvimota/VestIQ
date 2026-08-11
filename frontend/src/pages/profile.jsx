import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFormattedUser } from '../utils/userUtils';

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

const KYC_STYLE = {
  verified: 'bg-emerald-400/15 text-emerald-400',
  pending: 'bg-amber-400/15 text-amber-400',
  rejected: 'bg-rose-400/15 text-rose-400',
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="max-w-2xl mx-auto px-5 py-6 pb-16">
        <h1 className="text-xl font-semibold tracking-tight mb-6">Profile</h1>

        {/* Identity card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-emerald-400 flex items-center justify-center text-zinc-950 font-bold text-lg shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{mergedUser.name}</p>
            <p className="text-zinc-500 text-xs font-mono mt-0.5">{mergedUser.accountId}</p>
            <p className="text-zinc-500 text-xs mt-0.5">Member since {mergedUser.joinedOn}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${KYC_STYLE[mergedUser.kycStatus]}`}>
            KYC {mergedUser.kycStatus[0].toUpperCase() + mergedUser.kycStatus.slice(1)}
          </span>
        </div>

        {/* Details */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wide">Personal details</p>
            {!editing ? (
              <button
                onClick={() => {
                  setForm(mergedUser);
                  setEditing(true);
                }}
                className="text-emerald-400 text-sm font-medium hover:text-emerald-300"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)} className="text-zinc-500 text-sm hover:text-zinc-300">
                  Cancel
                </button>
                <button onClick={handleSave} className="text-emerald-400 text-sm font-medium hover:text-emerald-300">
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {FIELDS.map(([key, label]) => (
              <div key={key} className="grid grid-cols-3 gap-3 items-center">
                <span className="text-zinc-500 text-sm col-span-1">{label}</span>
                {editing ? (
                  <input
                    value={form[key] || ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-400/50"
                  />
                ) : (
                  <span className="col-span-2 text-sm">{mergedUser[key]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}