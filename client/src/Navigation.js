import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import ArrowBack from 'material-ui/svg-icons/navigation/arrow-back';

class Navigation extends Component {
  render() {
    return (
      <AppBar
        title={this.props.title}
        showMenuIconButton={!this.props.isHome}
        iconElementLeft={<IconButton onClick={this.props.backClick}><ArrowBack /></IconButton>}
        style={{position: 'fixed'}}
      />
    )
  }
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = dispatch => bindActionCreators({
  backClick: () => push('/')
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Navigation);
