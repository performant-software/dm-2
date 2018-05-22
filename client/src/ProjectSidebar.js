import React, { Component } from 'react';
import { grey400, yellow50 } from 'material-ui/styles/colors';
import TableOfContents from './TableOfContents';
import SidebarLinkInspectorContainer from './SidebarLinkInspectorContainer';

export default class ProjectSidebar extends Component {
  render() {
    if (this.props.sidebarTarget) {
      return (
        <div style={{backgroundColor: yellow50, height: '100%', paddingTop: '72px'}}>
          <SidebarLinkInspectorContainer target={this.props.sidebarTarget} openDocumentIds={this.props.openDocumentIds} />
        </div>
      );
    }
    return (
      <div style={{backgroundColor: 'white', height: '100%', paddingTop: '72px'}}>
        <TableOfContents contentsChildren={this.props.contentsChildren} openDocumentIds={this.props.openDocumentIds} />
      </div>
    );
  }
}
