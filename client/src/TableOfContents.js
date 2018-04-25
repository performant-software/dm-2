import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FlatButton from 'material-ui/FlatButton';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import { openDocumentPopover, closeDocumentPopover } from './modules/tableOfContents';
import { createTextDocument } from './modules/documentGrid';
import LinkableList from './LinkableList';

class TableOfContents extends Component {
  constructor(props) {
    super(props);

    this.newDocumentButton = null;
  }

  render() {
    return (
      <div>
        <FlatButton
          label='Add New Document'
          icon={<AddCircle />}
          style={{margin: 'auto'}}
          onClick={this.props.openDocumentPopover}
          id='addNewDocumentButton'
        />
        <Popover
          open={this.props.documentPopoverOpen}
          anchorEl={document.getElementById('addNewDocumentButton')}
          anchorOrigin={{horizontal: 'right', vertical: 'top'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this.props.closeDocumentPopover}
         >
          <Menu>
            <MenuItem primaryText='Text' onClick={() => {
              this.props.createTextDocument(this.props.projectId, 'Project');
              this.props.closeDocumentPopover();
            }} />
            <MenuItem primaryText='Image' />
          </Menu>
        </Popover>
        <LinkableList items={this.props.contentsChildren} openDocumentIds={this.props.openDocumentIds} allDraggable={true} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  documentPopoverOpen: state.tableOfContents.documentPopoverOpen,
  projectId: state.project.id,
  openDocumentIds: state.documentGrid.openDocuments.map(document => document.id.toString())
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
