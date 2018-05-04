import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { openDocumentPopover, closeDocumentPopover } from './modules/project';
import { createTextDocument } from './modules/documentGrid';
import AddDocumentButton from './AddDocumentButton';
import LinkableList from './LinkableList';

class TableOfContents extends Component {
  constructor(props) {
    super(props);

    this.newDocumentButton = null;
  }

  render() {
    return (
      <div>
        <AddDocumentButton label='Add New Document' documentPopoverOpen={this.props.documentPopoverOpen} openDocumentPopover={() => this.props.openDocumentPopover('tableOfContents')} closeDocumentPopover={this.props.closeDocumentPopover} textClick={() => {this.props.createTextDocument(this.props.projectId, 'Project');}} idString='tableOfContents' />
        <LinkableList items={this.props.contentsChildren} openDocumentIds={this.props.openDocumentIds} allDraggable={true} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  documentPopoverOpen: state.project.documentPopoverOpenFor === 'tableOfContents',
  projectId: state.project.id
});

const mapDispatchToProps = dispatch => bindActionCreators({
  openDocumentPopover,
  closeDocumentPopover,
  createTextDocument
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TableOfContents);
