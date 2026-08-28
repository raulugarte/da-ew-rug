import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateFooterContent } from '../../blocks/footer/footer.js';

const mountedFragments = [];

// Matches the real authored shape (see _handoff/content/footer.md /
// fragments/nav/footer.html): 4 sections - brand+blurb, a "columns" block
// with 3 link groups, legal links (one paragraph, space-separated), and
// copyright text.
const FOOTER_HTML = `
  <div class="section"><div class="default-content">
    <p><a href="/">RWE</a></p>
    <p>An energy group moving from a 125-year fossil legacy to a renewables-led future.</p>
  </div></div>
  <div class="section"><div class="block-content"><div class="columns">
    <div><div><h5>Start pages</h5><ul><li><a href="#">The Group</a></li></ul></div>
    <div><h5>Quick links</h5><ul><li><a href="#">Find a job</a></li></ul></div>
    <div><h5>We recommend</h5><ul><li><a href="#">Purpose &amp; strategy</a></li></ul></div></div>
  </div></div></div>
  <div class="section"><div class="default-content">
    <p><a href="#">Disclaimer</a> <a href="#">Imprint</a> <a href="#">Data protection</a></p>
  </div></div>
  <div class="section"><div class="default-content">
    <p>Concept redesign for practice purposes &middot; not affiliated with or endorsed by RWE AG &middot; &copy; 2026</p>
  </div></div>
`;

function mountFooter(html = FOOTER_HTML) {
  const fragment = document.createElement('div');
  fragment.className = 'footer-content';
  fragment.innerHTML = html;
  document.body.append(fragment);
  mountedFragments.push(fragment);
  decorateFooterContent(fragment);
  return fragment;
}

afterEach(() => {
  for (const el of mountedFragments.splice(0)) {
    el.remove();
  }
});

describe('decorateFooterContent', () => {
  it('classes each of the 4 sections by its authored position', () => {
    const fragment = mountFooter();
    expect(fragment.querySelector('.section-brand')).to.not.equal(null);
    expect(fragment.querySelector('.section-links')).to.not.equal(null);
    expect(fragment.querySelector('.section-legal')).to.not.equal(null);
    expect(fragment.querySelector('.section-copyright')).to.not.equal(null);
  });

  it('groups brand and links into .footer-top, in that order', () => {
    const fragment = mountFooter();
    const top = fragment.querySelector('.footer-top');
    expect(top).to.not.equal(null);
    expect([...top.children].map((c) => c.className)).to.deep.equal([
      'section section-brand',
      'section section-links',
    ]);
  });

  it('groups copyright and legal into .footer-legal, copyright first', () => {
    const fragment = mountFooter();
    const legalRow = fragment.querySelector('.footer-legal');
    expect(legalRow).to.not.equal(null);
    expect([...legalRow.children].map((c) => c.className)).to.deep.equal([
      'section section-copyright',
      'section section-legal',
    ]);
  });

  it('leaves .footer-top and .footer-legal as the only direct children', () => {
    const fragment = mountFooter();
    expect([...fragment.children].map((c) => c.className)).to.deep.equal([
      'footer-top',
      'footer-legal',
    ]);
  });

  it('does not throw when a section is missing', () => {
    const fragment = document.createElement('div');
    fragment.innerHTML = '<div class="section"><div class="default-content"><p><a href="/">RWE</a></p></div></div>';
    document.body.append(fragment);
    mountedFragments.push(fragment);
    expect(() => decorateFooterContent(fragment)).to.not.throw();
    expect(fragment.querySelector('.section-brand')).to.not.equal(null);
  });
});

describe('footer layout CSS', () => {
  let stylesheetsLoaded = null;
  function loadStylesheet(href) {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = resolve;
      document.head.append(link);
    });
  }

  // footer.css leans on --color-line-dark etc. from the page-level tokens.
  // section-metadata.css is also loaded here on purpose: its .section > *
  // rule is what the .footer-legal color fix below has to win against -
  // without it this suite can't catch a regression there at all.
  function loadStylesheets() {
    stylesheetsLoaded ??= Promise.all([
      loadStylesheet('/styles/styles.css'),
      loadStylesheet('/blocks/section-metadata/section-metadata.css'),
      loadStylesheet('/blocks/footer/footer.css'),
    ]);
    return stylesheetsLoaded;
  }

  function mountInFooter(html = FOOTER_HTML) {
    const footerEl = document.createElement('footer');
    const fragment = document.createElement('div');
    fragment.className = 'footer-content';
    fragment.innerHTML = html;
    footerEl.append(fragment);
    document.body.append(footerEl);
    mountedFragments.push(footerEl);
    decorateFooterContent(fragment);
    return footerEl;
  }

  afterEach(async () => {
    await setViewport({ width: 1440, height: 900 });
  });

  it('lays brand and links side by side at desktop width', async () => {
    await loadStylesheets();
    await setViewport({ width: 1440, height: 900 });
    const footerEl = mountInFooter();
    expect(getComputedStyle(footerEl.querySelector('.footer-top')).display).to.equal('flex');
    const brandRect = footerEl.querySelector('.section-brand').getBoundingClientRect();
    const linksRect = footerEl.querySelector('.section-links').getBoundingClientRect();
    expect(Math.round(linksRect.left)).to.be.at.least(Math.round(brandRect.right));
  });

  it('stacks brand above links below the breakpoint', async () => {
    await loadStylesheets();
    await setViewport({ width: 600, height: 900 });
    const footerEl = mountInFooter();
    const brandRect = footerEl.querySelector('.section-brand').getBoundingClientRect();
    const linksRect = footerEl.querySelector('.section-links').getBoundingClientRect();
    expect(Math.round(linksRect.top)).to.be.at.least(Math.round(brandRect.bottom));
  });

  it('spaces nav-column links by exactly the 10px gap, not styles.css\'s global li margin', async () => {
    // Regression test: styles.css's global li { margin-block: 1em } doesn't
    // collapse against a flex sibling's margin the way a normal block-level
    // li's margin would - left unreset, each item got ~16px top/bottom on
    // top of the 10px gap, more than quadrupling the mockup's real spacing.
    await loadStylesheets();
    const html = FOOTER_HTML.replace(
      '<ul><li><a href="#">The Group</a></li></ul>',
      '<ul><li><a href="#">The Group</a></li><li><a href="#">Our Energy</a></li></ul>',
    );
    const footerEl = mountInFooter(html);
    const items = [...footerEl.querySelectorAll('.section-links li')];
    const { top } = items[1].getBoundingClientRect();
    const { bottom } = items[0].getBoundingClientRect();
    expect(Math.round(top - bottom)).to.equal(10);
  });

  it('gives .footer-legal a top hairline, separate from the main content', async () => {
    await loadStylesheets();
    const footerEl = mountInFooter();
    const legalRow = footerEl.querySelector('.footer-legal');
    expect(getComputedStyle(legalRow).borderTopStyle).to.equal('solid');
  });

  it('keeps the muted copyright/legal-link color despite section-metadata\'s own text color', async () => {
    // Regression test: section-metadata.css sets color on every section's
    // direct child (for contrast on colored block backgrounds) - equal
    // specificity to a color set on the ancestor .footer-legal, so
    // whichever stylesheet loaded later silently won and the copyright
    // text rendered close to black on the dark footer instead of muted
    // white.
    await loadStylesheets();
    const footerEl = mountInFooter();
    const copyrightP = footerEl.querySelector('.section-copyright p');
    const legalP = footerEl.querySelector('.section-legal p');
    expect(getComputedStyle(copyrightP).color).to.equal('rgba(255, 255, 255, 0.42)');
    expect(getComputedStyle(legalP).color).to.equal('rgba(255, 255, 255, 0.42)');
  });
});
