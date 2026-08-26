import { getSvg } from '../../scripts/utils/svg.js';
import { cellNodes } from '../../scripts/utils/dom.js';

function buildTile(row) {
  const [headingCell, textCell, linkCell] = [...row.children];
  row.className = 'question-item';
  row.textContent = '';

  const icon = getSvg({ name: 'chat', className: 'question-icon' });
  row.append(icon);

  if (headingCell) {
    const h4 = document.createElement('h4');
    h4.append(...cellNodes(headingCell));
    row.append(h4);
  }
  if (textCell) row.append(textCell);

  const link = linkCell?.querySelector('a');
  if (link) {
    link.className = 'text-link';
    link.append(getSvg({ name: 'arrow-right' }));
    row.append(link);
  }
}

export default function init(el) {
  for (const row of [...el.children]) {
    buildTile(row);
  }
}
