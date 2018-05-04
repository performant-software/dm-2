import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Close from 'material-ui/svg-icons/navigation/close';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';
import Link from 'material-ui/svg-icons/content/link';
import { updateDocument, closeDocument, deleteDocument } from './modules/documentGrid';
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

class DocumentViewer extends Component {
  constructor(props) {
    super(props);

    this.titleChangeTimeout = null;
    this.titleChangeDelayMs = 800;
  }
  render() {
    const iconStyle = {
      padding: '0',
      width: '20px',
      height: '20px'
    };
    const buttonStyle = Object.assign({ margin: '2px' }, iconStyle);
    return (
      <Paper style={{ height: '480', padding: '10px', backgroundColor: this.props.document_kind === 'canvas' ? '#000' : '#FFF' }} zDepth={2}>
        <div style={{ display: 'flex', width: '100%'}} >
          <IconButton tooltip='Show link inspector' style={buttonStyle} iconStyle={iconStyle} onClick={this.props.linkInspectorAnchorClick}>
            <Link color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
          </IconButton>
          <TextField
            id={`text-document-title-${this.props.document_id}`}
            style={{ flexGrow: '1', height: '24px', fontWeight: 'bold', fontSize: '1.2em', margin: '0 0 10px 4px' }}
            inputStyle={{ color: this.props.document_kind === 'canvas' ? '#FFF' : '#000' }}
            defaultValue={this.props.resourceName}
            underlineShow={false}
            onChange={(event, newValue) => {
              window.clearTimeout(this.titleChangeTimeout);
              this.titleChangeTimeout = window.setTimeout(() => {
                this.props.updateDocument(this.props.document_id, {title: newValue}, {refreshLists: true});
              }, this.titleChangeDelayMs);
            }}
          />
          <IconButton tooltip='Delete document' onClick={() => {this.props.deleteDocument(this.props.document_id);}} style={buttonStyle} iconStyle={iconStyle}>
            <DeleteForever color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
          </IconButton>
          <IconButton tooltip='Close document' onClick={() => {this.props.closeDocument(this.props.document_id);}} style={buttonStyle} iconStyle={iconStyle}>
            <Close color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
          </IconButton>
        </div>
        <DocumentInner {...this.props} />
      </Paper>
    )
  }
}

const mapDispatchToProps = dispatch => bindActionCreators({
  updateDocument,
  closeDocument,
  deleteDocument
}, dispatch);

export default connect(
  null,
  mapDispatchToProps
)(DocumentViewer);
