import { expect } from '@esm-bundle/chai';

const mountedBlocks = [];

function mountBlock(html) {
  const el = document.createElement('div');
  el.className = 'spotlight';
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

const HEAD_ROW = `<div>
  <div><p>What we're working through</p></div>
  <div><p>Ongoing initiatives</p></div>
</div>`;

function itemRow({
  date = 'Mar 2026', heading = 'Grid modernisation', text = 'A short update.', href = '/updates/grid', image = '',
} = {}) {
  return `<div>
    <div><p>${date}</p></div>
    <div><p>${heading}</p></div>
    <div><p>${text}</p></div>
    <div><p><a href="${href}">Read more</a></p></div>
    <div>${image}</div>
  </div>`;
}

const PICTURE_HTML = '<picture><source srcset="/media_1.jpg?width=2000" media="(min-width: 600px)">'
  + '<img src="/media_1.jpg?width=750" alt="Grid substation" loading="lazy"></picture>';

async function mountSpotlight(html) {
  const el = mountBlock(html);
  const { default: init } = await import('../../blocks/spotlight/spotlight.js');
  init(el);
  return el;
}

describe('head', () => {
  it('renders the icon, kicker and heading', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow());
    const head = el.querySelector('.block-head');
    expect(head.querySelector('.spotlight-icon svg use').getAttribute('href')).to.contain('/img/icons/sparkle.svg#icon');
    expect(head.querySelector('.kicker').textContent).to.equal("What we're working through");
    expect(head.querySelector('h2').textContent).to.equal('Ongoing initiatives');
  });

  it('marks the head and carousel as reveal targets', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow());
    expect(el.querySelector('.block-head').classList.contains('reveal')).to.equal(true);
    expect(el.querySelector('.spotlight-carousel').classList.contains('reveal')).to.equal(true);
  });
});

describe('items', () => {
  it('renders date, heading, text and a link with the arrow icon', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow());
    const item = el.querySelector('.spotlight-item');
    expect(item.querySelector('.spotlight-date').textContent).to.equal('Mar 2026');
    expect(item.querySelector('h4').textContent).to.equal('Grid modernisation');
    expect(item.querySelector('h4 + div p').textContent).to.equal('A short update.');
    const link = item.querySelector('.text-link');
    expect(link.getAttribute('href')).to.equal('/updates/grid');
    expect(link.querySelector('svg use').getAttribute('href')).to.contain('/img/icons/arrow-right.svg#icon');
  });

  it('unwraps the authored heading <p> instead of nesting it inside h4', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow());
    const h4 = el.querySelector('.spotlight-item h4');
    expect(h4.querySelector('p')).to.equal(null);
  });

  it('marks only the first item active in the viewport', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow() + itemRow({ heading: 'Second' }));
    const items = el.querySelectorAll('.spotlight-carousel-item');
    expect(items).to.have.lengthOf(2);
    expect(items[0].classList.contains('active')).to.equal(true);
    expect(items[1].classList.contains('active')).to.equal(false);
  });

  it('renders an authored image as a thumbnail', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow({ image: PICTURE_HTML }));
    const thumb = el.querySelector('.spotlight-thumb');
    expect(thumb).to.not.equal(null);
    expect(thumb.querySelector('img').getAttribute('alt')).to.equal('Grid substation');
  });

  it('does not add a .spotlight-thumb without an authored picture', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow());
    expect(el.querySelector('.spotlight-thumb')).to.equal(null);
  });
});

describe('controls', () => {
  it('wires up/down buttons with their icons and one dot per item', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow() + itemRow({ heading: 'Second' }));
    expect(el.querySelector('.spotlight-controls .icon-btn:first-child svg use').getAttribute('href')).to.contain('/img/icons/chevron-up.svg#icon');
    expect(el.querySelector('.spotlight-controls .icon-btn:last-child svg use').getAttribute('href')).to.contain('/img/icons/chevron-down.svg#icon');
    expect(el.querySelectorAll('.spotlight-dot')).to.have.lengthOf(2);
  });

  it('advances to the next item on down-click and marks it leaving, then clears leaving', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow() + itemRow({ heading: 'Second' }));
    const [itemA, itemB] = el.querySelectorAll('.spotlight-carousel-item');
    el.querySelector('.spotlight-controls .icon-btn:last-child').click();
    expect(itemA.classList.contains('leaving')).to.equal(true);
    expect(itemB.classList.contains('active')).to.equal(true);
    await new Promise((resolve) => { setTimeout(resolve, 600); });
    expect(itemA.classList.contains('leaving')).to.equal(false);
  });

  it('goes to the previous item on up-click, wrapping from the first', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow() + itemRow({ heading: 'Second' }));
    const [, itemB] = el.querySelectorAll('.spotlight-carousel-item');
    el.querySelector('.spotlight-controls .icon-btn:first-child').click();
    expect(itemB.classList.contains('active')).to.equal(true);
  });

  it('jumps to the clicked dot', async () => {
    const el = await mountSpotlight(HEAD_ROW + itemRow() + itemRow({ heading: 'Second' }) + itemRow({ heading: 'Third' }));
    const dots = el.querySelectorAll('.spotlight-dot');
    const items = el.querySelectorAll('.spotlight-carousel-item');
    dots[2].click();
    expect(items[2].classList.contains('active')).to.equal(true);
  });
});

describe('autoplay', () => {
  it('does not start an interval with only one item', async () => {
    const original = window.setInterval;
    let called = false;
    window.setInterval = (...args) => {
      called = true;
      return original(...args);
    };
    try {
      await mountSpotlight(HEAD_ROW + itemRow());
    } finally {
      window.setInterval = original;
    }
    expect(called).to.equal(false);
  });
});
