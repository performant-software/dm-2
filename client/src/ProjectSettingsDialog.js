import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
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
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import Toggle from 'material-ui/Toggle';
import Checkbox from 'material-ui/Checkbox';
import { red100, red200, red400, red600, lightBlue100, lightBlue200, grey200, grey600 } from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import ErrorIcon from 'material-ui/svg-icons/alert/error';
import CheckIcon from 'material-ui/svg-icons/navigation/check';
import RefreshIcon from 'material-ui/svg-icons/navigation/refresh';
import {
  ADMIN_PERMISSION,
  READ_PERMISSION,
  WRITE_PERMISSION,
  createExport,
  createNewPermission,
  deletePermission,
  deleteProject,
  hideSettings,
  loadExports,
  setNewPermissionLevel,
  setNewPermissionUser,
  toggleDeleteConfirmation,
  updatePermission,
  updateProject,
} from "./modules/project";

class ProjectSettingsDialog extends Component {

  renderAddCollabRow() {
    const { newPermissionLevel, newPermissionError } = this.props; 

    return (
      <TableRow>
        <TableRowColumn><em>Enter an email address to invite:</em></TableRowColumn>
        <TableRowColumn>
          <TextField
            id='addcollab'
            onChange={(event, newValue) => {this.props.setNewPermissionUser(newValue);}}
            errorText={ newPermissionError ? newPermissionError : null }
          />
        </TableRowColumn>
        <TableRowColumn>
          <SelectField
            value={newPermissionLevel}
            onChange={(event, index, newValue) => {this.props.setNewPermissionLevel(newValue);}}
          >
            <MenuItem value={READ_PERMISSION} primaryText='Read' />
            <MenuItem value={WRITE_PERMISSION} primaryText='Write' />
            <MenuItem value={ADMIN_PERMISSION} primaryText='Admin' />
          </SelectField>
        </TableRowColumn>
        <TableRowColumn>
          <FlatButton label={this.renderAddButtonLabel()} disabled={!this.validateAddCollab()} onClick={this.props.createNewPermission} backgroundColor={lightBlue100} hoverColor={lightBlue200} />
        </TableRowColumn>
      </TableRow>
    )
  }

  renderAddButtonLabel() {
    return this.props.newPermissionLoading ? 'Adding...' : 'Add'
  }

  validateAddCollab() {
    const { newPermissionUser, newPermissionLoading } = this.props; 

    return (
      newPermissionLoading === false && 
      newPermissionUser !== null && 
      newPermissionUser.length > 0
    )
  }

  renderCollabTableRow(userProjectPermission) {
    const { currentUser } = this.props;

    return (
      <TableRow key={userProjectPermission.id}>
        <TableRowColumn>{userProjectPermission.user.name}</TableRowColumn>
        <TableRowColumn>{userProjectPermission.user.user_email}</TableRowColumn>
        <TableRowColumn>
          <SelectField
            value={userProjectPermission.permission}
            onChange={(event, index, newValue) => {this.props.updatePermission(userProjectPermission.id, newValue);}}
            disabled={currentUser.attributes.id === userProjectPermission.user.id}
          >
            <MenuItem value={READ_PERMISSION} primaryText='Read' />
            <MenuItem value={WRITE_PERMISSION} primaryText='Write' />
            <MenuItem value={ADMIN_PERMISSION} primaryText='Admin' />
          </SelectField>
        </TableRowColumn>
        <TableRowColumn>
          <FlatButton label='Revoke' onClick={() => {this.props.deletePermission(userProjectPermission.id);}} backgroundColor={red100} hoverColor={red200} disabled={currentUser.attributes.id === userProjectPermission.user.id} />
        </TableRowColumn>
      </TableRow>
    )
  }

  renderCollaboratorsTab() {
    const { userProjectPermissions } = this.props;

    return (
      <Tab label='Collaborators'>
        <Table selectable={false}>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            <TableRow>
              <TableHeaderColumn>Name</TableHeaderColumn>
              <TableHeaderColumn>Email</TableHeaderColumn>
              <TableHeaderColumn>Permission level</TableHeaderColumn>
              <TableHeaderColumn></TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            { userProjectPermissions.map(userProjectPermission => {
              return this.renderCollabTableRow(userProjectPermission)
            })}
            { this.renderAddCollabRow() }
          </TableBody>
        </Table>
      </Tab>
    );
  }

  renderProjectTab() {
    const { id, title, description } = this.props;

    return (
      <Tab label='Project'>
        <TextField
          fullWidth
          defaultValue={title}
          floatingLabelText='Title'
          onChange={(event, newValue) => {this.scheduleProjectTitleUpdate(newValue);}}
        /><br />
        <TextField
          fullWidth
          defaultValue={description}
          floatingLabelText='Description'
          onChange={(event, newValue) => {this.scheduleProjectDescriptionUpdate(newValue);}}
          multiLine={true}
          rows={4}
          rowsMax={2}
        />
        <Toggle
          label='Make project publicly viewable'
          toggled={this.props.public}
          onToggle={(event, isInputChecked) => {this.props.updateProject(id, {public: isInputChecked});}}
          style={{ maxWidth: '300px', margin: '18px 0' }}
        />
      </Tab>
    )
  }

  renderExportsTab() {
    const { exports, createExport } = this.props;
    let exportsTable;
    if (exports && exports.length) {
      const exportRows = exports.map((exp) => {
        let updatedAt = exp.updated_at;
        if (typeof updatedAt !== 'string') updatedAt *= 1000;
        updatedAt = new Date(updatedAt);
        let exportLink = "-";
        if (exp.url) {
          exportLink = <a href={exp.url}>Download</a>;
        }
        let status = exp.status;
        if (exp.error_class) {
          status = <>
            {exp.status}
            <IconButton 
              tooltip={`${exp.error_class}`}
              tooltipPosition="right"
              onClick={() => {}}
              disableFocusRipple
              disableTouchRipple
            >
              <ErrorIcon />
            </IconButton>
          </>
        }
        return (
          <TableRow key={exp.id}>
            <TableRowColumn>{updatedAt.toLocaleString()}</TableRowColumn>
            <TableRowColumn style={{
              overflow: "visible", display: "flex", alignItems: "center"
            }}>
              {status}
            </TableRowColumn>
            <TableRowColumn>{exportLink}</TableRowColumn>
          </TableRow>
        )
      });
      exportsTable = (
        <Table selectable={false}>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            <TableRow>
              <TableHeaderColumn>Date</TableHeaderColumn>
              <TableHeaderColumn style={{ display: "flex", alignItems: "center" }}>
                <span>Status</span>
                <IconButton
                  iconStyle={{ width: 18, height: 18 }}
                  style={{ width: 36, height: 36, padding: 4 }}
                  onClick={() => { this.props.loadExports(this.props.id) }}
                  disabled={this.props.exportsLoading}
                >
                  <RefreshIcon />
                </IconButton>
              </TableHeaderColumn>
              <TableHeaderColumn>Actions</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            {exportRows}
          </TableBody>
        </Table>
      )
    }
    let createStatus;
    if (this.props.exportJobId) {
      createStatus = (
      <>
        <CheckIcon />
        <span>Initiated successfully</span>
      </>
      )
    }
    return (
      <Tab label='Exports'>
        {exportsTable}
        <p>
          Initiate an export for archival purposes. This will create a .zip file with simple 
          HTML representations of this project's contents, preserving all text, images, and
          annotations. It may take some time to produce; check back here for its status.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <FlatButton
            label='Initiate export'
            onClick={() => {this.props.createExport()}}
            backgroundColor={lightBlue100}
            hoverColor={lightBlue200}
            disabled={!!this.props.exportsLoading || !!this.props.exportJobId}
          />
          {createStatus}
        </div>
      </Tab>
    );
  }

  renderDeleteTab() {
    const { id, deleteConfirmed, toggleDeleteConfirmation } = this.props;

    return (
      <Tab label='Project Deletion'>
        <h2>Delete My Project</h2>
        <Checkbox
          label='I understand that by destroying this project, I will permanently destroy all documents, folders, and highlights associated with it.'
          checked={deleteConfirmed}
          onCheck={toggleDeleteConfirmation}
          style={{ maxWidth: '500px', margin: '18px 0' }}
        />
        <FlatButton
          label='Destroy project'
          onClick={ () => {this.props.deleteProject(id)}}
          backgroundColor={red400}
          hoverColor={red600}
          style={{ color: deleteConfirmed ? 'white' : grey200 }}
          disabled={!deleteConfirmed}
        />
      </Tab>
    )
  }

  render() {
    const { settingsShown, hideSettings } = this.props;

    return (
      <Dialog
        title='Project settings'
        modal={false}
        open={settingsShown}
        onRequestClose={hideSettings}
        autoScrollBodyContent={true}
        actions={[
          <FlatButton
            label='Close'
            primary={true}
            onClick={hideSettings}
          />
        ]}
        contentStyle={{
          width: '90%',
          maxWidth: '1000px',
          position: 'absolute',
          left: '50%',
          top: '65px',
          transform: 'translate(-50%, 0)',
          transition: 'top 0.5s ease',
         }}
      >
        <Tabs tabItemContainerStyle={{ background: grey600 }}>
          { this.renderProjectTab() }
          { this.renderCollaboratorsTab() }
          { this.renderExportsTab() }
          { this.renderDeleteTab() }
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
  public: state.project.public,
  newPermissionUser: state.project.newPermissionUser,
  newPermissionLevel: state.project.newPermissionLevel,
  newPermissionError: state.project.newPermissionError,
  newPermissionLoading: state.project.newPermissionLoading,
  deleteConfirmed: state.project.deleteConfirmed,
  exports: state.project.exports,
  exportsLoading: state.project.exportsLoading,
  exportJobId: state.project.exportJobId,
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
  deleteProject,
  createExport,
  loadExports,
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectSettingsDialog);
