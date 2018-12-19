import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SearchResultsPopup from './SearchResultsPopup';
import { closeSearchPopup } from './modules/search';

class SearchResultsPopupLayer extends Component {

  onClose = () => {
    if( !this.props.search.loading ) {
      this.props.closeSearchPopup();
    }
  }

  render() {
    const search = this.props.search;
    return (
      <div style={{ position: 'absolute', top: '0', left: '0', bottom: '-320px', paddingLeft: this.props.sidebarWidth + 2, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            { search.popupOpen &&
              <SearchResultsPopup
                key='search-results'
                id='search-results'
                closeHandler={this.onClose}
                searchPhrase={search.searchPhrase}
                searchResults={search.searchResults}
                openDocumentIds={this.props.openDocumentIds}
              /> 
            }
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  search: state.search
});

const mapDispatchToProps = dispatch => bindActionCreators({
  closeSearchPopup
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchResultsPopupLayer);
