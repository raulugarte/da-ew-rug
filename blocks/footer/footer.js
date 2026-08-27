import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const FOOTER_PATH = '/fragments/nav/footer';

/**
 * Authored as 4 sections in this order: brand+blurb, link columns (a
 * "columns" block), legal links, copyright - see
 * _handoff/content/footer.md. Grouped into the mockup's own two rows
 * (.footer-top, .footer-legal) so each gets its own flex/grid context
 * instead of all 4 sections competing for space in one row.
 * @param {Element} fragment the loaded footer fragment (a.k.a. .footer-content)
 */
export function decorateFooterContent(fragment) {
  const [brand, links, legal, copyright] = fragment.querySelectorAll(':scope > .section');
  brand?.classList.add('section-brand');
  links?.classList.add('section-links');
  legal?.classList.add('section-legal');
  copyright?.classList.add('section-copyright');

  const top = document.createElement('div');
  top.className = 'footer-top';
  if (brand) top.append(brand);
  if (links) top.append(links);

  const legalRow = document.createElement('div');
  legalRow.className = 'footer-legal';
  if (copyright) legalRow.append(copyright);
  if (legal) legalRow.append(legal);

  fragment.textContent = '';
  fragment.append(top, legalRow);
}

/**
 * loads and decorates the footer
 * @param {Element} el The footer element
 */
export default async function init(el) {
  const { locale } = getConfig();
  const footerMeta = getMetadata('footer');
  const path = footerMeta || FOOTER_PATH;
  try {
    const fragment = await loadFragment(`${locale.prefix}${path}`);
    fragment.classList.add('footer-content');
    decorateFooterContent(fragment);
    el.append(fragment);
  } catch (e) {
    throw Error(e);
  }
}
