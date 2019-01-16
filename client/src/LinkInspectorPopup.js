import React, {Component} from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Draggable from 'react-draggable';

import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';
import TextField from 'material-ui/TextField';

import Link from 'material-ui/svg-icons/content/link';
import Close from 'material-ui/svg-icons/navigation/close';
import Done from 'material-ui/svg-icons/action/done';
import { yellow100, orange100, red100, purple100, blue100, lightGreen100, white  } from 'material-ui/styles/colors';
import { yellow500, orange300, redA100, purpleA100, blueA100, lightGreenA700 } from 'material-ui/styles/colors';

import LinkInspector from './LinkInspector';
import { updateHighlight } from './modules/documentGrid';

const timeUpdateDelay = 1000

class LinkInspectorPopup extends Component {

  constructor(props) {
    super(props)
    this.state = {
      titleBuffer: props.target.excerpt,
      titleUpdateTimer: null,
      titleHasFocus: false
    }
  }

  componentWillMount() {
    Paper.defaultProps.transitionEnabled = false;
  }

  getTitleColor(color) {
    if( color === yellow500) return yellow100
    if( color === orange300) return  orange100
    if( color === redA100) return red100
    if( color === purpleA100) return purple100
    if( color === blueA100) return blue100
    if( color === lightGreenA700) return lightGreen100
    return '#FFF';
  }

  onChangeTitle = (e,newTitle) => {
    let {titleUpdateTimer} = this.state; 

    if (titleUpdateTimer) {
      window.clearTimeout(titleUpdateTimer);
    }
    titleUpdateTimer = window.setTimeout(function() {
      this.props.updateHighlight(this.props.target.id, {excerpt: newTitle}); 
    }.bind(this), timeUpdateDelay);

    this.setState( {...this.state, titleBuffer: newTitle, titleUpdateTimer })
  }

  onTitleFocus(e) {
    this.setState( {...this.state, titleHasFocus: true })
  }

  onTitleBlur() {
    this.setState( {...this.state, titleHasFocus: false })
  }

  renderTitle(titleBarColor) {
    const titleBarID = `highlight-title-${this.props.target.uid}`

    if( this.state.titleHasFocus ) {
      return (
        <span>
          <TextField
            autocomplete="off" 
            id={titleBarID}
            style={{ fontWeight: 'bold', fontSize: '1.2em', cursor: 'text' }}
            onChange={this.onChangeTitle}          
            underlineStyle={{borderColor: titleBarColor }}
            underlineShow={true}
            value={this.state.titleBuffer}
          />
          <IconButton
            iconStyle={{width: '16px', height: '16px' }}
            onClick={this.onTitleBlur.bind(this)}
          >
            <Done />
          </IconButton>
        </span>
      )  
    } else {
      return(
        <span style={{ fontWeight: 'bold', fontSize: '1.2em', color: 'black' }} onDoubleClick={this.onTitleFocus.bind(this)}>
          {this.state.titleBuffer}
        </span>        
      )
    }
  }

  render() {
    const { target } = this.props;
    
    const linkIconStyle = {
      paddingLeft: 5,
      paddingRight: 10,
      marginBottom: '-5px',
      width: '20px',
      height: '20px'
    };

    const titleBarColor = this.getTitleColor(target.color);

    return (
      <Draggable handle='.links-popup-drag-handle' bounds='parent' disabled={this.state.titleHasFocus} >
        <Paper zDepth={4} style={{ position: 'absolute', top: `${target.startPosition.y}px`, left: `${target.startPosition.x}px`, zIndex: (999 + this.props.popupIndex).toString()}}>          
          <div style={{ display: 'flex', flexShrink: '0', backgroundColor: titleBarColor }}>
            <Subheader style={{ flexGrow: '1', cursor: '-webkit-grab' }} className='links-popup-drag-handle' onMouseDown={this.props.onDragHandleMouseDown} >
              <Link style={linkIconStyle}/>    
              { this.renderTitle(titleBarColor) }      
            </Subheader>
            <IconButton
              iconStyle={{width: '16px', height: '16px' }}
              onClick={this.props.closeHandler}
            >
              <Close />
            </IconButton>
          </div>
          <div style={{flexGrow: 1,}}>
            <LinkInspector {...this.props} />
          </div>         
        </Paper>
      </Draggable>
    )
  }

}

const mapStateToProps = state => ({
});

const mapDispatchToProps = dispatch => bindActionCreators({
  updateHighlight
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkInspectorPopup);