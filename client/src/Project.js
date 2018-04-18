import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import { loadProject } from './modules/project';
import { openDummyResources } from './modules/resourceGrid';
import { selectTarget, clearSelection } from './modules/annotationViewer';
import Navigation from './Navigation';
import ProjectSidebar from './ProjectSidebar';
import ResourceViewer from './ResourceViewer';
import AnnotationPopup from './AnnotationPopup';

class Project extends Component {
  setFocusHighlight(resourceId, highlightId) {
    const resource = this.props.openResources.find(resource => resource.id === resourceId);
    const target = resource && highlightId ? resource.highlights[highlightId] : resource;
    if (target) {
      target.resourceName = resource.title;
      target.documentKind = resource.documentKind;
      this.props.selectTarget(target);
    }
  }

  componentDidMount() {
    window.setFocusHighlight = this.setFocusHighlight.bind(this);
    this.props.loadProject();
    this.props.openDummyResources();
  }

  render() {
    return (
      <div>
        <Navigation title='Dummy Project' />
        <SplitPane split='vertical' minSize={250} maxSize={600} defaultSize={350}>
          <ProjectSidebar contentsChildren={this.props.contentsChildren} />
          <div style={{ margin: '80px 16px 16px 16px', display: 'grid', gridTemplateRows: '500px 500px', gridTemplateColumns: '1fr 1fr', gridGap: '20px' }}>
            {this.props.openResources.map(resource => (
              <ResourceViewer key={resource.id} resourceId={resource.id} resourceName={resource.title} documentKind={resource.documentKind} content={resource.content} highlights={resource.highlights} />
            ))}
            <AnnotationPopup target={this.props.selectedTarget} closeHandler={this.props.clearSelection} />
          </div>
        </SplitPane>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  contentsChildren: state.project.contentsChildren,
  openResources: state.resourceGrid.openResources,
  selectedTarget: state.annotationViewer.selectedTarget
});

const mapDispatchToProps = dispatch => bindActionCreators({
  loadProject,
  openDummyResources,
  selectTarget,
  clearSelection
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Project);
