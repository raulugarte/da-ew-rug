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
const HEAD_ROWS = `<div><div><p>Strategy</p></div></div>
<div><div><p>A bold quote about the future of energy.</p></div></div>
<div><div><p>A short lede paragraph.</p></div></div>
<div><div><p><a href="/energy" class="btn btn-primary">Explore renewables</a> <a href="/film" class="btn btn-secondary">Watch the film</a></p></div></div>`;

// Caption, image and video are each authored as their own row - like every
// other field in this block - not as cells sharing one row (matching real
// content: see test1.html). image/video mimic the pipeline's
// pre-decoration (decoratePictures / the youtube auto-block both run
// before a div block's init - see AGENTS.md's load pipeline) rather than
// raw authored markup.
function mediaRows({ caption = '', image = '', video = '' } = {}) {
  return [caption && `<div><div><p>${caption}</p></div></div>`,
    image && `<div><div>${image}</div></div>`,
    video && `<div><div>${video}</div></div>`]
    .filter(Boolean).join('\n');
}

const PICTURE_HTML = '<picture><source srcset="/media_1.jpg?width=2000" media="(min-width: 600px)">'
  + '<img src="/media_1.jpg?width=750" alt="A wind farm at sea" loading="lazy"></picture>';

const VIDEO_EMBED_HTML = '<div class="video" data-src="https://www.youtube-nocookie.com/embed/abc123"></div>';

const ROWS = `${HEAD_ROWS}\n${mediaRows({ caption: '02:14 · A look inside the transition' })}`;

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

  it('renders an authored image as the poster behind the play icon', async () => {
    const el = await mountStatement(`${HEAD_ROWS}\n${mediaRows({ image: PICTURE_HTML })}`);
    const video = el.querySelector('.statement-video');
    const image = video.querySelector('.statement-video-image');
    expect(image.querySelector('img').getAttribute('alt')).to.equal('A wind farm at sea');
    expect(video.querySelector('.play-btn')).to.not.equal(null);
  });

  it('renders an image authored below the caption in its own row', async () => {
    // Matches how an author actually adds it: a new row, not a second cell
    // in the caption's row (see test1.html).
    const el = await mountStatement(`${HEAD_ROWS}\n${mediaRows({
      caption: '02:14 · Inside the transition', image: PICTURE_HTML,
    })}`);
    const video = el.querySelector('.statement-video');
    expect(video.querySelector('.statement-video-image img')).to.not.equal(null);
    expect(video.querySelector('.cap').textContent).to.equal('02:14 · Inside the transition');
  });

  it('replaces the play icon with a real embedded video when one is authored', async () => {
    const el = await mountStatement(`${HEAD_ROWS}\n${mediaRows({ video: VIDEO_EMBED_HTML })}`);
    const video = el.querySelector('.statement-video');
    expect(video.querySelector('.video')).to.not.equal(null);
    expect(video.querySelector('.play-btn')).to.equal(null);
  });

  it('keeps the caption alongside a real embedded video', async () => {
    const el = await mountStatement(`${HEAD_ROWS}\n${mediaRows({
      caption: 'Inside the transition', video: VIDEO_EMBED_HTML,
    })}`);
    const video = el.querySelector('.statement-video');
    expect(video.querySelector('.video')).to.not.equal(null);
    expect(video.querySelector('.cap').textContent).to.equal('Inside the transition');
  });

  it('renders without a caption when only an image or video is authored', async () => {
    const el = await mountStatement(`${HEAD_ROWS}\n${mediaRows({ image: PICTURE_HTML })}`);
    expect(el.querySelector('.statement-video')).to.not.equal(null);
    expect(el.querySelector('.cap')).to.equal(null);
  });
});
