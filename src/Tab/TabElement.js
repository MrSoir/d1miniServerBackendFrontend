import React, { Component } from 'react';
import './TabElement.css';

class Tab extends Component{
	constructor(props){
		super(props);
		
		this.onClick = this.onClick.bind(this);
	}
	onClick(){
		this.props.onClick();
	}

	render(){
		return (
		<div id="TabElement"
				onClick={this.onClick}>
			<div id="TabElementName">
				{this.props.name}
			</div>
			<div id="TabElementIndicator"
				  ref={this.indicator}
				  className={this.props.selected ? "selected" : "unselected"}>
			</div>
		</div>
		);
	}
}

export default Tab;


