import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import AppBar from 'material-ui/AppBar';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import FlatButton from 'material-ui/FlatButton';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import CircularProgress from 'material-ui/CircularProgress';
import Divider from 'material-ui/Divider';
import ArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import Settings from 'material-ui/svg-icons/action/settings';
import MoreVert from 'material-ui/svg-icons/navigation/more-vert';
import { signOutUser } from './modules/redux-token-auth-config';
import { load, showRegistration, showLogin, showAuthMenu, hideAuthMenu, showAdminDialog } from './modules/home';
import LoginRegistrationDialog from './LoginRegistrationDialog';
import AdminDialog from './AdminDialog';

const LoginMenuBody = props => {
  if (props.currentUser && props.currentUser.isSignedIn) {
    return (
      <div>
        <MenuItem primaryText = 'Sign out' onClick={() => {
          props.signOutUser()
          .then(() => {
            props.hideAuthMenu();
            props.load();
            props.returnHome();
          });
        }} />
        {props.currentUser.attributes.admin &&
          <div>
            <Divider />
            <MenuItem primaryText = 'Admin' onClick={() => {
              props.showAdminDialog();
              props.hideAuthMenu();
            }} />
          </div>
        }
      </div>
    );
  }
  return (
    <div>
      <MenuItem primaryText='Sign in' onClick={props.showLogin} />
      <MenuItem primaryText='Register' onClick={props.showRegistration}/>
    </div>
  )
}

class Navigation extends Component {
  render() {
    let userMenuLabel = '';
    if (this.props.currentUser.attributes.id) { // if a user is signed in
      userMenuLabel += this.props.currentUser.attributes.name;
      if (!this.props.currentUser.attributes.approved) {
        userMenuLabel += ' (Pending approval)';
      }
    }
    return (
      <div>
        <AppBar
          title={<div>
            <span style={{ color: '#FFF', fontSize: '24px' }}>{this.props.title}</span>
            {this.props.showSettings &&
              <IconButton onClick={this.props.settingsClick} style={{ width: '44px', height: '44px', marginLeft: '6px' }} iconStyle={{ color: '#FFF', width: '20px', height: '20px' }}><Settings /></IconButton>
            }
            {this.props.isLoading &&
              <CircularProgress color={'#FFF'} style={{top: '12px', left: '18px'}}/>
            }
          </div>}
          // title={this.props.title}
          showMenuIconButton={!this.props.isHome}
          iconElementLeft={<IconButton onClick={this.props.returnHome}><ArrowBack /></IconButton>}
          iconElementRight={
            <FlatButton
              style={{ minWidth: '48px' }}
              icon={<MoreVert />}
              label={userMenuLabel}
              labelPosition='before'
              onClick={event => {this.props.showAuthMenu(event.currentTarget);}}
            />
          }
          style={{position: 'fixed'}}
        />
        <Popover
          open={this.props.authMenuShown}
          anchorEl={this.props.authMenuAnchor}
          anchorOrigin={{horizontal: 'left', vertical: 'top'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this.props.hideAuthMenu}
        >
          <Menu>
            <LoginMenuBody {...this.props} />
          </Menu>
        </Popover>
        <LoginRegistrationDialog />
        <AdminDialog />
      </div>
    )
  }
}

const mapStateToProps = state => ({
  currentUser: state.reduxTokenAuth.currentUser,
  authMenuShown: state.home.authMenuShown,
  authMenuAnchor: state.home.authMenuAnchor
});

const mapDispatchToProps = dispatch => bindActionCreators({
  returnHome: () => push('/'),
  load,
  showRegistration,
  showLogin,
  showAuthMenu,
  hideAuthMenu,
  signOutUser,
  showAdminDialog
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Navigation);
