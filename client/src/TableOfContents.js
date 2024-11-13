import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { faintBlack, white } from 'material-ui/styles/colors'
import { toggleSidebar, showBatchImagePrompt } from './modules/project';
import { createTextDocument, createCanvasDocument } from './modules/documentGrid';
import { createFolder } from './modules/folders';
import AddDocumentButton from './AddDocumentButton';
import AddFolderButton from './AddFolderButton';
import LinkableList from './LinkableList';
import { Toolbar, ToolbarGroup, Drawer, IconButton } from 'material-ui';
import Settings from 'material-ui/svg-icons/action/settings';
import MoveToInbox from 'material-ui/svg-icons/content/move-to-inbox';
import NoteAdd from 'material-ui/svg-icons/action/note-add';
import Image from 'material-ui/svg-icons/image/image';
import AddToPhotos from 'material-ui/svg-icons/image/add-to-photos';

class TableOfContents extends Component {

  render() {
    const { sidebarWidth, sidebarOpen, adminEnabled, projectId, contentsChildren, openDocumentIds, writeEnabled } = this.props

    return (
      <Drawer open={sidebarOpen} width={sidebarWidth} containerStyle={{overflowX: 'hidden', overflowY: 'auto'}}>
        <div style={{minHeight: '100%', paddingTop: '62px'}}>
          <div style={{flexGrow: '1'}}>
            { writeEnabled &&
              <Toolbar noGutter={true} style={{
                marginLeft: 0,
                background: white,
                position: "sticky",
                top: 62,
                zIndex: 2,
                minHeight: 72,
                padding: 10,
                boxShadow: `0px 1px 6px ${faintBlack}`,
              }}>
                <ToolbarGroup style={{ width: "100%" }}>
                  <AddDocumentButton
                    label="Add Text"
                    onClick={() => {this.props.createTextDocument(projectId, 'Project');}}
                    icon={<NoteAdd />}
                    addType="text"
                  />
                  <AddDocumentButton
                    label="Add Image"
                    onClick={() => {
                      this.props.createCanvasDocument({
                        parentId: projectId,
                        parentType: 'Project',
                      });
                    }}
                    icon={<Image />}
                    addType="image"
                  />
                  <AddDocumentButton
                    label="Add Batch"
                    onClick={() => this.props.showBatchImagePrompt({ projectId })}
                    icon={<AddToPhotos />}
                    addType="batch"
                  />
                  <AddFolderButton
                    onClick={() => {this.props.createFolder(projectId, 'Project');}}
                  />
                  <IconButton
                    onClick={this.props.checkInAllClick}
                    style={{ width: '44px', height: '44px', marginLeft: '6px' }}
                    iconStyle={{ width: '20px', height: '20px' }}
                    tooltip="Check in all documents"
                  >
                    <MoveToInbox />
                  </IconButton>
                  { adminEnabled && 
                    <IconButton 
                      onClick={this.props.settingsClick}
                      style={{ width: '44px', height: '44px', marginLeft: '6px' }}
                      iconStyle={{ width: '20px', height: '20px' }}
                      tooltip="Project settings"
                      tooltipPosition='bottom-left'
                    >
                      <Settings />
                    </IconButton>
                  }
                </ToolbarGroup>
              </Toolbar>
            }
            <LinkableList 
              items={contentsChildren} 
              inContents={true} 
              openDocumentIds={openDocumentIds} 
              allDraggable={writeEnabled} 
              writeEnabled={writeEnabled} 
              adminEnabled={adminEnabled}
            />
          </div>
        </div>
      </Drawer>
    );
  }
}

const mapStateToProps = state => ({
  projectId: state.project.id,
  sidebarOpen: state.project.sidebarOpen
});

const mapDispatchToProps = dispatch => bindActionCreators({
  createTextDocument,
  createCanvasDocument,
  createFolder,
  toggleSidebar,
  showBatchImagePrompt,
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TableOfContents);
