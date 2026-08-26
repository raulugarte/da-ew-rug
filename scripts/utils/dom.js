// A cell authored as plain text arrives wrapped in a <p> (standard EDS table
// conversion) - unwrap it so its nodes can be moved into a new element (e.g.
// a heading) without nesting a <p> inside it.
export function cellNodes(cell) {
  const p = cell?.querySelector(':scope > p');
  return p ? p.childNodes : (cell?.childNodes ?? []);
}
