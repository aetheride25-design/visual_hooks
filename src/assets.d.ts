// Files imported as URLs (Vite in the app, the Remotion bundler in the render).
declare module '*.woff2' {
  const url: string;
  export default url;
}
