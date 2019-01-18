import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import Link from 'material-ui/svg-icons/content/link';
import { IconButton } from 'material-ui';

const summarySource = {
  beginDrag(props) {
    const { id, highlight_id, document_id, parent_id, parent_type, descendant_folder_ids } = props.item;

    return {
      id,
      linkable_id: highlight_id || document_id,
      linkable_type: highlight_id ? 'Highlight' : 'Document',
      isFolder: props.isFolder,
      descendant_folder_ids: props.isFolder ? descendant_folder_ids : null,
      existingParentId: parent_id,
      existingParentType: parent_type
    };
  }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}

class DraggableLinkIcon extends Component { 
  render() {
    return this.props.connectDragSource( 
      <span >
        <IconButton
          tooltipPosition="top-left"
          tooltip={<span>Drag this icon to link to another highlight or document.</span>}
        >
          <Link/> 
        </IconButton>
      </span>
    );
  }
}

export default DragSource(
  props => props.inContents ? 'contentsSummary' : 'linkableSummary',
  summarySource,
  collect
)(DraggableLinkIcon);

