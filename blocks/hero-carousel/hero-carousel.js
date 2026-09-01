import { getSvg } from '../../scripts/utils/svg.js';
import { cellNodes } from '../../scripts/utils/dom.js';
import { moveInstrumentation } from '../../scripts/utils/ue.js';

const TONES = {
  deep: 'linear-gradient(135deg, var(--color-brand-dark-deep), var(--color-brand-dark) 65%)',
  forest: 'linear-gradient(135deg, var(--color-brand-deep), #0f2b26 70%)',
  charcoal: 'linear-gradient(135deg, #2a3b36, var(--color-ink) 70%)',
  teal: 'linear-gradient(135deg, #0f3d3e, var(--color-brand-dark) 70%)',
  night: 'linear-gradient(135deg, var(--color-brand-dark-deep), #06110f 70%)',
};
const TONE_ORDER = Object.keys(TONES);

const FIELD_PRESETS = [
  [{ w: 560, h: 560, top: -160, right: -140, tone: 'green' }, { w: 420, h: 420, bottom: -200, right: 220, tone: 'soft' }],
  [{ w: 520, h: 520, top: -200, left: -120, tone: 'soft' }, { w: 400, h: 400, bottom: -220, left: 280, tone: 'green' }],
  [{ w: 500, h: 500, top: -180, right: -100, tone: 'green' }],
  [{ w: 460, h: 460, bottom: -180, right: -100, tone: 'soft' }, { w: 380, h: 380, top: -160, left: 260, tone: 'green' }],
  [{ w: 540, h: 540, top: -200, left: -160, tone: 'green' }],
];

function buildFields(preset) {
  return preset.map((f) => {
    const div = document.createElement('div');
    div.className = `field ${f.tone === 'soft' ? 'f-soft' : 'f-green'}`;
    div.style.width = `${f.w}px`;
    div.style.height = `${f.h}px`;
    if (f.top !== undefined) div.style.top = `${f.top}px`;
    if (f.left !== undefined) div.style.left = `${f.left}px`;
    if (f.right !== undefined) div.style.right = `${f.right}px`;
    if (f.bottom !== undefined) div.style.bottom = `${f.bottom}px`;
    return div;
  });
}

function buildSlide(row, index) {
  const [kickerCell, headingCell, subCell, ctaCell, toneCell, imageCell] = [...row.children];
  const authoredTone = toneCell?.textContent.trim().toLowerCase();
  const fallbackTone = TONE_ORDER[index % TONE_ORDER.length];
  const tone = TONE_ORDER.includes(authoredTone) ? authoredTone : fallbackTone;

  const slide = document.createElement('div');
  slide.className = `hero-carousel-slide${index === 0 ? ' active' : ''}`;
  slide.dataset.index = String(index);
  // The row becomes the slide element itself - carry over whatever UE
  // instrumentation it carried so the slide stays selectable/movable/
  // deletable in the Universal Editor (see scripts/utils/ue.js).
  moveInstrumentation(row, slide);
  slide.setAttribute('data-aue-label', 'Slide');
  // The tone gradient still applies underneath an authored image - visible
  // instantly while the image loads, and as the sole background when no
  // image is authored (the original, still-supported behavior).
  slide.style.background = TONES[tone];

  // An image cell is optional - most slides are gradient-only. Tone has no
  // dedicated DOM element (it only ever drives slide.style.background), so
  // it's edited through the properties panel rather than in-context.
  const picture = imageCell?.querySelector('picture');
  if (picture) {
    moveInstrumentation(imageCell, picture);
    picture.setAttribute('data-aue-label', 'Image');
    const image = document.createElement('div');
    image.className = 'hero-carousel-image';
    image.append(picture);
    slide.append(image);
  }

  slide.append(...buildFields(FIELD_PRESETS[index % FIELD_PRESETS.length]));

  const contentWrap = document.createElement('div');
  contentWrap.className = 'wrap hero-carousel-content';

  if (kickerCell) {
    const kicker = document.createElement('span');
    kicker.className = 'kicker on-dark';
    kicker.append(...cellNodes(kickerCell));
    moveInstrumentation(kickerCell, kicker);
    kicker.setAttribute('data-aue-label', 'Kicker');
    contentWrap.append(kicker);
  }
  if (headingCell) {
    const h1 = document.createElement('h1');
    h1.className = 'hero-carousel-heading';
    h1.append(...cellNodes(headingCell));
    moveInstrumentation(headingCell, h1);
    h1.setAttribute('data-aue-label', 'Heading');
    contentWrap.append(h1);
  }
  if (subCell) {
    subCell.className = 'hero-carousel-sub';
    subCell.setAttribute('data-aue-label', 'Subtext');
    contentWrap.append(subCell);
  }

  // The CTA's btn/btn-primary/etc. class already comes from decorateLink's
  // markdown-emphasis handling (see AGENTS.md) - this only adds the arrow.
  const cta = ctaCell?.querySelector('a');
  if (cta) {
    moveInstrumentation(ctaCell, cta);
    cta.setAttribute('data-aue-label', 'CTA');
    cta.append(getSvg({ name: 'arrow-right' }));
    contentWrap.append(cta);
  }

  slide.append(contentWrap);
  return slide;
}

export default function init(el) {
  // el itself is never replaced, so any data-aue-resource/-filter/-model
  // Universal Editor already put on it survives untouched - this only
  // makes its container role explicit for the in-context UI.
  el.setAttribute('data-aue-type', 'container');
  el.setAttribute('data-aue-label', 'Hero Carousel');

  const rows = [...el.children];
  const slides = rows.map((row, i) => buildSlide(row, i));

  el.textContent = '';
  const slidesWrap = document.createElement('div');
  slidesWrap.className = 'hero-carousel-slides';
  slidesWrap.append(...slides);
  el.append(slidesWrap);

  const prevBtn = document.createElement('button');
  prevBtn.className = 'hero-carousel-arrow left';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.append(getSvg({ name: 'chevron-left' }));

  const nextBtn = document.createElement('button');
  nextBtn.className = 'hero-carousel-arrow right';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.append(getSvg({ name: 'chevron-right' }));

  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'hero-carousel-dots';
  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = `hero-carousel-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dotsWrap.append(dot);
    return dot;
  });

  el.append(prevBtn, nextBtn, dotsWrap);

  let current = 0;
  let timer;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(n) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }
  function next() { go(current + 1); }
  function prev() { go(current - 1); }
  function play() { if (!reduceMotion) timer = setInterval(next, 6500); }
  function stop() { clearInterval(timer); }
  function restart() {
    stop();
    play();
  }

  nextBtn.addEventListener('click', () => {
    next();
    restart();
  });
  prevBtn.addEventListener('click', () => {
    prev();
    restart();
  });
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    go(i);
    restart();
  }));
  el.addEventListener('mouseenter', stop);
  el.addEventListener('mouseleave', play);

  if (slides.length > 1) play();
}
