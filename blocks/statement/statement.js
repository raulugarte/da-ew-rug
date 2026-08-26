import { getSvg } from '../../scripts/utils/svg.js';
import { cellNodes } from '../../scripts/utils/dom.js';

function buildVideo(captionText) {
  const video = document.createElement('div');
  video.className = 'statement-video';

  const playBtn = document.createElement('div');
  playBtn.className = 'play-btn';
  playBtn.setAttribute('aria-hidden', 'true');
  playBtn.append(getSvg({ name: 'play' }));

  const cap = document.createElement('span');
  cap.className = 'cap';
  cap.textContent = captionText;

  video.append(playBtn, cap);
  return video;
}

export default function init(el) {
  const [kickerRow, quoteRow, ledeRow, actionsRow, videoRow] = [...el.children];

  el.textContent = '';
  el.classList.add('field-wrap');
  el.style.setProperty('--field-w', '520px');
  el.style.setProperty('--field-h', '520px');
  el.style.setProperty('--field-top', '-220px');
  el.style.setProperty('--field-left', '50%');

  const inner = document.createElement('div');
  inner.className = 'wrap statement-inner reveal';

  const kickerCell = kickerRow?.firstElementChild;
  if (kickerCell) {
    kickerCell.className = 'kicker';
    inner.append(kickerCell);
  }

  const quoteCell = quoteRow?.firstElementChild;
  if (quoteCell) {
    const bq = document.createElement('blockquote');
    bq.append(...cellNodes(quoteCell));
    inner.append(bq);
  }

  const ledeCell = ledeRow?.firstElementChild;
  if (ledeCell) {
    ledeCell.className = 'lede';
    inner.append(ledeCell);
  }

  // Links keep whatever btn/btn-primary/btn-secondary/etc. class the
  // markdown-emphasis decoration already gave them (see AGENTS.md) - this
  // only lays them out and adds the arrow to the first (primary) action.
  const actionsCell = actionsRow?.firstElementChild;
  if (actionsCell) {
    const ctaRow = document.createElement('div');
    ctaRow.className = 'statement-cta-row';
    [...actionsCell.querySelectorAll('a')].forEach((a, i) => {
      if (i === 0) a.append(getSvg({ name: 'arrow-right' }));
      ctaRow.append(a);
    });
    inner.append(ctaRow);
  }

  const captionText = videoRow?.textContent.trim();
  if (captionText) inner.append(buildVideo(captionText));

  el.append(inner);
}
