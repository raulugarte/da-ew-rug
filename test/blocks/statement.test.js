import { expect } from '@esm-bundle/chai';

const mountedBlocks = [];

function mountBlock(html) {
  const el = document.createElement('div');
  el.className = 'statement';
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

// Actions cell mimics real output from decorateLink/decorateButton: each
// link already carries whatever btn/btn-primary/etc. class the author's
// markdown emphasis produced - the block must not reassign these.
const ROWS = `<div><div><p>Strategy</p></div></div>
<div><div><p>A bold quote about the future of energy.</p></div></div>
<div><div><p>A short lede paragraph.</p></div></div>
<div><div><p><a href="/energy" class="btn btn-primary">Explore renewables</a> <a href="/film" class="btn btn-secondary">Watch the film</a></p></div></div>
<div><div><p>02:14 &middot; A look inside the transition</p></div></div>`;

const NO_VIDEO_ROWS = `<div><div><p>Strategy</p></div></div>
<div><div><p>A bold quote about the future of energy.</p></div></div>
<div><div><p>A short lede paragraph.</p></div></div>
<div><div><p><a href="/energy" class="btn btn-primary">Explore renewables</a></p></div></div>`;

async function mountStatement(html) {
  const el = mountBlock(html);
  const { default: init } = await import('../../blocks/statement/statement.js');
  init(el);
  return el;
}

describe('field decoration', () => {
  it('adds field-wrap with the authored custom properties', async () => {
    const el = await mountStatement(ROWS);
    expect(el.classList.contains('field-wrap')).to.equal(true);
    expect(el.style.getPropertyValue('--field-w')).to.equal('520px');
    expect(el.style.getPropertyValue('--field-h')).to.equal('520px');
    expect(el.style.getPropertyValue('--field-top')).to.equal('-220px');
    expect(el.style.getPropertyValue('--field-left')).to.equal('50%');
  });
});

describe('content', () => {
  it('renders kicker, quote and lede', async () => {
    const el = await mountStatement(ROWS);
    expect(el.querySelector('.kicker').textContent).to.equal('Strategy');
    expect(el.querySelector('blockquote').textContent).to.equal('A bold quote about the future of energy.');
    expect(el.querySelector('.lede').textContent).to.equal('A short lede paragraph.');
  });

  it('unwraps the authored quote <p> instead of nesting it inside blockquote', async () => {
    const el = await mountStatement(ROWS);
    expect(el.querySelector('blockquote p')).to.equal(null);
  });

  it('marks the inner wrap as a reveal target', async () => {
    const el = await mountStatement(ROWS);
    expect(el.querySelector('.statement-inner').classList.contains('reveal')).to.equal(true);
  });
});

describe('actions', () => {
  it('keeps the btn classes already applied by markdown-emphasis decoration', async () => {
    const el = await mountStatement(ROWS);
    const [first, second] = el.querySelectorAll('.statement-cta-row a');
    expect(first.classList.contains('btn-primary')).to.equal(true);
    expect(second.classList.contains('btn-secondary')).to.equal(true);
  });

  it('adds the arrow icon only to the first action', async () => {
    const el = await mountStatement(ROWS);
    const [first, second] = el.querySelectorAll('.statement-cta-row a');
    expect(first.querySelector('svg use').getAttribute('href')).to.contain('/img/icons/arrow-right.svg#icon');
    expect(second.querySelector('svg')).to.equal(null);
  });

  it('works with a single action', async () => {
    const el = await mountStatement(NO_VIDEO_ROWS);
    const links = el.querySelectorAll('.statement-cta-row a');
    expect(links).to.have.lengthOf(1);
    expect(links[0].querySelector('svg')).to.not.equal(null);
  });
});

describe('video teaser', () => {
  it('renders the play icon and caption when authored', async () => {
    const el = await mountStatement(ROWS);
    const video = el.querySelector('.statement-video');
    expect(video).to.not.equal(null);
    expect(video.querySelector('.play-btn svg use').getAttribute('href')).to.contain('/img/icons/play.svg#icon');
    expect(video.querySelector('.cap').textContent).to.contain('A look inside the transition');
  });

  it('is omitted without a caption row', async () => {
    const el = await mountStatement(NO_VIDEO_ROWS);
    expect(el.querySelector('.statement-video')).to.equal(null);
  });
});
