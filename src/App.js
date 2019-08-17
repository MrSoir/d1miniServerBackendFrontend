import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";
import Main from './Main/Main';
import './App.css';

class App extends Component {
	constructor(props){
		super(props);
		document.title = "Nila: Iiiih bin Achzeeehn";
		
		this.state = {
			urls: ['LEDstrip', 'Irrigation', 'Nila'],
			selectedUrl: 0
		};
	}
	componentDidUpdate(prevProps) {
		console.log('componentDidUpdate!!! - location: ', this.props.location, '	lastLoc: ', prevProps.location);
		if (this.props.location !== prevProps.location) {
			
			this.updateSelectedUrl();
		}
	}
	updateSelectedUrl(){
		let curPath = this.props.location.pathname;
		curPath = curPath.slice(1).toLowerCase(); // curPath starts with a '/'
		
		let selectedUrl = 0;
		this.state.urls.forEach( (url, id)=>{
			if( curPath.startsWith(url.toLowerCase()) ){
				selectedUrl = id;
			}
		});
		
		this.setState({selectedUrl});
	}
	componentWillMount() {
		window.hist = this.props.history;
		this.updateSelectedUrl();
	}
	render(){
		return (
			<div className="App">
				<Main urls={this.state.urls}
						selectedUrl={this.state.selectedUrl}/>
			</div>
		);
	}
}

export default withRouter( App );
