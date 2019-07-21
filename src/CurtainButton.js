import React, { Component } from 'react';
import './CurtainButton.css';

class DownloadButton extends Component{
	constructor(props){
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onMouseOver = this.onMouseOver.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);

		this.leftRect = React.createRef();
		this.rightRect = React.createRef();
		this.mainRef = React.createRef();
	}
	onClick(){
		if(this.props.onClick){
			this.props.onClick();
		}
	}
	onMouseOver(){		
		let lr = this.leftRect.current;
		let rr = this.rightRect.current;
		lr.style.width = '0%';
		rr.style.width = '0%';
	}
	onMouseLeave(){
		let lr = this.leftRect.current;
		let rr = this.rightRect.current;
		lr.style.width = '51%';
		rr.style.width = '51%';
	}
	render(){
		let buttonText = this.props.text ? this.props.text : "Download";
		return (
			<div id="CurtainButton"
				  className="CurtainButton HeadingTextSize"
				  onClick={this.onClick}
				  onMouseOver={this.onMouseOver}
				  onMouseLeave={this.onMouseLeave}>				
				<div id="LeftRect"
					  ref={this.leftRect}/>
					  
				<div id="RightRect"
					  ref={this.rightRect}/>
					  
				<div id="ButtonText">
					{buttonText}
				</div>
			</div>
		);
	}
}

export default DownloadButton;