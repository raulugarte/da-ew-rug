import { getSvg } from '../../scripts/utils/svg.js';

const KNOWN_ICONS = ['linkedin', 'facebook', 'mail', 'instagram', 'youtube'];

function iconNameFor(label) {
  const key = label.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (key === 'x' || key.includes('twitter')) return 'x';
  return KNOWN_ICONS.find((name) => key.includes(name)) ?? 'globe';
}

function buildShareRow(shareRow) {
  const [labelCell, linksCell] = [...shareRow.children];
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = labelCell?.textContent.trim() ?? '';

  const icons = document.createElement('div');
  icons.className = 'icons';
  for (const a of linksCell?.querySelectorAll('a') ?? []) {
    const text = a.textContent.trim();
    a.className = 'icon-btn';
    a.setAttribute('aria-label', text);
    a.textContent = '';
    a.append(getSvg({ name: iconNameFor(text) }));
    icons.append(a);
  }
  return [label, icons];
}

export default function init(el) {
  const [shareRow, elsewhereRow] = [...el.children];

  el.textContent = '';
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  if (shareRow) wrap.append(...buildShareRow(shareRow));

  if (elsewhereRow) {
    const [labelCell, linkCell] = [...elsewhereRow.children];
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = labelCell?.textContent.trim() ?? '';
    wrap.append(label);

    // The link keeps whatever btn/btn-secondary/etc. class markdown-emphasis
    // decoration already gave it (see AGENTS.md); .social-band overrides its
    // color to fit the dark band regardless of the variant chosen.
    const link = linkCell?.querySelector('a');
    if (link) wrap.append(link);
  }

  el.append(wrap);
}
