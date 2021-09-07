import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import { hideBatchImagePrompt } from './modules/project';
import { createMultipleCanvasDocs } from './modules/documentGrid';
import { DirectUploadProvider } from 'react-activestorage-provider';
import CloudUpload from 'material-ui/svg-icons/file/cloud-upload';

class BatchImagePrompt extends Component {
  renderMultipleUploadButton({ projectId }) {
    const { createMultipleCanvasDocs } = this.props;
    const buttonStyle = {};
    const iconStyle = {};
    return (
      <DirectUploadProvider
        multiple
        onSuccess={(signedIds) => {
          createMultipleCanvasDocs({
            projectId,
            signedIds,
            addTileSource: this.addTileSource,
          });
        }}
        render={({ handleUpload, uploads, ready }) => (
          <>
            <RaisedButton
              containerElement="label"
              style={buttonStyle}
              icon={<CloudUpload style={iconStyle} />}
              label="Upload"
              disabled={!ready}
            >
              <input
                type="file"
                disabled={!ready}
                multiple
                onChange={(e) => {
                  handleUpload(e.currentTarget.files);
                }}
                style={{ display: 'none' }}
              />
            </RaisedButton>
            {uploads.map((upload) => {
              switch (upload.state) {
                case 'waiting':
                  return (
                    <p key={upload.id}>Waiting to upload {upload.file.name}</p>
                  );
                case 'uploading':
                  return (
                    <p key={upload.id}>
                      Uploading {upload.file.name}: {upload.progress}%
                    </p>
                  );
                case 'error':
                  return (
                    <p key={upload.id}>
                      Error uploading {upload.file.name}: {upload.error}
                    </p>
                  );
                case 'finished':
                  return (
                    <p key={upload.id}>Finished uploading {upload.file.name}</p>
                  );
              }
            })}
          </>
        )}
      />
    );
  }

  render() {
    const { batchImagePromptShown, hideBatchImagePrompt } = this.props;
    const projectId = batchImagePromptShown;

    return (
      <Dialog
        title="Batch upload images"
        modal={false}
        open={!!batchImagePromptShown}
        onRequestClose={hideBatchImagePrompt}
        autoScrollBodyContent={true}
        actions={[
          <FlatButton
            label="Close"
            primary={true}
            onClick={hideBatchImagePrompt}
          />,
        ]}
        contentStyle={{ width: '90%', maxWidth: '1000px' }}
      >
        {this.renderMultipleUploadButton({ projectId })}
      </Dialog>
    );
  }
}

const mapStateToProps = (state) => ({
  batchImagePromptShown: state.project.batchImagePromptShown,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      hideBatchImagePrompt,
      createMultipleCanvasDocs,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(BatchImagePrompt);
