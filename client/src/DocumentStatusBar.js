import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { updateDocument, openDeleteDialog, DOCUMENT_DELETE } from './modules/documentGrid';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';
import Popover from 'material-ui/Popover';
import CircularProgress from 'material-ui/CircularProgress';

class DocumentStatusBar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tooltipOpen: {},
      tooltipAnchor: {},
    }
  }

  renderLastSaved() {
    let style = {
      color: this.props.document_kind === 'canvas' ? 'lightgray' : 'gray',
      marginLeft: '6px',
    };
    const saving = !this.props.doneSaving && !this.props.loading;
    const show = !saving && this.props.lastSaved !== '' && this.props.locked && this.props.lockedByMe;
    return (
      <span style={style}>{show ? `Saved: ${this.props.lastSaved}` : ''}</span>
    );
  }

  getStatusMessage() {
    let statusMessage = '';
    if (this.props.locked) {
      if (this.props.lockedByMe) {
        statusMessage = "Check document in for team to edit."
      } else {
        statusMessage = `This document is checked out by ${this.props.lockedByUserName}.`;
      }
    } else {
      statusMessage = "Check document out to edit it.";
    }

    return statusMessage;
  }

  onTooltipOpen(anchor, e) {
    e.persist();
    const anchorEl = e.currentTarget;
    e.preventDefault();
    this.setState((prevState) => {
      return {
        ...prevState,
        tooltipOpen: { ...prevState.tooltipOpen, [anchor]: true },
        tooltipAnchor: { ...prevState.tooltipAnchor, [anchor]: anchorEl },
      }
    });
  }

  onTooltipClose(anchor) {
    this.setState((prevState) => {
      return {
        ...prevState,
        tooltipOpen: { ...prevState.tooltipOpen, [anchor]: false },
      }
    });
  }

  renderTooltip({ name, text }) {
    return (
      <Popover
        key={name}
        open={this.state.tooltipOpen[name]}
        anchorEl={this.state.tooltipAnchor[name]}
        zDepth={5}
        className="tooltip-popover tooltip-above"
        anchorOrigin={{ horizontal: 'middle', vertical: 'top' }}
        targetOrigin={{ horizontal: 'middle', vertical: 'bottom' }}
        useLayerForClickAway={false}
        autoCloseWhenOffScreen={false}
      >
        {text}
      </Popover>
    );
  }


  renderCheckInOutButtons() {
    let label;
    if (this.props.locked) {
      if (this.props.lockedByMe) {
        label = 'check in';
      } else {
        label = 'checked out';
      }
    } else {
      label = 'check out';
    }

    return (
      <RaisedButton
        style={{ margin: '10px' }}
        label={label}
        onClick={() => {
          this.props.updateDocument(this.props.document_id, { locked: !this.props.locked }, {
            adjustLock: true,
            instanceKey: this.props.instanceKey,
          })
        }}
        onMouseOver={this.onTooltipOpen.bind(this, 'checkInOut')}
        onMouseOut={this.onTooltipClose.bind(this, 'checkInOut')}
        disabled={this.props.loading || (this.props.locked && !this.props.lockedByMe)}
      />
    );
  }

  renderSaveIcon() {
    if (!this.props.locked || (this.props.locked && !this.props.lockedByMe)) return null;
    const saving = !this.props.doneSaving && !this.props.loading;
    const style = {
      verticalAlign: 'middle',
      width: '24px',
      maxWidth: '24px',
      minWidth: '24px',
      height: '24px',
      maxHeight: '24px',
      minHeight: '24px',
      marginLeft: '6px',
      color: 'gray'
    };
    return (
      <>
        {saving && (
          <CircularProgress
            size={24}
            style={style}
            color="gray"
          />
        )}
      </>
    )
  }

  renderDeleteButton() {
    // don't allow deletion if locked by someone else
    if (this.props.locked && !this.props.lockedByMe) return null;

    return (
      <IconButton style={{ float: 'right', marginTop: '5px' }}
        tooltip='Delete document'
        tooltipPosition='top-left'
        onClick={() => {
          this.props.openDeleteDialog(
            'Destroying "' + this.props.resourceName + '"',
            'Deleting this document will destroy all its associated highlights and links, as well as the content of the document itself.',
            'Destroy document',
            { documentId: this.props.document_id },
            DOCUMENT_DELETE
          );
        }}
      >
        <DeleteForever color={this.props.document_kind === 'canvas' ? '#FFF' : '#000'} />
      </IconButton>
    );
  }

  render() {
    if (!this.props.writeEnabled) return null;

    const style = {
      backgroundColor: this.props.document_kind === 'canvas' ? '#424242' : '#ccc',
      paddingLeft: '7px',
      zIndex: 2,
    }

    return (
      <div style={style} >
        {this.renderCheckInOutButtons()}
        {this.renderSaveIcon()}
        {this.renderLastSaved()}
        {this.renderDeleteButton()}
        {this.renderTooltip({ name: 'checkInOut', text: this.getStatusMessage() })}
      </div>
    );
  }
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = dispatch => bindActionCreators({
  updateDocument,
  openDeleteDialog
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocumentStatusBar);
