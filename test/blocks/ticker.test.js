import { expect } from '@esm-bundle/chai';

const mountedBlocks = [];

function mountBlock(html) {
  const el = document.createElement('div');
  el.className = 'ticker';
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

function row(label, value) {
  return `<div><div><p>${label}</p></div><div><p>${value}</p></div></div>`;
}

const DE_ROWS = row('Symbol', 'RWE.DE')
  + row('Kurs', '€ 34.12')
  + row('Veränderung', '+1.4%')
  + row('52-Wochen-Range', '€ 28.40 – € 38.90')
  + row('Marktkapitalisierung', '€ 24.5B')
  + row('Sparkline', '42,38,44,30,34,20,26,14,18,8,12');

const EN_ROWS = row('Symbol', 'RWE.DE')
  + row('Price', '€ 34.12')
  + row('Change', '+1.4%')
  + row('Range', '€ 28.40 – € 38.90')
  + row('Market Cap', '€ 24.5B');

async function mountTicker(html) {
  const el = mountBlock(html);
  const { default: init } = await import('../../blocks/ticker/ticker.js');
  init(el);
  return el;
}

describe('German labels', () => {
  it('renders symbol, price, change, range and market cap', async () => {
    const el = await mountTicker(DE_ROWS);
    expect(el.querySelector('.kicker').textContent).to.equal('RWE.DE');
    expect(el.querySelector('.ticker-price').textContent).to.equal('€ 34.12');
    expect(el.querySelector('.ticker-delta').textContent).to.equal('+1.4%');
    const [range, cap] = el.querySelectorAll('.ticker-foot span');
    expect(range.textContent).to.equal('€ 28.40 – € 38.90');
    expect(cap.textContent).to.equal('€ 24.5B');
  });
});

describe('English label aliases', () => {
  it('reads Price/Change/Range/Market Cap the same way', async () => {
    const el = await mountTicker(EN_ROWS);
    expect(el.querySelector('.ticker-price').textContent).to.equal('€ 34.12');
    expect(el.querySelector('.ticker-delta').textContent).to.equal('+1.4%');
    const [range, cap] = el.querySelectorAll('.ticker-foot span');
    expect(range.textContent).to.equal('€ 28.40 – € 38.90');
    expect(cap.textContent).to.equal('€ 24.5B');
  });
});

describe('live indicator', () => {
  it('renders a live label', async () => {
    const el = await mountTicker(DE_ROWS);
    expect(el.querySelector('.ticker-live').textContent).to.contain('Live');
  });
});

describe('sparkline', () => {
  it('builds a polyline with one point per value', async () => {
    const el = await mountTicker(DE_ROWS);
    const svg = el.querySelector('.ticker-sparkline');
    expect(svg).to.not.equal(null);
    const points = svg.querySelector('polyline').getAttribute('points').trim().split(' ');
    expect(points).to.have.lengthOf(11);
  });

  it('is omitted without a sparkline row', async () => {
    const el = await mountTicker(EN_ROWS);
    expect(el.querySelector('.ticker-sparkline')).to.equal(null);
  });

  it('is omitted with fewer than two numeric points', async () => {
    const el = await mountTicker(DE_ROWS.replace('42,38,44,30,34,20,26,14,18,8,12', '42'));
    expect(el.querySelector('.ticker-sparkline')).to.equal(null);
  });
});

describe('safety', () => {
  it('treats an authored value that looks like markup as plain text', async () => {
    // Entities decode to literal angle brackets in the authored text node -
    // this must render as that literal string, not be parsed as an element.
    const el = await mountTicker(row('Symbol', '&lt;b&gt;RWE.DE&lt;/b&gt;') + row('Kurs', '€ 34.12'));
    const kicker = el.querySelector('.kicker');
    expect(kicker.querySelector('b')).to.equal(null);
    expect(kicker.textContent).to.equal('<b>RWE.DE</b>');
  });
});
