import React, {Component} from 'react';
import { ResizableBox } from 'react-resizable';
import Draggable from 'react-draggable';
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import Close from 'material-ui/svg-icons/navigation/close';
import Subheader from 'material-ui/Subheader';
import Search from 'material-ui/svg-icons/action/search';
import Divider from 'material-ui/Divider';
import LinkableList from './LinkableList';

const dialogStartPosition = { x: 300, y: 100, z: 1100 };

export default class SearchResultsPopup extends Component {
  componentWillMount() {
    Paper.defaultProps.transitionEnabled = false;
  }

  render() {

    const searchIconStyle = {
      paddingLeft: 5,
      paddingRight: 10,
      marginBottom: '-5px',
      width: '20px',
      height: '20px'
    };

    return (
      <Draggable handle='.search-popup-drag-handle' bounds='parent'>
        <Paper zDepth={4} style={{ position: 'absolute', top: `${dialogStartPosition.y}px`, left: `${dialogStartPosition.x}px`, zIndex: dialogStartPosition.z }}>
          <ResizableBox width={300} height={300} minConstraints={[200, 120]} maxConstraints={[500, 800]}>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'hidden'}}>
              <div style={{ display: 'flex', flexShrink: '0' }}>
                <Subheader 
                    style={{ flexGrow: '1', cursor: '-webkit-grab' }} 
                    className='search-popup-drag-handle' 
                >
                  <Search style={searchIconStyle} /> 
                  Search for: {this.props.searchPhrase}
                </Subheader>
                <IconButton
                  iconStyle={{width: '16px', height: '16px'}}
                  onClick={this.props.closeHandler}
                >
                  <Close />
                </IconButton>
              </div>
              <Divider style={{ flexShrink: '0' }} />
              <div style={{flexGrow: 1, overflowY: 'scroll'}}>
                { this.props.searchResults.length > 0 ? 
                  <LinkableList 
                    items={this.props.searchResults} 
                    inContents={false} 
                    openDocumentIds={this.props.openDocumentIds}
                    allDraggable={false} 
                    writeEnabled={false}
                    adminEnabled={false}
                  />
                  :
                  <div style={{padding: '15px'}}>
                    No documents found.
                  </div>              
                }                  
              </div>
            </div>
          </ResizableBox>
        </Paper>
      </Draggable>
    );
  }
}
