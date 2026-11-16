import React from 'react';
import { SEV } from './polyTheme.js';

const SevBadge = ({ severity, children }) => {
  const s = SEV[severity] || SEV.ok;
  return (
    <span
      className="font-mono text-xs font-bold px-2 py-0.5 border uppercase"
      style={{ color: s.text, background: s.bg, borderColor: s.border }}
    >
      {children ?? severity}
    </span>
  );
};

export default SevBadge;
