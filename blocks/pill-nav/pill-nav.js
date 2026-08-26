import { cellNodes } from '../../scripts/utils/dom.js';

function buildHead(headRow) {
  const head = document.createElement('div');
  head.className = 'block-head reveal';
  if (!headRow) return head;

  const [kickerCell, headingCell] = [...headRow.children];
  if (kickerCell) {
    kickerCell.className = 'kicker';
    head.append(kickerCell);
  }
  if (headingCell) {
    const h2 = document.createElement('h2');
    h2.append(...cellNodes(headingCell));
    head.append(h2);
  }
  return head;
}

export default function init(el) {
  const [headRow, pillsRow] = [...el.children];

  el.textContent = '';
  el.append(buildHead(headRow));

  const pillsCell = pillsRow?.firstElementChild;
  if (pillsCell) {
    const row = document.createElement('div');
    row.className = 'pill-nav-row reveal';
    for (const a of pillsCell.querySelectorAll('a')) {
      a.className = 'pill-nav-pill';
      row.append(a);
    }
    el.append(row);
  }
}
