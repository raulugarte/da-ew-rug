import { getSvg } from '../../scripts/utils/svg.js';
import { cellNodes } from '../../scripts/utils/dom.js';

function buildHead(headRow) {
  const head = document.createElement('div');
  head.className = 'block-head reveal';

  const icon = document.createElement('div');
  icon.className = 'spotlight-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.append(getSvg({ name: 'sparkle' }));
  head.append(icon);

  if (!headRow) return head;
  const [kickerCell, headingCell] = [...headRow.children];
  if (kickerCell) {
    const kicker = document.createElement('span');
    kicker.className = 'kicker';
    kicker.append(...cellNodes(kickerCell));
    head.append(kicker);
  }
  if (headingCell) {
    const h2 = document.createElement('h2');
    h2.append(...cellNodes(headingCell));
    head.append(h2);
  }
  return head;
}

function buildItem(row) {
  const [dateCell, headingCell, textCell, linkCell, imageCell] = [...row.children];
  const item = document.createElement('div');
  item.className = 'spotlight-item';

  // An image cell is optional - most items are text-only.
  const picture = imageCell?.querySelector('picture');
  if (picture) {
    const thumb = document.createElement('div');
    thumb.className = 'spotlight-thumb';
    thumb.append(picture);
    item.append(thumb);
  }

  const body = document.createElement('div');
  body.className = 'spotlight-body';

  if (dateCell) {
    dateCell.className = 'spotlight-date';
    body.append(dateCell);
  }
  if (headingCell) {
    const h4 = document.createElement('h4');
    h4.append(...cellNodes(headingCell));
    body.append(h4);
  }
  if (textCell) {
    textCell.className = '';
    body.append(textCell);
  }
  const link = linkCell?.querySelector('a');
  if (link) {
    link.className = 'text-link';
    link.append(getSvg({ name: 'arrow-right' }));
    body.append(link);
  }
  item.append(body);
  return item;
}

export default function init(el) {
  const [headRow, ...itemRows] = [...el.children];

  el.textContent = '';
  el.append(buildHead(headRow));

  const items = itemRows.map(buildItem);

  const carousel = document.createElement('div');
  carousel.className = 'spotlight-carousel reveal';

  const row = document.createElement('div');
  row.className = 'spotlight-row';

  const viewport = document.createElement('div');
  viewport.className = 'spotlight-viewport';
  items.forEach((item, i) => {
    item.classList.add('spotlight-carousel-item');
    if (i === 0) item.classList.add('active');
    viewport.append(item);
  });

  const upBtn = document.createElement('button');
  upBtn.className = 'icon-btn';
  upBtn.setAttribute('aria-label', 'Previous story');
  upBtn.append(getSvg({ name: 'chevron-up' }));

  const downBtn = document.createElement('button');
  downBtn.className = 'icon-btn';
  downBtn.setAttribute('aria-label', 'Next story');
  downBtn.append(getSvg({ name: 'chevron-down' }));

  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'spotlight-dots';
  const dots = items.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = `spotlight-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Story ${i + 1}`);
    dotsWrap.append(dot);
    return dot;
  });

  const controls = document.createElement('div');
  controls.className = 'spotlight-controls';
  controls.append(upBtn, dotsWrap, downBtn);

  row.append(viewport, controls);
  carousel.append(row);
  el.append(carousel);

  let current = 0;
  let timer;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(n) {
    const prevItem = items[current];
    current = (n + items.length) % items.length;
    prevItem.classList.remove('active');
    prevItem.classList.add('leaving');
    dots.forEach((d) => d.classList.remove('active'));
    items[current].classList.add('active');
    dots[current].classList.add('active');
    setTimeout(() => prevItem.classList.remove('leaving'), 520);
  }
  function next() { go(current + 1); }
  function prev() { go(current - 1); }
  function play() { if (!reduceMotion) timer = setInterval(next, 5000); }
  function stop() { clearInterval(timer); }
  function restart() {
    stop();
    play();
  }

  downBtn.addEventListener('click', () => {
    next();
    restart();
  });
  upBtn.addEventListener('click', () => {
    prev();
    restart();
  });
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    go(i);
    restart();
  }));
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', play);

  if (items.length > 1) play();
}
