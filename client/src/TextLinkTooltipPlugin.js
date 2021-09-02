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
      
    // Tooltip bounding box
    let box = this.tooltip.offsetParent.getBoundingClientRect();
    const scrollTop = this.tooltip.offsetParent.scrollTop;
    // Find a center-ish x position from the selection endpoints (when
    // crossing lines, end may be more to the left)
    let left = Math.max((start.left + end.left) / 2, start.left + 3);
    this.tooltip.style.left = left - box.left + 'px';
    this.tooltip.style.bottom = box.bottom - start.top - scrollTop + 'px';
    // TODO: Handle links at top of viewport
    this.tooltip.innerHTML = `<a href="${href}" target="_blank">${href}</a>`;
  }

  destroy() {
    this.tooltip.remove();
  }
}

export default LinkTooltip;
