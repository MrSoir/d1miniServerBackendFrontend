import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";

// modules_frontend_backend:
import {arraysEqual, evalCurrentUnixTime, evalUnixTimeFromDate} from 'staticfunctions';
import IE from 'irrigationentry';

// local files:
import RotatingButton from '../RotatingButton';
import './LEDanimationSelector.css';



class LEDanimationSelector extends Component{
	constructor(initSelectedAnim){
		super();
		
		
		this.state = {
			selectedAnimation: initSelectedAnim
		}
		
	}
	componentWillMount(){
   }
   componentDidMount(){
   }
   componentWillUnmount(){
   }

	render(){
		<div>
			
		</div>
		);
	}
}

export default LEDanimationSelector;


