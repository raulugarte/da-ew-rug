// Universal Editor pre-instruments authored rows/cells with data-aue-*
// attributes before a block's init() runs. A block that discards or
// replaces those elements while restructuring its DOM must carry the
// attributes over to whatever survives, or in-context editing breaks for
// that piece of content. See https://www.aem.live/developer/universal-editor-blocks.
export function moveInstrumentation(from, to) {
  if (!from || !to) return;
  [...from.attributes]
    .filter(({ nodeName }) => nodeName.startsWith('data-aue-') || nodeName.startsWith('data-richtext-'))
    .forEach(({ nodeName, nodeValue }) => {
      to.setAttribute(nodeName, nodeValue);
      from.removeAttribute(nodeName);
    });
}
