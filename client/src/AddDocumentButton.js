import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';

export default class AddDocumentButton extends Component {
  render() {
    const buttonId = `addNewDocumentButton-${this.props.idString}`;
    return (
      <div>
        <FlatButton
          label={this.props.label}
          icon={<AddCircle />}
          style={{margin: 'auto'}}
          onClick={this.props.openDocumentPopover}
          id={buttonId}
        />
        <Popover
          open={this.props.documentPopoverOpen}
          anchorEl={document.getElementById(buttonId)}
          anchorOrigin={{horizontal: 'right', vertical: 'top'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this.props.closeDocumentPopover}
         >
          <Menu>
            <MenuItem primaryText='Text' onClick={() => {
              this.props.textClick();
              this.props.closeDocumentPopover();
            }} />
            <MenuItem primaryText='Image' />
          </Menu>
        </Popover>
      </div>
    );
  }
}
