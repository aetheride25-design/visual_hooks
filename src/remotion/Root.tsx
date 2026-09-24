import React from 'react';
import { Composition, Still } from 'remotion';
import { PerfilA, PerfilB, PerfilC, PortadaX } from '../marca/marca.tsx';
import { baseDefaults, canvasOf, durationInFrames, effects, shells } from '../registry.tsx';
import type { BaseProps } from '../lib/types.ts';

// Una composición por efecto. El render recibe los mismos props que ve la vista previa.
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
    {/* Imágenes fijas de marca (se exportan con `pnpm marca`) */}
    <Still id="marca-perfil-a" component={PerfilA} width={400} height={400} />
    <Still id="marca-perfil-b" component={PerfilB} width={400} height={400} />
    <Still id="marca-perfil-c" component={PerfilC} width={400} height={400} />
    <Still
      id="marca-portada-x"
      component={PortadaX}
      width={1500}
      height={500}
      defaultProps={{ phrase: 'Construyo proyectos con IA hasta poder', accent: 'renunciar', name: 'chitodev' }}
    />
  </>
);
