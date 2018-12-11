import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { updateDocument, closeDocument, moveDocument, openDeleteDialog, DOCUMENT_DELETE } from './modules/documentGrid';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';

class DocumentStatusBar extends Component {

    renderStatusMessage() {

        const style = {
            color: this.props.document_kind === 'canvas' ? 'white' : 'black'
        };
        // Checkout out by another state
        const statusMessage = this.props.locked ? "Check this document in to allow others to edit." : "Check this document out to edit it.";

        return (
            <span style={style}>{statusMessage}</span>
        );
    }

    renderCheckInOutButtons() {
        const label = this.props.locked ? 'check in' : 'check out';
        
        return (
            <RaisedButton 
                style={{margin: '10px'}}
                label={label}
                onClick={() => {
                    // TODO
                }}            
            ></RaisedButton>
        );
    }

    renderDeleteButton() {
        return (
            <IconButton style={{ float: 'right', marginTop:'5px'}}
                tooltip='Delete document'
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
    closeDocument,
    moveDocument,
    openDeleteDialog
}, dispatch);
  
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DocumentStatusBar);
