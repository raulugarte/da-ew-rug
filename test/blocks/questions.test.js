import { expect } from '@esm-bundle/chai';

const mountedBlocks = [];

function mountBlock(html) {
  const el = document.createElement('div');
  el.className = 'questions';
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

function tileRow({
  heading = 'How do I apply?', text = 'Find out how our hiring process works.', href = '/careers/apply', label = 'Learn more',
} = {}) {
  return `<div>
    <div><p>${heading}</p></div>
    <div><p>${text}</p></div>
    <div><p><a href="${href}">${label}</a></p></div>
  </div>`;
}

async function mountQuestions(html) {
  const el = mountBlock(html);
  const { default: init } = await import('../../blocks/questions/questions.js');
  init(el);
  return el;
}

describe('a tile', () => {
  it('renders the chat icon, heading, text and link', async () => {
    const el = await mountQuestions(tileRow());
    const tile = el.querySelector('.question-item');
    expect(tile.querySelector('svg.question-icon use')).to.not.equal(null);
    expect(tile.querySelector('h4').textContent).to.equal('How do I apply?');
    expect(tile.querySelector('p').textContent).to.equal('Find out how our hiring process works.');
    const link = tile.querySelector('.text-link');
    expect(link.getAttribute('href')).to.equal('/careers/apply');
  });

  it('uses the chat sprite icon', async () => {
    const el = await mountQuestions(tileRow());
    const use = el.querySelector('.question-item svg use');
    expect(use.getAttribute('href')).to.contain('/img/icons/chat.svg#icon');
  });

  it('adds the arrow icon to the link', async () => {
    const el = await mountQuestions(tileRow());
    const link = el.querySelector('.text-link');
    const uses = link.querySelectorAll('svg use');
    const hrefs = [...uses].map((use) => use.getAttribute('href'));
    expect(hrefs.some((href) => href.includes('/img/icons/arrow-right.svg#icon'))).to.equal(true);
  });

  it('unwraps the authored heading <p> instead of nesting it inside h4', async () => {
    const el = await mountQuestions(tileRow());
    expect(el.querySelector('h4 p')).to.equal(null);
  });
});

describe('multiple tiles', () => {
  it('decorates each row independently', async () => {
    const el = await mountQuestions(tileRow() + tileRow({ heading: 'Second question' }));
    const tiles = el.querySelectorAll('.question-item');
    expect(tiles).to.have.lengthOf(2);
    expect(tiles[1].querySelector('h4').textContent).to.equal('Second question');
  });
});
