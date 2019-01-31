import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { loadProject, updateProject, showSettings, hideSettings, setSidebarIsDragging, setSidebarWidth } from './modules/project';
import { selectTarget, closeTarget, closeTargetRollover, promoteTarget } from './modules/annotationViewer';
import { closeDeleteDialog, confirmDeleteDialog, layoutOptions } from './modules/documentGrid';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Drawer from 'material-ui/Drawer';
import Navigation from './Navigation';
import ProjectSettingsDialog from './ProjectSettingsDialog';
import ProjectSidebar from './ProjectSidebar';
import DocumentViewer from './DocumentViewer';
import LinkInspectorPopupLayer from './LinkInspectorPopupLayer';
import SearchResultsPopupLayer from './SearchResultsPopupLayer';

class Project extends Component {
  constructor(props) {
    super(props);

    this.mainContainer = null;
    this.mouseX = 0;
    this.mouseY = 0;
  }

  setFocusHighlight(document_id, highlight_id) {
    const target = this.createTarget(document_id, highlight_id)
    if (target) {
      this.props.selectTarget(target);
    }
  }

  showRollover(document_id, highlight_id) {
    const existingPopover = this.props.selectedTargets.find( target => !target.rollover && target.uid === highlight_id )
    if( !existingPopover ) {
      const target = this.createTarget(document_id, highlight_id)
      target.rollover = true
      this.props.selectTarget(target);
    }
  }

  hideRollover(highlight_uid) {
    const existingRollover = this.props.selectedTargets.find( target => target.rollover && target.uid === highlight_uid )
    if( existingRollover ) {
      this.props.closeTargetRollover(highlight_uid);
    }
  }

  createTarget( documentID, highlightID ) {
    const resource = this.props.openDocuments.find(resource => resource.id.toString() === documentID.toString());
    const target = resource && highlightID ? resource.highlight_map[highlightID] : resource;
    if (target) {
      let newTarget = { ...target }
      newTarget.document_id = documentID;
      newTarget.highlight_id = highlightID ? target.id : null;
      newTarget.document_title = resource.title;
      newTarget.document_kind = resource.document_kind;
      newTarget.startPosition = {
        x: Math.min(Math.max(this.mouseX - this.props.sidebarWidth, 0), this.mainContainer.offsetWidth),
        y: this.mouseY + window.scrollY
      };
      return newTarget
    } else {
      return null
    }
  }

  // const rolloverTimeout = 3000

  // activateRolloverTimer() {
  //   this.deactivateRolloverTimer()
  //   this.rolloverTimer = setTimeout(this.props.closeHandler, rolloverTimeout )
  //   console.log('arm')
  // }

  // deactivateRolloverTimer() {
  //   if( this.rolloverTimer ) {
  //     clearTimeout(this.rolloverTimer)
  //     this.rolloverTimer = null
  //     console.log('disarm')
  //   }
  // }

  componentDidMount() {
    window.setFocusHighlight = this.setFocusHighlight.bind(this);
    window.showRollover = this.showRollover.bind(this);
    window.hideRollover = this.hideRollover.bind(this);
    if (this.props.match.params.slug !== 'new') {
      this.props.loadProject(this.props.match.params.slug, this.props.projectTitle)
    }
  }

  renderDeleteDialog() {
    const { deleteDialogTitle, closeDeleteDialog, deleteDialogSubmit, deleteDialogOpen, deleteDialogBody, confirmDeleteDialog } = this.props;

    return (
      <Dialog
        title={deleteDialogTitle}
        actions={[
          <FlatButton label='Cancel' primary={true} onClick={closeDeleteDialog} />,
          <FlatButton label={deleteDialogSubmit} primary={true} onClick={confirmDeleteDialog} />
        ]}
        modal={true}
        open={deleteDialogOpen}
      >
        {deleteDialogBody}
      </Dialog>
    );
  }

  renderDialogLayers() {
    return (
      <div>
        <LinkInspectorPopupLayer 
          targets={this.props.selectedTargets} 
          closeHandler={this.props.closeTarget} 
          mouseDownHandler={this.props.promoteTarget} 
          openDocumentIds={this.props.openDocumentIds} 
          writeEnabled={this.props.writeEnabled} 
          sidebarWidth={this.props.sidebarWidth} 
        />
        <SearchResultsPopupLayer 
          openDocumentIds={this.props.openDocumentIds} 
          sidebarWidth={this.props.sidebarWidth} 
        />
        { this.renderDeleteDialog() }
        <ProjectSettingsDialog />
      </div>
    );
  }

  renderDocumentViewer = (document,index) => {
    const key = `${document.id}-${document.timeOpened}`;
    return (
      <DocumentViewer 
        key={key} 
        index={index} 
        document_id={document.id}  
        timeOpened={document.timeOpened} 
        resourceName={document.title} 
        document_kind={document.document_kind} 
        content={document.content} 
        highlight_map={document.highlight_map} 
        image_thumbnail_urls={document.image_thumbnail_urls} 
        image_urls={document.image_urls} 
        linkInspectorAnchorClick={() => {this.setFocusHighlight(document.id);}} 
        writeEnabled={this.props.writeEnabled} 
        locked={document.locked}
        lockedByUserName={document.locked_by_user_name}
        lockedByMe={document.locked_by_me}
        numRows={this.numRows}
        firstTarget={document.firstTarget}
      />
    );
  }

  renderDocumentGrid() {
    const { currentLayout, openDocuments } = this.props;
    const newNumRows = Math.max(1, Math.ceil(openDocuments.length / currentLayout.cols));

    // if the number of rows goes up, bump the scroll bar
    if( this.numRows && newNumRows > currentLayout.rows && newNumRows > this.numRows ) {
      const newScrollPos = 100 + window.pageYOffset;
      window.scrollTo(0, newScrollPos);
    }
    this.numRows = newNumRows;

    const gridInnerStyle = { 
      margin: `72px 8px 0 ${this.props.sidebarWidth + 8}px`, 
      display: 'flex', 
      flexWrap: 'wrap', 
      overflow: 'hidden' 
    }

    return (
      <div
        id='document-grid-main'
        ref={el => {this.mainContainer = el;}}
        onMouseMove={event => {this.mouseX = event.clientX; this.mouseY = event.clientY;}}
      >          
        <div 
          id='document-grid-inner'
          style={gridInnerStyle}
        >
          {openDocuments.map( this.renderDocumentViewer )}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <Navigation
          title={this.props.title}
          inputId={this.props.projectId}
          onTitleChange={(event, newValue) => {this.props.updateProject(this.props.projectId, {title: newValue});}}
          isLoading={this.props.loading}
          showSettings={this.props.adminEnabled}
          settingsClick={this.props.showSettings}
        />
        <Drawer docked={true} open={true} width={this.props.sidebarWidth}>
          <ProjectSidebar sidebarTarget={this.props.sidebarTarget} contentsChildren={this.props.contentsChildren} openDocumentIds={this.props.openDocumentIds} writeEnabled={this.props.writeEnabled} />
        </Drawer>
        { this.renderDialogLayers() }
        { this.renderDocumentGrid() }
      </div>
    );
  }
}

const mapStateToProps = state => ({
  currentUser:        state.reduxTokenAuth.currentUser,
  projectId:          state.project.id,
  title:              state.project.title,
  loading:            state.project.loading,
  errored:            state.project.errored,
  adminUsers:         state.project.adminUsers,
  contentsChildren:   state.project.contentsChildren,
  sidebarWidth:       state.project.sidebarWidth,
  sidebarIsDragging:  state.project.sidebarIsDragging,
  writeEnabled:       state.project.currentUserPermissions.write,
  adminEnabled:       state.project.currentUserPermissions.admin,
  openDocuments:      state.documentGrid.openDocuments,
  openDocumentIds:    state.documentGrid.openDocuments.map(document => document.id.toString()),
  deleteDialogOpen:   state.documentGrid.deleteDialogOpen,
  deleteDialogTitle:  state.documentGrid.deleteDialogTitle,
  deleteDialogBody:   state.documentGrid.deleteDialogBody,
  deleteDialogSubmit: state.documentGrid.deleteDialogSubmit,
  currentLayout:      layoutOptions[state.documentGrid.currentLayout],
  selectedTargets:    state.annotationViewer.selectedTargets,
  sidebarTarget:      state.annotationViewer.sidebarTarget
});

const mapDispatchToProps = dispatch => bindActionCreators({
  loadProject,
  updateProject,
  selectTarget,
  closeTarget,
  closeTargetRollover,
  promoteTarget,
  closeDeleteDialog,
  confirmDeleteDialog,
  showSettings,
  hideSettings,
  setSidebarIsDragging,
  setSidebarWidth
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DragDropContext(HTML5Backend)(Project));
