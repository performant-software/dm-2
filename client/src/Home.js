import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import Paper from 'material-ui/Paper';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import FlatButton from 'material-ui/FlatButton';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import { load } from './modules/home';
import { newProject, clearProject } from './modules/project';
import { closeAllResources } from './modules/documentGrid';
import Navigation from './Navigation';

class Home extends Component {
  componentDidMount() {
    this.props.load();
    this.props.clearProject();
    this.props.closeAllResources();
  }

  render() {
    return (
      <div style={{height: '100%', width: '100%', position: 'absolute'}}>
        <Navigation title='DM 2.0' isHome={true} isLoading={this.props.loading} />
        <Paper style={{ minWidth: '300px', maxWidth: '60%', maxHeight: '72%', margin: '112px auto 32px auto', overflowY: 'scroll' }} zDepth={2}>
          <List style={{ padding: '0' }}>
            {this.props.projects.map(project => (
              <ListItem
                primaryText={project.title}
                secondaryText={project.description}
                secondaryTextLines={2}
                onClick={() => this.props.projectClick(project.id)}
                style={{padding: '16px'}}
                key={`project-${project.id}`}
              />
            ))}
          </List>
          {this.props.currentUser.isSignedIn && this.props.currentUser.attributes.approved &&
            <div style={{position: 'sticky', bottom: '0', background: '#FFF', borderRadius: '2px'}}>
              <Divider />
              <FlatButton
                label='New project'
                fullWidth={true} icon={<AddCircle />}
                style={{padding: '12px 0', height: 'auto'}}
                onClick={this.props.newProject}
              />
            </div>
          }
        </Paper>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  projects: state.home.projects,
  loading: state.home.loading,
  currentUser: state.reduxTokenAuth.currentUser,
  reduxTokenAuth: state.reduxTokenAuth
});

const mapDispatchToProps = dispatch => bindActionCreators({
  load,
  projectClick: slug => push(`/${slug}`),
  newProject,
  clearProject,
  closeAllResources
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
