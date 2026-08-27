/**
 * Converts a CSS color value to RGB values
 * @param {string} color - CSS color value (hex, rgb, rgba, hsl, hsla, or named color)
 * @returns {Object|null} Object with r, g, b values (0-255) or null if invalid
 */
function parseColor(section) {
  if (!section) return null;

  const computedBg = getComputedStyle(section).backgroundColor;
  const rgbMatch = computedBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) return null;
  return {
    r: parseInt(rgbMatch[1], 10),
    g: parseInt(rgbMatch[2], 10),
    b: parseInt(rgbMatch[3], 10),
  };
}

function getRelativeLuminance({ r, g, b }) {
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : ((rsRGB + 0.055) / 1.055) ** 2.4;
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : ((gsRGB + 0.055) / 1.055) ** 2.4;
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : ((bsRGB + 0.055) / 1.055) ** 2.4;

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Determines if a CSS color value is light or dark
 * @param {string} color - CSS color value
 * @param {number} threshold - Luminance threshold (default: 0.5)
 * @returns {boolean} true if light, false if dark, null if invalid color
 */
export function getColorScheme(section) {
  const rgb = parseColor(section);
  if (!rgb) return null;

  return getRelativeLuminance(rgb) > 0.5 ? 'light-scheme' : 'dark-scheme';
}

export function setColorScheme(section) {
  const scheme = getColorScheme(section);
  if (!scheme) return;
  section.querySelectorAll(':scope > *').forEach((el) => {
    // Reset any pre-made color schemes
    el.classList.remove('light-scheme', 'dark-scheme');
    el.classList.add(scheme);
  });
}

async function handleBackground(background, section) {
  delete section.dataset.background;

  // Images
  const isMedia = background.startsWith('http');
  if (isMedia) {
    const mediaUrl = new URL(background, window.location.href);
    // No MP4 support
    if (mediaUrl.pathname.endsWith('.mp4')) return;
    const { createPicture } = await import('../../scripts/utils/picture.js');
    const pic = createPicture({ src: mediaUrl.href });
    section.classList.add('has-background');
    pic.classList.add('section-background');
    section.prepend(pic);
    return;
  }

  // Color
  section.style.backgroundColor = background.startsWith('color-token')
    ? `var(${background.replace('color-token', '--color')})`
    : background;

  setColorScheme(section);
}

async function handleLayout(text, section, type) {
  delete section.dataset[type];

  if (text === '0') return;
  if (type === 'grid') section.classList.add('grid');
  section.classList.add(`${type}-${text}`);
}

// Corner presets for the .field-wrap decoration (see styles.css). Authors
// pick a placement keyword instead of raw offsets: "Field: bottom-left, soft".
const FIELD_PLACEMENTS = {
  'top-right': { top: '-160px', right: '-140px' },
  'top-left': { top: '-160px', left: '-140px' },
  'bottom-right': { bottom: '-160px', right: '-140px' },
  'bottom-left': { bottom: '-160px', left: '-140px' },
  center: { top: '-220px', left: '50%' },
};

function handleField(text, section) {
  delete section.dataset.field;

  const [placementRaw, toneRaw] = text.split(',').map((s) => s.trim().toLowerCase());
  const offsets = FIELD_PLACEMENTS[placementRaw] ?? FIELD_PLACEMENTS['top-right'];

  section.classList.add('field-wrap');
  if (toneRaw === 'soft') section.classList.add('tone-soft');
  for (const [prop, value] of Object.entries(offsets)) {
    section.style.setProperty(`--field-${prop}`, value);
  }
}

function handleId(text, section) {
  delete section.dataset.id;
  section.id = text;
}

// Turns a plain default-content run (kicker text, a heading, an optional
// trailing lede paragraph) into the same .block-head structure blocks like
// spotlight/pill-nav build for themselves - "Head: kicker-lede".
function handleHead(text, section) {
  delete section.dataset.head;
  if (text !== 'kicker-lede') return;

  const content = section.querySelector(':scope > .default-content');
  if (!content) return;
  const children = [...content.children];
  const [first] = children;

  if (first?.tagName === 'P') {
    const kicker = document.createElement('span');
    kicker.className = 'kicker';
    kicker.append(...first.childNodes);
    first.replaceWith(kicker);
  }

  // The lede is the paragraph right after the heading, not necessarily the
  // last child - a section can have further paragraphs after it (e.g. a
  // pull-quote) that should stay plain.
  const heading = children.find((el) => /^H[1-6]$/.test(el.tagName));
  const lede = heading?.nextElementSibling;
  if (lede?.tagName === 'P') {
    lede.classList.add('lede');
  }

  const head = document.createElement('div');
  head.className = 'block-head reveal';
  head.append(...content.childNodes);
  content.append(head);
}

export default async function init(section) {
  const {
    grid,
    gap,
    spacing,
    container,
    layout,
    background,
    field,
    id,
    head,
  } = section.dataset;
  if (grid) handleLayout(grid, section, 'grid');
  if (gap) handleLayout(gap, section, 'gap');
  if (spacing) handleLayout(spacing, section, 'spacing');
  if (container) handleLayout(container, section, 'container');
  if (background) await handleBackground(background, section);
  if (layout) handleLayout(layout, section, 'layout');
  if (field) handleField(field, section);
  if (id) handleId(id, section);
  if (head) handleHead(head, section);
}
