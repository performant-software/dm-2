import React, { Component } from 'react';
import { GithubPicker } from 'react-color';
import { yellow500, orange500, red500, purple500, blue500, lightGreen500 } from 'material-ui/styles/colors';

export default class HighlightColorSelect extends Component {
  render() {
    return (
      <div>
        <div onClick={this.props.toggleColorPicker} style={{ padding: '2px', borderRadius: '1px', boxShadow: '0 0 0 1px rgba(0,0,0,.1)', display: 'inline-block', cursor: 'pointer', marginRight: '8px', backgroundColor: '#FFF' }}>
          <div style={{ height: '16px', width: '32px', background: this.props.highlightColor, borderRadius: '2px'}}></div>
        </div>
        {this.props.displayColorPicker &&
          <div style={{position: 'absolute', zIndex: '99'}}>
            <GithubPicker
              colors={[yellow500, orange500, red500, purple500, blue500, lightGreen500, 'white', 'black']}
              color={this.props.highlightColor}
              onChange={color => {this.props.setHighlightColor(color.hex);}}
            />
          </div>
        }
      </div>
    );
  }
}
