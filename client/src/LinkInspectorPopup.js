import React, {Component} from 'react';
import { ResizableBox } from 'react-resizable';
import Draggable from 'react-draggable';
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import Close from 'material-ui/svg-icons/navigation/close';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import { yellow50 } from 'material-ui/styles/colors';
import LinkInspector from './LinkInspector';

export default class LinkInspectorPopup extends Component {
  componentWillMount() {
    Paper.defaultProps.transitionEnabled = false;
  }

  render() {
    const { target } = this.props;
    return (
      <Draggable handle='.links-popup-drag-handle' bounds='parent'>
        <Paper zDepth={4} style={{ position: 'absolute', top: `${target.startPosition.y}px`, left: `${target.startPosition.x}px`, zIndex: (999 + this.props.popupIndex).toString(), backgroundColor: yellow50}}>
          <ResizableBox width={300} height={300} minConstraints={[200, 120]} maxConstraints={[500, 800]}>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'hidden'}}>
              <div style={{ display: 'flex', flexShrink: '0' }}>
                <Subheader style={{ flexGrow: '1', cursor: '-webkit-grab' }} className='links-popup-drag-handle' onMouseDown={this.props.onDragHandleMouseDown}>Edit Annotation</Subheader>
                <IconButton
                  iconStyle={{width: '16px', height: '16px'}}
                  onClick={this.props.closeHandler}
                >
                  <Close />
                </IconButton>
              </div>
              <Divider style={{ flexShrink: '0' }} />
              <div style={{flexGrow: 1, overflowY: 'scroll'}}>
                <LinkInspector {...this.props} />
              </div>
            </div>
          </ResizableBox>
        </Paper>
      </Draggable>
    );
  }
}
