import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';
import { grey600, grey900, red800 } from 'material-ui/styles/colors';
import { openFolder, closeFolder, updateFolder } from './modules/folders';
import { updateDocument, openDeleteDialog, FOLDER_DELETE } from './modules/documentGrid';
import { loadProject } from './modules/project';
import LinkableList from './LinkableList';
import LinkableSummary from './LinkableSummary';

const titleChangeDelayMs = 800;

const FolderContents = props => {
  switch (props.contents) {
    case 'loading':
      return <p style={{ color: grey600 }}>Loading...</p>;

    case 'errored':
      return <p style={{ color: red800 }}>Error!</p>;

    default:
      if (props.contents.length > 0) {
        return (
          <LinkableList items={props.contents} openDocumentIds={props.openDocumentIds} writeEnabled={props.writeEnabled} allDraggable={props.allDraggable} insideFolder={true} inContents={true} parentFolderId={props.parentFolderId} />
        );
      }
      return <p style={{ color: grey600 }}>Empty</p>;
  }
}

class DocumentFolder extends Component {
  render() {
    return (
      <LinkableSummary {...this.props} isFolder={true} borderBold={this.props.isOver} noMargin={true}>
        <div style={{ display: 'flex' }}>
          <TextField
            autoComplete='off'
            inputStyle={{ color: grey900, height: '20px' }}
            style={{ flexGrow: '1', height: '20px', cursor: 'text' }}
            id={'folderTitleField-' + this.props.item.id}
            defaultValue={this.props.item.document_title}
            disabled={!this.props.writeEnabled}
            underlineShow={false}
            onChange={(event, newValue) => {
              window.clearTimeout(this['folderTitleChangeTimeout_' + this.props.item.id]);
              this['folderTitleChangeTimeout_' + this.props.item.id] = window.setTimeout(() => {
                this.props.updateFolder(this.props.item.id, {title: newValue});
              }, titleChangeDelayMs);
            }}
            onClick={event => {
              event.stopPropagation();
              return 0;
            }}
          />
          {this.props.isOpen && this.props.writeEnabled &&
            <IconButton
              style={{ width: '18px', height: '18px', padding: '0' }}
              iconStyle={{ width: '18px', height: '18px' }}
              onClick={() => {
                this.props.openDeleteDialog(
                  'Destroying "' + this.props.item.document_title + '"',
                  'Deleting this folder will destroy all its contents. If you wish to preserve any documents or folders inside, click Cancel and move them out of this folder before deleting it.',
                  'Destroy folder',
                  { folderId: this.props.item.id, parentType: this.props.item.parent_type, parentId: this.props.parentId },
                  FOLDER_DELETE
                );
              }}
            >
              <DeleteForever />
            </IconButton>
          }
        </div>
        {this.props.isOpen &&
          <FolderContents contents={this.props.contents} writeEnabled={this.props.writeEnabled} allDraggable={this.props.isDraggable} openDocumentIds={this.props.openDocumentIds} parentFolderId={this.props.item.id} />
        }
      </LinkableSummary>
    );
  }
}

const mapStateToProps = state => ({
  openFolderContents: state.folders.openFolderContents,
  projectId: state.project.id
});

const mapDispatchToProps = dispatch => bindActionCreators({
  openFolder,
  closeFolder,
  updateDocument,
  updateFolder,
  loadProject,
  openDeleteDialog
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocumentFolder);
