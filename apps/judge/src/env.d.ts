/// <reference types="vite-plugin-pwa/vue" />

declare module '*.md?raw' {
  const text: string
  export default text
}
