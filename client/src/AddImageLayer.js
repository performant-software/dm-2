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

class AddImageLayer extends Component {

    constructor(props) {
        super(props);
        this.imageUrlForThumbnail = null;
    }

  addTileSource = (addTileSourceMode) => {
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
            this.imageUrlForThumbnail = newTileSources[0].url;
        }
        break;

      case IMAGE_URL_SOURCE_TYPE:
        newTileSources.push({
          type: 'image',
          url: this.newTileSourceValue
        });
        if (shouldSetThumbnail)
          this.imageUrlForThumbnail = this.newTileSourceValue;
        break;

      case IIIF_TILE_SOURCE_TYPE:
        if (shouldSetThumbnail) {
          const baseUrl = this.newTileSourceValue.split('info.json')[0];
          this.imageUrlForThumbnail = baseUrl + 'full/!160,160/0/default.png';
        }
        break;

      default:
        newTileSources.push(this.newTileSourceValue);
    }

    newContent.tileSources = existingTileSources.concat(newTileSources);
    this.props.updateDocument(this.props.document_id, {
      content: newContent
    });
    if (this.props.osdViewer) {
      this.props.osdViewer.open(newContent.tileSources);
    }
    this.newTileSourceValue = '';
    this.props.setAddTileSourceMode(this.props.document_id, null);

    if (shouldSetThumbnail && this.imageUrlForThumbnail)
      this.props.setDocumentThumbnail(this.props.document_id, this.imageUrlForThumbnail);
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
                multiple={true}
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
  }

  onWebLink = () => {
    this.props.setAddTileSourceMode(this.props.document_id, IMAGE_URL_SOURCE_TYPE);
  }

  onLinkSubmit = () => {
    const { document_id, addTileSourceMode } = this.props;
    const tileSourceMode = addTileSourceMode[document_id];

    this.addTileSource(tileSourceMode);
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
    const linkError = false;

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
                        errorText={ linkError ? "Please enter a valid URL." : "" }
                        floatingLabelText={tileSourceMode ? tileSourceTypeLabels[tileSourceMode].textField : ''}
                        onChange={(event, newValue) => {this.newTileSourceValue = newValue;}}
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
