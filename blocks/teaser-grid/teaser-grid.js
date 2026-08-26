import { getSvg } from '../../scripts/utils/svg.js';
import { cellNodes } from '../../scripts/utils/dom.js';

function parseOptions(cell) {
  const text = cell?.textContent.trim().toLowerCase() ?? '';
  return text.split(',').map((s) => s.trim()).filter(Boolean);
}

function decorateTile(row) {
  const [headingCell, textCell, linkCell, optionsCell] = [...row.children];
  const options = parseOptions(optionsCell);
  optionsCell?.remove();

  const tone = options.find((o) => /^tone-[a-d]$/.test(o)) || 'tone-a';
  const isWide = options.includes('wide');
  const hasVideo = options.includes('video');
  const hasContours = options.includes('contours');

  const originalLink = linkCell?.querySelector('a');
  const href = originalLink?.getAttribute('href') || '#';
  const linkText = originalLink?.textContent.trim();

  const tile = document.createElement('a');
  tile.href = href;
  tile.className = `teaser-grid-tile ${tone}${isWide ? ' wide' : ''}`;

  if (hasContours) {
    const contours = getSvg({ name: 'contours', viewBox: '0 0 400 260', className: 'contours' });
    contours.setAttribute('preserveAspectRatio', 'none');
    tile.append(contours);
  }
  if (hasVideo) {
    const playMini = document.createElement('div');
    playMini.className = 'play-mini';
    playMini.append(getSvg({ name: 'play' }));
    tile.append(playMini);
  }

  const content = document.createElement('div');
  content.className = 'mt-content';

  if (headingCell) {
    const h4 = document.createElement('h4');
    h4.append(...cellNodes(headingCell));
    content.append(h4);
  }
  if (textCell) {
    const p = document.createElement('p');
    p.append(...cellNodes(textCell));
    content.append(p);
  }

  const textLink = document.createElement('span');
  textLink.className = 'text-link on-dark';
  if (linkText) {
    const label = document.createElement('span');
    label.textContent = linkText;
    textLink.append(label);
  }
  textLink.append(getSvg({ name: 'arrow-right' }));
  content.append(textLink);

  tile.append(content);
  row.replaceWith(tile);
}

export default function init(el) {
  const upClass = [...el.classList].find((c) => /^\d+-up$/.test(c));
  const cols = upClass ? upClass.replace('-up', '') : '3';
  el.classList.add(`cols-${cols}`);

  for (const row of [...el.children]) {
    decorateTile(row);
  }
}
