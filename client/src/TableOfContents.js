import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import CreateNewFolder from 'material-ui/svg-icons/file/create-new-folder';
import { white } from 'material-ui/styles/colors'
import { openDocumentPopover, closeDocumentPopover, toggleSidebar } from './modules/project';
import { createTextDocument, createCanvasDocument } from './modules/documentGrid';
import { createFolder } from './modules/folders';
import AddDocumentButton from './AddDocumentButton';
import LinkableList from './LinkableList';
import ArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import { Toolbar, ToolbarGroup, FlatButton, Drawer, IconButton } from 'material-ui';
import Settings from 'material-ui/svg-icons/action/settings';
import MoveToInbox from 'material-ui/svg-icons/content/move-to-inbox';
import { clearSelection } from './modules/annotationViewer'

class TableOfContents extends Component {

  onCloseProject = () => {
    this.props.clearSelection()
    this.props.returnHome()
  }

  render() {
    const { sidebarWidth, sidebarOpen, showSettings, projectId, contentsChildren, openDocumentIds, writeEnabled } = this.props

    return (
      <Drawer open={sidebarOpen} width={sidebarWidth}>
        <div style={{minHeight: '100%', paddingTop: '72px', display: 'flex', alignItems: 'stretch'}}>
          <div style={{flexGrow: '1'}}>
            { writeEnabled &&
              <Toolbar noGutter={true} style={{marginLeft: 10, background: white}}>
                <ToolbarGroup >
                  <IconButton onClick={this.onCloseProject} ><ArrowBack /></IconButton>
                  <AddDocumentButton 
                    label='New Item' 
                    documentPopoverOpen={this.props.documentPopoverOpen} 
                    openDocumentPopover={() => this.props.openDocumentPopover('tableOfContents')} 
                    closeDocumentPopover={this.props.closeDocumentPopover} 
                    textClick={() => {this.props.createTextDocument(projectId, 'Project');}} 
                    imageClick={() => {this.props.createCanvasDocument(projectId, 'Project');}} 
                    idString='tableOfContents' 
                  />
                  <FlatButton
                    label={'New Folder'}
                    icon={<CreateNewFolder />}
                    onClick={() => {this.props.createFolder(projectId, 'Project');}}
                  />
                    <IconButton onClick={this.props.settingsClick} style={{ width: '44px', height: '44px', marginLeft: '6px' }} iconStyle={{ width: '20px', height: '20px' }}><MoveToInbox /></IconButton>
                  { showSettings && 
                    <IconButton onClick={this.props.settingsClick} style={{ width: '44px', height: '44px', marginLeft: '6px' }} iconStyle={{ width: '20px', height: '20px' }}><Settings /></IconButton>
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
            />
          </div>
        </div>
      </Drawer>
    );
  }
}

const mapStateToProps = state => ({
  documentPopoverOpen: state.project.documentPopoverOpenFor === 'tableOfContents',
  projectId: state.project.id,
  sidebarOpen: state.project.sidebarOpen
});

const mapDispatchToProps = dispatch => bindActionCreators({
  returnHome: () => push('/'),
  clearSelection,
  openDocumentPopover,
  closeDocumentPopover,
  createTextDocument,
  createCanvasDocument,
  createFolder,
  toggleSidebar
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TableOfContents);
