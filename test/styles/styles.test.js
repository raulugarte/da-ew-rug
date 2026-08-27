import { expect } from '@esm-bundle/chai';

let stylesheetLoaded = null;

function loadStylesheet() {
  stylesheetLoaded ??= new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/styles.css';
    link.onload = resolve;
    link.onerror = resolve;
    document.head.append(link);
  });
  return stylesheetLoaded;
}

describe('root color scheme', () => {
  // The RWE design (reference/rwe-mockup.html) has a single, fixed light
  // palette with no dark variant. :root must pin color-scheme to light so
  // --color-text/--color-link/--color-background etc. (defined via
  // light-dark()) don't flip on the visitor's OS preference.
  it('pins :root to light regardless of the light-dark() tokens defined on it', async () => {
    await loadStylesheet();
    expect(getComputedStyle(document.documentElement).colorScheme).to.equal('light');
  });
});

describe('default link underline', () => {
  // reference/rwe-mockup.html resets every <a> to text-decoration: none
  // (color/weight/hover carry the link styling instead) - only .btn had
  // this locally, so any plain link without its own block-specific class
  // (e.g. pill-nav's tags) fell back to the browser's default underline.
  it('removes the underline from a plain, unstyled link', async () => {
    await loadStylesheet();
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = 'Plain link';
    document.body.append(a);
    expect(getComputedStyle(a).textDecorationLine).to.equal('none');
    a.remove();
  });
});
