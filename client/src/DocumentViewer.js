import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
	DragSource,
	DropTarget
} from 'react-dnd';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Close from 'material-ui/svg-icons/navigation/close';
import Visibility from 'material-ui/svg-icons/action/visibility';
import VisibilityOff from 'material-ui/svg-icons/action/visibility-off';
import Description from 'material-ui/svg-icons/action/description';
import { grey100, grey800, grey900 } from 'material-ui/styles/colors';
import { updateDocument, closeDocument, moveDocumentWindow, layoutOptions } from './modules/documentGrid';
import { toggleHighlights } from './modules/canvasEditor'
import { closeDocumentTargets } from './modules/annotationViewer';
import TextResource from './TextResource';
import CanvasResource from './CanvasResource';
import DocumentStatusBar from './DocumentStatusBar';

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

    props.moveDocumentWindow(dragIndex, hoverIndex);
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

  isEditable = () => {
    const { writeEnabled, lockedByMe } = this.props;
    return ( writeEnabled && lockedByMe );
  }

  onChangeTitle = (event, newValue) => {
    window.clearTimeout(this.titleChangeTimeout);
    this.titleChangeTimeout = window.setTimeout(() => {
      this.props.updateDocument(this.props.document_id, {title: newValue}, {refreshLists: true});
    }, this.titleChangeDelayMs);
  }

  onToggleHighlights() {
    const key = this.getInstanceKey()
    const currentState = this.props.highlightsHidden[key] === true ? true : false
    this.props.toggleHighlights( key, !currentState )
  }

  getInstanceKey() {
    const { document_id, timeOpened } = this.props;
    return `${document_id}-${timeOpened}`;
  }

  onCloseDocument() {
    this.props.closeDocument(this.props.document_id)
    this.props.closeDocumentTargets(this.props.document_id)
  }

  renderTitleBar() {
    const iconStyle = {
      padding: '0',
      width: '20px',
      height: '20px'
    };
    const buttonStyle = Object.assign({ margin: '2px' }, iconStyle);
    const highlightsHidden = this.props.highlightsHidden[this.getInstanceKey()] 

    return (
      this.props.connectDragSource(
        <div style={{ width: '100%', flexShrink: '0', cursor: '-webkit-grab' }}>
          <div style={{ display: 'flex', padding: '10px 10px 0 10px', backgroundColor: this.props.document_kind === 'canvas' ? grey800 : grey100, borderRadius: '2px' }}>
            <IconButton tooltip='Show link inspector' style={buttonStyle} iconStyle={iconStyle} onClick={this.props.linkInspectorAnchorClick}>
              <Description color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
            </IconButton>
            <TextField
              id={`text-document-title-${this.props.document_id}`}
              style={{ flexGrow: '1', height: '24px', fontWeight: 'bold', fontSize: '1.2em', margin: '0 0 10px 4px', cursor: 'text' }}
              autoComplete='off'
              inputStyle={{ color: this.props.document_kind === 'canvas' ? '#FFF' : '#000' }}
              defaultValue={this.props.resourceName}
              underlineShow={false}
              onChange={this.onChangeTitle}
              disabled={!this.isEditable()}
            />
            { this.props.document_kind === 'canvas' && !this.isEditable() &&
              <IconButton tooltip='Toggle highlights' onClick={this.onToggleHighlights.bind(this)} style={buttonStyle} iconStyle={iconStyle}>
                { highlightsHidden ? <VisibilityOff color='#FFF' /> : <Visibility color='#FFF' /> }
              </IconButton>
            }
            <IconButton tooltip='Close document' onClick={this.onCloseDocument.bind(this)} style={buttonStyle} iconStyle={iconStyle}>
              <Close color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
            </IconButton>
          </div>
        </div>
      )
    );
  }

  renderStatusBar() {
    const { document_kind, document_id, locked, lockedByMe, lockedByUserName, resourceName, writeEnabled } = this.props;

    return (
      <DocumentStatusBar 
        document_id={document_id}
        document_kind={document_kind} 
        locked={locked}
        lockedByUserName={lockedByUserName}
        lockedByMe={lockedByMe}
        resourceName={resourceName} 
        writeEnabled={writeEnabled} >
      </DocumentStatusBar>
    );
  }

  render() {
    const { currentLayout, isDragging, document_kind, connectDropTarget, numRows, sidebarWidth } = this.props;
    const documentGridOffsetWidth = window.innerWidth - sidebarWidth - 16;
    const windowHeight = window.innerHeight;
    const width = (documentGridOffsetWidth / currentLayout.cols) - 100
    const rows = currentLayout.rows < numRows ? currentLayout.rows : numRows;
    const height = ((windowHeight - 72.0) / rows) - 16;

    return (
      <Paper
        style={{
          zIndex: '99',
          opacity: isDragging ? '0.5' : '1',
          margin: '8px',
          padding: '0',
          backgroundColor: document_kind === 'canvas' ? grey900 : '#FFF',
          width: `${width}px`,
          height: `${height}px`,
          flexGrow: '1',
          flexShrink: '1'
        }}
        zDepth={2}
      >
        {connectDropTarget(
          <div style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            { this.renderTitleBar() }
            <DocumentInner {...this.props} />
            { this.renderStatusBar() }
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
  currentLayout: layoutOptions[state.documentGrid.currentLayout],
  sidebarWidth:  state.project.sidebarWidth,
  highlightsHidden: state.canvasEditor.highlightsHidden
});

const mapDispatchToProps = dispatch => bindActionCreators({
  updateDocument,
  closeDocument,
  moveDocumentWindow,
  closeDocumentTargets,
  toggleHighlights
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocumentViewer);
