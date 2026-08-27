import { expect } from '@esm-bundle/chai';

const mountedBlocks = [];

function mountBlock(className, html) {
  const el = document.createElement('div');
  el.className = className;
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

const PLAIN_ROW = `<div>
  <div><p>Our Energy</p></div>
  <div><p>Wind, solar, storage and hydrogen.</p></div>
  <div><p><a href="/energy">Discover more</a></p></div>
</div>`;

const FULL_OPTIONS_ROW = `<div>
  <div><p>Careers</p></div>
  <div><p>Join the team.</p></div>
  <div><p><a href="/careers">Find a job</a></p></div>
  <div><p>tone-b, wide, video, contours</p></div>
</div>`;

const NO_LINK_TEXT_ROW = `<div>
  <div><p>Untitled</p></div>
  <div><p>No link label authored.</p></div>
  <div><p><a href="/somewhere"></a></p></div>
</div>`;

async function mountTeaserGrid(html, className = 'teaser-grid') {
  const el = mountBlock(className, html);
  const { default: init } = await import('../../blocks/teaser-grid/teaser-grid.js');
  init(el);
  return el;
}

describe('column count', () => {
  it('defaults to 3-up without a variant class', async () => {
    const el = await mountTeaserGrid(PLAIN_ROW);
    expect(el.classList.contains('cols-3')).to.equal(true);
  });

  it('reads the up-count from the variant class', async () => {
    const el = await mountTeaserGrid(PLAIN_ROW, 'teaser-grid 6-up');
    expect(el.classList.contains('cols-6')).to.equal(true);
    expect(el.classList.contains('cols-3')).to.equal(false);
  });
});

describe('a plain tile', () => {
  it('renders heading, text and a link built from the authored href', async () => {
    const el = await mountTeaserGrid(PLAIN_ROW);
    const tile = el.querySelector('a.teaser-grid-tile');
    expect(tile).to.not.equal(null);
    expect(tile.getAttribute('href')).to.equal('/energy');
    expect(tile.querySelector('h4').textContent).to.equal('Our Energy');
    expect(tile.querySelector('p').textContent).to.equal('Wind, solar, storage and hydrogen.');
  });

  it('defaults to tone-a and is not wide', async () => {
    const el = await mountTeaserGrid(PLAIN_ROW);
    const tile = el.querySelector('a.teaser-grid-tile');
    expect(tile.classList.contains('tone-a')).to.equal(true);
    expect(tile.classList.contains('wide')).to.equal(false);
  });

  it('does not create a play badge or contours', async () => {
    const el = await mountTeaserGrid(PLAIN_ROW);
    expect(el.querySelector('.play-mini')).to.equal(null);
    expect(el.querySelector('.contours')).to.equal(null);
  });

  it('unwraps the authored <p> instead of nesting it inside h4/p', async () => {
    const el = await mountTeaserGrid(PLAIN_ROW);
    const tile = el.querySelector('a.teaser-grid-tile');
    expect(tile.querySelector('h4 p')).to.equal(null);
    expect(tile.querySelectorAll('.mt-content > p')).to.have.lengthOf(1);
  });

  it('replaces the original row, leaving no leftover markup', async () => {
    const el = await mountTeaserGrid(PLAIN_ROW);
    expect(el.children).to.have.lengthOf(1);
    expect(el.querySelector('a[href="/energy"] a')).to.equal(null);
  });

  it('renders the arrow icon in the text-link', async () => {
    const el = await mountTeaserGrid(PLAIN_ROW);
    const link = el.querySelector('.text-link.on-dark');
    expect(link.textContent.trim()).to.equal('Discover more');
    const use = link.querySelector('svg use');
    expect(use.getAttribute('href')).to.contain('/img/icons/arrow-right.svg#icon');
  });

  it('omits the label span when no link text is authored, keeping only the icon', async () => {
    const el = await mountTeaserGrid(NO_LINK_TEXT_ROW);
    const link = el.querySelector('.text-link.on-dark');
    expect(link.querySelector('span')).to.equal(null);
    expect(link.querySelector('svg')).to.not.equal(null);
  });
});

describe('spacing from a preceding sibling block', () => {
  // Regression test: a teaser-grid following pill-nav (or another
  // teaser-grid, e.g. the "what we're good at" / "careers" sections) had no
  // gap from it at all - reference/rwe-mockup.html's .tile-grid3 always
  // carries margin-top: 36px. Not wanted when the teaser-grid is the first
  // block in its section, where the block-head's own spacing already
  // applies.
  let stylesheetLoaded = null;
  function loadStylesheet() {
    stylesheetLoaded ??= new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/blocks/teaser-grid/teaser-grid.css';
      link.onload = resolve;
      link.onerror = resolve;
      document.head.append(link);
    });
    return stylesheetLoaded;
  }

  it('adds margin-top when preceded by a sibling block', async () => {
    await loadStylesheet();
    const container = document.createElement('div');
    container.innerHTML = '<div class="pill-nav"></div><div class="teaser-grid cols-3"></div>';
    document.body.append(container);
    mountedBlocks.push(container);
    const grid = container.querySelector('.teaser-grid');
    expect(getComputedStyle(grid).marginTop).to.equal('36px');
  });

  it('does not add margin-top when it is the first block in its section', async () => {
    await loadStylesheet();
    const container = document.createElement('div');
    container.innerHTML = '<div class="teaser-grid cols-3"></div>';
    document.body.append(container);
    mountedBlocks.push(container);
    const grid = container.querySelector('.teaser-grid');
    expect(getComputedStyle(grid).marginTop).to.equal('0px');
  });
});

describe('a tile with every option set', () => {
  it('applies tone, wide, and removes the options cell from the DOM', async () => {
    const el = await mountTeaserGrid(FULL_OPTIONS_ROW);
    const tile = el.querySelector('a.teaser-grid-tile');
    expect(tile.classList.contains('tone-b')).to.equal(true);
    expect(tile.classList.contains('wide')).to.equal(true);
    expect(tile.textContent).to.not.contain('tone-b');
  });

  it('adds a play badge with the play icon', async () => {
    const el = await mountTeaserGrid(FULL_OPTIONS_ROW);
    const badge = el.querySelector('.play-mini');
    expect(badge).to.not.equal(null);
    const use = badge.querySelector('svg use');
    expect(use.getAttribute('href')).to.contain('/img/icons/play.svg#icon');
  });

  it('adds a contours graphic stretched to fill the tile', async () => {
    const el = await mountTeaserGrid(FULL_OPTIONS_ROW);
    const contours = el.querySelector('svg.contours');
    expect(contours).to.not.equal(null);
    expect(contours.getAttribute('preserveAspectRatio')).to.equal('none');
    expect(contours.getAttribute('viewBox')).to.equal('0 0 400 260');
  });
});
