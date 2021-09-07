import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import LinearProgress from 'material-ui/LinearProgress';
import CloudUpload from 'material-ui/svg-icons/file/cloud-upload';
import { hideBatchImagePrompt } from './modules/project';
import { createMultipleCanvasDocs } from './modules/documentGrid';
import { DirectUploadProvider } from 'react-activestorage-provider';
import { red400, green400, lightBlue400 } from 'material-ui/styles/colors';

class BatchImagePrompt extends Component {
  renderMultipleUploadButton({ projectId }) {
    const { createMultipleCanvasDocs } = this.props;
    const progressTrStyle = {
      marginTop: '20px',
    };
    const nameTdStyle = {
      width: '450px',
      maxWidth: '450px',
      minWidth: '450px',
      overflowWrap: 'break-word',
      paddingRight: '10px',
    };
    const progressTdStyle = {
      width: '450px',
      maxWidth: '450px',
      minWidth: '450px',
    };
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
              style={{ display: 'flex' }}
              icon={<CloudUpload />}
              label="Upload multiple"
              disabled={
                !ready ||
                uploads.length > 0 ||
                this.props.uploads.some((upload) => upload.state !== 'finished')
              }
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
            {this.props.uploads && this.props.uploads.length > 0 && (
              <table style={{ marginTop: '20px', width: '100%' }}>
                <tbody>
                  {this.props.uploads.map((upload) => {
                    const name = upload.filename || upload.signedId;
                    switch (upload.state) {
                      case 'uploading':
                        return (
                          <tr key={upload.signedId} style={progressTrStyle}>
                            <td style={nameTdStyle}>
                              <strong>{name}</strong>: Uploading
                            </td>
                            <td style={progressTdStyle}><LinearProgress
                              mode="indeterminate"
                              color={lightBlue400}
                              style={{ height: '12px' }}
                            /></td>
                          </tr>
                        );
                      case 'error':
                        return (
                          <tr key={upload.signedId} style={progressTrStyle}>
                            <td style={nameTdStyle}>
                              <strong>{name}</strong>: {upload.error}
                            </td>
                            <td style={progressTdStyle}><LinearProgress
                              mode="determinate"
                              value={100}
                              color={red400}
                              style={{ height: '12px' }}
                            /></td>
                          </tr>
                        );
                      case 'finished':
                        return (
                          <tr key={upload.signedId} style={progressTrStyle}>
                            <td style={nameTdStyle}>
                              <strong>{name}</strong>: Complete
                            </td>
                            <td style={progressTdStyle}><LinearProgress
                              mode="determinate"
                              value={100}
                              color={green400}
                              style={{ height: '12px' }}
                            /></td>
                          </tr>
                        );
                      default:
                        return (
                          <tr key={upload.signedId} style={progressTrStyle}>
                            <td><strong>{name}</strong></td>
                            <td>Status unknown</td>
                          </tr>
                        );
                    }
                  })}
                </tbody>
              </table>
            )}
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
  uploads: state.project.uploads,
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
