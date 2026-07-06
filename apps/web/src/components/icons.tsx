import type { SVGProps } from 'react';

/**
 * Set de iconos propio, trazo 1.75 consistente, 20px por defecto.
 * (Sin emoji, sin librerías externas — solo lo que necesita el shell de M0.)
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function GridIcon(props: IconProps) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function DoorIcon(props: IconProps) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <path d="M5 21V5a2 2 0 0 1 2-2h6l6 3v15" />
      <path d="M13 21V3" />
      <circle cx="9.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16 8.2a3 3 0 1 1 0 5.9" />
      <path d="M21.2 20a5.6 5.6 0 0 0-4.3-5.9" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 4.5M17 5h3a3 3 0 0 1-3 4.5" />
      <path d="M12 14v3M9 21h6M10 21v-2.5h4V21" />
    </svg>
  );
}

export function BarsIcon(props: IconProps) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <path d="M5 20v-7M12 20V5M19 20v-10" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.7 7.7 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7c.76.66 1.64 1.17 2.6 1.5l.4 2.3h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.3 5.2a3.5 3.5 0 0 1 5 5L16 11.5" />
      <path d="M13 17.5 11.7 18.8a3.5 3.5 0 0 1-5-5L8 12.5" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M15 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
      <path d="M10 12h11M17 8l4 4-4 4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <circle cx="8" cy="14" r="3.5" />
      <path d="M10.5 11.5 20 2M15 7l2 2M18 4l2 2" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M14.5 4.5 19.5 9.5 8 21H3v-5L14.5 4.5Z" />
      <path d="M13 6 18 11" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
    </svg>
  );
}

export function MedalIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M7 3h10l-3 6h-4L7 3Z" />
      <circle cx="12" cy="14.5" r="5" />
      <path d="m10.5 14 1.2 1.2 2.3-2.4" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M12 3 4.5 5.5v6c0 4.3 3.2 8.1 7.5 9.5 4.3-1.4 7.5-5.2 7.5-9.5v-6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function DiceIcon(props: IconProps) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <circle cx="8.3" cy="8.3" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="8.3" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="8.3" cy="15.7" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="15.7" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CardsIcon(props: IconProps) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <rect x="3" y="6.5" width="12" height="15" rx="1.8" transform="rotate(-8 9 14)" />
      <rect x="8.5" y="3.5" width="12" height="15" rx="1.8" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} fill="currentColor" stroke="none" {...props}>
      <path d="M7 4.5v15l13-7.5-13-7.5Z" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M4 5.5c2.2-1.3 5-1.3 7 0v13c-2-1.3-4.8-1.3-7 0v-13Z" />
      <path d="M20 5.5c-2.2-1.3-5-1.3-7 0v13c2-1.3 4.8-1.3 7 0v-13Z" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} width={14} height={14} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M6 9a6 6 0 1 1 12 0v5l1.8 3H4.2L6 14V9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base} width={18} height={18} fill="currentColor" stroke="none" {...props}>
      <path d="M4 20 20.5 12 4 4l2 7 9 1-9 1-2 7Z" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v3" />
    </svg>
  );
}

export function MicOffIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-.28 1.27M15 15a3 3 0 0 1-5.6-1.5" />
      <path d="M19 11a7 7 0 0 1-9.9 6.36M5 11a7 7 0 0 0 1.34 4.12M12 18v3" />
      <path d="M4 4l16 16" />
    </svg>
  );
}

export function PhoneOffIcon(props: IconProps) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M4 3l17 17" />
      <path d="M10.6 6.9a15.6 15.6 0 0 1 3.2-.4M17.5 13.8c1 .3 2 .7 2.9 1.2a1.6 1.6 0 0 1 .6 1.9l-.9 2.1a1.6 1.6 0 0 1-1.8 1 15.6 15.6 0 0 1-11-6.6A15.6 15.6 0 0 1 4 3.3a1.6 1.6 0 0 1 1-1.8l2.1-.9a1.6 1.6 0 0 1 1.9.6c.5.9.9 1.9 1.2 2.9" />
    </svg>
  );
}

/** Asa de arrastre (seis puntos) — p.ej. para reposicionar `VoiceCallWidget`. */
export function GripIcon(props: IconProps) {
  return (
    <svg {...base} width={14} height={14} fill="currentColor" stroke="none" {...props}>
      <circle cx="8" cy="5" r="1.6" />
      <circle cx="8" cy="12" r="1.6" />
      <circle cx="8" cy="19" r="1.6" />
      <circle cx="16" cy="5" r="1.6" />
      <circle cx="16" cy="12" r="1.6" />
      <circle cx="16" cy="19" r="1.6" />
    </svg>
  );
}
