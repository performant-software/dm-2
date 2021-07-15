import React, {Component} from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Draggable from 'react-draggable';

import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';
import TextField from 'material-ui/TextField';

import Close from 'material-ui/svg-icons/navigation/close';
import Done from 'material-ui/svg-icons/action/done';
import ModeComment from 'material-ui/svg-icons/editor/mode-comment';
import { yellow100, orange100, red100, purple100, blue100, cyan100, green100, lightGreen100  } from 'material-ui/styles/colors';
import { yellow500, orange300, redA100, purpleA100, cyanA100, blueA100, lightGreenA700, lightGreenA200, grey400 } from 'material-ui/styles/colors';

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
    if( color === cyanA100) return cyan100
    if( color === blueA100) return blue100
    if( color === lightGreenA700) return green100
    if( color === lightGreenA200) return lightGreen100
    return grey400;
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

    if( this.props.target.highlight_id ) {
      if( this.state.titleHasFocus && !this.props.rollover ) {
        return (
          <span>
            <TextField
              autoComplete="off" 
              id={titleBarID}
              style={{ fontWeight: 'bold', maxWidth: '350px', fontSize: '1.2em', cursor: 'text' }}
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
    } else {
      return (
        <span style={{ fontWeight: 'bold', fontSize: '1.2em', color: 'black' }} >
          {this.props.target.title}
        </span>        
      )
    }
  }

  getInnerID() {
    return `${this.props.id}-inner`
  }

  render() {
    const { target, writeEnabled, adminEnabled, rollover } = this.props;
    
    const titleBarColor = this.getTitleColor(target.color);
    
    const linkIconStyle = {
      paddingLeft: 5,
      paddingRight: 10,
      marginBottom: '-5px',
      width: '20px',
      height: '20px'
    };

    const linkInspectorVisible = (writeEnabled && !rollover) || (this.props.target.links_to && this.props.target.links_to.length > 0) 
    const linkInspectorProps = { ...this.props, writeEnabled: writeEnabled && !rollover, adminEnabled }

    return (
      <Draggable handle='.links-popup-drag-handle' bounds='parent' disabled={this.state.titleHasFocus || this.props.rollover} >
        <Paper 
          id={this.getInnerID()} 
          zDepth={4} 
          style={{ position: 'absolute', top: `${target.startPosition.y}px`, left: `${target.startPosition.x}px`, zIndex: (999 + this.props.popupIndex).toString()}}
        >          
          <div style={{ display: 'flex', flexShrink: '0', backgroundColor: titleBarColor }}>
            <Subheader style={{ flexGrow: '1', cursor: '-webkit-grab' }} className='links-popup-drag-handle' onMouseDown={this.props.onDragHandleMouseDown} >
              <ModeComment style={linkIconStyle}/> 
              { this.renderTitle(titleBarColor) }      
            </Subheader>
              <IconButton
              iconStyle={{width: '16px', height: '16px' }}
              onClick={this.props.closeHandler}
              >
              { !this.props.rollover && <Close /> }
            </IconButton>            
          </div>
          { linkInspectorVisible && 
            <div style={{flexGrow: 1 }}>
              <LinkInspector { ...linkInspectorProps } />
            </div>             
          }
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