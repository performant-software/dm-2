import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import CircularProgress from 'material-ui/CircularProgress';
import TextField from 'material-ui/TextField';
import { Tabs, Tab } from 'material-ui/Tabs';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import AutoComplete from 'material-ui/AutoComplete';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import Toggle from 'material-ui/Toggle';
import Checkbox from 'material-ui/Checkbox';
import Divider from 'material-ui/Divider';
import { red100, red200, red400, red600, lightBlue100, lightBlue200, grey200, grey600 } from 'material-ui/styles/colors';
import { hideSettings, updateProject, setNewPermissionUser, setNewPermissionLevel, createNewPermission, deletePermission, updatePermission, toggleDeleteConfirmation, deleteProject, READ_PERMISSION, WRITE_PERMISSION, ADMIN_PERMISSION } from './modules/project';

class ProjectSettingsDialog extends Component {
  render() {
    let usersDataSource = [];
    const permissionIds = this.props.userProjectPermissions.map(userProjectPermission => userProjectPermission.user.id);
    this.props.allUsers.forEach(user => {
      if (!permissionIds.includes(user.id)) {
        usersDataSource.push({
          textKey: user.name,
          valueKey: user.id
        });
      }
    });
    let usersDataSourceConfig = {
      text: 'textKey',
      value: 'valueKey',
    };

    return (
      <Dialog
        title='Project settings'
        modal={false}
        open={this.props.settingsShown}
        onRequestClose={this.props.hideSettings}
        autoScrollBodyContent={true}
        actions={[
          <FlatButton
            label='Close'
            primary={true}
            onClick={this.props.hideSettings}
          />
        ]}
        contentStyle={{ width: '90%', maxWidth: '1000px' }}
      >
        <Tabs tabItemContainerStyle={{ background: grey600 }}>
          <Tab label='Project'>
            <TextField
              defaultValue={this.props.title}
              floatingLabelText='Title'
              onChange={(event, newValue) => {this.scheduleProjectTitleUpdate(newValue);}}
            /><br />
            <TextField
              defaultValue={this.props.description}
              floatingLabelText='Description'
              onChange={(event, newValue) => {this.scheduleProjectDescriptionUpdate(newValue);}}
              multiLine={true}
              rows={4}
              rowsMax={2}
            />
          </Tab>
          <Tab label='Collaborators'>
            <Table selectable={false}>
              <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                <TableRow>
                  <TableHeaderColumn>Name</TableHeaderColumn>
                  {this.props.currentUser.attributes.admin &&
                    <TableHeaderColumn>Email</TableHeaderColumn>
                  }
                  <TableHeaderColumn>Permission level</TableHeaderColumn>
                  <TableHeaderColumn></TableHeaderColumn>
                </TableRow>
              </TableHeader>
              <TableBody displayRowCheckbox={false}>
                {this.props.userProjectPermissions.map(userProjectPermission => (
                  <TableRow key={userProjectPermission.id}>
                    <TableRowColumn>{userProjectPermission.user.name}</TableRowColumn>
                    {this.props.currentUser.attributes.admin &&
                      <TableRowColumn>{userProjectPermission.user.user_email}</TableRowColumn>
                    }
                    <TableRowColumn>
                      <SelectField
                        value={userProjectPermission.permission}
                        onChange={(event, index, newValue) => {this.props.updatePermission(userProjectPermission.id, newValue);}}
                        disabled={this.props.currentUser.attributes.id === userProjectPermission.user.id}
                      >
                        <MenuItem value={READ_PERMISSION} primaryText='Read' />
                        <MenuItem value={WRITE_PERMISSION} primaryText='Write' />
                        <MenuItem value={ADMIN_PERMISSION} primaryText='Admin' />
                      </SelectField>
                    </TableRowColumn>
                    <TableRowColumn>
                      <FlatButton label='Revoke' onClick={() => {this.props.deletePermission(userProjectPermission.id);}} backgroundColor={red100} hoverColor={red200} disabled={this.props.currentUser.attributes.id === userProjectPermission.user.id} />
                    </TableRowColumn>
                  </TableRow>
                ))}
                <TableRow>
                  <TableRowColumn>
                    <AutoComplete
                      hintText='Add a collaborator'
                      filter={AutoComplete.noFilter}
                      openOnFocus={true}
                      dataSource={usersDataSource}
                      dataSourceConfig={usersDataSourceConfig}
                      onNewRequest={(chosenRequest, index) => {
                        if (index >= 0) {
                          this.props.setNewPermissionUser(usersDataSource[index].valueKey);
                        }
                      }}
                    />
                  </TableRowColumn>
                  {this.props.currentUser.attributes.admin &&
                    <TableRowColumn></TableRowColumn>
                  }
                  <TableRowColumn>
                    <SelectField
                      value={this.props.newPermissionLevel}
                      onChange={(event, index, newValue) => {this.props.setNewPermissionLevel(newValue);}}
                    >
                      <MenuItem value={READ_PERMISSION} primaryText='Read' />
                      <MenuItem value={WRITE_PERMISSION} primaryText='Write' />
                      <MenuItem value={ADMIN_PERMISSION} primaryText='Admin' />
                    </SelectField>
                  </TableRowColumn>
                  <TableRowColumn>
                    <FlatButton label='Add' disabled={this.props.newPermissionUser === null} onClick={this.props.createNewPermission} backgroundColor={lightBlue100} hoverColor={lightBlue200} />
                  </TableRowColumn>
                </TableRow>
              </TableBody>
            </Table>
          </Tab>
          <Tab label='Publishing & Deletion'>
            <Toggle
              label='Make project publicly viewable'
              toggled={this.props.public}
              onToggle={(event, isInputChecked) => {this.props.updateProject(this.props.id, {public: isInputChecked});}}
              style={{ maxWidth: '300px', margin: '18px 0' }}
            />
            <Divider />
            <Checkbox
              label='I understand that by destroying this project, I will permanently destroy all documents, folders, and highlights associated with it.'
              checked={this.props.deleteConfirmed}
              onCheck={this.props.toggleDeleteConfirmation}
              style={{ maxWidth: '500px', margin: '18px 0' }}
            />
            <FlatButton
              label='Destroy project'
              onClick={() => {this.props.deleteProject(this.props.id);}}
              backgroundColor={red400}
              hoverColor={red600}
              style={{ color: this.props.deleteConfirmed ? 'white' : grey200 }}
              disabled={!this.props.deleteConfirmed}
            />
          </Tab>
        </Tabs>
      </Dialog>
    );
  }

  scheduleProjectTitleUpdate(title) {
    const delay = 1000; // milliseconds
    if (this.scheduledProjectTitleUpdate)
      window.clearTimeout(this.scheduledProjectTitleUpdate);
    this.scheduledProjectTitleUpdate = window.setTimeout(function() {
      this.props.updateProject(this.props.id, {title});
    }.bind(this), delay);
  }

  scheduleProjectDescriptionUpdate(description) {
    const delay = 1000; // milliseconds
    if (this.scheduledProjectDescriptionUpdate)
      window.clearTimeout(this.scheduledProjectDescriptionUpdate);
    this.scheduledProjectDescriptionUpdate = window.setTimeout(function() {
      this.props.updateProject(this.props.id, {description});
    }.bind(this), delay);
  }
}

const mapStateToProps = state => ({
  currentUser: state.reduxTokenAuth.currentUser,
  settingsShown: state.project.settingsShown,
  id: state.project.id,
  title: state.project.title,
  description: state.project.description,
  userProjectPermissions: state.project.userProjectPermissions,
  allUsers: state.project.allUsers,
  public: state.project.public,
  newPermissionUser: state.project.newPermissionUser,
  newPermissionLevel: state.project.newPermissionLevel,
  deleteConfirmed: state.project.deleteConfirmed
});

const mapDispatchToProps = dispatch => bindActionCreators({
  hideSettings,
  updateProject,
  setNewPermissionUser,
  setNewPermissionLevel,
  createNewPermission,
  deletePermission,
  updatePermission,
  toggleDeleteConfirmation,
  deleteProject
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectSettingsDialog);
