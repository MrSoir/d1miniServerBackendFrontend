import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";

// modules_frontend_backend:
import {arraysEqual, evalCurrentUnixTime, evalUnixTimeFromDate} from 'staticfunctions';

// local files:
import './SpinningWheel.css';


class RotatedDiv extends Component{
	constructor(){
		super();
	
	}
	componentDidMount()
	{
	}
	render(){
		const tag = this.props.tag;
		
		let lblRot = this.props.labelRotation;
		
		let lblStyle = {
			transform: 'rotate(' + lblRot + 'rad) translate(-50%)'
		};
		let lblClass = !!this.props.selected ? "SpinningEntryLabel selected" : "SpinningEntryLabel";
		this.div = (
				<div style={lblStyle}
						className={lblClass}
						onClick={()=>{if(!!this.props.onLabelClicked){
							this.props.onLabelClicked();
						}}}>
					{tag}
				</div>
		);
		
		let rotRad = this.props.rotationRad;
		
		let xOffs = this.props.xOffset;
		let yOffs = this.props.yOffset;
		
		let translateX = this.props.width * 0.5 + Math.sin(rotRad) * (this.props.width*0.5 * xOffs);
		let translateY = this.props.height * 0.5 - Math.cos(rotRad) * (this.props.height * 0.5 * yOffs);
		
		 const rot = {
		 	transform: 'translateX(calc(' + translateX + 'px - 50%)) '
		 				+ 'translateY(calc(' + translateY + 'px - 50%)) '
		 				+ 'rotate(' + rotRad + 'rad)',
		 				
		 	transitionDuration: this.props.transitionDuration
		 };
		 
		return (
			<div style={rot}
				  className="SpinningEntry">
				{this.div}
			</div>
		);
	}
}


class SpinningWheel extends Component{
	constructor(){
		super();
		
		this.state = {
			focusedId: 0,
			transitionDuration: '0.15s'
		}
		
		this.rotateElementsAtOnce = this.rotateElementsAtOnce.bind(this);
		this.rotateElementsIncremental = this.rotateElementsIncremental.bind(this);
	}
	elementClicked(elmntId){
		let dx;
		
		let tagsCount = this.props.tags.length;
		
		let curFocusedId = this.state.focusedId;
		
		let clockwise;
		let counterclock;
		
		if(elmntId > curFocusedId){
			clockwise = elmntId - curFocusedId;
			counterclock = (tagsCount - elmntId) + curFocusedId;
		}else{
			clockwise = (tagsCount - curFocusedId) + elmntId;
			counterclock = curFocusedId - elmntId;
		}
		dx = clockwise < counterclock ? clockwise : -counterclock;
		
		this.rotateElementsIncremental(dx);
		
		this.props.onTagClicked(this.props.tags[elmntId], elmntId);
	}
	componentWillMount(){
   }
   componentDidMount(){
   	if(this.props.initSelection){
			let initTag = this.props.initSelection;
			let id = 0;
			const tags = this.props.tags;
			for(let i=0; i < tags.length; ++i){
				if(tags[i] === initTag)
				{
					this.elementClicked(i);
					break;
				}
			}
		}
   }
   componentWillUnmount(){
   }
   rotateElementsAtOnce(idOffs){
   	this.setState({transitionDuration: '1s'});
		let focusedId = this.state.focusedId;
		let newFocusedId = (focusedId + idOffs) % this.props.tags.length;
		if(newFocusedId < 0){
			newFocusedId = this.props.tags.length + newFocusedId;
		}
		
		this.setState({
			focusedId: newFocusedId
		});
   }
   rotateElementsIncremental(idOffs){
   	this.setState({transitionDuration: '0s'});
   	let totalDuration = 500;
   	let dt = 10;
   	
   	let tagCount = this.props.tags.length;
   	let fctnToOffs = idOffs / tagCount;
   	
   	let steps = totalDuration / dt;
   	
   	let rotIncrmnt = idOffs / steps;
   	
   	let cntr = 0;
   	
   	let incrmntRot = ()=>{
   		let focusedId = this.state.focusedId;
   		
   		let newFocusedId = focusedId + rotIncrmnt;
   		if(newFocusedId < 0){
				newFocusedId = tagCount + newFocusedId;
			}
			newFocusedId = newFocusedId % tagCount;
			
   		this.setState({
   			focusedId: newFocusedId
   		});
   		
   		cntr += 1;
   		if(cntr >= steps){
   			let finalId = Math.round(focusedId) % tagCount;
   			
	   		this.setState({
	   			focusedId: finalId
	   		});
	   		
   			return;
   		}
   		setTimeout(incrmntRot, dt);
   	};
   	setTimeout(incrmntRot, dt);
   }
   
   getRotRadPerTag(){
   	const tagsSize = this.props.tags.length;
   	return Math.PI * 2 / tagsSize;
   }

	render(){
		const focusedId = this.state.focusedId;
		
		const tagsSize = this.props.tags.length;
		const rotRadPerTag = this.getRotRadPerTag();
		const rotRadOffs = -rotRadPerTag * focusedId + Math.PI * 0.5;
		
		let width = 400;
		let height = 400;
		
		let rad = 0.9;
		let labelRotation = Math.PI / 2 * 3;
		
		const testTag = this.props.tags[0];
		
/*		return (
			<div className="SpinningWheel">
				{<RotatedDiv	
							className="SpinningEntry"
							tag={testTag}
							width={width}
							height={height}
							xOffset={rad}
							yOffset={rad}
							labelRotation={labelRotation}
							rotationRad={this.state.rotation}
				 />
				}
			</div>
		);*/
		
		let isFocused = (i)=>{
			let rng = 0.5
			return i > focusedId - rng &&
					i < focusedId + rng;
		};
		
		return (
			<div className="SpinningWheel">
				{this.props.tags.map( (tag,i)=>{
					return <RotatedDiv
							key={i}
							className="SpinningEntry"
							transitionDuration={this.state.transitionDuration}
							tag={tag}
							width={width}
							height={height}
							xOffset={rad}
							yOffset={rad}
							selected={isFocused(i)}
							labelRotation={labelRotation}
							rotationRad={i * rotRadPerTag + rotRadOffs}
							onLabelClicked={()=>{this.elementClicked(i)}}
				 />;
				})}
			</div>
		);
	}
}

export default SpinningWheel;


