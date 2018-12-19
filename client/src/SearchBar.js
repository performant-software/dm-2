import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Search from 'material-ui/svg-icons/action/search';
import { grey500 } from 'material-ui/styles/colors';
import { startSearch } from './modules/search';

class SearchBar extends Component {

// TODO: hitting enter or clicking icon should start search
// search should pop up a search results dialog
// entering a new search refeshes dialog with new results
// need a redux layer for search? or a verb off of project?

    constructor(props) {
        super(props);
        this.state = {
            searchInput: ''
        }
    }

    onSearch = () => {
        this.props.startSearch( this.props.projectID, this.state.searchInput );
    }

    onChange = (e,value) => {
        this.setState({ searchInput: value});     
    }

    render() {
        return (
            <div style={{display: 'inline', marginRight: '30px'} }>
                <TextField 
                    inputStyle={{color: 'white'}} 
                    hintStyle={{color: grey500 }}
                    hintText="Search project..."
                    onChange={this.onChange}
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
    startSearch
}, dispatch);

export default connect(
    mapStateToProps,
    mapDispatchToProps
  )(SearchBar);
