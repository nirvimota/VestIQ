import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFormattedUser } from '../../utils/userUtils';

const TEAL = '#2ED9B8';
const INK = '#0A0F1A';
const BORDER = '#1E2838';

export default function Navbar() {
  const { profile, user: authUser } = useAuth();
  const currentUser = getFormattedUser(profile, authUser);

  return (
    <header
      className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 h-14 bg-[#0A0F1A]/80 backdrop-blur-md"
      style={{ borderBottom: `1px solid ${BORDER}` }}
    >
      <Link to="/dashboard" className="text-base tracking-tight flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#ECEEF0' }}>
        <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ background: TEAL, color: INK }}>
          V
        </span>
        vest<span style={{ color: '#e8b84b' }}>IQ</span>
      </Link>

      <Link
        to="/profile"
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border hover:opacity-85 transition-opacity"
        style={{
          background: TEAL,
          color: INK,
          borderColor: BORDER,
          fontFamily: "'IBM Plex Mono', monospace"
        }}
      >
        {currentUser.initials}
      </Link>
    </header>
  );
}
