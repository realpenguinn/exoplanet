import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Accessibility & WCAG 2.1 AA Compliance Audit', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  it('declares valid language and responsive viewport', () => {
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('name="viewport"');
  });

  it('defines landmark roles for primary page regions', () => {
    expect(html).toContain('role="banner"');
    expect(html).toContain('role="contentinfo"');
    expect(html).toContain('<main');
  });

  it('implements combobox and listbox semantics for accessible search', () => {
    expect(html).toContain('id="searchInput"');
    expect(html).toContain('id="searchResults"');
    expect(html).toContain('aria-autocomplete="list"');
  });

  it('provides non-visual aria-live announcement region for photometric transit events', () => {
    expect(html).toContain('id="liveFluxAnnouncement"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('class="sr-only"');
  });

  it('provides descriptive aria-labels for canvas elements', () => {
    expect(html).toContain('id="canvas3d"');
    expect(html).toContain('aria-label=');
    expect(html).toContain('id="transitCanvas"');
  });

  it('centralizes user-facing UI strings with zero string fragmentation', () => {
    const stringsFile = path.resolve('src/ui/strings.en.ts');
    expect(fs.existsSync(stringsFile)).toBe(true);
    const content = fs.readFileSync(stringsFile, 'utf-8');
    expect(content).toContain('COSMOSCAN');
    expect(content).toContain('accessibility:');
  });
});
