import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Search from 'material-ui/svg-icons/action/search';
import { grey500 } from 'material-ui/styles/colors';
import { startSearch, updateSearchPhraseBuffer } from './modules/search';

class SearchBar extends Component {

    onSearch = () => {
        const search = this.props.search;
        if( search.searchPhraseBuffer.length > 0 ) {
            this.props.startSearch( this.props.projectID, search.searchPhraseBuffer );
        }
    }

    onChange = (e,value) => {
        this.props.updateSearchPhraseBuffer( value );
    }

    // TODO: support hitting enter to begin a search

    render() {
        return (
            <div style={{display: 'inline', marginRight: '30px'} }>
                <TextField 
                    inputStyle={{color: 'white'}} 
                    hintStyle={{color: grey500 }}
                    hintText="Search project..."
                    onChange={this.onChange}
                    value={this.props.search.searchPhraseBuffer}
                />
                <IconButton onClick={this.onSearch} >
                    <Search color='white'/>
                </IconButton>
            </div>
        );
    }
}


const mapStateToProps = state => ({
    search: state.search
});
  
const mapDispatchToProps = dispatch => bindActionCreators({
    startSearch,
    updateSearchPhraseBuffer
}, dispatch);

export default connect(
    mapStateToProps,
    mapDispatchToProps
  )(SearchBar);
