import { expect } from '@esm-bundle/chai';

const mountedBlocks = [];

function mountBlock(html) {
  const el = document.createElement('div');
  el.className = 'hero-carousel';
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

function slideRow({
  kicker = 'Strategy', heading = 'Powering the future', sub = 'A short subtext.', href = '/energy', label = 'Explore renewables', tone = '', image = '',
} = {}) {
  return `<div>
    <div><p>${kicker}</p></div>
    <div><p>${heading}</p></div>
    <div><p>${sub}</p></div>
    <div><p><a href="${href}" class="btn btn-primary">${label}</a></p></div>
    <div><p>${tone}</p></div>
    <div>${image}</div>
  </div>`;
}

const PICTURE_HTML = '<picture><source srcset="/media_1.jpg?width=2000" media="(min-width: 600px)">'
  + '<img src="/media_1.jpg?width=750" alt="Wind turbines at dusk" loading="lazy"></picture>';

async function mountHeroCarousel(html) {
  const el = mountBlock(html);
  const { default: init } = await import('../../blocks/hero-carousel/hero-carousel.js');
  init(el);
  return el;
}

describe('slide structure', () => {
  it('builds one slide per row, first one active', async () => {
    const el = await mountHeroCarousel(slideRow() + slideRow({ heading: 'Second slide' }));
    const slides = el.querySelectorAll('.hero-carousel-slide');
    expect(slides).to.have.lengthOf(2);
    expect(slides[0].classList.contains('active')).to.equal(true);
    expect(slides[1].classList.contains('active')).to.equal(false);
  });

  it('unwraps the authored heading <p> instead of nesting it inside h1', async () => {
    const el = await mountHeroCarousel(slideRow());
    const h1 = el.querySelector('.hero-carousel-heading');
    expect(h1.querySelector('p')).to.equal(null);
    expect(h1.textContent).to.equal('Powering the future');
  });

  it('keeps the CTA classes already applied by markdown-emphasis decoration', async () => {
    const el = await mountHeroCarousel(slideRow());
    const cta = el.querySelector('.hero-carousel-content a');
    expect(cta.classList.contains('btn')).to.equal(true);
    expect(cta.classList.contains('btn-primary')).to.equal(true);
    expect(cta.textContent.trim()).to.equal('Explore renewables');
  });

  it('adds the arrow icon to the CTA', async () => {
    const el = await mountHeroCarousel(slideRow());
    const use = el.querySelector('.hero-carousel-content a svg use');
    expect(use.getAttribute('href')).to.contain('/img/icons/arrow-right.svg#icon');
  });

  it('respects an authored tone', async () => {
    const el = await mountHeroCarousel(slideRow({ tone: 'forest' }));
    const slide = el.querySelector('.hero-carousel-slide');
    expect(slide.style.background).to.contain('var(--color-brand-deep)');
  });

  it('falls back to rotating the default tones when none is authored', async () => {
    const el = await mountHeroCarousel(slideRow() + slideRow({ heading: 'Second' }));
    const [first, second] = el.querySelectorAll('.hero-carousel-slide');
    expect(first.style.background).to.not.equal(second.style.background);
  });

  it('renders an authored image as the slide background', async () => {
    const el = await mountHeroCarousel(slideRow({ image: PICTURE_HTML }));
    const image = el.querySelector('.hero-carousel-image');
    expect(image).to.not.equal(null);
    expect(image.querySelector('picture')).to.not.equal(null);
    expect(image.querySelector('img').getAttribute('alt')).to.equal('Wind turbines at dusk');
  });

  it('keeps the tone gradient as the background even with an image authored', async () => {
    // Visible immediately while the image loads, and lets the slide look
    // right even if the image fails to load.
    const el = await mountHeroCarousel(slideRow({ tone: 'forest', image: PICTURE_HTML }));
    const slide = el.querySelector('.hero-carousel-slide');
    expect(slide.style.background).to.contain('var(--color-brand-deep)');
  });

  it('does not add a .hero-carousel-image without an authored picture', async () => {
    const el = await mountHeroCarousel(slideRow());
    expect(el.querySelector('.hero-carousel-image')).to.equal(null);
  });
});

describe('arrows and dots', () => {
  it('wires prev/next arrows with their icons', async () => {
    const el = await mountHeroCarousel(slideRow() + slideRow({ heading: 'Second' }));
    const left = el.querySelector('.hero-carousel-arrow.left svg use');
    const right = el.querySelector('.hero-carousel-arrow.right svg use');
    expect(left.getAttribute('href')).to.contain('/img/icons/chevron-left.svg#icon');
    expect(right.getAttribute('href')).to.contain('/img/icons/chevron-right.svg#icon');
  });

  it('creates one dot per slide, first active', async () => {
    const el = await mountHeroCarousel(slideRow() + slideRow({ heading: 'Second' }) + slideRow({ heading: 'Third' }));
    const dots = el.querySelectorAll('.hero-carousel-dot');
    expect(dots).to.have.lengthOf(3);
    expect(dots[0].classList.contains('active')).to.equal(true);
  });

  it('advances to the next slide on next-arrow click', async () => {
    const el = await mountHeroCarousel(slideRow() + slideRow({ heading: 'Second' }));
    const [slideA, slideB] = el.querySelectorAll('.hero-carousel-slide');
    el.querySelector('.hero-carousel-arrow.right').click();
    expect(slideA.classList.contains('active')).to.equal(false);
    expect(slideB.classList.contains('active')).to.equal(true);
  });

  it('wraps to the last slide on prev-arrow click from the first', async () => {
    const el = await mountHeroCarousel(slideRow() + slideRow({ heading: 'Second' }));
    const [slideA, slideB] = el.querySelectorAll('.hero-carousel-slide');
    el.querySelector('.hero-carousel-arrow.left').click();
    expect(slideA.classList.contains('active')).to.equal(false);
    expect(slideB.classList.contains('active')).to.equal(true);
  });

  it('jumps to the clicked dot', async () => {
    const el = await mountHeroCarousel(slideRow() + slideRow({ heading: 'Second' }) + slideRow({ heading: 'Third' }));
    const dots = el.querySelectorAll('.hero-carousel-dot');
    const slides = el.querySelectorAll('.hero-carousel-slide');
    dots[2].click();
    expect(slides[2].classList.contains('active')).to.equal(true);
    expect(dots[2].classList.contains('active')).to.equal(true);
  });
});

describe('autoplay', () => {
  it('does not start an interval with only one slide', async () => {
    const original = window.setInterval;
    let called = false;
    window.setInterval = (...args) => {
      called = true;
      return original(...args);
    };
    try {
      await mountHeroCarousel(slideRow());
    } finally {
      window.setInterval = original;
    }
    expect(called).to.equal(false);
  });

  it('stops on mouseenter and resumes on mouseleave', async () => {
    const original = window.clearInterval;
    let clearCalls = 0;
    window.clearInterval = (...args) => {
      clearCalls += 1;
      return original(...args);
    };
    try {
      const el = await mountHeroCarousel(slideRow() + slideRow({ heading: 'Second' }));
      el.dispatchEvent(new MouseEvent('mouseenter'));
      expect(clearCalls).to.be.greaterThan(0);
      el.dispatchEvent(new MouseEvent('mouseleave'));
    } finally {
      window.clearInterval = original;
    }
  });
});

describe('Universal Editor instrumentation', () => {
  // Universal Editor pre-instruments authored rows/cells with data-aue-*
  // attributes before init() runs (see scripts/utils/ue.js) - these tests
  // set them manually to stand in for that pre-instrumentation.
  it('marks the block itself as a container', async () => {
    const el = await mountHeroCarousel(slideRow());
    expect(el.getAttribute('data-aue-type')).to.equal('container');
    expect(el.getAttribute('data-aue-label')).to.equal('Hero Carousel');
  });

  it("moves the row's instrumentation onto the resulting slide, not left behind on the row", async () => {
    const el = mountBlock(slideRow());
    const row = el.firstElementChild;
    row.setAttribute('data-aue-resource', 'urn:aemconnection:/content/test/hero-carousel/item_1');
    row.setAttribute('data-aue-model', 'hero-carousel-slide');
    const { default: init } = await import('../../blocks/hero-carousel/hero-carousel.js');
    init(el);

    const slide = el.querySelector('.hero-carousel-slide');
    expect(slide.getAttribute('data-aue-resource')).to.equal('urn:aemconnection:/content/test/hero-carousel/item_1');
    expect(slide.getAttribute('data-aue-model')).to.equal('hero-carousel-slide');
    expect(slide.getAttribute('data-aue-label')).to.equal('Slide');
    expect(row.getAttribute('data-aue-resource')).to.equal(null);
  });

  it('moves each field cell\'s instrumentation onto its rebuilt element', async () => {
    const el = mountBlock(slideRow({ image: PICTURE_HTML }));
    const [kickerCell, headingCell, , ctaCell, , imageCell] = [...el.firstElementChild.children];
    kickerCell.setAttribute('data-aue-prop', 'kicker');
    headingCell.setAttribute('data-aue-prop', 'heading');
    ctaCell.setAttribute('data-aue-prop', 'cta');
    imageCell.setAttribute('data-aue-prop', 'image');

    const { default: init } = await import('../../blocks/hero-carousel/hero-carousel.js');
    init(el);

    expect(el.querySelector('.kicker').getAttribute('data-aue-prop')).to.equal('kicker');
    expect(el.querySelector('.hero-carousel-heading').getAttribute('data-aue-prop')).to.equal('heading');
    expect(el.querySelector('.hero-carousel-content a').getAttribute('data-aue-prop')).to.equal('cta');
    expect(el.querySelector('.hero-carousel-image picture').getAttribute('data-aue-prop')).to.equal('image');
  });

  it('keeps instrumentation on the reused subtext cell without moving anything', async () => {
    const el = await mountHeroCarousel(slideRow());
    expect(el.querySelector('.hero-carousel-sub').getAttribute('data-aue-label')).to.equal('Subtext');
  });
});
