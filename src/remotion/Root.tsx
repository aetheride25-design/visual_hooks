import React from 'react';
import { Composition } from 'remotion';
import { baseDefaults, canvasOf, durationInFrames, effects } from '../registry.ts';
import { shells } from '../shell.tsx';
import type { BaseProps } from '../lib/types.ts';

// One composition per effect. The render receives the same props the preview shows.
export const Root: React.FC = () => (
  <>
    {effects.map((def) => {
      const defaultProps = { ...baseDefaults(def), ...def.defaults };
      const size = canvasOf(def, defaultProps);
      return (
        <Composition
          key={def.id}
          id={def.id}
          component={shells[def.id]}
          width={size.width}
          height={size.height}
          defaultProps={defaultProps}
          calculateMetadata={({ props }) => {
            const p = props as unknown as BaseProps;
            return { fps: p.fps, durationInFrames: durationInFrames(p), ...canvasOf(def, props) };
          }}
        />
      );
    })}
  </>
);
