import React, { Component } from 'react';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Search from 'material-ui/svg-icons/action/search';
import { grey500 } from 'material-ui/styles/colors';

export default class SearchBar extends Component {

// TODO: hitting enter or clicking icon should start search
// search should pop up a search results dialog
// entering a new search refeshes dialog with new results
// need a redux layer for search? or a verb off of project?

    onSearch = () => {

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
