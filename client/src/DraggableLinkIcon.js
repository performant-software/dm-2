import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import Link from 'material-ui/svg-icons/content/link';
import { IconButton } from 'material-ui';

const summarySource = {
  beginDrag(props) {
    const {
      id, highlight_id, document_id, parent_id, parent_type, descendant_folder_ids,
    } = props.item;

    return {
      id,
      linkable_id: highlight_id || document_id,
      linkable_type: highlight_id ? 'Highlight' : 'Document',
      isFolder: props.isFolder,
      descendant_folder_ids: props.isFolder ? descendant_folder_ids : null,
      existingParentId: parent_id,
      existingParentType: parent_type,
    };
  },
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
  };
}

class DraggableLinkIcon extends Component {
  componentDidMount() {
    // use a static image for dragg preview
    const { connectDragPreview } = this.props;
    const linkDragIcon = new Image();
    linkDragIcon.src = '/dragging-link.png';
    connectDragPreview(linkDragIcon);
  }

  render() {
    return this.props.connectDragSource(
      <div style={{ marginTop: 12, marginRight: 15 }}>
        <Link />
      </div>,
    );
  }

  oldrender() {
    return this.props.connectDragSource(
      <div>
        <IconButton
          tooltipPosition="top-left"
          tooltip={<span>Drag this icon to make a link.</span>}
        >
          <Link />
        </IconButton>
      </div>,
    );
  }
}

export default DragSource(
  (props) => (props.inContents ? 'contentsSummary' : 'linkableSummary'),
  summarySource,
  collect,
)(DraggableLinkIcon);
