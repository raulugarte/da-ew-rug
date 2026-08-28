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

// Caption, image and video each get their own row - like every other field
// in this block - rather than sharing one row as separate cells, so any
// combination (or none) can be authored in whatever order.
function classifyMediaRow(row) {
  const cell = row.firstElementChild;
  if (!cell) return null;
  const picture = cell.querySelector('picture');
  if (picture) return { picture };
  const videoEmbed = cell.querySelector('.video');
  if (videoEmbed) return { videoEmbed };
  const text = cell.textContent.trim();
  return text ? { text } : null;
}

export default function init(el) {
  const [kickerRow, quoteRow, ledeRow, actionsRow, ...mediaRows] = [...el.children];

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

  let captionText;
  let picture;
  let videoEmbed;
  mediaRows.forEach((row) => {
    const classified = classifyMediaRow(row);
    if (!classified) return;
    if (classified.picture) picture = classified.picture;
    else if (classified.videoEmbed) videoEmbed = classified.videoEmbed;
    else captionText = classified.text;
  });
  if (captionText || picture || videoEmbed) {
    inner.append(buildVideo(captionText, picture, videoEmbed));
  }

  el.append(inner);
}
