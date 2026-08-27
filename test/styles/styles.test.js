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
