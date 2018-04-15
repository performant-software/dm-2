import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { loadProject } from './modules/project';
import { openDummyResources } from './modules/resourceGrid';
import { selectTarget, clearSelection } from './modules/annotationViewer';
import ResourceViewer from './ResourceViewer';
import AnnotationPopup from './AnnotationPopup';

class Project extends Component {
  setFocusHighlight(resourceId, highlightId) {
    const resource = this.props.openResources.find(resource => resource.id === resourceId);
    const target = resource && highlightId ? resource.highlights[highlightId] : resource;
    if (target) {
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
      <div style={{ margin: '15px', display: 'grid', gridTemplateRows: '500px 500px', gridTemplateColumns: '1fr 1fr', gridGap: '20px' }}>
        {this.props.openResources.map(resource => (
          <ResourceViewer key={resource.id} resourceId={resource.id} resourceName={resource.title} resourceType={resource.type} content={resource.content} highlights={resource.highlights} />
        ))}
        <AnnotationPopup target={this.props.selectedTarget} resources={this.props.allResources} closeHandler={this.props.clearSelection} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  allResources: state.project.resources,
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
