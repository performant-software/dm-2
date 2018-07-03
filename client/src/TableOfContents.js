import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FlatButton from 'material-ui/FlatButton';
import CreateNewFolder from 'material-ui/svg-icons/file/create-new-folder';
import { openDocumentPopover, closeDocumentPopover } from './modules/project';
import { createTextDocument, createCanvasDocument } from './modules/documentGrid';
import { createFolder } from './modules/folders';
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
        {this.props.writeEnabled &&
          <div>
            <AddDocumentButton label='Add New Document' documentPopoverOpen={this.props.documentPopoverOpen} openDocumentPopover={() => this.props.openDocumentPopover('tableOfContents')} closeDocumentPopover={this.props.closeDocumentPopover} textClick={() => {this.props.createTextDocument(this.props.projectId, 'Project');}} imageClick={() => {this.props.createCanvasDocument(this.props.projectId, 'Project');}} idString='tableOfContents' />
            <FlatButton
              label={'Add Folder'}
              icon={<CreateNewFolder />}
              style={{margin: 'auto'}}
              onClick={() => {this.props.createFolder(this.props.projectId, 'Project');}}
            />
          </div>
        }
        <LinkableList items={this.props.contentsChildren} inContents={true} openDocumentIds={this.props.openDocumentIds} allDraggable={this.props.writeEnabled} writeEnabled={this.props.writeEnabled} />
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
  createTextDocument,
  createCanvasDocument,
  createFolder
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TableOfContents);
