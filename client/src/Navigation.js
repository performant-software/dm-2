import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import AppBar from 'material-ui/AppBar';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import CircularProgress from 'material-ui/CircularProgress';
import ArrowBack from 'material-ui/svg-icons/navigation/arrow-back';

class Navigation extends Component {
  render() {
    return (
      <AppBar
        title={<div>
          <TextField
            id={`navigation-title-field-${this.props.inputId || 'generic'}`}
            key={this.props.inputId || 'generic'}
            defaultValue={this.props.title}
            underlineShow={false}
            inputStyle={{color: '#FFF', fontSize: '24px', width: '320px'}}
            onChange={this.props.onTitleChange || function(){}}
            style={{width: 'auto'}}
          />
          {this.props.isLoading &&
            <CircularProgress color={'#FFF'} style={{top: '12px', left: '18px'}}/>
          }
        </div>}
        // title={this.props.title}
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
