import React, { Component } from 'react';
import { findDOMNode } from 'react-dom'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
	DragSource,
	DropTarget,
	ConnectDropTarget,
	ConnectDragSource,
	DropTargetMonitor,
	DropTargetConnector,
	DragSourceConnector,
	DragSourceMonitor,
} from 'react-dnd';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Close from 'material-ui/svg-icons/navigation/close';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';
import Link from 'material-ui/svg-icons/content/link';
import { grey100, grey800, grey900 } from 'material-ui/styles/colors';
import { updateDocument, closeDocument, moveDocument, openDeleteDialog, DOCUMENT_DELETE, layoutOptions } from './modules/documentGrid';
import TextResource from './TextResource';
import CanvasResource from './CanvasResource';

const DocumentInner = function(props) {
  switch (props.document_kind) {
    case 'text':
      return <TextResource {...props} />;
    case 'canvas':
      return <CanvasResource {...props} />;
    default:
      return <div>Error: no type defined for this resource.</div>;
  }
}

const documentSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index
    };
  }
}

const documentTarget = {
  hover(props, monitor, component) {
    if (!component) {
      return null;
    }

    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    if (dragIndex === hoverIndex) {
      return null;
    }

    props.moveDocument(dragIndex, hoverIndex);
    monitor.getItem().index = hoverIndex;
  }
}

function collectDrag(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}

function collectDrop(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  };
}

class DocumentViewer extends Component {
  constructor(props) {
    super(props);

    this.titleChangeTimeout = null;
    this.titleChangeDelayMs = 800;

    this.elementRef = React.createRef();
  }

  componentDidMount() {
    this.props.connectDragPreview(new Image());
  }

  render() {
    const iconStyle = {
      padding: '0',
      width: '20px',
      height: '20px'
    };
    const buttonStyle = Object.assign({ margin: '2px' }, iconStyle);
    const documentGridEl = document.getElementById('document-grid-inner');
    const numRows = Math.min(this.props.currentLayout.rows, Math.ceil(this.props.openDocuments.length / this.props.currentLayout.cols));
    return (
      <Paper
        style={{
          zIndex: '99',
          opacity: this.props.isDragging ? '0.5' : '1',
          margin: '8px',
          padding: '0',
          backgroundColor: this.props.document_kind === 'canvas' ? grey900 : '#FFF',
          // overflow: 'hidden',
          width: `${documentGridEl.offsetWidth / this.props.currentLayout.cols - 16}px`,
          height: `${((window.innerHeight - 72.0) / numRows) - 16}px`,
          flexGrow: '1',
          flexShrink: '1'
        }}
        zDepth={2}
      >
        {this.props.connectDropTarget(
          <div style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {this.props.connectDragSource(
              <div style={{ width: '100%', flexShrink: '0', cursor: '-webkit-grab' }}>
                <div style={{ display: 'flex', padding: '10px 10px 0 10px', backgroundColor: this.props.document_kind === 'canvas' ? grey800 : grey100, borderRadius: '2px' }}>
                  <IconButton tooltip='Show link inspector' style={buttonStyle} iconStyle={iconStyle} onClick={this.props.linkInspectorAnchorClick}>
                    <Link color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
                  </IconButton>
                  <TextField
                    id={`text-document-title-${this.props.document_id}`}
                    style={{ flexGrow: '1', height: '24px', fontWeight: 'bold', fontSize: '1.2em', margin: '0 0 10px 4px', cursor: 'text' }}
                    inputStyle={{ color: this.props.document_kind === 'canvas' ? '#FFF' : '#000' }}
                    defaultValue={this.props.resourceName}
                    underlineShow={false}
                    onChange={(event, newValue) => {
                      window.clearTimeout(this.titleChangeTimeout);
                      this.titleChangeTimeout = window.setTimeout(() => {
                        this.props.updateDocument(this.props.document_id, {title: newValue}, {refreshLists: true});
                      }, this.titleChangeDelayMs);
                    }}
                    disabled={!this.props.writeEnabled}
                  />
                  {this.props.writeEnabled &&
                    <IconButton
                      tooltip='Delete document'
                      onClick={() => {
                        this.props.openDeleteDialog(
                          'Destroying "' + this.props.resourceName + '"',
                          'Deleting this document will destroy all its associated highlights and links, as well as the content of the document itself.',
                          'Destroy document',
                          { documentId: this.props.document_id },
                          DOCUMENT_DELETE
                        );
                      }}
                      style={buttonStyle}
                      iconStyle={iconStyle}
                    >
                      <DeleteForever color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
                    </IconButton>
                  }
                  <IconButton tooltip='Close document' onClick={() => {this.props.closeDocument(this.props.document_id);}} style={buttonStyle} iconStyle={iconStyle}>
                    <Close color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
                  </IconButton>
                </div>
              </div>
            )}
            <DocumentInner {...this.props} />
          </div>
        )}
      </Paper>
    );
  }
}
DocumentViewer = DragSource(
  'documentViewer',
  documentSource,
  collectDrag
)(DropTarget(
  'documentViewer',
  documentTarget,
  collectDrop
)(DocumentViewer));

const mapStateToProps = state => ({
  openDocuments: state.documentGrid.openDocuments,
  currentLayout: layoutOptions[state.documentGrid.currentLayout]
});

const mapDispatchToProps = dispatch => bindActionCreators({
  updateDocument,
  closeDocument,
  moveDocument,
  openDeleteDialog
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocumentViewer);
