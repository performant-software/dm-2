import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Checkbox from 'material-ui/Checkbox';
import Dialog from 'material-ui/Dialog';
import DropDownMenu from 'material-ui/DropDownMenu';
import FlatButton from 'material-ui/FlatButton';
import LinearProgress from 'material-ui/LinearProgress';
import RaisedButton from 'material-ui/RaisedButton';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import TextField from 'material-ui/TextField';
import CloudUpload from 'material-ui/svg-icons/file/cloud-upload';
import {
  getFolderData,
  hideBatchImagePrompt,
  hideCloseDialog,
  showCloseDialog,
  startUploading,
} from './modules/project';
import { createBatchImages } from './modules/documentGrid';
import { DirectUploadProvider } from 'react-activestorage-provider';
import { red400, green400, lightBlue400 } from 'material-ui/styles/colors';
import MenuItem from 'material-ui/MenuItem/MenuItem';

const TableRow = ({ upload }) => {
  const name = upload.filename || upload.signedId;
  const progressTrStyle = {
    marginTop: '20px',
  };
  const nameTdStyle = {
    width: '400px',
    maxWidth: '400px',
    minWidth: '400px',
    overflowWrap: 'break-word',
    paddingRight: '10px',
    fontWeight: 'bold',
  };
  const progressTdStyle = {
    width: '320px',
    maxWidth: '320px',
    minWidth: '320px',
    paddingRight: '10px',
  };
  const statusTdStyle = {
    width: '200px',
    maxWidth: '200px',
    minWidth: '200px',
    textAlign: 'right',
  }
  switch (upload.state) {
    case 'uploading':
      return (
        <tr key={upload.signedId} style={progressTrStyle}>
          <td style={nameTdStyle}>
            {name}
          </td>
          <td style={progressTdStyle}><LinearProgress
            mode="indeterminate"
            color={lightBlue400}
            style={{ height: '12px' }}
          /></td>
          <td style={statusTdStyle}>
            Uploading
          </td>
        </tr>
      );
    case 'error':
      return (
        <tr key={upload.signedId} style={progressTrStyle}>
          <td style={nameTdStyle}>
            {name}
          </td>
          <td style={progressTdStyle}><LinearProgress
            mode="determinate"
            value={100}
            color={red400}
            style={{ height: '12px' }}
          /></td>
          <td style={statusTdStyle}>
            {upload.error.toString()}
          </td>
        </tr>
      );
    case 'finished':
      return (
        <tr key={upload.signedId} style={progressTrStyle}>
          <td style={nameTdStyle}>
            {name}
          </td>
          <td style={progressTdStyle}><LinearProgress
            mode="determinate"
            value={100}
            color={green400}
            style={{ height: '12px' }}
          /></td>
          <td style={statusTdStyle}>
            Complete
          </td>
        </tr>
      );
    default:
      return (
        <tr key={upload.signedId} style={progressTrStyle}>
          <td><strong>{name}</strong></td>
          <td style={progressTdStyle}><LinearProgress
            mode="determinate"
            value={100}
            color={'gray'}
            style={{ height: '12px' }}
          /></td>
          <td style={statusTdStyle}>
            Unknown
          </td>
        </tr>
      );
  }
}

const CloseDialog = ({ closeAction, cancelAction, open }) => {
  return (
    <Dialog
      title="Close"
      modal={true}
      open={open}
      actions={[
        <FlatButton
          label="Cancel"
          primary
          onClick={cancelAction}
        />,
        <FlatButton
          label="Close"
          secondary
          onClick={closeAction}
        />,
      ]}
    >
      Are you sure you want to close this dialog? It may interrupt uploads in progress.
    </Dialog>
  );
}

class BatchImagePrompt extends Component {
  constructor(props) {
    super(props);
    this.defaultState = {
      inFolder: false,
      existingFolder: false,
      newFolderName: '',
      folderId: '',
      menuItemsToRender: [],
    };
    this.state = {
      ...this.defaultState,
    };
  }

  pushSelfAndDescendants({ parent, folderData, level }) {
    if(!this.state.menuItemsToRender.some(item => item.key === parent.id)) {
      const newItem = {
        key: parent.id,
        value: parent.id,
        primaryText: `${level > 0 ? `└${'─'.repeat(level-1)}` : ''} ${parent.title}`,
      };
      this.setState((prevState) => ({ menuItemsToRender: [...prevState.menuItemsToRender, newItem] }));
      folderData
        .filter(child => 
          child.parent_type === 'DocumentFolder' && 
          child.parent_id === parent.id
        )
        .sort((a, b) => {
          if (a.title.toLowerCase() < b.title.toLowerCase()) { return -1; }
          if (a.title.toLowerCase() > b.title.toLowerCase()) { return 1; }
          return 0;
        })
        .forEach(child => this.pushSelfAndDescendants({
          parent: child,
          folderData,
          level: level+1,
        }));
    }
  }

  updateCheck() {
    this.setState((prevState) => {
      if (prevState.inFolder === false) {
        return {
          ...prevState,
          inFolder: !prevState.inFolder,
          existingFolder: false,
        }
      } else {
        return {
          ...prevState,
          inFolder: !prevState.inFolder,
        };
      }
    });
  }

  changeFolderType(event, value) {
    const { folderData } = this.props;
    this.setState({
      existingFolder: value === 'existing',
    })
    if (value === 'existing') {
      folderData
        .filter(child => child['parent_type'] === 'Project')
        .sort((a, b) => {
          if (a.title.toLowerCase() < b.title.toLowerCase()) { return -1; }
          if (a.title.toLowerCase() > b.title.toLowerCase()) { return 1; }
          return 0;
        })
        .forEach(child => this.pushSelfAndDescendants(
          { parent: child, folderData, level: 0}
        ));
    }
  }

  selectFolder(event, index, value) {
    this.setState({
      folderId: value,
    })
  }

  renderFolderChoice() {
    const { contentsChildren } = this.props;
    const { inFolder, existingFolder, folderId, newFolderName } = this.state;
    const spaced = { marginBottom: '16px' };
    const dropdownStyle = { width: '100%', marginTop: '-6px', marginBottom: '22px'  };
    const grayStyle = { color: 'gray' };
    return (
      <>
        <Checkbox
          label="Place all uploads into a folder"
          checked={inFolder}
          onCheck={this.updateCheck.bind(this)}
          style={spaced}
        />
        {inFolder && (
          <>
            <RadioButtonGroup
              name="folderType"
              defaultSelected="new"
              onChange={this.changeFolderType.bind(this)}
            >
              <RadioButton
                value="new"
                label="New folder"
                style={spaced}
              />
              <RadioButton
                value="existing"
                label="Existing folder"
                style={spaced}
                disabled={
                  contentsChildren.filter(
                    child => child['document_kind'] === 'folder'
                  ).length === 0
                }
              />
            </RadioButtonGroup>
            {!existingFolder && (
              <>
                New folder:
                {' '}
                <TextField
                  value={newFolderName}
                  onChange={(e, val) => this.setState({ newFolderName: val })}
                  hintText="Name"
                  style={{ marginLeft: '4px', ...spaced }}
                >
                </TextField>
              </>
            )}
            {existingFolder && (       
              <DropDownMenu
                value={folderId}
                onChange={this.selectFolder.bind(this)}
                style={dropdownStyle}
                autoWidth={false}
                labelStyle={folderId === '' ? grayStyle : {}}
                menuStyle={{ paddingLeft: 0 }}
              >
                <MenuItem
                  value={''}
                  primaryText={'Choose an existing folder...'}
                  disabled={folderId !== ''}
                />
                {
                  this.state.menuItemsToRender.map(item => (
                    <MenuItem
                      key={item.key}
                      value={item.value}
                      primaryText={item.primaryText}
                    />
                  ))
                }
              </DropDownMenu>
            )}
          </>
        )}
      </>
    )
  }

  renderMultipleUploadButton({ projectId }) {
    const { createBatchImages, uploading, startUploading } = this.props;
    const { folderId, newFolderName, inFolder, existingFolder } = this.state;
    const uploadsNotDone = this.props.uploads.some(
      (upload) => upload.state !== 'finished' && upload.state !== 'error'
    );
    const folderChoiceValid = 
      !inFolder || 
      (existingFolder === false && newFolderName !== '') ||
      (existingFolder === true && folderId !== '');
    return (
      <DirectUploadProvider
        multiple
        onSuccess={(signedIds) => {
          createBatchImages({
            projectId,
            signedIds,
            inFolder,
            existingFolder,
            folderId,
            newFolderName,
          });
        }}
        render={({ handleUpload, uploads, ready }) => (
          <>
            {!uploading && !(this.props.uploads && this.props.uploads.length > 0) && (
              <RaisedButton
                containerElement="label"
                style={{ display: 'flex' }}
                icon={<CloudUpload />}
                label="Upload multiple"
                disabled={
                  !ready ||
                  uploads.length > 0 ||
                  uploadsNotDone ||
                  !folderChoiceValid
                }
              >
                <input
                  type="file"
                  disabled={!ready}
                  multiple
                  onChange={(e) => {
                    handleUpload(e.currentTarget.files);
                    startUploading();
                  }}
                  style={{ display: 'none' }}
                />
              </RaisedButton>
            )}
            {uploading && !(this.props.uploads && this.props.uploads.length > 0) && (
              <>
                <p>
                  Loading...
                </p>
                <LinearProgress
                  mode="indeterminate"
                  color={lightBlue400}
                  style={{ height: '12px' }}
                />
              </>
            )}
            {this.props.uploads && this.props.uploads.length > 0 && (
              <table style={{ marginTop: '20px', width: '100%' }}>
                <tbody>
                  {this.props.uploads.map((upload) => (
                    <TableRow upload={upload} key={upload.signedId} />
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      />
    );
  }

  render() {
    const { 
      batchImagePromptShown,
      closeDialogShown,
      hideBatchImagePrompt,
      hideCloseDialog,
      showCloseDialog,
      uploading,
      uploads,
    } = this.props;
    const projectId = batchImagePromptShown;

    const uploadsNotDone = uploads.some(
      (upload) => upload.state !== 'finished' && upload.state !== 'error'
    );

    return (
      <Dialog
        title="Batch upload images"
        modal={false}
        open={!!batchImagePromptShown}
        onRequestClose={() => {
          if (uploading || (uploads.length > 0 && uploadsNotDone)) {
            showCloseDialog();
          } else {
            hideBatchImagePrompt();
            this.setState({ ...this.defaultState });
          }
        }}
        autoScrollBodyContent={true}
        actions={[
          <FlatButton
            label="Close"
            primary
            onClick={() => {
              if (uploading || (uploads.length > 0 && uploadsNotDone)) {
                showCloseDialog();
              } else {
                hideBatchImagePrompt();
                this.setState({ ...this.defaultState });
              }
            }}
          />,
        ]}
        contentStyle={{ width: '90%', maxWidth: '1000px' }}
      >
        {
          !uploading && 
          !(this.props.uploads && this.props.uploads.length > 0) && 
          this.renderFolderChoice()
        }
        <div style={{ textAlign: 'center' }}>
          {uploading && uploads.length > 0 && uploadsNotDone && (<>
            <p>Upload in progress. Closing this page before uploads complete may result in lost uploads.</p>
            <p>It is also recommended not to close this dialog window.</p>
          </>)}
          {uploads && !uploading && uploads.length > 0 && !uploadsNotDone && (<>
            <p>Upload complete!</p>
            <p>You may now safely close this dialog window and/or page.</p>
          </>)}
        </div>
        {this.renderMultipleUploadButton({ projectId })}
        <CloseDialog 
          closeAction={() => {
            hideBatchImagePrompt();
            hideCloseDialog();
            this.setState({ ...this.defaultState });
          }}
          cancelAction={() => {
            hideCloseDialog();
          }}
          open={closeDialogShown}
        />
      </Dialog>
    );
  }
}

const mapStateToProps = (state) => ({
  batchImagePromptShown: state.project.batchImagePromptShown,
  uploads: state.project.uploads,
  uploading: state.project.uploading,
  contentsChildren: state.project.contentsChildren,
  folderData: state.project.folderData,
  closeDialogShown: state.project.closeDialogShown,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      hideBatchImagePrompt,
      startUploading,
      createBatchImages,
      getFolderData,
      showCloseDialog,
      hideCloseDialog,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(BatchImagePrompt);
