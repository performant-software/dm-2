import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import Paper from 'material-ui/Paper';
import {List, ListItem} from 'material-ui/List';
import Navigation from './Navigation';

class Home extends Component {
  render() {
    return (
      <div style={{height: '100%', width: '100%', position: 'absolute'}}>
        <Navigation title='DM 2.0' isHome={true} />
        <Paper style={{ minWidth: '300px', maxWidth: '60%', margin: '112px auto 0 auto' }} zDepth={2}>
          <List>
            <ListItem
              primaryText='Dummy Project'
              secondaryText='A sample project with documents and highlights set in the redux store rather than retrieved from the API. Contains two text documents and two canvas documents.'
              secondaryTextLines={2}
              onClick={() => {this.props.projectClick('project')}}
              style={{padding: '16px'}}
            />
          </List>
        </Paper>
      </div>
    );
  }
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = dispatch => bindActionCreators({
  projectClick: slug => push(`/${slug}`)
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
