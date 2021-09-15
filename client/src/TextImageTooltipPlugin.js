import { NodeSelection } from 'prosemirror-state';

class ImageTooltip {
  constructor(view) {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'link-tooltip image-tooltip';

    this.buttons = [];

    this.tooltipImageSmall = document.createElement('span');
    this.tooltipImageSmall.innerText = 'Small';
    this.buttons.push(this.tooltipImageSmall);
    this.tooltipImageMedium = document.createElement('span');
    this.tooltipImageMedium.innerText= 'Medium';
    this.buttons.push(this.tooltipImageMedium);
    this.tooltipImageLarge = document.createElement('span');
    this.tooltipImageLarge.innerText = 'Large';
    this.buttons.push(this.tooltipImageLarge);
    this.tooltipImageOrig = document.createElement('span');
    this.tooltipImageOrig.innerText = 'Original';
    this.buttons.push(this.tooltipImageOrig);

    this.buttons.forEach((button, index) => {
      let tooltipDiv = document.createElement('div');
      tooltipDiv.className = index === 3 ? '' : 'image-tooltip-div';
      button.onclick = () => console.log(button.innerText);
      tooltipDiv.appendChild(button);
      this.tooltip.appendChild(tooltipDiv);
    })
    
    view.dom.parentNode.appendChild(this.tooltip);

    this.update(view, null);
  }

  handleClick({ node, from, view, width }) {
    let transaction = view.state.tr.setNodeMarkup(
      from, null, {src: node.attrs.src, width: width} 
    );
    const resolvedPos = transaction.doc.resolve(from);
    const nodeSelection = new NodeSelection(resolvedPos);
    transaction = transaction.setSelection(nodeSelection);
    view.dispatch(transaction);
    view.focus();
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

    let { empty } = state.selection;
    // Don't display if there's a non-empty selection, or no cursor
    if (empty) {
      this.tooltip.style.display = 'none';
      return;
    }
    this.tooltip.style.display = '';
    let { from, to } = state.selection;
    // Check that we've selected an image
    let imageSelected = false;
    let nodeSelection = null;
    state.doc.nodesBetween(from, to, (node) => {
      if (node.type.name === 'image') {
        imageSelected = true;
        nodeSelection = NodeSelection.create(state.doc, from);
      }
    });
    // Otherwise don't display
    if (!imageSelected) {
      this.tooltip.style.display = 'none';
      return;
    }
    // Viewport coordinates
    let start = view.coordsAtPos(from);
    let end = view.coordsAtPos(to)
      
    // Parent bounding box
    let box = this.tooltip.offsetParent.getBoundingClientRect();
    const scrollTop = this.tooltip.offsetParent.scrollTop;
    let origTooltipLeft = Math.max((start.left + end.left) / 2, start.left + 3) - box.left;
    this.tooltip.style.left = `${origTooltipLeft}px`;
    let tooltipBottom = box.bottom - start.top - 42 - scrollTop;
    this.tooltip.style.bottom = `${tooltipBottom}px`;

    let tooltipRect = this.tooltip.getBoundingClientRect();

    // Handle horizontal overflow
    if (tooltipRect.left < box.left) {
      let newTooltipLeft = (box.left + box.right) / 2 - box.left;
      this.tooltip.style.left = `${newTooltipLeft}px`;
    }
    if (tooltipRect.right > box.right) {
      const overflow = tooltipRect.right - box.right;
      this.tooltip.style.left = `${origTooltipLeft - overflow - 20}px`;
    }
    
    // Handle vertical overflow
    if (tooltipRect.top < box.top) {
      const diff = box.top - tooltipRect.top;
      this.tooltip.style.bottom = `${tooltipBottom - diff - 10}px`;
    }
    const node = nodeSelection !== null ? nodeSelection.node : null;
    this.tooltipImageSmall.onclick = () => this.handleClick({ node, from, view, width: '240px' });
    this.tooltipImageMedium.onclick = () => this.handleClick({ node, from, view, width: '500px' });
    this.tooltipImageLarge.onclick = () => this.handleClick({ node, from, view, width: '1024px' });
    this.tooltipImageOrig.onclick = () => this.handleClick({ node, from, view, width: 'unset' });
  }

  destroy() {
    this.tooltip.remove();
  }
}

export default ImageTooltip;
