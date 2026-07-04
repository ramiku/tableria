export type Presence = 'online' | 'away' | 'offline';
type Tone = 'content' | 'sidebar';

const presenceColor: Record<Tone, Record<Presence, string>> = {
  content: { online: 'bg-tb-success', away: 'bg-tb-warn', offline: 'bg-tb-muted' },
  sidebar: { online: 'bg-tb-sidebar-success', away: 'bg-tb-warn', offline: 'bg-tb-sidebar-muted' },
};

const ringColor: Record<Tone, string> = {
  content: 'ring-tb-surface',
  sidebar: 'ring-tb-sidebar-bg',
};

interface AvatarProps {
  initial: string;
  color: string;
  presence?: Presence;
  size?: number;
  /** content = vive sobre una superficie del tema claro/oscuro; sidebar = vive en la franja de marca, siempre oscura. */
  tone?: Tone;
}

export function Avatar({ initial, color, presence, size = 36, tone = 'content' }: AvatarProps) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex h-full w-full items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: color }}
      >
        {initial}
      </span>
      {presence && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ${ringColor[tone]} ${presenceColor[tone][presence]}`}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
