import React, {Component} from 'react';
import Draggable from 'react-draggable';
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import Close from 'material-ui/svg-icons/navigation/close';
import Subheader from 'material-ui/Subheader';
import LinkInspector from './LinkInspector';
import Link from 'material-ui/svg-icons/content/link';

import { yellow100, orange100, red100, purple100, blue100, lightGreen100, white  } from 'material-ui/styles/colors';
import { yellow500, orange300, redA100, purpleA100, blueA100, lightGreenA700 } from 'material-ui/styles/colors';

export default class LinkInspectorPopup extends Component {
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

  render() {
    const { target } = this.props;
    
    const linkIconStyle = {
      paddingLeft: 5,
      paddingRight: 10,
      marginBottom: '-5px',
      width: '20px',
      height: '20px'
    };

    const title = target.excerpt;
    const titleBarColor = this.getTitleColor(target.color);

    return (
      <Draggable handle='.links-popup-drag-handle' bounds='parent'>
        <Paper zDepth={4} style={{ position: 'absolute', top: `${target.startPosition.y}px`, left: `${target.startPosition.x}px`, zIndex: (999 + this.props.popupIndex).toString()}}>          
          <div style={{ display: 'flex', flexShrink: '0', backgroundColor: titleBarColor }}>
            <Subheader style={{ flexGrow: '1', cursor: '-webkit-grab' }} className='links-popup-drag-handle' onMouseDown={this.props.onDragHandleMouseDown}>
              <Link style={linkIconStyle}/> {title}
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
    );
  }
}
