import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FlatButton from 'material-ui/FlatButton';
import ArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import { closeSidebarTarget } from './modules/annotationViewer';
import LinkInspector from './LinkInspector';

class SidebarLinkInspectorContainer extends Component {
  render() {
    return (
      <div>
        <FlatButton
          label="Return to Table of Contents"
          icon={<ArrowBack />}
          onClick={this.props.closeSidebarTarget}
          id="returnToTOCButton"
        />
        <LinkInspector
          target={this.props.target}
          openDocumentIds={this.props.openDocumentIds}
          id="sidebarLinkInspector"
          writeEnabled={this.props.writeEnabled}
          adminEnabled={this.props.adminEnabled}
        />
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  closeSidebarTarget,
}, dispatch);

export default connect(
  null,
  mapDispatchToProps,
)(SidebarLinkInspectorContainer);
