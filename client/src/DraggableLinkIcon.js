import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import Link from 'material-ui/svg-icons/content/link';

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
    const linkIconStyle = {
        paddingLeft: 5,
        paddingRight: 10,
        marginBottom: '-5px',
        width: '20px',
        height: '20px'
      };

    return this.props.connectDragSource( 
      <div style={{display:'inline'}}>
        <Link style={linkIconStyle}/> 
      </div>
    );
  }
}

export default DragSource(
  props => props.inContents ? 'contentsSummary' : 'linkableSummary',
  summarySource,
  collect
)(DraggableLinkIcon);

