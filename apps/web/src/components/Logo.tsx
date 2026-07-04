import { useState } from 'react';

interface LogoProps {
  /** stacked = icono + wordmark propio debajo (sidebar/auth). inline = icono+texto en fila (compacto). */
  variant?: 'inline' | 'stacked';
  /** Tamaño del icono en px. Por defecto: 140 (stacked) / 32 (inline). */
  size?: number;
}

const ICON_SRC = '/logo-tableria-st.png';

/**
 * Marca Tableria. El PNG (icono, sin texto) es el arte; el wordmark
 * "TABLERIA" y el eslogan se rotulan aparte con una tipografía redondeada
 * y rotunda (Baloo 2) que evoca fichas y tableros de juego.
 */
export function Logo({ variant = 'inline', size: sizeProp }: LogoProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const stacked = variant === 'stacked';
  const size = sizeProp ?? (stacked ? 140 : 32);

  const icon = iconFailed ? (
    <span
      className={`tb-hex flex items-center justify-center font-display font-extrabold text-white ${stacked ? 'bg-tb-sidebar-accent' : 'bg-tb-accent'}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      T
    </span>
  ) : (
    <img
      src={ICON_SRC}
      alt="Tableria"
      style={{ width: size, height: size }}
      className="object-contain"
      onError={() => setIconFailed(true)}
    />
  );

  if (stacked) {
    return (
      <span className="flex flex-col items-center gap-3 text-center">
        <span className="flex justify-center">{icon}</span>
        <span className="flex flex-col items-center gap-1.5">
          <span
            className="tb-sidebar-wordmark font-wordmark font-extrabold uppercase tracking-wide"
            style={{ fontSize: size * 0.2 }}
          >
            Tableria
          </span>
          <span
            className="font-semibold uppercase tracking-[0.2em] text-tb-sidebar-muted"
            style={{ fontSize: size * 0.07 }}
          >
            — Tu plataforma de juegos de mesa —
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {icon}
      <span className="tb-brand-wordmark font-wordmark text-xl font-extrabold uppercase tracking-wide">
        Tableria
      </span>
    </span>
  );
}
