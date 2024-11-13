import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import CreateNewFolder from 'material-ui/svg-icons/file/create-new-folder';
import FlatButton from 'material-ui/FlatButton';

class AddFolderButton extends Component {
  componentDidMount() {
    // use a static image for add folder drag preview
    const { connectDragPreview } = this.props;
    let dragIcon = new Image();
    dragIcon.src = '/dragging-add-folder.png';
    connectDragPreview(dragIcon);
  }

  render() {
    return this.props.connectDragSource(
      <div>
        <FlatButton
          className="add-button"
          label="New Folder"
          icon={<CreateNewFolder />}
          onClick={this.props.onClick}
        />
      </div>
    );
  }
}

function collectDrag(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}

export default DragSource(
  'newFolder',
  { beginDrag: (_props) => ({}) },
  collectDrag
)(AddFolderButton);
