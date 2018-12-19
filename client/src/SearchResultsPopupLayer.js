import React, { Component } from 'react';
import SearchResultsPopup from './SearchResultsPopup';

export default class SearchResultsPopupLayer extends Component {

  onClose = () => {
    
  }

  render() {
    return (
      <div style={{ position: 'absolute', top: '0', left: '0', bottom: '-320px', paddingLeft: this.props.sidebarWidth + 2, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <SearchResultsPopup
              key='search-results'
              id='search-results'
              closeHandler={this.onClose}
              searchResults={this.props.searchResults}
              openDocumentIds={this.props.openDocumentIds}
            />
        </div>
      </div>
    );
  }
}
