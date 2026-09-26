# Cómo contribuir

[English](CONTRIBUTING.md) · **Español**

¡Gracias por querer ayudar! La forma más fácil de empezar es un hook nuevo: cada uno es un solo archivo.

## Cómo enviar un cambio

1. Haz un **fork** de este repo (tu propia copia en GitHub) y clónalo.
2. Crea una rama: `git checkout -b mi-hook-nuevo`.
3. Instala y abre la app:
   ```sh
   pnpm install
   pnpm dev   # http://localhost:3210
   ```
4. Haz tu cambio. Para un efecto nuevo, sigue [Agregar un efecto nuevo](README.es.md#agregar-un-efecto-nuevo).
5. Comprueba que todo pasa:
   ```sh
   pnpm test
   pnpm typecheck
   ```
6. Sube tu rama y abre un **pull request** hacia `main`. Cuenta qué hace y, si es visual, adjunta una captura o un
   clip corto.

Quien mantiene el proyecto revisa cada PR y puede pedir cambios antes de unirlo.

## Por dónde empezar

- [Good first issues](docs/good-first-issues.md): ideas de hooks con un archivo de partida y una lista de "listo cuando".
- ¿Encontraste un error o tienes una idea? Abre primero un **issue** para conversarlo.

## Algunas reglas

- Anima solo a partir del cuadro (`useCurrentFrame`), nunca con `Date.now()`, `Math.random()` ni animaciones CSS: el
  render tiene que ser idéntico a la vista previa cuadro por cuadro.
- Los nombres, descripciones y etiquetas son `{ en, es }` para que la app funcione en los dos idiomas.
- Un efecto por PR hace que la revisión sea rápida.
