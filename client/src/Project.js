import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import { loadProject, loadDummyProject, updateProject } from './modules/project';
import { openDummyResources } from './modules/documentGrid';
import { selectTarget, clearSelection } from './modules/annotationViewer';
import Navigation from './Navigation';
import ProjectSidebar from './ProjectSidebar';
import DocumentViewer from './DocumentViewer';
import AnnotationPopup from './AnnotationPopup';

class Project extends Component {
  setFocusHighlight(resourceId, highlightId) {
    console.log(resourceId + ' - ' + highlightId);
    const resource = this.props.openDocuments.find(resource => resource.id.toString() === resourceId.toString());
    console.log(this.props.openDocuments);
    const target = resource && highlightId ? resource.highlight_map[highlightId] : resource;
    if (target) {
      target.resourceName = resource.title;
      target.document_kind = resource.document_kind;
      this.props.selectTarget(target);
    }
  }

  componentDidMount() {
    window.setFocusHighlight = this.setFocusHighlight.bind(this);
    if (this.props.match.params.slug === 'project') {
      this.props.loadDummyProject();
      this.props.openDummyResources();
    }
    else if (this.props.match.params.slug !== 'new') {
      this.props.loadProject(this.props.match.params.slug, this.props.projectTitle)
    }
  }

  render() {
    return (
      <div>
        <Navigation title={this.props.title} inputId={this.props.projectId} onTitleChange={(event, newValue) => {this.props.updateProject(this.props.projectId, {title: newValue});}} isLoading={this.props.loading} />
        <SplitPane split='vertical' minSize={250} maxSize={600} defaultSize={350}>
          <ProjectSidebar contentsChildren={this.props.contentsChildren} />
          <div style={{ margin: '80px 16px 16px 16px', display: 'grid', gridTemplateRows: '500px 500px', gridTemplateColumns: '1fr 1fr', gridGap: '20px' }}>
            {this.props.openDocuments.map(resource => (
              <DocumentViewer key={resource.id} resourceId={resource.id} resourceName={resource.title} document_kind={resource.document_kind} content={resource.content} highlight_map={resource.highlight_map} />
            ))}
            <AnnotationPopup target={this.props.selectedTarget} closeHandler={this.props.clearSelection} />
          </div>
        </SplitPane>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  projectId: state.project.id,
  title: state.project.title,
  loading: state.project.loading,
  errored: state.project.errored,
  contentsChildren: state.project.contentsChildren,
  openDocuments: state.documentGrid.openDocuments,
  selectedTarget: state.annotationViewer.selectedTarget
});

const mapDispatchToProps = dispatch => bindActionCreators({
  loadProject,
  loadDummyProject,
  updateProject,
  openDummyResources,
  selectTarget,
  clearSelection
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Project);
