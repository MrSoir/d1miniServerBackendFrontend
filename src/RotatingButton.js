import React, { Component } from 'react';
import './RotatingButton.css';


class RotatingButton extends Component{
	constructor(props){
		super(props);
	}
	clicked(){
		if(this.props.onClicked){
			this.props.onClicked();
		}
	}
	getButtonClass(){
		let cls = 'RotatingButton';
		let buttonType = this.props.buttonType;
		if(buttonType){
			if(buttonType.includes('WARNING')){
				cls += ' Warning';
			}
			if (buttonType.includes('DEVELOPER')){
				cls += ' Developer';
			}
			if (buttonType.includes('SMALL')){
				cls += ' Small';
			}
		}
		return cls;
	}
	render(){
		let btnClass = this.getButtonClass();
		return (<button type="button"
							  onClick={(e)=>{
							  	console.log('button clicked');
							  		const btn = e.target;
							  		btn.style.animationName = 'rotationAnimation';
							  		setTimeout(()=>btn.style.animationName = '', 500);
							  		
							  		this.clicked();
							  	}}
							  className={btnClass}>
						{this.props.label ? this.props.label : ''}
					</button>);
	}
}

export default RotatingButton;