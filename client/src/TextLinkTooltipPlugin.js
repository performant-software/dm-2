class LinkTooltip {
  constructor(view) {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'link-tooltip';
    view.dom.parentNode.appendChild(this.tooltip);

    this.update(view, null);
  }

  update(view, lastState) {
    let state = view.state;
    // Don't do anything if the document/selection didn't change
    if (
      lastState &&
      lastState.doc.eq(state.doc) &&
      lastState.selection.eq(state.selection)
    ) {
      return;
    }

    let { empty, $cursor } = state.selection;
    // Don't display if there's a non-empty selection, or no cursor
    if (!$cursor || !empty) {
      this.tooltip.style.display = 'none';
      return;
    }
    this.tooltip.style.display = '';
    let { from, to } = state.selection;
    let href = '';
    // Check that we're inside a link
    let insideLink = false;
    state.doc.nodesBetween(from, to, (node) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'link') {
          insideLink = true;
          // Grab link from mark attrs
          href = mark.attrs.href;
        }
      })
    });
    // Otherwise don't display
    if (!insideLink) {
      this.tooltip.style.display = 'none';
      return;
    }
    // Viewport coordinates
    let start = view.coordsAtPos(from),
      end = view.coordsAtPos(to);
      
    // Parent bounding box
    let box = this.tooltip.offsetParent.getBoundingClientRect();
    const scrollTop = this.tooltip.offsetParent.scrollTop;
    const origTooltipLeft = start.left - box.left;
    this.tooltip.style.left = `${origTooltipLeft}px`;
    let tooltipBottom = box.bottom - start.top - scrollTop;
    this.tooltip.style.bottom = `${tooltipBottom}px`;
    let text = href;
    if (text.length > 30) {
      text = `${text.substring(0, 27)}...`;
    }

    this.tooltip.innerHTML = `<a href="${href}" target="_blank">${text}</a>`;

    let tooltipRect = this.tooltip.getBoundingClientRect();

    // Handle horizontal overflow
    if (tooltipRect.left < box.left) {
      const overflow = box.left - tooltipRect.left;
      this.tooltip.style.left = `${origTooltipLeft + overflow + 5}px`;
    }
    if (tooltipRect.right > box.right) {
      const overflow = tooltipRect.right - box.right;
      this.tooltip.style.left = `${origTooltipLeft - overflow - 20}px`;

    }
  }

  destroy() {
    this.tooltip.remove();
  }
}

export default LinkTooltip;
