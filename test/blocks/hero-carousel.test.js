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
  kicker = 'Strategy', heading = 'Powering the future', sub = 'A short subtext.', href = '/energy', label = 'Explore renewables', tone = '',
} = {}) {
  return `<div>
    <div><p>${kicker}</p></div>
    <div><p>${heading}</p></div>
    <div><p>${sub}</p></div>
    <div><p><a href="${href}" class="btn btn-primary">${label}</a></p></div>
    <div><p>${tone}</p></div>
  </div>`;
}

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
