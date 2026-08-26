import { expect } from '@esm-bundle/chai';

const mountedBlocks = [];

function mountBlock(html) {
  const el = document.createElement('div');
  el.className = 'pill-nav';
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

const ROWS = `<div>
  <div><p>Information for</p></div>
  <div><p>Choose your audience</p></div>
</div>
<div>
  <div><p><a href="/investors">Investors</a> <a href="/media">Media</a> <a href="/careers">Careers</a></p></div>
</div>`;

const NO_PILLS_ROWS = `<div>
  <div><p>Information for</p></div>
  <div><p>Choose your audience</p></div>
</div>`;

async function mountPillNav(html) {
  const el = mountBlock(html);
  const { default: init } = await import('../../blocks/pill-nav/pill-nav.js');
  init(el);
  return el;
}

describe('head', () => {
  it('renders kicker and heading', async () => {
    const el = await mountPillNav(ROWS);
    expect(el.querySelector('.kicker').textContent).to.equal('Information for');
    expect(el.querySelector('h2').textContent).to.equal('Choose your audience');
  });

  it('unwraps the authored heading <p> instead of nesting it inside h2', async () => {
    const el = await mountPillNav(ROWS);
    expect(el.querySelector('h2 p')).to.equal(null);
  });

  it('marks the head as a reveal target', async () => {
    const el = await mountPillNav(ROWS);
    expect(el.querySelector('.block-head').classList.contains('reveal')).to.equal(true);
  });
});

describe('pills', () => {
  it('turns every link in the pills cell into a pill', async () => {
    const el = await mountPillNav(ROWS);
    const pills = el.querySelectorAll('.pill-nav-pill');
    expect(pills).to.have.lengthOf(3);
    expect([...pills].map((a) => a.textContent)).to.deep.equal(['Investors', 'Media', 'Careers']);
    expect(pills[0].getAttribute('href')).to.equal('/investors');
  });

  it('marks the pill row as a reveal target', async () => {
    const el = await mountPillNav(ROWS);
    expect(el.querySelector('.pill-nav-row').classList.contains('reveal')).to.equal(true);
  });

  it('does not add a pill row without a pills row authored', async () => {
    const el = await mountPillNav(NO_PILLS_ROWS);
    expect(el.querySelector('.pill-nav-row')).to.equal(null);
  });
});
