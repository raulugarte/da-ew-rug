import { expect } from '@esm-bundle/chai';

const mountedBlocks = [];

function mountBlock(html) {
  const el = document.createElement('div');
  el.className = 'social-band';
  el.innerHTML = html;
  document.body.append(el);
  mountedBlocks.push(el);
  return el;
}

afterEach(() => {
  for (const el of mountedBlocks.splice(0)) {
    el.remove();
  }
});

const SHARE_ROW = `<div>
  <div><p>Share this page</p></div>
  <div><p>
    <a href="https://linkedin.com/x">LinkedIn</a>
    <a href="https://facebook.com/x">Facebook</a>
    <a href="mailto:x@rwe.com">E-Mail</a>
    <a href="https://x.com/x">X</a>
    <a href="https://instagram.com/x">Instagram</a>
    <a href="https://youtube.com/x">YouTube</a>
    <a href="https://example.com/rss">RSS</a>
  </p></div>
</div>`;

const ELSEWHERE_ROW = '<div><div><p>Find us elsewhere</p></div><div><p><a href="/social" class="btn btn-secondary">All channels</a></p></div></div>';

async function mountSocialBand(html) {
  const el = mountBlock(html);
  const { default: init } = await import('../../blocks/social-band/social-band.js');
  init(el);
  return el;
}

function iconHrefFor(el, label) {
  const link = [...el.querySelectorAll('.icon-btn')].find((a) => a.getAttribute('aria-label') === label);
  return link.querySelector('svg use').getAttribute('href');
}

describe('share icons', () => {
  it('maps known platform labels to the matching icon', async () => {
    const el = await mountSocialBand(SHARE_ROW);
    expect(iconHrefFor(el, 'LinkedIn')).to.contain('/img/icons/linkedin.svg#icon');
    expect(iconHrefFor(el, 'Facebook')).to.contain('/img/icons/facebook.svg#icon');
    expect(iconHrefFor(el, 'E-Mail')).to.contain('/img/icons/mail.svg#icon');
    expect(iconHrefFor(el, 'X')).to.contain('/img/icons/x.svg#icon');
    expect(iconHrefFor(el, 'Instagram')).to.contain('/img/icons/instagram.svg#icon');
    expect(iconHrefFor(el, 'YouTube')).to.contain('/img/icons/youtube.svg#icon');
  });

  it('falls back to the globe icon for an unrecognized label', async () => {
    const el = await mountSocialBand(SHARE_ROW);
    expect(iconHrefFor(el, 'RSS')).to.contain('/img/icons/globe.svg#icon');
  });

  it('does not match "x" as a substring of unrelated labels', async () => {
    const el = await mountSocialBand('<div><div><p>Share</p></div><div><p><a href="#">Xylophone</a></p></div></div>');
    expect(iconHrefFor(el, 'Xylophone')).to.contain('/img/icons/globe.svg#icon');
  });

  it('replaces the link text with the icon and keeps it as the accessible name', async () => {
    const el = await mountSocialBand(SHARE_ROW);
    const link = el.querySelector('.icon-btn');
    expect(link.getAttribute('aria-label')).to.equal('LinkedIn');
    expect(link.textContent.trim()).to.equal('');
  });

  it('renders the share label', async () => {
    const el = await mountSocialBand(SHARE_ROW);
    expect(el.querySelector('.label').textContent).to.equal('Share this page');
  });
});

describe('elsewhere row', () => {
  it('renders the label and keeps the link classes already applied by decoration', async () => {
    const el = await mountSocialBand(SHARE_ROW + ELSEWHERE_ROW);
    const labels = el.querySelectorAll('.label');
    expect(labels[1].textContent).to.equal('Find us elsewhere');
    const link = el.querySelector('a.btn');
    expect(link.classList.contains('btn-secondary')).to.equal(true);
    expect(link.getAttribute('href')).to.equal('/social');
  });

  it('is omitted without a second row', async () => {
    const el = await mountSocialBand(SHARE_ROW);
    expect(el.querySelectorAll('.label')).to.have.lengthOf(1);
    expect(el.querySelector('a.btn')).to.equal(null);
  });
});

describe('layout', () => {
  // Regression test: the band itself is full-bleed (see section-metadata.css/
  // styles.css - excluded from the generic section centering the same way
  // as the hero carousel), but its own .wrap must still center the content
  // within it, matching reference/rwe-mockup.html's .wrap convention -
  // .wrap here previously had no max-width at all, so it spanned the full
  // (already full-bleed) band edge to edge instead.
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

  // social-band.css leans on --grid-container-width from the page tokens.
  function loadStylesheets() {
    stylesheetsLoaded ??= Promise.all([
      loadStylesheet('/styles/styles.css'),
      loadStylesheet('/blocks/social-band/social-band.css'),
    ]);
    return stylesheetsLoaded;
  }

  it('centers .wrap within the full-bleed band instead of spanning it edge to edge', async () => {
    await loadStylesheets();
    const el = await mountSocialBand(SHARE_ROW);
    el.style.width = '1440px';
    expect(getComputedStyle(el.querySelector('.wrap')).maxWidth).to.not.equal('none');
  });
});
