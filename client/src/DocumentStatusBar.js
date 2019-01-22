import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { updateDocument, openDeleteDialog, DOCUMENT_DELETE } from './modules/documentGrid';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';

class DocumentStatusBar extends Component {

    renderStatusMessage() {
        let style = {
            color: this.props.document_kind === 'canvas' ? 'white' : 'black'
        };

        let statusMessage;
        if( this.props.locked ) {
            if( this.props.lockedByMe ) {
                statusMessage = "Check document in for team to edit."
            } else {
                statusMessage = `This document is checked out by ${this.props.lockedByUserName}.`;
                style.display = 'block'
                style.height = '20px'
                style.padding = '5px'
            }
        } else {
            statusMessage = "Check document out to edit it.";
        }

        return (
            <span style={style}>{statusMessage}</span>
        );
    }

    renderCheckInOutButtons() {
        let label;
        if( this.props.locked ) {
            if( this.props.lockedByMe ) {
                label = 'check in';
            } else {
                return null;
            }
        } else {
            label = 'check out';
        }
        
        return (
            <RaisedButton 
                style={{margin: '10px'}}
                label={label}
                onClick={() => {
                    this.props.updateDocument(this.props.document_id, { locked: !this.props.locked }, {adjustLock: true} )
                }}            
            ></RaisedButton>
        );
    }

    renderDeleteButton() {
        // don't allow deletion if locked by someone else
        if( this.props.locked && !this.props.lockedByMe ) return null;

        return (
            <IconButton style={{ float: 'right', marginTop:'5px'}}
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
        if( !this.props.writeEnabled ) return null;
        
        const style = {
            backgroundColor: this.props.document_kind === 'canvas' ? '#424242' : '#ccc',
            paddingLeft: '7px'
        }

        return ( 
            <div style={style} >
                { this.renderCheckInOutButtons() }
                { this.renderStatusMessage() }
                { this.renderDeleteButton() }
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
