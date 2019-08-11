import React, { Component } from 'react';
import './SlideBar.css';

class SlideBar extends Component{
	constructor(props){
		super(props);
		
		this.onSlide = this.onSlide.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		
		this.slideBar = React.createRef();
	}
	onSlide(e){
		const val = e.target.value / 100;
		if(this.props.onSlide){
			this.props.onSlide(val);
		}
	}
	onMouseUp(e){
		const val = e.target.value / 100;
		if(this.props.onMouseUp){
			this.props.onMouseUp(val);
		}
	}
	render(){
		return (
		<div className="SlideBarDiv">
			<div className="SliderBarLabel SliderBarCentered">
				{this.props.label ? this.props.label : ""}
			</div>
			<input type="range"
				ref={this.slideBar}
				min="0"
				max="100"
				defaultValue={!!this.props.defaultValue ? this.props.defaultValue * 100 : 0}
				className="SlideBar SliderBarCentered"

				onInput={this.onSlide}
				onMouseUp={this.onMouseUp}
			/>
		</div>
		);
	}
}

export default SlideBar;