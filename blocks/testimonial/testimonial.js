/**
 * Testimonial Block
 *
 * Structure in the DA document:
 *   .testimonial
 *     row 1 (header):  col1 = section title, col2 = subtitle
 *     row 2…N (cards): col1 = quote text, col2 = name, col3 = role/title
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  /* ── header row ── */
  const header = rows.shift();
  const cols = [...header.children];
  const title = cols[0]?.textContent.trim();
  const subtitle = cols[1]?.textContent.trim();

  const headerEl = document.createElement('div');
  headerEl.classList.add('testimonial-header');
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title;
    headerEl.append(h2);
  }
  if (subtitle) {
    const p = document.createElement('p');
    p.textContent = subtitle;
    headerEl.append(p);
  }

  /* ── testimonial cards ── */
  const grid = document.createElement('div');
  grid.classList.add('testimonial-grid');

  rows.forEach((row) => {
    const card = document.createElement('div');
    card.classList.add('testimonial-card');

    const cardCols = [...row.children];
    const quote = cardCols[0]?.textContent.trim();
    const name = cardCols[1]?.textContent.trim();
    const role = cardCols[2]?.textContent.trim();

    if (quote) {
      const blockquote = document.createElement('blockquote');
      blockquote.textContent = quote;
      card.append(blockquote);
    }

    const meta = document.createElement('div');
    meta.classList.add('testimonial-meta');

    if (name) {
      const nameEl = document.createElement('p');
      nameEl.classList.add('testimonial-name');
      nameEl.textContent = name;
      meta.append(nameEl);
    }
    if (role) {
      const roleEl = document.createElement('p');
      roleEl.classList.add('testimonial-role');
      roleEl.textContent = role;
      meta.append(roleEl);
    }

    card.append(meta);
    grid.append(card);
  });

  /* ── replace block content ── */
  block.textContent = '';
  block.append(headerEl, grid);
}
