import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";
import Main from './Main/Main';
import './App.css';

class App extends Component {
	constructor(){
		super();
		document.title = "Nila: Iiiih bin Achzeeehn";
		this.state = {
		
		};
	}
	componentWillMount() {
		window.hist = this.props.history;
	}
	render(){
		return (
			<div className="App">
				<Main/>
			</div>
		);
	}
}

export default withRouter( App );
