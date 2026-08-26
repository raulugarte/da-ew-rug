import { expect } from '@esm-bundle/chai';
import reveal from '../../scripts/utils/reveal.js';

const mounted = [];

afterEach(() => {
  for (const el of mounted.splice(0)) {
    el.remove();
  }
});

function mount(className) {
  const el = document.createElement('div');
  el.className = className;
  el.style.cssText = 'width: 10px; height: 10px;';
  document.body.append(el);
  mounted.push(el);
  return el;
}

async function waitFor(predicate, timeout = 2000) {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => { requestAnimationFrame(resolve); });
  }
  throw new Error('condition not met in time');
}

describe('reveal', () => {
  it('adds .in to a .reveal element once it intersects the viewport', async () => {
    const el = mount('reveal');
    reveal();
    await waitFor(() => el.classList.contains('in'));
    expect(el.classList.contains('in')).to.equal(true);
  });

  it('leaves non-reveal elements untouched', async () => {
    const el = mount('not-reveal');
    reveal();
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    expect(el.classList.contains('in')).to.equal(false);
  });
});
