import React, { Component } from 'react';
import './FlipSelector.css';

class FlipSelector extends Component{
	constructor(props){
		super(props);
		
		this.dropDownContentRef = React.createRef();
		
		this.incrementIndex = this.incrementIndex.bind(this);
		this.decrementIndex = this.decrementIndex.bind(this);
		this.setIndex = this.setIndex.bind(this);
		
		this.value0Ref = React.createRef();
		this.value1Ref = React.createRef();
		this.val0Active = true;
		
		this.animDur = 500;
	}
	genAnimDurCssStr(){
		return '' + (this.animDur / 1000)  + 's';
	}
	setHiddenValue(val, increment, callback){
		let v0 = this.value0Ref.current;
		let v1 = this.value1Ref.current;
		if(this.val0Active){
			v1.style.transitionDuration = '';
			v1.innerHTML = val;
			v1.style.transform = increment ? 'translateY(-200%) translateX(-50%)' 
											 : 'translateY( 200%) translateX(-50%)';
		}else{
			v0.style.transitionDuration = '';
			v0.innerHTML = val;
			v0.style.transform = increment ? 'translateY(-200%) translateX(-50%)' 
											 : 'translateY( 200%) translateX(-50%)';
		}
		setTimeout(callback, 0);
	}
	fadeOutDiv(div, increment){
		div.style.opacity = '0.0';
		div.style.transform = increment ? 'translateY( 200%) translateX(-50%)' 
												  : 'translateY(-200%) translateX(-50%)';
	}
	fadeInDiv(div){
		div.style.opacity = '';
		div.style.transform = '';
	}
	switchValuesAnimation(nextValue, increment, callbackAfterAnim){
		const callback = ()=>{
			let v0 = this.value0Ref.current;
			let v1 = this.value1Ref.current;
			
			v0.style.transitionDuration = this.genAnimDurCssStr();
			v1.style.transitionDuration = this.genAnimDurCssStr();
			
			if(this.val0Active){
				this.fadeOutDiv(v0, increment);
				this.fadeInDiv (v1);
			}else{
				this.fadeInDiv (v0);
				this.fadeOutDiv(v1, increment);
			}
			this.val0Active = !this.val0Active;

			callbackAfterAnim();
		};
		this.setHiddenValue(nextValue, increment, callback);
	}
	incrementIndex(){
		let nextId = (this.props.selectedId + 1) % this.props.values.length;
		console.log('curId: ', this.props.selectedId, '	nextId: ', nextId);
		const callbackAfterAnim = ()=>{			
			this.setIndex(nextId);
		};
		this.switchValuesAnimation(this.props.values[nextId], true, callbackAfterAnim);
	}
	decrementIndex(){
		let prevId = this.props.selectedId - 1;
		if(prevId < 0){
			prevId = this.props.values.length - 1;
		}
		const callbackAfterAnim = ()=>{
			this.setIndex(prevId);
		};
		this.switchValuesAnimation(this.props.values[prevId], false, callbackAfterAnim);
	}
	setIndex(id){
		if( !!this.props.onIndexSelected ){
			this.props.onIndexSelected(id);
		}		
		if( !!this.props.onValueSelected ){
			this.props.onValueSelected(this.props.values[id]);
		}
	}
	startIncrement(){
		this.startIncrDecr_hlpr(this.incrementIndex);
	}
	startDecrement(){
		this.startIncrDecr_hlpr(this.decrementIndex);
	}
	startIncrDecr_hlpr(tarFunction){
		this.execute = true;
		this.animDur = 500;
		let cntr = 0;
		const incrmnt = ()=>{
			if( !this.execute ){
				return;
			}
			if(cntr++ > 1){
				this.animDur = 100;
			}else if(cntr > 15){
				this.animDur = 50;
			}
			tarFunction();
			setTimeout(incrmnt, this.animDur);
		};
		incrmnt();
	}
	stopIncrement(){
		this.endTouchEvent();
		this.execute = false;
		this.animDur = 500;
	}
	//------------------
	startMouseIncrement(){
		if(!this.useTouch){
			this.startIncrement();
		}
	}
	startMouseDecrement(){
		if(!this.useTouch){
			this.startDecrement();
		}
	}
	//--------
	startTouchIncrement(){
		this.initTouchEvent();
		this.startIncrement();
	}
	startTouchDecrement(){
		this.initTouchEvent();
		this.startDecrement();
	}
	//------------------
	initTouchEvent(){
		this.useTouch = true;
	}
	endTouchEvent(){
		this.useTouch = false;
	}
	//------------------
	render(){
		let vals = this.props.values;
		let id 	= this.props.selectedId;
		
		let tarVal = vals[id];
		
		return (
			<div className="FlipPicker">
				<div className="IncrementButtonFP"
					onMouseDown  = { !window.mobilecheck() ? this.startMouseIncrement.bind(this) : ()=>{}}
					onTouchStart = {  window.mobilecheck() ? this.startTouchIncrement.bind(this) : ()=>{}}
					
					onMouseUp		= {this.stopIncrement.bind(this)}					
					onTouchEnd		= {this.stopIncrement.bind(this)}
					onTouchCancel	= {this.stopIncrement.bind(this)}
				>
					&#10574;
				</div>
				<div className="ValueDivFP">
					<div className="ValueFP"
							ref={this.value0Ref}>
						{tarVal}
					</div>
					<div className="ValueFP"
							ref={this.value1Ref}>
					</div>
				</div>
				<div className="IncrementButtonFP"
					onMouseDown	 = { !window.mobilecheck() ? this.startMouseDecrement.bind(this) : ()=>{}}
					onTouchStart = {  window.mobilecheck() ? this.startTouchDecrement.bind(this) : ()=>{}}
					
					onMouseUp		= {this.stopIncrement.bind(this)}					
					onTouchEnd		={this.stopIncrement.bind(this)}
					onTouchCancel	= {this.stopIncrement.bind(this)}
				>
					&#10576;
				</div>
			</div>
		);
	}
}

export default FlipSelector;

