import React, { Component } from 'react';
import ResourceViewer from './ResourceViewer';
import AnnotationPopup from './AnnotationPopup';
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      focusHighlightId: null,
      highlights: {
        dm_text_highlight_1: {
          linksTo: [
            'dm_canvas_highlight_red'
          ],
          referencedBy: [
            'dm_canvas_highlight_blue'
          ],
          resourceName: 'A Text Resource'
        },
        dm_canvas_highlight_blue: {
          linksTo: [
            'dm_text_highlight_1'
          ],
          resourceName: 'A Canvas Resource'
        },
        dm_canvas_highlight_red: {
          referencedBy: [
            'dm_text_highlight_1'
          ],
          resourceName: 'Another Canvas Resource'
        }
      }
    };
  }

  setFocusHighlight(highlightId) {
    if (highlightId !== null && this.state.focusHighlightId !== null) return;
    this.setState({ focusHighlightId: highlightId });
  }

  componentDidMount() {
    window.setFocusHighlight = this.setFocusHighlight.bind(this);
  }

  render() {
    const {focusHighlightId, highlights} = this.state;
    return (
      <div style={{ margin: '15px', display: 'grid', gridTemplateRows: '500px 500px', gridTemplateColumns: '1fr 1fr', gridGap: '20px' }}>
        <ResourceViewer resourceName='A Text Resource' resourceType='text' />
        <ResourceViewer resourceName='A Canvas Resource' resourceType='canvas' debugColor='blue' />
        <ResourceViewer resourceName='Another Canvas Resource' resourceType='canvas' debugColor='red' />
        <AnnotationPopup highlightId={focusHighlightId} closeHandler={this.setFocusHighlight.bind(this, null)} highlights={highlights} />
      </div>
    );
  }
}

export default App;
