import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";
import axios from 'axios';
import { ChromePicker } from 'react-color';


// modules_frontend_backend:
import StaticFunctions from 'staticfunctions';
import ServerStaticFunctions from 'serverstaticfunctions';
import IE from 'irrigationentry';

// local files:
import SlideBar 			from '../SlideBar';
import IndicatorBar 		from '../IndicatorBar';
import RotatingButton 	from '../RotatingButton';
import SpinningWheel 	from './SpinningWheel';

import './LEDstrip.css';

const SF = StaticFunctions;
const SERVER_SF = ServerStaticFunctions;


//------------------constants and global vars-------------------------------

const BACKEND_IP = '/LEDstripServer';
let ARDUINO_ID = 'LED_STRIP_LIVING_ROOM_0';

//-------------------------------------------------

let MIN_ANIM_TRANSFORM_DURATION = 100;
let MAX_ANIM_TRANSFORM_DURATION = 10000;

let MIN_ANIM_TRANSFORM_RANGE = 0.05;
let MAX_ANIM_TRANSFORM_RANGE = 0.8; 

function interpolateSliderValToDuration(sliderVal){
	// 0.0 <= sliderVal <= 1.0
	let minVal = MIN_ANIM_TRANSFORM_DURATION;
	let maxVal = MAX_ANIM_TRANSFORM_DURATION;
	return minVal + (maxVal - minVal) * sliderVal;
}
function interpolateDurationToSliderVal(duration){
	// 0.0 <= sliderVal <= 1.0
	let minVal = MIN_ANIM_TRANSFORM_DURATION;
	let maxVal = MAX_ANIM_TRANSFORM_DURATION;
	return (duration - minVal) / (maxVal - minVal);
}

function interpolateSliderValToRange(sliderVal){
	// 0.0 <= sliderVal <= 1.0
	let minVal = MIN_ANIM_TRANSFORM_RANGE;
	let maxVal = MAX_ANIM_TRANSFORM_RANGE;
	return minVal + (maxVal - minVal) * sliderVal;
}
function interpolateRangeToSliderVal(duration){
	// 0.0 <= sliderVal <= 1.0
	let minVal = MIN_ANIM_TRANSFORM_RANGE;
	let maxVal = MAX_ANIM_TRANSFORM_RANGE;
	return (duration - minVal) / (maxVal - minVal);
}

//----------------------------------------------------


function httpGET(path, callback=undefined){
	path = SERVER_SF.addArduinoIdToURL(path, ARDUINO_ID);
	
	console.log('httpGET: ');
	console.log('path: ', path);
		  
	_httpGETorPOSThlpr(path, null, callback, axios.get);
}

function httpPOST(path, data, callback=res=>{console.log(res.data)}){
	path = SERVER_SF.addArduinoIdToURL(path, ARDUINO_ID);
	
	console.log('httpPOST: ');
	console.log('path: ', path);
	console.log('data: ', data);
		  
	_httpGETorPOSThlpr(path, data, callback, axios.post);
}

function _httpGETorPOSThlpr(path, data, callback=res=>{console.log(res.data)}, axiosFtn){
	if(!callback){
		callback = (res, err)=>{
			if(!!err){
				console.log('server-error: ', err);
			}else{
				console.log('server-response: ', res.data);
			}
		};
	}
	
	const tarURL = SF.erasePaddingSlash(BACKEND_IP) + SF.ensureLeadingSlash(path);
	
	console.log('tarURL: ', tarURL);
	
	axiosFtn(BACKEND_IP + path, data)
		  .then(callback)
		  .catch(e=>{
		  		console.log(e);
		  });
}



class ColorRect extends Component{
	constructor(){
		super();
		
		this.state = {
			width: '150px',
			height: '30px'
		};
	}
	componentWillMount(){
		if(!!this.props.width){
			this.setState({
				width: this.props.width,
				height: this.props.height
			});
		}
	}
	render(){
		let rectStyle = {
			backgroundColor: this.props.hexColor,
			width: this.state.width,
			height: this.state.height,
			borderRadius: !!this.props.borderRadius ? this.props.borderRadius : '0px',
			cursor: !!this.props.onClicked ? 'pointer' : 'default'
		};
		return (
			<div className="ColorRect"
				   style={rectStyle}
				   onClick={this.props.onClicked ? this.props.onClicked : ()=>{}}>
				{!!this.props.label ? this.props.label : ''}
			</div>
		);
	}
}

function genRoundColorRect(color, onClicked){
	return (
		<ColorRect
				  hexColor={color}
				  borderRadius='100%'
				  width='50px'
				  height='50px'
				  onClicked={onClicked}
		/>
	);
}

class StaticAnimation extends Component{
	constructor(){
		super();
		
		this.state = {
			animation:{
				color: '#ff00ff'
			}
		}
	}
	componentWillMount(){
		this.setState({
			animation: this.props.selectedAnimation
		});
	}
	render(){
		let color = this.state.animation.color;
		return (
			<div id="SelectedColorSMOOTH">
				{genRoundColorRect(color)}
				<div className="SelectedColorAnimLabel">
					ausgewählte Farbe:
				</div>
			</div>
		);
	}
}

class Smooth extends Component{
	constructor(){
		super();
		
		this.state = {
			animation: {
				colors: ['#ff00ff', '#00ff00', '#008800', '#0000ff'],
				range: 0.2
			}
		};
		
		this.colorClicked = this.colorClicked.bind(this);
		this.onDurationChanged = this.onDurationChanged.bind(this);
	}
	componentWillMount(){
		this.setState({
			animation: this.props.selectedAnimation
		});
	}
	colorClicked(indx){
		this.state.animation.colors.splice(indx, 1);

		this.props.onSelectionChanged(this.state.animation);
	}
	onDurationChanged(sliderDurVal){
		this.state.animation.duration = interpolateSliderValToDuration(sliderDurVal);
		
		this.props.onSelectionChanged(this.state.animation);
	}
	render(){
		let colors = this.state.animation.colors;
		
		let duration 	= this.state.animation.duration;
		let durSliderVal 	 = interpolateDurationToSliderVal(duration);
		
		let lbl = colors.length > 0 
			?	(<div className="SelectedColorAnimLabel">
					ausgewählte Farben:
				 </div>)
		   : ("Bitte wähle eine Farbe aus!");
		return (
			<div id="SelectedColorSMOOTHScrollView">
				<div id="SelectedColorSMOOTH">
					{colors.map((col,i)=>
							<div key={i}>
								{genRoundColorRect(col, ()=>{this.colorClicked(i)})}
							</div>
					)}
					{lbl}
				</div>
				<div className="SlideBarDivLED">
					<SlideBar defaultValue={durSliderVal}
						 onMouseUp={this.onDurationChanged}
						 label="Zyklusdauer"
					/>
				</div>
			</div>
		);
	}
}

class Wave extends Component{
	constructor(){
		super();
		
		this.state = {
			animation: {
				colors: ['#ff00ff', '#00ff00', '#008800', '#0000ff'],
				duration: 5000,
				range: 0.2
			}
		};
		
		this.colorClicked 		= this.colorClicked.bind(this);
		this.onDurationChanged 	= this.onDurationChanged.bind(this);
		this.onRangeChanged 		= this.onRangeChanged.bind(this);
	}
	componentWillMount(){
		this.setState({
			animation: this.props.selectedAnimation
		});
	}
	colorClicked(indx){
		let colors = this.state.animation.colors;
		colors.splice(indx, 1);
		
		this.props.onSelectionChanged(this.state.animation);
	}
	onRangeChanged(sliderRangeVal){
		this.state.animation.range = interpolateSliderValToRange(sliderRangeVal);
		
		this.props.onSelectionChanged(this.state.animation);
	}
	onDurationChanged(sliderDurVal){
		this.state.animation.duration = interpolateSliderValToDuration(sliderDurVal);
		
		this.props.onSelectionChanged(this.state.animation);
	}
	render(){
		let selectedColors = this.state.animation.colors;
		let lbl = selectedColors.length > 0 
			?	(<div className="SelectedColorAnimLabel">
					ausgewählte Farben:
				 </div>)
		   : ("Bitte wähle eine Farbe aus!");
		
		let duration 	= this.state.animation.duration;
		let range 		= this.state.animation.range;
		let durSliderVal 	 = interpolateDurationToSliderVal(duration);
		let rangeSliderVal = interpolateRangeToSliderVal(range);
		
		return (
			<div id="SelectedColorWAVEScrollView">
				<div id="SelectedColorSMOOTH">
					{this.state.animation.colors.map((col,i)=>
							<div key={i}>
								{genRoundColorRect(col, ()=>{this.colorClicked(i)})}
							</div>
					)}
					
					{lbl}
				</div>
				<div className="SlideBarDivLED">
					<SlideBar defaultValue={durSliderVal}
						 onMouseUp={this.onDurationChanged}
						 label="Zyklusdauer"
					/>
				</div>
				<div className="SlideBarDivLED">
					<SlideBar defaultValue={rangeSliderVal}
						 onMouseUp={this.onRangeChanged}
						 label="Range"
					/>
				</div>
			</div>
		);
	}
}

class ShootingStar extends Wave{
	
}


class LEDstrip extends Component{
	constructor(){
		super();
		
		this.colorPickerColor = '#00ff00';
		
		this.state = {
			manualDuration: 1 * 60 * 60 + 0 * 60 + 0,
			
			animationTags: ['Static', 'Smooth', 'Wave', 'ShootingStar'],
			wheelTags: [],
			
			selectedAnimation: {
				type: 2, // 0: StaticAnimation | 1: Smooth | 2: Wave | 3: ShootingStar
				color: '#00ff00',
				colors: ['#ff00ff', '#00ff00', '#008800', '#0000ff'],
				duration: 5000,
				range: 0.2,
			}
		}
		
		this.selectedColorsFadingDivRef = React.createRef();

		this.updateMaualDuration 	= this.updateMaualDuration.bind(this);
		this.turnLEDstripOn 			= this.turnLEDstripOn.bind(this);
		this.turnLEDstripOff			= this.turnLEDstripOff.bind(this);
		this.selectedAnimChanged 	= this.selectedAnimChanged.bind(this);
		this.addSelectedColor 		= this.addSelectedColor.bind(this);
		this.colorPicked				= this.colorPicked.bind(this);
		this.setAnimationType		= this.setAnimationType.bind(this);
		this.setAnimation				= this.setAnimation.bind(this);
		
		this.loadLEDAnimationFromServer 	  = this.loadLEDAnimationFromServer.bind(this);
		this.sendSelectedAnimationToServer = this.sendSelectedAnimationToServer.bind(this);
	}
	componentWillMount(){
		this.loadLEDAnimationFromServer();
	}
   componentDidMount(){
   	// add tags incrementally -> force SpinningWheel-anim-effect:
   	let tags = this.state.animationTags;
   	const addTag = (i)=>{
   		let tag = tags[i % tags.length];
   		let wheelTags = this.state.wheelTags;
   		wheelTags.push(tag);
   		this.setState({
   			wheelTags: wheelTags
   		});
   		if(i+1 < tags.length * 3){
	   		setTimeout(()=>{
		   		addTag(i+1)
		   	}, 150);
		   }
   	};
		setTimeout(()=>{addTag(0)}, 300);
   }
   componentWillUnmount(){
   }

   turnLEDstripOn(){
   	this.updateMaualDuration();
   	
   	const manualDuration = this.state.manualDuration;
   	
   	console.log('manualDuration: ', manualDuration);
   	
   	const data = {
   		duration: manualDuration
   	};
   	
   	httpPOST('/turnLEDstripOn', data);
   }
   turnLEDstripOff(){
   	httpGET('/turnLEDstripOff');
   }
   updateMaualDuration(){
   	let hours = document.getElementById('ManualTimeHours').value;
   	hours = SF.valToInteger(hours);
   	let mins = document.getElementById('ManualTimeMins').value;
   	mins = SF.valToInteger(mins);
   	let secs = document.getElementById('ManualTimeSecs').value;
   	secs = SF.valToInteger(secs);
   	
   	let manualDuration = hours * 60 * 60 + mins * 60 + secs;
   	
   	this.setState({manualDuration});
   }

   loadLEDAnimationFromServer(){
   	const serverResp = (resp, err)=>{
			if(err){
				console.log('could not load LED-Animation from Server/File: ', err);
			}else{
				const data = resp.data;
				
				let ledAnimation = data.animation;
				console.log('loadLEDAnimationFromServer -> ledAnimation: ', ledAnimation);
				console.log('loadLEDAnimationFromServer: data: ', data);
				
				this.setAnimation(ledAnimation);
			}
   	};
   	httpGET('/getLEDanimation', serverResp);
   }
   setAnimation(anim){
   	if(!anim){
   		console.log('LEDstrip::setAnimation: anim invalid!!!');
   		return;
   	}
   	
   	this.setState({
   		selectedAnimation: anim,
   	});
   }
   
   sendSelectedAnimationToServer(){
   	let animation = this.state.selectedAnimation;

   	console.log('sendSelectedAnimationToServer: animation: ', animation);
   	
   	httpPOST('/setLEDanimation', animation);
   }
   
   genRotatingButtonWithMargins(onClick, label, buttonType){
   	return 	<div className="RotatingButtonMargins">
   					<RotatingButton
								  onClicked={()=>{
								  		onClick();
								  	}}
								  label={label}
								  buttonType={buttonType}
						/>
					</div>;
   }
   onColorPickerDraged(color, c){
   	console.log('color: ', color);
   	let colors = this.state.colors;
   	colors.push(color.hex);
   	this.setState({
   		colors: colors
   	});
   	if(this.setColorToAnimationCreator){
   		this.setColorToAnimationCreator(color.hex);
   	}
   }
   addSelectedColor(){
      let color = this.colorPickerColor;
      console.log('curColPicker: ', color);
   	
      let curAnim = this.state.selectedAnimation;
      console.log('curAnim: ', curAnim);
      
   	if(curAnim.type === 0){
   		curAnim.color = color;
   	}else{
   		curAnim.colors.push(color);
   	}
   	this.setState({
   		selectedAnimation: curAnim
   	});
   }
   colorPicked(color){
   	this.colorPickerColor = color.hex;
   }
   selectedAnimChanged(animObj){
   	console.log('animChanged: ', animObj);
   	this.setState({
   		selectedAnimation: animObj
   	});
   }
   
   setAnimationType(animType){
   	let anim = this.state.selectedAnimation;
   	
   	let lastAnimType = anim.type;
   	
   	if(animType === 'Static'){
   		anim.type = 0;
   	}else if(animType === 'Smooth'){
   		anim.type = 1;
   	}else if(animType === 'Wave'){
   		anim.type = 2;
   	}else if(animType === 'ShootingStar'){
   		anim.type = 3;
   	}
   	
   	if(lastAnimType != anim.type){
   		let rf = this.selectedColorsFadingDivRef.current;
   		rf.style.opacity = 0.0;
   		rf.style.transform = 'scaleX(0)';
   		setTimeout(()=>{
	   		this.setState({
		   		selectedAnimation: anim
		   	});
		   	rf.style.opacity = 1.0;
		   	rf.style.transform = 'scaleX(1)';
   		}, 500);
	   }
   }
   genAnimationDiv(){
   	let anim = this.state.selectedAnimation;
   	
   	console.log('genAnimationDiv: anim: ', anim);
   	
		let animDiv;
		
		if(anim.type === 0){
			animDiv = (
					<StaticAnimation selectedAnimation={this.state.selectedAnimation}
							onSelectionChanged={this.selectedAnimChanged}/>
			);
		}else if(anim.type === 1){
			animDiv = (
					<Smooth selectedAnimation={this.state.selectedAnimation}
							onSelectionChanged={this.selectedAnimChanged}/>
			);
		}else if(anim.type === 2){
			animDiv = (
					<Wave selectedAnimation={this.state.selectedAnimation}
							onSelectionChanged={this.selectedAnimChanged}/>
			);
		}else{
			animDiv = (
					<ShootingStar selectedAnimation={this.state.selectedAnimation}
							onSelectionChanged={this.selectedAnimChanged}/>
			);
		}
		
		return animDiv;
   }

	render(){
		let selctdAnim = this.state.selectedAnimation;
		
		console.log('render - selectedAnimation: ', selctdAnim);
				
		const manualDuration 		= this.state.manualDuration;
		const manualDurationHours 	= SF.evalHours(manualDuration);
		const manualDurationMins 	= SF.evalMins(manualDuration);
		const manualDurationSecs	= SF.evalSecs(manualDuration);
		
		let initSelectionTag = this.state.animationTags[this.state.selectedAnimation.type];
		
		let colorPickerButtonLabel = "Farbe hinzufügen";
		if(selctdAnim.type === 0){
			colorPickerButtonLabel = "Farbe auswählen";
		}
		
		return (
		<div id="LEDstripMain">
			
			<div id="LEDstripHeading">
				LED Strips
			</div>
			
			<div className="IrrigationBlock"
					id="ManualLEDstrip">
				<div className="LEDstripHeading">
					Animation starten
				</div>
				<div id="ManualLEDactivationSelection">
						Animation starten für
						<input type="text" id="ManualTimeHours"
							className="ManualLEDstripTimeInput"
							required
	       				defaultValue={manualDurationHours}
	       				size="2"/>
	       			hh
						<input type="text" id="ManualTimeMins"
							className="ManualLEDstripTimeInput"
							required
	       				defaultValue={manualDurationMins}
	       				size="2"/>
	       			mm
	       			<input type="text" id="ManualTimeSecs"
	       				className="ManualLEDstripTimeInput"
							required
	       				defaultValue={manualDurationSecs}
	       				size="2"/>
						ss
					<br/>

					{this.genRotatingButtonWithMargins(this.turnLEDstripOn,
															'Start!')}
							  
					<div className="IrrigationSep">
					</div>
					
					<RotatingButton
							  onClicked={()=>{
							  		this.turnLEDstripOff();
							  	}}
							  label='LEDs ausschalten'
							  buttonType="WARNING"
					/>
				</div>
			</div>
			<div className="IrrigationBlock"
					id="AnimationSelectionBlock">
				<div className="LEDstripHeading">
					Animation auswählen
				</div>
				<div id="AnimSpinningWheelScrollDiv">
					<div id="AnimSpinningWheelDiv">
						<SpinningWheel tags={this.state.wheelTags}
											initSelection={initSelectionTag}
											onTagClicked={(tag, tagId)=>{
												this.setAnimationType(tag);
											}}
						/>
						<div id="AnimColPickerDiv">
							<div id="AnimColPicker">
								<ChromePicker onChangeComplete={ this.colorPicked }/>
							</div>
							{this.genRotatingButtonWithMargins(this.addSelectedColor,
							colorPickerButtonLabel)}
						</div>
					</div>
				</div>
				
				<div className="IrrigationSep">
					</div>
					
				<div id="SelectedColorsFadingDiv" ref={this.selectedColorsFadingDivRef}>
					{this.genAnimationDiv()}
				</div>
				
				<br/>
				
				<div className="IrrigationSep">
				</div>
				
				<RotatingButton onClicked={this.sendSelectedAnimationToServer}
								label="Animation festlegen!"
				/>
				<br/><br/>
			</div>
			
			<div className="BufferDiv">
			</div>
		</div>
		);
	}
}

export default withRouter( LEDstrip );


