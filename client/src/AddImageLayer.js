import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ActiveStorageProvider from '@docflow/react-activestorage-provider';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import FlatButton from 'material-ui/FlatButton';

import CloudUpload from 'material-ui/svg-icons/file/cloud-upload';
import InsertLink from 'material-ui/svg-icons/editor/insert-link';
import Error from 'material-ui/svg-icons/alert/error';

import {
  setAddTileSourceMode,
  setImageUrl,
  IIIF_TILE_SOURCE_TYPE,
  IMAGE_URL_SOURCE_TYPE,
  UPLOAD_SOURCE_TYPE,
  changePage
} from './modules/canvasEditor';
import {
  replaceDocument,
  updateDocument,
  setDocumentThumbnail,
} from './modules/documentGrid';
import deepEqual from 'deep-equal';

const tileSourceTypeLabels = {};
tileSourceTypeLabels[IIIF_TILE_SOURCE_TYPE] = {select: 'IIIF', textField: 'Link to IIIF Image Information URI'};
tileSourceTypeLabels[IMAGE_URL_SOURCE_TYPE] = {select: 'Image URL', textField: 'Link to Web Image'};
tileSourceTypeLabels[UPLOAD_SOURCE_TYPE] = {select: 'Upload image', textField: 'Choose files'};

const validURLRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i

class AddImageLayer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      newTileSourceValue: null,
      linkError: false,
      uploadErrorMessage: null,
      uploading: false,
      newImageUrls: [],
      addingNewLayers: false,
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.image_urls.length > prevProps.image_urls.length) {
      if (this.props.addTileSourceMode[this.props.document_id] === UPLOAD_SOURCE_TYPE) {
        this.props.image_urls.forEach(url =>{
          if (!prevProps.image_urls.includes(url)) {
            this.setState((prevState) => ({ ...prevState, newImageUrls: prevState.newImageUrls.concat([url]) }));
          }
        })
      } else {
        this.setState({ newImageUrls: [] });
      }
    }
    if (prevProps.content && this.props.content 
        && this.props.content.tileSources && this.props.content.tileSources[0]
        && !deepEqual(prevProps.content.tileSources, this.props.content.tileSources))
    {
      this.setState({addingNewLayers: true});
    }
  }

  addTileSource = (addTileSourceMode) => {
    let imageUrlForThumbnail = null;
    const newContent = {};
    if (this.props.content) Object.assign(newContent, this.props.content);
    const existingTileSources = newContent.tileSources || [];
    const existingIiifTileNames = newContent.iiifTileNames || [];
    const shouldSetThumbnail = existingTileSources.length < 1;

    let iiifTileNames = [];

    let newTileSources = [];
    switch (addTileSourceMode) {
      case UPLOAD_SOURCE_TYPE:
        if (this.props.image_urls && this.props.image_urls.length > 0 
        && this.state.newImageUrls && this.state.newImageUrls.length > 0) {
          this.state.newImageUrls.forEach((url) => {
            const filename = decodeURIComponent(url.substring(
              url.lastIndexOf('/')+1,
              url.lastIndexOf('.')
            ));
            newTileSources.push({
              type: 'image',
              url,
              name: filename,
            });
            if (shouldSetThumbnail && newTileSources.length > 0)
              imageUrlForThumbnail = newTileSources[0].url;
          })
        }
        break;

      case IMAGE_URL_SOURCE_TYPE:
        const url = this.state.newTileSourceValue;
        const filename = url.substring(url.lastIndexOf('/')+1, url.lastIndexOf('.'));
        newTileSources.push({
          type: 'image',
          url,
          name: filename,
        });
        if (shouldSetThumbnail)
          imageUrlForThumbnail = url;
        break;

      case IIIF_TILE_SOURCE_TYPE:
        newTileSources.push(this.state.newTileSourceValue);
        if (shouldSetThumbnail) {
          imageUrlForThumbnail = this.state.newTileSourceValue.replace('http:', 'https:').replace('/info.json', '') + '/full/!160,160/0/default.png';
        }
        iiifTileNames.push({
          name: 'IIIF layer',
          url: this.state.newTileSourceValue,
        });
        break;

      default:
        newTileSources.push(this.state.newTileSourceValue);
    }

    this.setState(prevState => ({
      ...prevState,
      newImageUrls: [],
      newTileSourceValue: null,
    }));
    this.props.setAddTileSourceMode(this.props.document_id, null);

    if (shouldSetThumbnail && imageUrlForThumbnail) {
      this.props.setDocumentThumbnail({
        documentId: this.props.document_id, 
        image_url: imageUrlForThumbnail,
      });
    }

    newContent.tileSources = existingTileSources.concat(newTileSources);
    newContent.iiifTileNames = existingIiifTileNames.concat(iiifTileNames);
    this.props.updateDocument(this.props.document_id, {
      content: newContent
    }, { replaceThisDocument: true });

    this.props.changePage({
      page: newContent.tileSources.length - 1,
      editorKey: this.props.editorKey,
    });
  }

  renderUploadButton(buttonStyle,iconStyle) {
    const {
      content,
      document_id,
      replaceDocument,
      setAddTileSourceMode,
      setLastSaved,
      setSaving,
    } = this.props;
    const allowNewLayers = this.state.addingNewLayers || (content && content.tileSources && content.tileSources.length > 0);
    return (
      <ActiveStorageProvider
        endpoint={{
          path: `/documents/${document_id}/add_images`,
          model: 'Document',
          attribute: 'images',
          protocol: 'https',
          method: 'PUT',
        }}
        multiple={true}
        onSubmit={(document) => {
          replaceDocument({
            ...document,
            locked_by_me: document.locked ? true : false,
          });
          this.addTileSource(UPLOAD_SOURCE_TYPE);
          this.setState({
            ...this.state,
            uploadErrorMessage: null,
            uploading: false,
          });
          setLastSaved(new Date().toLocaleString('en-US'));
          setSaving({ doneSaving: true });
        }}
        onError={() => {
          this.setState({
            ...this.state,
            uploadErrorMessage: 'Unable to process file.',
            uploading: false,
          });
        }}
        render={({ handleUpload, uploads, ready }) => (
          <RaisedButton
            containerElement="label"
            style={buttonStyle}
            icon={<CloudUpload style={iconStyle} />}
            label="Upload from Computer"
            disabled={this.state.uploading}
          >
            <input
              key="upload-form"
              type="file"
              accept="image/png, image/jpeg"
              disabled={!ready}
              onChange={(e) => {
                setAddTileSourceMode(
                  document_id,
                  UPLOAD_SOURCE_TYPE
                );
                this.setState({
                  ...this.state,
                  uploadErrorMessage: null,
                  uploading: true,
                });
                setSaving({ doneSaving: false });
                handleUpload(e.currentTarget.files);
              }}
              style={{ display: 'none' }}
              multiple={allowNewLayers}
            />
          </RaisedButton>
        )}
      />
    );
  }

  onIIIFLink = () => {
    this.props.setAddTileSourceMode(this.props.document_id, IIIF_TILE_SOURCE_TYPE);
    this.setState( { ...this.state, uploadErrorMessage: null, uploading: false, linkError: false } );
  }

  onWebLink = () => {
    this.props.setAddTileSourceMode(this.props.document_id, IMAGE_URL_SOURCE_TYPE);
    this.setState( { ...this.state, uploadErrorMessage: null, uploading: false, linkError: false } );
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

  render() {
    const { document_id, writeEnabled, addTileSourceMode, content } = this.props;
    const tileSourceMode = addTileSourceMode[document_id];
    const allowNewLayers = this.state.addingNewLayers || (content && content.tileSources && content.tileSources.length > 0);
    
    if (!writeEnabled || !tileSourceMode) return null;
    
    const divStyle = { margin: 20 };
    const textStyle = { color: 'white' };
    const buttonStyle = { margin: 12, height: 60 };
    const iconStyle = { width: 50, height: 50 };
    
    return (
      <div style={divStyle}>
        <h2 style={textStyle}>
          {allowNewLayers && (
            <>
              Add image layer(s)
            </>
          )}
          {!allowNewLayers && (
            <>
              Add an image
            </>
          )}
        </h2>
        <p style={textStyle}>Choose an image source:</p>
    
        {this.renderUploadButton(buttonStyle, iconStyle)}
    
        <RaisedButton
          label="Link to IIIF"
          icon={<InsertLink style={iconStyle} />}
          onClick={this.onIIIFLink}
          disabled={this.state.uploading}
          style={buttonStyle}
        />
        <RaisedButton
          label="Link to Web"
          icon={<InsertLink style={iconStyle} />}
          onClick={this.onWebLink}
          disabled={this.state.uploading}
          style={buttonStyle}
        />
    
        {tileSourceMode !== UPLOAD_SOURCE_TYPE && (
          <div>
            <TextField
              inputStyle={{ color: 'white' }}
              floatingLabelStyle={{ color: 'white' }}
              errorText={this.state.linkError ? 'Please enter a valid URL.' : ''}
              floatingLabelText={
                tileSourceMode ? tileSourceTypeLabels[tileSourceMode].textField : ''
              }
              onChange={(event, newValue) => {
                this.setState({ ...this.state, newTileSourceValue: newValue });
              }}
            />
            <RaisedButton
              label="Add Image"
              style={{ margin: 30, verticalAlign: 'top' }}
              onClick={this.onLinkSubmit}
            />
          </div>
        )}
        {tileSourceMode === UPLOAD_SOURCE_TYPE && this.state.uploading ? (
          <div>
            <h2 style={{ color: 'white' }}>Uploading image...</h2>
            <CircularProgress size={80} thickness={5} color="white" />
          </div>
        ) : (
          this.state.uploadErrorMessage != null && (
            <div>
              <p style={{ color: 'white' }}>
                <Error style={{ margin: 5, color: 'white' }} />
                {this.state.uploadErrorMessage}
              </p>
            </div>
          )
        )}
    
        {allowNewLayers && (
          <FlatButton
            label="Cancel"
            style={{ color: 'white' }}
            onClick={this.onCancel}
          />
        )}
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
  setImageUrl,
  setDocumentThumbnail,
  replaceDocument,
  changePage,
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddImageLayer);
