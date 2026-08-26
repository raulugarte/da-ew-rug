import { getSvg } from '../../scripts/utils/svg.js';
import { cellNodes } from '../../scripts/utils/dom.js';

function isViewAllRow(row) {
  return row
    && row.children.length === 1
    && row.querySelector('a')
    && !row.querySelector('h1, h2, h3, h4');
}

function buildItem(row) {
  const [dateCell, headingCell, textCell] = [...row.children];
  const item = document.createElement('div');
  item.className = 'press-list-item';

  if (dateCell) {
    dateCell.className = 'press-list-date';
    item.append(dateCell);
  }

  const body = document.createElement('div');
  if (headingCell) {
    const h4 = document.createElement('h4');
    h4.append(...cellNodes(headingCell));
    body.append(h4);
  }
  if (textCell) body.append(textCell);
  item.append(body);
  return item;
}

export default function init(el) {
  const rows = [...el.children];
  let viewAllLink;
  if (isViewAllRow(rows[rows.length - 1])) {
    viewAllLink = rows.pop().querySelector('a');
  }

  el.textContent = '';
  const list = document.createElement('div');
  list.className = 'press-list-items';
  for (const row of rows) {
    list.append(buildItem(row));
  }
  el.append(list);

  if (viewAllLink) {
    viewAllLink.className = 'text-link press-list-view-all';
    viewAllLink.append(getSvg({ name: 'arrow-right' }));
    el.append(viewAllLink);
  }
}
