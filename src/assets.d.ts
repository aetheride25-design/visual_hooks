// Archivos que se importan como URL (Vite en la app y el bundler de Remotion en el render).
declare module '*.woff2' {
  const url: string;
  export default url;
}
