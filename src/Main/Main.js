import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";
import Tab from '../Tab/Tab';
import Irrigation from '../Irrigation/Irrigation';
import LEDstrip from '../LEDstrip/LEDstrip';
import Nila from '../Nila/Nila';
import './Main.css';

class TabInfo{
	constructor(name, selected=false){
		this.name = name;
		this.selected = selected
	}
}

class MainPage extends Component{
	constructor(){
		super();
		
		this.urls = ['LEDstrip', 'Irrigation', 'Nila'];
		
		this.state = {
			tabs: [new TabInfo('LEDs', true),
					 new TabInfo('Bewässerung', false),
					 new TabInfo('Nila & Pack', false)]
		}
		
		this.tabClicked = this.tabClicked.bind(this);
	}
	componentWillMount() {
   }
   componentDidMount(){
   	window.scrollTo(0, 0);
   }
   tabClicked(id){
   	const tabs = this.state.tabs;
   	tabs.forEach(tab=>{tab.selected = false;});
   	tabs[id].selected = true;
   	this.setState({tabs});
   	
   	const tabName = this.urls[id];
   	this.loadTabUrl(tabName);
   }
   loadTabUrl(tabName){
		if (!!window.hist)
		{
			window.hist.push('/' + tabName.replace(' ', ''));
		}
	}

	render(){
		return (
		<div>
			<Tab id="MainTab"
				  tabs={this.state.tabs}
				  onClick={this.tabClicked}
			/>
			<div id="BigSeparator">
			</div>
			<div className="MainContent">
				<Switch>
					<Route exact path='/' 				component={LEDstrip}/>
					<Route exact path='/LEDstrip' 	component={LEDstrip}/>
					<Route exact path='/Irrigation' 	component={Irrigation}/>
					<Route exact path='/Nila' 			component={Nila}/>
				</Switch>
			</div>
		</div>
		);
	}
}

export default MainPage;


