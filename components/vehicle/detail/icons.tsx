import React from "react";

export type IconProps = { className?: string };
export type IconComponent = (p: IconProps) => React.JSX.Element;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Icon set reused across the detail page (spec chips, highlight tiles, chips).
export const I = {
  battery: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><rect x="2" y="8" width="17" height="8" rx="2" /><path d="M22 11v2M6 11v2M10 11v2" /></svg>,
  bolt: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" /></svg>,
  range: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><circle cx="5.5" cy="17.5" r="2.5" /><circle cx="18.5" cy="6.5" r="2.5" /><path d="M8 17.5h6.5a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" /></svg>,
  gauge: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M12 14 15 9" /><circle cx="12" cy="14" r="8.5" /><path d="M3.5 14h1M19.5 14h1M12 5.5v1" /></svg>,
  torque: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 1 8 8" /><path d="M12 20v-4M12 20l-3-1.5M12 20l3-1.5" /><circle cx="12" cy="12" r="2" /></svg>,
  shield: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.5 7.5 9 4.3-1.5 7.5-4.5 7.5-9V6z" /><path d="m9 12 2 2 4-4" /></svg>,
  clearance: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M3 5h18" /><path d="M12 9v10M12 19l-2.5-2.5M12 19l2.5-2.5M12 9 9.5 11.5M12 9l2.5 2.5" /></svg>,
  ruler: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="6" rx="1.5" transform="rotate(-45 12 12)" /><path d="m8.5 9.5 1.5 1.5M11.5 6.5 13 8M14.5 3.5 16 5" /></svg>,
  drive: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v6M12 15v6M3.5 9.5 9 11M20.5 9.5 15 11" /></svg>,
  seat: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><circle cx="9" cy="5" r="2" /><path d="M9 9v5a2 2 0 0 0 2 2h4l2 5" /><path d="M9 14H7a3 3 0 0 0-3 3v3" /></svg>,
  airbag: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>,
  boot: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 12h18M8 7V5h8v2" /></svg>,
  calendar: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>,
  car: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M5 11 6.5 6.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" /><rect x="3" y="11" width="18" height="6" rx="1.5" /><circle cx="7.5" cy="17" r="1.5" /><circle cx="16.5" cy="17" r="1.5" /></svg>,
  wheel: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.2" /><path d="M12 3.2v5.6M12 15.2v5.6M3.2 12h5.6M15.2 12h5.6" /></svg>,
  check: (p: IconProps) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>,
  star: (p: IconProps) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01z" /></svg>,
  chevronR: (p: IconProps) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>,
  chevronL: (p: IconProps) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6 9 12l6 6" /></svg>,
};
