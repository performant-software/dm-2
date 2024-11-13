import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
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
import { grey100, grey200, grey300, grey800, grey900, white } from 'material-ui/styles/colors';
import { updateDocument, closeDocument, moveDocumentWindow, layoutOptions } from './modules/documentGrid';
import { toggleCanvasHighlights } from './modules/canvasEditor';
import { toggleTextHighlights } from './modules/textEditor';
import { closeDocumentTargets } from './modules/annotationViewer';
import TextResource from './TextResource';
import CanvasResource from './CanvasResource';
import DocumentStatusBar from './DocumentStatusBar';
import { Popover, RaisedButton } from 'material-ui';
import { BoxArrowUp, Check2 } from 'react-bootstrap-icons';

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

    this.state = {
      resourceName: this.props.resourceName,
      lastSaved: '',
      doneSaving: true,
      cornerIconTooltipOpen: false,
      cornerIconTooltipAnchor: null,
      sharePanelOpen: false,
      sharePanelAnchor: null,
      documentURL: '',
      hasCopiedURL: false,
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.resourceName !== prevProps.resourceName) {
      this.setState({
        resourceName: this.props.resourceName,
      });
    }
  }

  async componentDidMount() {
    this.props.connectDragPreview(new Image());
    await this.getDocumentURL(this.props.document_id.toString());
  }

  isEditable = () => {
    const { writeEnabled, lockedByMe } = this.props;
    return ( writeEnabled && lockedByMe );
  }

  setLastSaved(lastSaved) {
    this.setState({ lastSaved });
  }

  onChangeTitle = (event, newValue) => {
    this.setSaving({ doneSaving: false })
    this.setState({
      resourceName: newValue,
    })
    window.clearTimeout(this.titleChangeTimeout);
    this.titleChangeTimeout = window.setTimeout(() => {
      this.props.updateDocument(this.props.document_id, {title: newValue}, {
        refreshLists: true,
        refreshDocumentContent: true,
        timeOpened: this.props.timeOpened,
      });
      this.setLastSaved(new Date().toLocaleString('en-US'));
      this.setSaving({ doneSaving: true })
    }, this.titleChangeDelayMs);
  }

  onToggleHighlights() {
    const key = this.getInstanceKey();
    const currentState = this.props.highlightsHidden[key] === true ? true : false
    this.props.toggleHighlights( key, !currentState )
  }

  getInstanceKey() {
    const { document_id, timeOpened } = this.props;
    return `${document_id}-${timeOpened}`;
  }

  onCloseDocument() {
    this.props.closeDocument(this.props.document_id, this.props.timeOpened)
    this.props.closeDocumentTargets(this.props.document_id)
  }

  setSaving({ doneSaving }) {
    this.setState({ doneSaving });
  }


  onTooltipOpen (e) {
    e.persist();
    const cornerIconTooltipAnchor = e.currentTarget;
    e.preventDefault();
    this.setState((prevState) => {
      return {
        ...prevState,
        cornerIconTooltipOpen: true,
        cornerIconTooltipAnchor,
      }
    });
  }

  onTooltipClose () {
    this.setState((prevState) => {
      return {
        ...prevState,
        cornerIconTooltipOpen: false,
      }
    });
  }

  onShareOpen (e) {
    e.persist();
    const sharePanelAnchor = e.currentTarget;
    e.preventDefault();
    this.setState((prevState) => {
      return {
        ...prevState,
        sharePanelOpen: true,
        sharePanelAnchor,
      }
    });
  }

  onShareClose () {
    this.setState((prevState) => {
      return {
        ...prevState,
        sharePanelOpen: false,
        hasCopiedURL: false,
      }
    });
  }

  async getDocumentURL(docId) {
    let loc;
    // eslint-disable-next-line no-restricted-globals
    const isInIframe = (parent !== window);
    let clipboardWrite = {};
    try {
      clipboardWrite = await navigator.permissions.query({ name: 'clipboard-write' });
    } catch (e) {
      // in firefox + iframe we will assume clipboard has been granted
      clipboardWrite = { state: "granted" };
    }
    if (isInIframe && clipboardWrite.state === "granted") {
      // if in iframe, use parent URL to build document URL
      // (check that clipboard write permission is granted to ensure iframe parent URL
      // only used here when intentionally enabled)
      loc = document.referrer;
    } else {
      // eslint-disable-next-line no-restricted-globals
      loc = window.location.href.replace(location.search, "");
    }
    this.setState((prevState) => ({
      ...prevState,
      documentURL: `${loc}?document=${docId}`
    }));
  }

  copyDocumentURL(e) {
    if (e.currentTarget.nodeName === "INPUT") {
      e.currentTarget.select();
    } else {
      e.currentTarget.parentNode.parentNode.querySelector("#document-link").select();
    }
    navigator.clipboard.writeText(this.state.documentURL);
    this.setState((prevState) => ({
      ...prevState,
      hasCopiedURL: true,
    }));
  }

  renderTitleBar() {
    const iconStyle = {
      padding: '0',
      width: '20px',
      height: '20px'
    };
    const buttonStyle = Object.assign({ margin: '2px' }, iconStyle);
    const highlightsHidden = this.props.highlightsHidden[this.getInstanceKey()];

    return (
      this.props.connectDragSource(
        <div style={{ width: '100%', flexShrink: '0', cursor: '-webkit-grab' }}>
          <div style={{ display: 'flex', padding: '10px 10px 0 10px', backgroundColor: this.props.document_kind === 'canvas' ? grey800 : grey100, borderRadius: '2px' }}>
            <IconButton
              style={buttonStyle}
              iconStyle={iconStyle}
              onClick={this.props.linkInspectorAnchorClick}
              onMouseOver={this.onTooltipOpen.bind(this)}
              onMouseOut={this.onTooltipClose.bind(this)}
            >
              <Description color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
            </IconButton>
            <Popover
              open={this.state.cornerIconTooltipOpen}
              anchorEl={this.state.cornerIconTooltipAnchor}
              zDepth={5}
              className="tooltip-popover"
              anchorOrigin={{horizontal: 'middle', vertical: 'bottom'}}
              targetOrigin={{horizontal: 'middle', vertical: 'top'}}
              useLayerForClickAway={false}
              autoCloseWhenOffScreen={false}
            >
              Show link inspector
            </Popover>
            <TextField
              id={`text-document-title-${this.props.document_id}`}
              style={{ flexGrow: '1', height: '24px', fontWeight: 'bold', fontSize: '1.2em', margin: '0 0 10px 4px', cursor: 'text' }}
              autoComplete='off'
              inputStyle={{ color: this.props.document_kind === 'canvas' ? '#FFF' : '#000' }}
              value={this.state.resourceName}
              underlineShow={false}
              onChange={this.onChangeTitle}
              disabled={!this.isEditable()}
            />
            <IconButton
              tooltip="Share document"
              onClick={this.onShareOpen.bind(this)}
              style={buttonStyle}
              iconStyle={{ width: '16px', height: '16px' }}
            >
              <BoxArrowUp color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
            </IconButton>
            <Popover
              open={this.state.sharePanelOpen}
              anchorEl={this.state.sharePanelAnchor}
              zDepth={5}
              className="share-panel"
              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
              targetOrigin={{horizontal: 'right', vertical: 'top'}}
              useLayerForClickAway={true}
              autoCloseWhenOffScreen={true}
              onRequestClose={this.onShareClose.bind(this)}
              style={{ padding: '5px 0 5px 10px', backgroundColor: grey200 }}
            >
              <div style={{
                display: 'flex',
                gap: '10px',
                flexFlow: 'row nowrap',
                alignItems: 'center',
              }}>
                <TextField
                  id="document-link"
                  value={this.state.documentURL}
                  onFocus={this.copyDocumentURL.bind(this)}
                  onClick={this.copyDocumentURL.bind(this)}
                  inputStyle={{
                    backgroundColor: white,
                    height: '40px',
                    marginTop: '5px',
                    padding: '0 5px',
                  }}
                  underlineStyle={{
                    marginBottom: '-5px',
                    padding: '0 5px',
                  }}
                  style={{ margin: '0 10px 0 0' }}
                />
                <RaisedButton
                  icon={this.state.hasCopiedURL ? <Check2 /> : null}
                  label={this.state.hasCopiedURL ? "Copied" : "Copy link"}
                  style={{marginRight: '10px'}}
                  onClick={this.copyDocumentURL.bind(this)}
                  backgroundColor={this.state.hasCopiedURL ? grey300 : white}
                />
              </div>
            </Popover>
            { !this.isEditable() &&
              <IconButton tooltip='Toggle highlights' tooltipStyles={{ marginLeft: '-10px' }} onClick={this.onToggleHighlights.bind(this)} style={buttonStyle} iconStyle={iconStyle}>
                { highlightsHidden 
                  ? <VisibilityOff
                      color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'}
                    /> 
                  : <Visibility
                      color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'}
                    /> 
                }
              </IconButton>
            }
            <IconButton
              tooltip="Close document"
              tooltipPosition="bottom-left"
              onClick={this.onCloseDocument.bind(this)}
              style={buttonStyle}
              iconStyle={iconStyle}
            >
              <Close color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
            </IconButton>
          </div>
        </div>
      )
    );
  }

  renderStatusBar() {
    const {
      document_kind,
      document_id,
      loading,
      locked,
      lockedByMe,
      lockedByUserName,
      resourceName,
      writeEnabled
    } = this.props;

    return (
      <DocumentStatusBar
        loading={loading}
        document_id={document_id}
        document_kind={document_kind}
        instanceKey={this.getInstanceKey()}
        locked={locked}
        lockedByUserName={lockedByUserName}
        lockedByMe={lockedByMe}
        resourceName={resourceName}
        writeEnabled={writeEnabled}
        lastSaved={this.state.lastSaved}
        doneSaving={this.state.doneSaving}
      />
    );
  }

  render() {
    const { currentLayout, isDragging, document_kind, connectDropTarget, numRows, sidebarWidth } = this.props;
    const documentGridOffsetWidth = window.innerWidth - sidebarWidth - 16;
    const windowHeight = window.innerHeight;
    const width = (documentGridOffsetWidth / currentLayout.cols) - 100
    const rows = currentLayout.rows < numRows ? currentLayout.rows : numRows;
    const height = ((windowHeight - 72.0) / rows) - 16;
    const highlightsHidden = this.props.highlightsHidden[this.getInstanceKey()];

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
        className={this.props.document_kind !== 'canvas' && !this.isEditable() && highlightsHidden ? 'highlights-hidden' : ''}
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
            <DocumentInner 
              setLastSaved={this.setLastSaved.bind(this)}
              setSaving={this.setSaving.bind(this)}
              {...this.props}
            />
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

const mapStateToProps = (state, ownProps) => ({
  openDocuments: state.documentGrid.openDocuments,
  loading: state.documentGrid.loading,
  currentLayout: layoutOptions[state.documentGrid.currentLayout],
  sidebarWidth:  state.project.sidebarWidth,
  highlightsHidden: ownProps.document_kind === 'canvas' ? state.canvasEditor.highlightsHidden : state.textEditor.highlightsHidden,
});

const mapDispatchToProps = (dispatch, props) => bindActionCreators({
  updateDocument,
  closeDocument,
  moveDocumentWindow,
  closeDocumentTargets,
  toggleHighlights: props.document_kind === 'canvas' ? toggleCanvasHighlights : toggleTextHighlights,
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter((props) => <DocumentViewer {...props} />));

