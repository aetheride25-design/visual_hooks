import React from 'react';
import { fonts } from '../brand.ts';
import { easeOutBack, lerp } from '../lib/anim.ts';

/** Rótulo grande tipo sello ("ANTES", "AHORA") que entra con golpe. `p` va de 0 a 1. */
export const StampLabel: React.FC<{ text: string; color: string; p: number; rotate?: number; style?: React.CSSProperties }> = ({
  text,
  color,
  p,
  rotate = -4,
  style,
}) =>
  p <= 0 ? null : (
    <div
      style={{
        display: 'inline-block',
        padding: '14px 38px',
        borderRadius: 18,
        background: color,
        color: '#0a0b0d',
        fontFamily: fonts.sans,
        fontWeight: 900,
        fontSize: 84,
        letterSpacing: 4,
        transform: `scale(${lerp(2.2, 1, easeOutBack(p, 1.5))}) rotate(${rotate}deg)`,
        opacity: Math.min(1, p * 4),
        boxShadow: `0 18px 50px rgba(0,0,0,0.55), 0 0 60px ${color}55`,
        ...style,
      }}
    >
      {text}
    </div>
  );
