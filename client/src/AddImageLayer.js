import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ActiveStorageProvider from 'react-activestorage-provider';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';

import { setAddTileSourceMode, IIIF_TILE_SOURCE_TYPE, IMAGE_URL_SOURCE_TYPE, UPLOAD_SOURCE_TYPE } from './modules/canvasEditor';
import { replaceDocument, updateDocument, setDocumentThumbnail } from './modules/documentGrid';

const tileSourceTypeLabels = {};
tileSourceTypeLabels[IIIF_TILE_SOURCE_TYPE] = {select: 'IIIF', textField: 'IIIF info.json URL'};
tileSourceTypeLabels[IMAGE_URL_SOURCE_TYPE] = {select: 'Image URL', textField: 'External static image URL'};
tileSourceTypeLabels[UPLOAD_SOURCE_TYPE] = {select: 'Upload image', textField: 'Choose files'};

class AddImageLayer extends Component {

    constructor(props) {
        super(props);
        this.imageUrlForThumbnail = null;
    }

  addTileSource() {
    const newContent = {};
    if (this.props.content) Object.assign(newContent, this.props.content);
    const existingTileSources = newContent.tileSources || [];
    const shouldSetThumbnail = existingTileSources.length < 1;

    let newTileSources = [];
    switch (this.props.addTileSourceMode[this.props.document_id]) {
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
    if (this.osdViewer) {
      this.osdViewer.open(newContent.tileSources);
    }
    this.newTileSourceValue = '';
    this.props.setAddTileSourceMode(this.props.document_id, null);

    if (shouldSetThumbnail && this.imageUrlForThumbnail)
      this.props.setDocumentThumbnail(this.props.document_id, this.imageUrlForThumbnail);
  }

  render() {
    const { document_id, image_thumbnail_urls, addTileSourceMode, setAddTileSourceMode, replaceDocument } = this.props;
    const mode = addTileSourceMode[document_id];
    
    return (
        <div style={{ display: mode && this.props.writeEnabled ? 'initial' : 'none' }} >
            <SelectField
                style={{ color: 'white' }}
                labelStyle={{ color: 'white' }}
                floatingLabelStyle={{ color: 'white' }}
                floatingLabelText='Image source type'
                value={addTileSourceMode[document_id]}
                onChange={(event, index, newValue) => {setAddTileSourceMode(document_id, newValue);}}
            >
                <MenuItem value={UPLOAD_SOURCE_TYPE} primaryText={tileSourceTypeLabels[UPLOAD_SOURCE_TYPE].select} />
                <MenuItem value={IIIF_TILE_SOURCE_TYPE} primaryText={tileSourceTypeLabels[IIIF_TILE_SOURCE_TYPE].select} />
                <MenuItem value={IMAGE_URL_SOURCE_TYPE} primaryText={tileSourceTypeLabels[IMAGE_URL_SOURCE_TYPE].select} />
            </SelectField>
            {addTileSourceMode[document_id] !== UPLOAD_SOURCE_TYPE &&
                <div>
                <TextField
                    id={this.osdId + '-addtilesource'}
                    inputStyle={{ color: 'white' }}
                    floatingLabelStyle={{ color: 'white' }}
                    floatingLabelText={mode ? tileSourceTypeLabels[mode].textField : ''}
                    onChange={(event, newValue) => {this.newTileSourceValue = newValue;}}
                />
                <br /><br />
                </div>
            }
            {addTileSourceMode[document_id] === UPLOAD_SOURCE_TYPE &&
                <ActiveStorageProvider
                endpoint={{
                    path: `/documents/${document_id}/add_images`,
                    model: 'Document',
                    attribute: 'images',
                    method: 'PUT'
                }}
                multiple={true}
                onSubmit={document => {
                    replaceDocument(document);
                }}
                render={({ handleUpload, uploads, ready}) => (
                    <div>
                    <RaisedButton
                        containerElement='label'
                        label={mode ? tileSourceTypeLabels[mode].textField : 'Choose files'}
                    >
                        <input
                        type='file'
                        multiple={true}
                        disabled={!ready}
                        onChange={e => handleUpload(e.currentTarget.files)}
                        style={{ display: 'none' }}
                        />
                    </RaisedButton>
                    {uploads.map(
                        upload =>
                        upload.state === 'waiting' ? (
                            <p style={{ color: 'white' }} key={upload.id}>Waiting to upload {upload.file.name}</p>
                        ) : upload.state === 'uploading' ? (
                            <p style={{ color: 'white' }}  key={upload.id}>
                            Uploading {upload.file.name}: {upload.progress}%
                            </p>
                        ) : upload.state === 'error' ? (
                            <p style={{ color: 'white' }}  key={upload.id}>
                            Error uploading {upload.file.name}: {upload.error}
                            </p>
                        ) : (
                            <p style={{ color: 'white' }}  key={upload.id}>Finished uploading {upload.file.name}</p>
                        )
                    )}
                    <br /><br />
                    {image_thumbnail_urls.map((thumbnailUrl, index) =>
                        <img alt='' key={`thumbnail-${document_id}-${index}`} src={thumbnailUrl} style={{ maxWidth: '40px', maxHeight: '40px' }} />
                    )}
                    </div>
                )}
                />
            }
            <FlatButton label='Cancel' style={{ color: 'white' }} onClick={() => {setAddTileSourceMode(document_id, null);}} />
            <FlatButton label='Add image source' style={{ color: 'white' }} onClick={this.addTileSource.bind(this)} />
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
