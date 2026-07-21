import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink text-bone flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-slate text-sm mb-2">404</p>
      <h1 className="font-display text-xl mb-6">This page doesn't exist</h1>
      <Link to="/" className="rounded-full bg-gold text-ink font-medium px-6 py-2.5 text-sm">Back home</Link>
    </div>
  );
}