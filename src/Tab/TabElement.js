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
		<div className="TabElementTE"
				onClick={this.onClick}>
			<div className="TabElementNameTE">
				{this.props.name}
			</div>
			<div ref={this.indicator}
				  className={"TabElementIndicatorTE" + (this.props.selected ? " selected" : " unselected")}>
			</div>
		</div>
		);
	}
}

export default Tab;


