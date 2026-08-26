const SVG_NS = 'http://www.w3.org/2000/svg';

function parseSparklinePoints(text) {
  return text.split(',').map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
}

function buildSparkline(points) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 300;
  const h = 60;
  const step = w / (points.length - 1);
  const coords = points
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ');

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'ticker-sparkline');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const polyline = document.createElementNS(SVG_NS, 'polyline');
  polyline.setAttribute('points', coords);
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', 'currentColor');
  polyline.setAttribute('stroke-width', '2');
  svg.append(polyline);
  return svg;
}

function readData(el) {
  const data = {};
  for (const row of el.children) {
    const [labelCell, valueCell] = [...row.children];
    const key = labelCell?.textContent.trim().toLowerCase();
    if (key) data[key] = valueCell?.textContent.trim() ?? '';
  }
  return data;
}

function pick(data, ...keys) {
  return keys.map((key) => data[key]).find(Boolean) ?? '';
}

function buildSpan(className, text) {
  const span = document.createElement('span');
  if (className) span.className = className;
  span.textContent = text;
  return span;
}

// Symbol/price/change/range/cap/sparkline are authored placeholders, not
// live data. In production these should come from a client-side market
// data fetch, not authoring - see HANDOFF.md.
export default function init(el) {
  const data = readData(el);

  const symbol = pick(data, 'symbol');
  const price = pick(data, 'kurs', 'price');
  const delta = pick(data, 'veränderung', 'change');
  const range = pick(data, '52-wochen-range', 'range');
  const cap = pick(data, 'marktkapitalisierung', 'market cap');
  const points = parseSparklinePoints(pick(data, 'sparkline'));

  el.textContent = '';

  const head = document.createElement('div');
  head.className = 'ticker-head';
  head.append(buildSpan('kicker on-dark', symbol), buildSpan('ticker-live', 'Live · delayed 15 min'));
  el.append(head);

  const priceRow = document.createElement('div');
  priceRow.className = 'ticker-price-row';
  priceRow.append(buildSpan('ticker-price', price), buildSpan('ticker-delta', delta));
  el.append(priceRow);

  const sparkline = buildSparkline(points);
  if (sparkline) el.append(sparkline);

  const foot = document.createElement('div');
  foot.className = 'ticker-foot';
  foot.append(buildSpan('', range), buildSpan('', cap));
  el.append(foot);
}
