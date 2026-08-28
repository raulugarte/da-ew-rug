import { getSvg } from '../../scripts/utils/svg.js';
import { cellNodes } from '../../scripts/utils/dom.js';

function buildVideo(captionText, picture, videoEmbed) {
  const video = document.createElement('div');
  video.className = 'statement-video';

  // A real video (already auto-blocked from an authored link, e.g. YouTube -
  // see AGENTS.md) takes over the panel entirely; the poster image and play
  // icon only stand in for it when no video was authored.
  if (videoEmbed) {
    video.append(videoEmbed);
  } else {
    if (picture) {
      const bg = document.createElement('div');
      bg.className = 'statement-video-image';
      bg.append(picture);
      video.append(bg);
    }
    const playBtn = document.createElement('div');
    playBtn.className = 'play-btn';
    playBtn.setAttribute('aria-hidden', 'true');
    playBtn.append(getSvg({ name: 'play' }));
    video.append(playBtn);
  }

  if (captionText) {
    const cap = document.createElement('span');
    cap.className = 'cap';
    cap.textContent = captionText;
    video.append(cap);
  }

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

  const [captionCell, imageCell, videoCell] = videoRow ? [...videoRow.children] : [];
  const captionText = captionCell?.textContent.trim();
  const picture = imageCell?.querySelector('picture');
  const videoEmbed = videoCell?.querySelector('.video');
  if (captionText || picture || videoEmbed) {
    inner.append(buildVideo(captionText, picture, videoEmbed));
  }

  el.append(inner);
}
