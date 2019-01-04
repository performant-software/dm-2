import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ActiveStorageProvider from 'react-activestorage-provider';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import { Snackbar } from 'material-ui';

import CloudUpload from 'material-ui/svg-icons/file/cloud-upload';
import InsertLink from 'material-ui/svg-icons/editor/insert-link';

import { setAddTileSourceMode, IIIF_TILE_SOURCE_TYPE, IMAGE_URL_SOURCE_TYPE, UPLOAD_SOURCE_TYPE } from './modules/canvasEditor';
import { replaceDocument, updateDocument, setDocumentThumbnail } from './modules/documentGrid';

const tileSourceTypeLabels = {};
tileSourceTypeLabels[IIIF_TILE_SOURCE_TYPE] = {select: 'IIIF', textField: 'Link to IIIF Image'};
tileSourceTypeLabels[IMAGE_URL_SOURCE_TYPE] = {select: 'Image URL', textField: 'Link to Web Image'};
tileSourceTypeLabels[UPLOAD_SOURCE_TYPE] = {select: 'Upload image', textField: 'Choose files'};

const validURLRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i

class AddImageLayer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            newTileSourceValue: null,
            linkError: false
        }
    }

  addTileSource = (addTileSourceMode) => {
    let imageUrlForThumbnail = null;
    const newContent = {};
    if (this.props.content) Object.assign(newContent, this.props.content);
    const existingTileSources = newContent.tileSources || [];
    const shouldSetThumbnail = existingTileSources.length < 1;

    let newTileSources = [];
    switch (addTileSourceMode) {
      case UPLOAD_SOURCE_TYPE:
        if (this.props.image_urls && this.props.image_urls.length > 0) {
          let existingImageUrls = [];
          existingTileSources.forEach(source => {
            if (source.type && source.url && source.type === 'image')
              existingImageUrls.push(source.url);
          });
          this.props.image_urls.forEach(url => {
            if (!existingImageUrls.includes(url)) {
              newTileSources.push({
                type: 'image',
                url
              });
            }
          });
          if (shouldSetThumbnail && newTileSources.length > 0)
            imageUrlForThumbnail = newTileSources[0].url;
        }
        break;

      case IMAGE_URL_SOURCE_TYPE:
        newTileSources.push({
          type: 'image',
          url: this.state.newTileSourceValue
        });
        if (shouldSetThumbnail)
          imageUrlForThumbnail = this.state.newTileSourceValue;
        break;

      case IIIF_TILE_SOURCE_TYPE:
        if (shouldSetThumbnail) {
          const baseUrl = this.state.newTileSourceValue.split('info.json')[0];
          imageUrlForThumbnail = baseUrl + 'full/!160,160/0/default.png';
        }
        break;

      default:
        newTileSources.push(this.state.newTileSourceValue);
    }

    newContent.tileSources = existingTileSources.concat(newTileSources);
    this.props.updateDocument(this.props.document_id, {
      content: newContent
    });
    if (this.props.osdViewer) {
      this.props.osdViewer.open(newContent.tileSources);
    }
    this.setState( { ...this.state, newTileSourceValue: null } );
    this.props.setAddTileSourceMode(this.props.document_id, null);

    if (shouldSetThumbnail && imageUrlForThumbnail)
      this.props.setDocumentThumbnail(this.props.document_id, imageUrlForThumbnail);
  }

  renderUploadButton(buttonStyle,iconStyle) {
    const { document_id, replaceDocument } = this.props;
    return (
        <ActiveStorageProvider
            endpoint={{
                path: `/documents/${document_id}/add_images`,
                model: 'Document',
                attribute: 'images',
                method: 'PUT'
            }}
            multiple={true}
            onSubmit={document => {
                this.props.setAddTileSourceMode(this.props.document_id, UPLOAD_SOURCE_TYPE);
                replaceDocument(document);
                this.addTileSource(UPLOAD_SOURCE_TYPE);
            }}
            render={({ handleUpload, uploads, ready}) => (
            <RaisedButton
                containerElement='label'
                style={buttonStyle}
                icon={<CloudUpload style={iconStyle}/>}
                label='Upload from Computer'
            >                
                { this.renderUploadMessage(uploads) }
                <input
                key='upload-form'
                type='file'
                disabled={!ready}
                onChange={e => handleUpload(e.currentTarget.files)}
                style={{ display: 'none' }}
                />
            </RaisedButton>
            )}
        />
    );
  }

  onIIIFLink = () => {
    this.props.setAddTileSourceMode(this.props.document_id, IIIF_TILE_SOURCE_TYPE);
    this.setState( { ...this.state, linkError: false } );
  }

  onWebLink = () => {
    this.props.setAddTileSourceMode(this.props.document_id, IMAGE_URL_SOURCE_TYPE);
    this.setState( { ...this.state, linkError: false } );
  }

  onLinkSubmit = () => {
    const { document_id, addTileSourceMode } = this.props;
    const tileSource = this.state.newTileSourceValue
    const tileSourceMode = addTileSourceMode[document_id];

    if( this.validateTileSource(tileSource) ) {
        this.addTileSource(tileSourceMode);
        this.setState( { ...this.state, linkError: false } );
    } else {
        this.setState( { ...this.state, linkError: true } );
    }
  }

  validateTileSource(tileSource) {
    if( tileSource && tileSource.length > 0 ) {
        return validURLRegex.test( tileSource );
    }
    return false;
  }

  onCancel = () => {
    this.props.setAddTileSourceMode(this.props.document_id, null);
  }

  renderUploadMessage(uploads) {
    if( !uploads || uploads.length === 0 ) { return null; }
    const message = uploads.map(
        upload =>
        upload.state === 'waiting' || 'uploading' ? (
            `Uploading...`
        ) : upload.state === 'error' ? (      
            `Error uploading ${upload.file.name}: ${upload.error}`
        ) : (
            `Finished uploading ${upload.file.name}`
        )
    );

    return (
        <Snackbar
            open={true}
            message={<span style={{ color: 'white'}}>{message}</span>}        
            autoHideDuration={4000}
        />
    )
  }

  render() {
    const { document_id, writeEnabled, addTileSourceMode } = this.props;
    const tileSourceMode = addTileSourceMode[document_id];

    if( !writeEnabled || !tileSourceMode ) return null;

    const divStyle = { margin: 20 };
    const textStyle = { color: 'white' };
    const buttonStyle = { margin: 12, height: 60 };
    const iconStyle = { width: 50, height: 50}

    return (
        <div style={divStyle} >
            <h2 style={textStyle}>Add an Image</h2>
            <p style={textStyle}>Choose an image source.</p>

            { this.renderUploadButton(buttonStyle,iconStyle) }
            
            <RaisedButton
                    label='Link to IIIF'
                    icon={<InsertLink style={iconStyle}/>}
                    onClick={this.onIIIFLink}
                    style={buttonStyle}
            />
            <RaisedButton
                    label='Link to Web'
                    icon={<InsertLink style={iconStyle}/>}
                    onClick={this.onWebLink}
                    style={buttonStyle}
            />

            { tileSourceMode !== UPLOAD_SOURCE_TYPE &&
                <div>
                    <TextField
                        inputStyle={{ color: 'white' }}
                        floatingLabelStyle={{ color: 'white' }}
                        errorText={ this.state.linkError ? "Please enter a valid URL." : "" }
                        floatingLabelText={tileSourceMode ? tileSourceTypeLabels[tileSourceMode].textField : ''}
                        onChange={(event, newValue) => {this.setState( { ...this.state, newTileSourceValue: newValue}) }}
                    />
                    <RaisedButton
                        label='Add Image'
                        style={ {margin: 30, verticalAlign:'top'} }
                        onClick={this.onLinkSubmit}
                    />
                </div>
            }

            {/* TODO display cancel only when adding layers <FlatButton label='Cancel' style={{ color: 'white' }} onClick={this.onCancel} /> */}
        </div>
    );
  }

}

const mapStateToProps = state => ({
  addTileSourceMode: state.canvasEditor.addTileSourceMode
});

const mapDispatchToProps = dispatch => bindActionCreators({
  setAddTileSourceMode,
  updateDocument,
  setDocumentThumbnail,
  replaceDocument
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddImageLayer);
