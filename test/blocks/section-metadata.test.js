import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import init from '../../blocks/section-metadata/section-metadata.js';

const mountedSections = [];

function mountSection(dataset = {}) {
  const section = document.createElement('div');
  Object.assign(section.dataset, dataset);
  document.body.append(section);
  mountedSections.push(section);
  return section;
}

afterEach(() => {
  for (const el of mountedSections.splice(0)) {
    el.remove();
  }
});

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

function loadStylesheets() {
  stylesheetsLoaded ??= Promise.all([
    loadStylesheet('/styles/styles.css'),
    loadStylesheet('/blocks/section-metadata/section-metadata.css'),
  ]);
  return stylesheetsLoaded;
}

function mountStyledSection(className, html) {
  const section = document.createElement('div');
  section.className = className;
  section.innerHTML = html;
  document.body.append(section);
  mountedSections.push(section);
  return section;
}

function mountHeadSection(html, dataset = { head: 'kicker-lede' }) {
  const section = document.createElement('div');
  section.innerHTML = `<div class="default-content">${html}</div>`;
  Object.assign(section.dataset, dataset);
  document.body.append(section);
  mountedSections.push(section);
  return section;
}

const PAIR_HTML = '<div class="default-content"><p>Text</p></div><div class="block-content"><div class="card"></div></div>';
const TICKER_PRESS_HTML = '<div class="default-content"><p>Heading text</p></div>'
  + '<div class="block-content"><div class="ticker"></div><div class="press-list"></div></div>';

describe('field decoration', () => {
  it('adds field-wrap and the offsets for a known placement', async () => {
    const section = mountSection({ field: 'bottom-left' });
    await init(section);
    expect(section.classList.contains('field-wrap')).to.equal(true);
    expect(section.style.getPropertyValue('--field-bottom')).to.equal('-160px');
    expect(section.style.getPropertyValue('--field-left')).to.equal('-140px');
  });

  it('adds the tone-soft modifier when authored', async () => {
    const section = mountSection({ field: 'bottom-left, soft' });
    await init(section);
    expect(section.classList.contains('tone-soft')).to.equal(true);
  });

  it('does not add tone-soft when no tone is authored', async () => {
    const section = mountSection({ field: 'top-right' });
    await init(section);
    expect(section.classList.contains('tone-soft')).to.equal(false);
  });

  it('falls back to top-right for an unrecognized placement', async () => {
    const section = mountSection({ field: 'somewhere' });
    await init(section);
    expect(section.style.getPropertyValue('--field-top')).to.equal('-160px');
    expect(section.style.getPropertyValue('--field-right')).to.equal('-140px');
  });

  it('is case-insensitive', async () => {
    const section = mountSection({ field: 'Bottom-Right, SOFT' });
    await init(section);
    expect(section.style.getPropertyValue('--field-bottom')).to.equal('-160px');
    expect(section.style.getPropertyValue('--field-right')).to.equal('-140px');
    expect(section.classList.contains('tone-soft')).to.equal(true);
  });

  it('removes the data attribute once consumed', async () => {
    const section = mountSection({ field: 'center' });
    await init(section);
    expect(section.dataset.field).to.equal(undefined);
  });

  it('does nothing when no field is authored', async () => {
    const section = mountSection({ grid: '0' });
    await init(section);
    expect(section.classList.contains('field-wrap')).to.equal(false);
  });
});

describe('anchor id', () => {
  it('sets the section id for in-page jump links', async () => {
    const section = mountSection({ id: 'markets' });
    await init(section);
    expect(section.id).to.equal('markets');
  });

  it('removes the data attribute once consumed', async () => {
    const section = mountSection({ id: 'markets' });
    await init(section);
    expect(section.dataset.id).to.equal(undefined);
  });
});

describe('default section spacing and centering', () => {
  // Regression test: a plain section.block in the mockup gets padding: 64px
  // 0 and its content sits in a centered, max-width-capped .wrap - only the
  // hero carousel is full-bleed edge to edge. .block-content previously had
  // neither: no vertical gap between sections, and content flush against
  // the viewport edge (section-metadata's own default --top-bottom-spacing
  // of 0 was overriding whatever styles.css declared, since both rules are
  // .section at equal specificity and this one loads later).
  afterEach(async () => {
    await setViewport({ width: 1440, height: 900 });
  });

  it('pads top/bottom by 64px and centers .block-content by default', async () => {
    await loadStylesheets();
    await setViewport({ width: 1440, height: 900 });
    const section = mountStyledSection('section', '<div class="block-content"><div class="teaser-grid"></div></div>');
    const style = getComputedStyle(section);
    expect(style.paddingTop).to.equal('64px');
    expect(style.paddingBottom).to.equal('64px');
    expect(getComputedStyle(section.querySelector('.block-content')).maxWidth).to.not.equal('none');
  });

  it('is full-bleed for the hero carousel: no padding, no max-width', async () => {
    await loadStylesheets();
    await setViewport({ width: 1440, height: 900 });
    const section = mountStyledSection('section', '<div class="block-content"><div class="hero-carousel"></div></div>');
    const style = getComputedStyle(section);
    expect(style.paddingTop).to.equal('0px');
    expect(style.paddingBottom).to.equal('0px');
    expect(getComputedStyle(section.querySelector('.block-content')).maxWidth).to.equal('none');
  });

  it('is full-bleed for the social band: no padding, no max-width', async () => {
    // Same reasoning as the hero carousel above - the mockup's social band
    // is a plain full-bleed div (not a section.block), with its own inner
    // .wrap centering just its content.
    await loadStylesheets();
    await setViewport({ width: 1440, height: 900 });
    const section = mountStyledSection('section', '<div class="block-content"><div class="social-band"></div></div>');
    const style = getComputedStyle(section);
    expect(style.paddingTop).to.equal('0px');
    expect(style.paddingBottom).to.equal('0px');
    expect(getComputedStyle(section.querySelector('.block-content')).maxWidth).to.equal('none');
  });

  it('does not apply the 64px default inside header/footer - those bring their own row spacing', async () => {
    await loadStylesheets();
    const header = document.createElement('header');
    header.innerHTML = '<div class="section"><div class="default-content"><p>Utility</p></div></div>';
    document.body.append(header);
    mountedSections.push(header);
    const section = header.querySelector('.section');
    expect(getComputedStyle(section).paddingTop).to.equal('0px');
  });
});

describe('layout-pair CSS (text beside a single block)', () => {
  afterEach(async () => {
    await setViewport({ width: 1440, height: 900 });
  });

  it('grids the section itself into two columns at desktop width', async () => {
    await loadStylesheets();
    await setViewport({ width: 1440, height: 900 });
    const section = mountStyledSection('section layout-pair', PAIR_HTML);
    const style = getComputedStyle(section);
    expect(style.display).to.equal('grid');
    expect(style.gridTemplateColumns.trim().split(/\s+/)).to.have.lengthOf(2);
  });

  it('centers the grid itself instead of letting the two columns split the full section width', async () => {
    await loadStylesheets();
    await setViewport({ width: 1440, height: 900 });
    const section = mountStyledSection('section layout-pair', PAIR_HTML);
    expect(getComputedStyle(section).maxWidth).to.not.equal('none');
  });

  it('stacks to a single column below the breakpoint', async () => {
    await loadStylesheets();
    await setViewport({ width: 600, height: 900 });
    const section = mountStyledSection('section layout-pair', PAIR_HTML);
    const style = getComputedStyle(section);
    expect(style.gridTemplateColumns.trim().split(/\s+/)).to.have.lengthOf(1);
  });
});

describe('grid-2 stays exactly as before layout-pair (section 8 pattern)', () => {
  afterEach(async () => {
    await setViewport({ width: 1440, height: 900 });
  });

  it('does not turn the section itself into a grid - only its block-content', async () => {
    await loadStylesheets();
    await setViewport({ width: 1440, height: 900 });
    const section = mountStyledSection('section grid grid-2', TICKER_PRESS_HTML);
    expect(getComputedStyle(section).display).to.equal('block');

    const blockContent = section.querySelector('.block-content');
    const blockStyle = getComputedStyle(blockContent);
    expect(blockStyle.display).to.equal('grid');
    expect(blockStyle.gridTemplateColumns.trim().split(/\s+/)).to.have.lengthOf(2);
  });
});

describe('kicker-lede head', () => {
  it('turns the first <p> into a .kicker span and the last into .lede, wrapped in .block-head', async () => {
    const section = mountHeadSection('<p>Media &amp; share price</p><h2>What\'s moving</h2><p>A lede paragraph.</p>');
    await init(section);
    const head = section.querySelector('.block-head');
    expect(head).to.not.equal(null);
    expect(head.classList.contains('reveal')).to.equal(true);
    const kicker = head.querySelector('span.kicker');
    expect(kicker.textContent).to.equal('Media & share price');
    const lede = head.querySelector('.lede');
    expect(lede.tagName).to.equal('P');
    expect(lede.textContent).to.equal('A lede paragraph.');
  });

  it('does not add .lede when there is no trailing paragraph', async () => {
    const section = mountHeadSection('<p>Kicker</p><h2>Heading only</h2>');
    await init(section);
    expect(section.querySelector('.lede')).to.equal(null);
    expect(section.querySelector('span.kicker').textContent).to.equal('Kicker');
  });

  it('ledes the paragraph right after the heading, not a later pull-quote paragraph', async () => {
    const section = mountHeadSection('<p>Kicker</p><h2>Heading</h2><p>The real lede.</p><p>A pull-quote after it.</p>');
    await init(section);
    const ledes = section.querySelectorAll('.lede');
    expect(ledes).to.have.lengthOf(1);
    expect(ledes[0].textContent).to.equal('The real lede.');
    const paragraphs = [...section.querySelectorAll('.block-head p')];
    expect(paragraphs[1].textContent).to.equal('A pull-quote after it.');
    expect(paragraphs[1].classList.contains('lede')).to.equal(false);
  });

  it('does nothing for an unrecognized value', async () => {
    const section = mountHeadSection('<p>Kicker</p><h2>Heading</h2>', { head: 'something-else' });
    await init(section);
    expect(section.querySelector('.block-head')).to.equal(null);
    expect(section.querySelector('span.kicker')).to.equal(null);
  });

  it('does not throw without a default-content sibling', async () => {
    const section = mountSection({ head: 'kicker-lede' });
    await init(section);
    expect(section.querySelector('.block-head')).to.equal(null);
  });

  it('removes the data attribute once consumed', async () => {
    const section = mountHeadSection('<p>Kicker</p><h2>Heading</h2>');
    await init(section);
    expect(section.dataset.head).to.equal(undefined);
  });
});
