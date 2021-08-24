import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import Toggle from 'material-ui/Toggle';
import {
  red50, red400, red600, lightBlue50, grey200,
} from 'material-ui/styles/colors';
import { hideAdminDialog, updateUser, deleteUser } from './modules/home';

class AdminDialog extends Component {
  render() {
    return (
      <Dialog
        title="Site administration"
        modal={false}
        open={this.props.adminDialogShown}
        onRequestClose={this.props.hideAdminDialog}
        autoScrollBodyContent
        actions={[
          <FlatButton
            label="Close"
            primary
            onClick={this.props.hideAdminDialog}
          />,
        ]}
        contentStyle={{ width: '90%', maxWidth: '1000px' }}
      >
        <Table selectable={false}>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            <TableRow>
              <TableHeaderColumn>Email</TableHeaderColumn>
              <TableHeaderColumn>Name</TableHeaderColumn>
              <TableHeaderColumn>Approved</TableHeaderColumn>
              <TableHeaderColumn>Site admin</TableHeaderColumn>
              <TableHeaderColumn />
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            {this.props.userAdminList.map((user) => (
              <TableRow key={user.id} style={{ background: user.approved ? (user.admin ? lightBlue50 : 'initial') : red50 }}>
                <TableRowColumn>{user.email}</TableRowColumn>
                <TableRowColumn>{user.name}</TableRowColumn>
                <TableRowColumn>
                  <Toggle toggled={user.approved} disabled={user.id === this.props.currentUser.attributes.id} onToggle={(event, isInputChecked) => { this.props.updateUser(user.id, { approved: isInputChecked }); }} />
                </TableRowColumn>
                <TableRowColumn>
                  <Toggle toggled={user.admin} disabled={user.id === this.props.currentUser.attributes.id} onToggle={(event, isInputChecked) => { this.props.updateUser(user.id, { admin: isInputChecked }); }} />
                </TableRowColumn>
                <TableRowColumn>
                  <FlatButton label="Delete" disabled={user.id === this.props.currentUser.attributes.id} onClick={() => { this.props.deleteUser(user.id); }} backgroundColor={red400} hoverColor={red600} style={{ color: user.id === this.props.currentUser.attributes.id ? grey200 : 'white' }} />
                </TableRowColumn>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Dialog>
    );
  }
}

const mapStateToProps = (state) => ({
  currentUser: state.reduxTokenAuth.currentUser,
  adminDialogShown: state.home.adminDialogShown,
  userAdminList: state.home.userAdminList,
  userAdminListLoading: state.home.userAdminListLoading,
  userAdminListErrored: state.home.userAdminListErrored,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  hideAdminDialog,
  updateUser,
  deleteUser,
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AdminDialog);
