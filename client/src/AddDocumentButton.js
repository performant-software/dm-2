import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import FlatButton from 'material-ui/FlatButton';

class AddDocumentButton extends Component {
  componentDidMount() {
    // use a static image for drag preview
    const { addType, connectDragPreview } = this.props;
    let dragIcon = new Image();
    if (addType === 'text') {
      dragIcon.src = '/dragging-add-doc.png';
    } else {
      dragIcon.src = '/dragging-add-img.png';
    }
    connectDragPreview(dragIcon);
  }

  render() {
    if (this.props.addType === "batch") {
      // image batch should not be draggable, as it already has a folder
      // selector in its modal
      return (
        <div>
          <FlatButton
            label={this.props.label}
            className="add-button"
            icon={this.props.icon}
            onClick={this.props.onClick}
          />
        </div>
      );
    }
    // connect all others to drag and drop
    return this.props.connectDragSource(
      <div>
        <FlatButton
          label={this.props.label}
          className="add-button"
          icon={this.props.icon}
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
  'newDocument',
  { beginDrag: (props) => ({ addType: props.addType }) },
  collectDrag
)(AddDocumentButton);
