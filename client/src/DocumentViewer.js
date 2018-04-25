import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Close from 'material-ui/svg-icons/navigation/close';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';
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
  render() {
    const iconStyle = {
      padding: '0',
      width: '20px',
      height: '20px'
    };
    const buttonStyle = Object.assign({ margin: '4px' }, iconStyle);
    return (
      <Paper style={{ height: '480', padding: '10px', backgroundColor: this.props.document_kind === 'canvas' ? '#000' : '#FFF' }} zDepth={2}>
        <div style={{ display: 'flex', width: '100%'}} >
          <TextField
            id={`text-document-title-${this.props.resourceId}`}
            style={{ flexGrow: '1', height: '24px', fontWeight: 'bold', fontSize: '1.2em', margin: '0 0 10px 0' }}
            inputStyle={{ color: this.props.document_kind === 'canvas' ? '#FFF' : '#000' }}
            defaultValue={this.props.resourceName}
            underlineShow={false}
            onChange={(event, newValue) => {this.props.updateDocument(this.props.resourceId, {title: newValue}, {refreshProject: true})}}
          />
          <IconButton tooltip='Delete document' onClick={() => {this.props.deleteDocument(this.props.resourceId);}} style={buttonStyle} iconStyle={iconStyle}>
            <DeleteForever color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
          </IconButton>
          <IconButton tooltip='Close document' onClick={() => {this.props.closeDocument(this.props.resourceId);}} style={buttonStyle} iconStyle={iconStyle}>
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
