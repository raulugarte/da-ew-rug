import { expect } from '@esm-bundle/chai';

const mountedBlocks = [];

function mountBlock(html) {
  const el = document.createElement('div');
  el.className = 'press-list';
  el.innerHTML = html;
  document.body.append(el);
  mountedBlocks.push(el);
  return el;
}

afterEach(() => {
  for (const el of mountedBlocks.splice(0)) {
    el.remove();
  }
});

function itemRow({
  date = 'Mar 2026', heading = 'RWE reports Q1 results', text = 'A short summary.',
} = {}) {
  return `<div>
    <div><p>${date}</p></div>
    <div><p>${heading}</p></div>
    <div><p>${text}</p></div>
  </div>`;
}

const VIEW_ALL_ROW = '<div><div><p><a href="/press">All press releases</a></p></div></div>';

async function mountPressList(html) {
  const el = mountBlock(html);
  const { default: init } = await import('../../blocks/press-list/press-list.js');
  init(el);
  return el;
}

describe('items', () => {
  it('renders date, heading and text for each row', async () => {
    const el = await mountPressList(itemRow());
    const item = el.querySelector('.press-list-item');
    expect(item.querySelector('.press-list-date').textContent).to.equal('Mar 2026');
    expect(item.querySelector('h4').textContent).to.equal('RWE reports Q1 results');
    expect(item.querySelector('h4 + div p').textContent).to.equal('A short summary.');
  });

  it('unwraps the authored heading <p> instead of nesting it inside h4', async () => {
    const el = await mountPressList(itemRow());
    expect(el.querySelector('h4 p')).to.equal(null);
  });

  it('renders one item per row, in order', async () => {
    const el = await mountPressList(itemRow() + itemRow({ heading: 'Second story' }));
    const items = el.querySelectorAll('.press-list-item');
    expect(items).to.have.lengthOf(2);
    expect(items[1].querySelector('h4').textContent).to.equal('Second story');
  });
});

describe('view-all link', () => {
  it('is detected from a trailing single-link-only row and moved after the list', async () => {
    const el = await mountPressList(itemRow() + VIEW_ALL_ROW);
    expect(el.querySelectorAll('.press-list-item')).to.have.lengthOf(1);
    const link = el.querySelector(':scope > a.press-list-view-all');
    expect(link).to.not.equal(null);
    expect(link.getAttribute('href')).to.equal('/press');
    expect(link.classList.contains('text-link')).to.equal(true);
  });

  it('adds the arrow icon to the view-all link', async () => {
    const el = await mountPressList(itemRow() + VIEW_ALL_ROW);
    const use = el.querySelector('a.press-list-view-all svg use');
    expect(use.getAttribute('href')).to.contain('/img/icons/arrow-right.svg#icon');
  });

  it('is not created when the last row is a regular item', async () => {
    const el = await mountPressList(itemRow() + itemRow({ heading: 'Second story' }));
    expect(el.querySelector('a.press-list-view-all')).to.equal(null);
    expect(el.querySelectorAll('.press-list-item')).to.have.lengthOf(2);
  });

  it('is not mistaken for a single-cell row that also carries a heading', async () => {
    const headingWithLinkRow = '<div><div><h4>Not a view-all row</h4><p><a href="/x">Link</a></p></div></div>';
    const el = await mountPressList(itemRow() + headingWithLinkRow);
    expect(el.querySelector('a.press-list-view-all')).to.equal(null);
  });
});
