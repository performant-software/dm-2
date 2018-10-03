import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { grey400, yellow50 } from 'material-ui/styles/colors';
import { setSidebarWidth, setSidebarIsDragging } from './modules/project';
import TableOfContents from './TableOfContents';
import SidebarLinkInspectorContainer from './SidebarLinkInspectorContainer';

const SidebarInner = props => {
  if (props.sidebarTarget) {
    return (
      <SidebarLinkInspectorContainer target={props.sidebarTarget} openDocumentIds={props.openDocumentIds} writeEnabled={props.writeEnabled} />
    );
  }
  return (
    <TableOfContents contentsChildren={props.contentsChildren} openDocumentIds={props.openDocumentIds} writeEnabled={props.writeEnabled} />
  );
}

class ProjectSidebar extends Component {
  startDragging(event) {
    this.props.setSidebarIsDragging(true);
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
  };

  onMouseMove(event) {
    if (this.props.sidebarIsDragging) {
      this.props.setSidebarWidth(event.clientX);
    }
  }

  onMouseUp(event) {
    if (this.props.sidebarIsDragging) {
      this.props.setSidebarIsDragging(false);
      window.removeEventListener('mousemove', this.onMouseMove.bind(this));
      window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    }
  }

  render() {
    return (
      <div style={{backgroundColor: this.props.sidebarTarget ? yellow50 : 'white', minHeight: '100%', paddingTop: '72px', display: 'flex', alignItems: 'stretch'}}>
        <div style={{flexGrow: '1'}}>
          <SidebarInner {...this.props} />
        </div>
        <div draggable={true} onDragStart={this.startDragging.bind(this)} style={{ width: '6px', cursor: 'col-resize' }}>&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  sidebarWidth: state.project.sidebarWidth,
  sidebarIsDragging: state.project.sidebarIsDragging
});

const mapDispatchToProps = dispatch => bindActionCreators({
  setSidebarWidth,
  setSidebarIsDragging
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectSidebar);
