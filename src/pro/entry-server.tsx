import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { ProApp } from './ProApp';

/** Called by scripts/prerender.mjs at build time. Mirrors main.tsx so hydration sees the same tree. */
export function render(): string {
  return renderToString(
    <StrictMode>
      <ProApp />
    </StrictMode>,
  );
}
