import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";
import axios from 'axios';
import socketIOClient from "socket.io-client";

// modules_frontend_backend:
import StaticFunctions from 'staticfunctions';

import IE from 'irrigationentry';

// local files:
import SlideBar from '../SlideBar';
import IndicatorBar from '../IndicatorBar';
import RotatingButton from '../RotatingButton';
import DropDown from '../DropDown';
import './Irrigation.css';

const IrrigationEntry = IE.IrrigationEntry;
const RecurringIE = IE.RecurringIE;
const OneTimerIE = IE.OneTimerIE;

// laptop:		192.168.2.109
// arduino:		192.168.2.110
// raspberry:	192.168.2.103

//const BACKEND_PORT = 5000;
//const D1MINI_PORT = 80;
const BACKEND_IP = '/irrigation';//http://raspberrypi.local:' + BACKEND_PORT + '/irrigation';//'http://192.168.2.109';
const SOCKET_IP = 'http://192.168.2.109:8080';
let SOCKET_ID = null;
const ARDUINO_ID = 'ARDUINO_IRRIGATION';
let socket = null;
//const D1MINI_IP  = 'http://ESP_3A0B03.local:' + D1MINI_PORT;


function ensureLeadingSlash(s){
	return s.length === 0 || s.charAt(0) === '/' 
				? s
				: '/' + s;
}
function ensurePaddingSlash(s){
	return s.charAt(s.length - 1) === '/' 
				? s
				: s + '/';
}
function eraseLeadingSlash(s){
	return s.length === 0 || s.charAt(0) != '/'
			? s
			: s.substr(1);
}
function erasePaddingSlash(s){
	return s.length === 0 || s.charAt(s.length - 1) != '/'
			? s
			: s.substr(0, s.length-1);
}

function getRelUrlPath(url){
	let lio = url.lastIndexOf('/');
	return lio > -1 ? url.substring(lio) : url;
}
function addSocketIdToURL(url){
	let relUrlPath = getRelUrlPath(url);
	
	let socketIdIsValid = !!SOCKET_ID;
	
	if(relUrlPath.includes('?')){
		if(socketIdIsValid){
			return url += '&socketId=' + SOCKET_ID + '&arduinoId=' + ARDUINO_ID;
		}else{
			return url += '&arduinoId=' + ARDUINO_ID;
		}
	}else{
		if(socketIdIsValid){
			return url += '?socketId=' + SOCKET_ID + '&arduinoId=' + ARDUINO_ID;
		}else{
			return url += '?arduinoId=' + ARDUINO_ID;
		}
	}
}

function httpGET(path, callback=undefined){
	console.log('httpGET: ');
	console.log('path: ', path);
	
	path = addSocketIdToURL(path);
	
	console.log('path_with_socketId: ', path);
		  
	_httpGETorPOSThlpr(path, null, callback, axios.get);
}

function httpPOST(path, data, callback=res=>{console.log(res.data)}){
	console.log('httpPOST: ');
	console.log('path: ', path);
	
	path = addSocketIdToURL(path);
	
	console.log('path_with_socketId: ', path);
	
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
	
	const tarURL = erasePaddingSlash(BACKEND_IP) + ensureLeadingSlash(path);
	
	console.log('tarURL: ', tarURL);
	
	axiosFtn(BACKEND_IP + path, data)
		  .then(callback)
		  .catch(e=>{
		  		console.log(e);
		  });
}

function padZeros(num, size=2) {
	var s = "000000000" + num;
	return s.substr(s.length-size);
}
function evalHours(unixtime){
	return Math.floor(unixtime / (60*60));
}
function evalMins(unixtime){
	return Math.floor((unixtime % (60*60)) / 60);
}
function evalSecs(unixtime){
	return Math.floor((unixtime % (60*60)) % 60);
}
function daySecondsToPrettyString(daysecs){
	const hours = evalHours(daysecs);
	const mins = evalMins(daysecs);
	const secs = evalSecs(daysecs);
	
	let s = hours + ':' + mins + ':' + secs;
	return s;
}
function timeToString(x){
	const h = evalHours(x);
	const m = evalMins(x);
	const s = evalSecs(x);
	return `${h}:${m}:${s}`;
}
function valToInteger(x){
 	if(!x)
 		x = 0;
 	x = parseInt(x);
 	if(isNaN(x))
 		x = 0;
 	return x;
}


class SelectionTab extends Component{
	constructor(props){
		super(props);
		this.state = {
			selectedTab: 0
		};
	}
	render(){
		return (
			<div className="SelectionTab">
				{this.props.tabs.map((t, cnt)=>{
					let cls = "SelectionTabEntry";
					cls += (cnt === this.state.selectedTab) ? " Selected" : "";
					return (<div className={cls}
									 key={cnt}
									onClick={()=>{
										this.setState({selectedTab: cnt});
										t.onClick()
									}}>
								{t.label}
							 </div>)
				})}
			</div>
		);
	}
}

class IrrigationTable extends Component{
	constructor(props){
		super(props);
	}
	render(){
		return(
			<table className="IrrigationTable">
				<tbody>
					<tr>
						<th>#</th>
						<th>Datum / Wochentag(e)</th> 
						<th>Beginn</th>
						<th>Dauer</th>
						<th>löschen</th>
					</tr>
					{this.props.entries.map((e,i)=>
						<IrrigationTableEntry
										key={i}
										id={i}
										irrigationEntry={e}
										onClicked={()=>this.props.rowClicked(i)}
										delete={()=>this.props.deleteRow(i)}/>
					)}
				</tbody>
			</table>
		);
	}
}
class IrrigationTableEntry extends Component{
	constructor(props){
		super(props);
	}
	render(){
		let ie = this.props.irrigationEntry;
		
		return (
			<tr className="IrrigationTableRow"
				onClick={()=>this.props.onClicked()}>
				<td>{this.props.id + 1}</td>
				<td>{this.props.irrigationEntry.getDateString()}</td>
				<td>{this.props.irrigationEntry.getTodayBeginString()}</td>
				<td>{this.props.irrigationEntry.getDurationString()}</td>
				<td><div className="TableDelBtn" onClick={this.props.delete}>x</div></td>
			</tr>
		);
	}
}


class Irrigation extends Component{
	constructor(){
		super();
		
		let irentries = [];
		irentries.push(new RecurringIE([0,1,2,3,4,5,6],  6*60*60 + 0*60 + 0, 1*60 + 0));
		irentries.push(new RecurringIE([0,1,2,3,4,5,6],  1*60*60 + 0*60 + 0, 1*60 + 0));
		irentries.push(new RecurringIE([0,1,2,3,4,5,6], 22*60*60 + 0*60 + 0, 1*60 + 0));
		irentries.push(new RecurringIE([5,6], 1*60*60 +  0*60 + 0, 0*60 + 45));
		irentries.push(new OneTimerIE(StaticFunctions.evalCurrentUnixTime(), 0*60*60 + 1*60));
		
		irentries = irentries.sort(IrrigationEntry.Comparator);
		
		let curSelection = new RecurringIE(
											[0,1,2,3,4,5,6],
											8 * 60 * 60 + 0 * 60 + 0,
											1 * 60 + 0);
		
		let genMoistSensor = (id)=>{
			let label = "Sensor " + id;
			let sensitivity = 0.5 * id;
			let value = 0.1 * id;
			let pin = id;
			
			return {
				id,
				label,
				sensitivity,
				value,
				pin
			}
		};
		let moistureSensors = [];
		moistureSensors.push(genMoistSensor(0));
		moistureSensors.push(genMoistSensor(1));
		moistureSensors.push(genMoistSensor(2));
		
		this.moistureSensorsmap = new Map();
		[...moistureSensors].forEach( (sensor, indx)=>{
			this.moistureSensorsmap.set(indx, sensor);
		});
		
		let lastOneTimerIE = new OneTimerIE(StaticFunctions.evalCurrentUnixTime(), 1 * 60);
		
		this.state = {
			curSelection,
			lastRecurringIE: curSelection,
			lastOneTimerIE: lastOneTimerIE,
			irrigationEntries: irentries,
			manualDuration: 0 * 60 + 30,
			showDeveloperOptions: false,
			moistureSensors,
			irrigationEntrySelection: 'RECURRING'
		};
		
		this.entireWeekSelected = this.entireWeekSelected.bind(this);
		this.selectDay = this.selectDay.bind(this);
		this.selectAllDays = this.selectAllDays.bind(this);
		this.deSelectAllDays = this.deSelectAllDays.bind(this);
		this.daySelected = this.daySelected.bind(this);
		this.tableRowClicked = this.tableRowClicked.bind(this);
		this.deleteTableRow = this.deleteTableRow.bind(this);
		this.addSelectedIrrigationEntry = this.addSelectedIrrigationEntry.bind(this);
		this.setDuration = this.setDuration.bind(this);
		this.setBegin = this.setBegin.bind(this);
		this.getBegin = this.getBegin.bind(this);
		this.getDuration = this.getDuration.bind(this);
		this.updateMaualDuration = this.updateMaualDuration.bind(this);
		this.startManualIrrigation = this.startManualIrrigation.bind(this);
		this.abortCurrentIrrigation = this.abortCurrentIrrigation.bind(this);
		this.clearIrrigationPlan = this.clearIrrigationPlan.bind(this);
		this.setIrrigationEntriesToState = this.setIrrigationEntriesToState.bind(this);
		this.updateUserInputToCurSelection = this.updateUserInputToCurSelection.bind(this);

		this.setMoistureSensors = this.setMoistureSensors.bind(this);
		this.setMoistureSensorLabel = this.setMoistureSensorLabel.bind(this);
		this.setMoistureSensorPin = this.setMoistureSensorPin.bind(this);
		this.setMoistureSensorSensitivity = this.setMoistureSensorSensitivity.bind(this);
		this.updateMoistureSensorValues = this.updateMoistureSensorValues.bind(this);
		
		// developer-functions:
		this.getUnixTime = this.getUnixTime.bind(this);
		this.setUnixTime = this.setUnixTime.bind(this);
		
		this.sendPlanToArduino = this.sendPlanToArduino.bind(this);
		this.loadPlanFromServer = this.loadPlanFromServer.bind(this);
		
		this.receiveSensorData = this.receiveSensorData.bind(this);
		this.requestMoistureSensorData = this.requestMoistureSensorData.bind(this);
		
		this.showHideDeveloperOptions = this.showHideDeveloperOptions.bind(this);
		
		this.setUnixDayOffset = this.setUnixDayOffset.bind(this);
	}
	componentWillMount(){
		this.loadPlanFromServer();
		this.receiveSensorData();
   }
   componentDidMount(){
		this.connectSocketIO();

/*		setTimeout(()=>{
			let sensor = this.state.moistureSensors[0];
			sensor.label = 'Nila';
			sensor.pin   = 9;
			sensor.sensitivity = 0.75;
			sensor.value = 1.0;
			this.setMoistureSensors(this.state.moistureSensors);
		}, 4000);*/
		
/*		const reqMoistVals = ()=>{
			console.log('requesting moisture sensor values');
			this.requestMoistureSensorValues();
			setTimeout(reqMoistVals, 10000);
		};
		reqMoistVals();*/
   }
   
   requestMoistureSensorValues(){
   	const sensorResp = (resp, err)=>{
   		if(err){
   			console.log('requestMoistureSensorValues: Arduino-ERROR: ', err.code);
   		}else{
   			let bareData = resp.data;
   			
   			console.log('received moistureSensorData: ', bareData);
   			
   			let sensorValues = bareData.values;
   			   			
   			if(!!sensorValues){
   				this.updateMoistureSensorValues(sensorValues);
   			}else{
   				console.log('no/invalid moisture sensor values recevied!');
   			}
   		}
   	};
   	httpGET('/requestMoistureSensorValues', sensorResp.bind(this));
   }
   componentWillUnmount(){
   	console.log('componentWillUnmount!');
   	this.disconnectSocket();
   }
   
   connectSocketIO(){
		socket = socketIOClient(SOCKET_IP);
		socket.on('planUpdated', plan => {
			console.log('CLIENT: socket-io: planUpdated', plan);
			// plan.irrigationEntries == bare json-objects - obacht!!!
			// setIrrigationEntriesToState takes care and parses them to IrrigationEntry-instances:
			this.setIrrigationEntriesToState(plan.irrigationEntries);
		});
		socket.on('connectionEstablished', data=>{
			console.log('client: socket-io: connectionEstablished', data);
			SOCKET_ID = data.id;
		});
		socket.on('moistreValuesUpdated', sensorValues =>{
			console.log('CLIENT: socket-io: moistureValuesUpdated - ', sensorValues);
			this.updateMoistureSensorValues(sensorValues);
		});
   }
   disconnectSocket(){
   	console.log('disconnectSocket - socket: ', socket);
   	if(socket){
   		console.log('client: socket-io: disconnect!');
   		socket.emit('disconnect', {});
   	}
   }
   
   tableRowClicked(rowId){
   	if(this.state.irrigationEntries.length <= rowId)
   		return;
   		
//   	this.updateUserInputToCurSelection();
		
   	const newSelection = this.state.irrigationEntries[rowId].copy();
   	const curSelection = this.state.curSelection;
   	
   	let newLastRecurringIE = (curSelection.type === 0) ? curSelection : this.state.lastRecurringIE;
   	let newLastOneTimerIE  = (curSelection.type === 1) ? curSelection : this.state.lastOneTimerIE;
   	
   	this.setState({
   		curSelection: newSelection,
   		irrigationEntrySelection: ((newSelection.type === 0) ? 'RECURRING' : 'ONE_TIMER'),
   		lastRecurringIE: newLastRecurringIE,
   		lastOneTimerIE: newLastOneTimerIE
   	});
   }
   
   clearIrrigationPlan(){
   	let irrigationEntries = this.state.irrigationEntries;
   	irrigationEntries.length = 0; // ECMAScript 5-standard - should work on all browsers!
		
		httpGET('/clearIrrigationPlan');
   }
   deleteTableRow(rowId){
   	if(this.state.irrigationEntries.length <= rowId)
   		return;
   	
   	let irrigationEntries = this.state.irrigationEntries;
   	
   	let ie = irrigationEntries[rowId];

   	httpPOST('/removeIrrigationEntry', ie);
   }
   entireWeekSelected(){
   	console.log('curSelection: ', this.state.curSelection);
   	return this.state.curSelection.allDaysOfWeek();
   }
   selectDay(i){
   	let curSelection = this.state.curSelection;
   	curSelection.selectDay(i);
   	this.setState({curSelection});
   }
   deSelectDay(i){
   	let curSelection = this.state.curSelection;
   	curSelection.deSelectDay(i);
   	this.setState({curSelection});
   }
   selectAllDays(){
   	let curSelection = this.state.curSelection;
   	curSelection.selectAllDays();
   	this.setState({curSelection});
   }
   deSelectAllDays(){
   	let curSelection = this.state.curSelection;
   	curSelection.deSelectAllDays();
   	this.setState({curSelection});
   }
   daySelected(i){
   	return this.state.curSelection.daySelected(i);
   }
   
   updateUserInputToCurSelection(){
	   this.updateRecurringBegin();
		this.updateRecurringDuration();
		
		let curSelection = this.state.curSelection;
		
		console.log('curSelection: ', curSelection);
		
      if( this.state.irrigationEntrySelection === 'RECURRING' ){
			
   	}else if(this.state.irrigationEntrySelection === 'ONE_TIMER'){
			let dateInput = document.getElementById('OneTimerDateSelection');
			let date = new Date(dateInput.value);
			let unix = StaticFunctions.evalUnixTimeFromDate(date, false);
			let begin = unix + curSelection.begin % 86400;
			curSelection.begin = begin;
			
			console.log('curSelection.begin: ', begin);
			console.log('curUnixTime:        ', StaticFunctions.evalCurrentUnixTime());
   	}
   }
   addSelectedIrrigationEntry(){
   	this.updateUserInputToCurSelection();
   	
   	let irrigationEntries = this.state.irrigationEntries;
   	let curSelection = this.state.curSelection.copy();
   	
      if( this.state.irrigationEntrySelection === 'RECURRING' ){
   	   if(!curSelection.daysOfWeek || curSelection.daysOfWeek.length === 0){
	   		this.showWarning("Es muss mindestens ein Wochentag ausgewählt werden!", 1000);
	   		return;
	   	}
   	}

   	let equalEntryAlrAdded = false;
   	irrigationEntries.forEach( ie => {
   		if(curSelection.equals(ie)){
   			equalEntryAlrAdded = true;
   		}
   	});
   	if(equalEntryAlrAdded){
   		this.showWarning('Identischer Bewässerungseintrag bereits vorahnden!', 1000);
   		setTimeout(()=>{
	      	this.hideWarning();
	      }, 1000);
   		return;
   	}
   	
   	httpPOST('/addIrrigationEntry', curSelection);
   }
   addSelectedOneTimerIE(){
   	let ies = this.state.irrigationEntries;
   	let curSelection = this.state.curSelection.copy();
   	
   	let equalEntryAlrAdded = false;
   	ies.forEach( ie => {
   		if(curSelection.equals(ie)){
   			equalEntryAlrAdded = true;
   		}
   	});
   	if(equalEntryAlrAdded){
   		this.showWarning('Identischer Bewässerungseintrag bereits vorahnden!', 1000);
   		setTimeout(()=>{
	      	this.hideWarning();
	      }, 1000);
   		return;
   	}
   	
		// send new entry to Arduino:
   	httpPOST('/addIrrigationEntry', curSelection);
   }
   getDuration(){
   	return this.state.curSelection.duration;
   }
   setDuration(duration){
   	let curSelection = this.state.curSelection;
   	curSelection.duration = duration;
   	this.setState({curSelection});
   }
   getBegin(){
   	return this.state.curSelection.begin;
   }
   setBegin(begin){
   	let curSelection = this.state.curSelection;
   	curSelection.begin = begin;
   	this.setState({curSelection});
   }
   startManualIrrigation(){
   	this.updateMaualDuration();
   	
   	const manualDuration = this.state.manualDuration;
   	
   	console.log('manualDuration: ', manualDuration);
   	
   	const data = {
   		duration: manualDuration
   	};
   	
   	httpPOST('/startManualIrrigation', data);
   }
   updateMaualDuration(){
   	let mins = document.getElementById('ManualIrrigationTimeMins').value;
   	mins = valToInteger(mins);
   	let secs = document.getElementById('ManualIrrigationTimeSecs').value;
   	secs = valToInteger(secs);
   	
   	let manualDuration = mins * 60 + secs;
   	
   	this.setState({manualDuration});
   }
   
   abortCurrentIrrigation(){
   	httpGET('/stopCurrentIrrigation');
   	
/*   	this.showWarning('laufende Bewässerung abgebrochen!', 1000);
   	setTimeout(()=>{
      	this.hideWarning();
      }, 1000);*/
   }
   updateRecurringBegin(){
 		let hours = document.getElementById('ScheduledSelectionHours').value;
 		hours = valToInteger(hours);
 		hours = hours * 60 * 60;
 		
 		let mins = document.getElementById('ScheduledSelectionMinutes').value;
 		mins = valToInteger(mins);
 		mins = mins * 60;
 		
 		let secs = document.getElementById('ScheduledSelectionSeconds').value;
 		secs = valToInteger(secs);
 		
 		let begin = hours + mins + secs;
 		
 		this.setBegin(begin);
   }
   updateRecurringDuration(){ 		
 		let mins = document.getElementById('ScheduledSelectionDurationMinutes').value;
 		mins = valToInteger(mins);
 		mins = mins * 60;
 		
 		let secs = document.getElementById('ScheduledSelectionDurationSeconds').value;
 		secs = valToInteger(secs);
 		
 		let duration = mins + secs;
 		
 		this.setDuration(duration);
   }   
   showWarning(warningMsg, showButton=true){
   	let warningMessageDiv = document.getElementById('WarningMessageDiv');
   	let warmingMessage = document.getElementById('WarningMessage');
   	
   	let btn = document.getElementById('WarningMessageCloseBtn');
   	btn.style.display = Number.isInteger(showButton) ? 'none' : 'inline-block';
   	
   	warmingMessage.innerHTML = warningMsg;
   	warningMessageDiv.style.opacity = '0.0';
   	warningMessageDiv.style.display = 'block';
   	if(warningMsg.length > 100){
	   	warningMessageDiv.style.fontSize = '15px';
	   }else{
	   	warningMessageDiv.style.fontSize = '50px';
   	}
   	setTimeout(()=>{
      	warningMessageDiv.style.opacity = '1.0';
      	if(Number.isInteger(showButton)){
	      	setTimeout(()=>{
	      		this.hideWarning();
	      	}, showButton);
	      }
      }, 0);
   }
   hideWarning(){
      const warningMessageDiv = document.getElementById('WarningMessageDiv');
      warningMessageDiv.style.opacity = '0';
      setTimeout(()=>{
      	warningMessageDiv.style.display = 'none';
      }, 1000);
   }
   
   // developer functions:
   getUnixTime(){
   	console.log('getUnixTime -> current browser-unix time: ' + StaticFunctions.evalCurrentUnixTime());
   	httpGET('/getArduinoUnixTime');
   }
   setUnixTime(){
   	httpGET('/setArduinoUnixTime');
   }
   sendPlanToArduino(){
   	httpGET('/updateArduinosIrrigationPlan');
   }
   receiveSensorData(){
		this.requestMoistureSensorData();
   }
   requestMoistureSensorData(){
   	const irrResp = (resp, err)=>{
   		if(err){
   			console.log('Arduino-ERROR: ', err);
   		}else{
   			let bareData = resp.data;
   			
   			console.log('received moistureSensorData: ', bareData);
   			
   			let moistureSensors = bareData.sensors;
   			
   			console.log('bareData: ', bareData);
   			console.log('moistureSensors: ', moistureSensors);
   			
   			if(!!moistureSensors){
   				this.setMoistureSensors(moistureSensors);
   			}else{
   				console.log('no/invalid moisture sensor data recevied!');
   			}
   		}
   	};
   	httpGET('/getMoistureSensorData', irrResp.bind(this));
   }
   setMoistureSensors(sensors){
   	console.log('setMoistureSensors');
   	
   	sensors.forEach(sensor => {
   		this.moistureSensorsmap.set(sensor.id, sensor);
   	});
   	
   	this.setState({
			moistureSensors: sensors,
		});
   }
   setMoistureSensorLabel(label, sensor){
   	sensor.label = label;
   	this.setMoistureSensors(this.state.moistureSensors);
   	this.sendSensorDataToServer();
   }
	setMoistureSensorPin(pin, sensor){
		sensor.pin = pin;
		this.setMoistureSensors(this.state.moistureSensors);
		this.sendSensorDataToServer();
	}
	
	setMoistureSensorSensitivity(sensitivity, sensor){
		sensor.sensitivity = sensitivity;
		this.setMoistureSensors(this.state.moistureSensors);
		this.sendSensorDataToServer();
	}
	updateMoistureSensorValues(sensorValues){
		sensorValues.forEach( ([value, sensorId]) => {
			if(this.moistureSensorsmap.has(sensorId)){
				this.moistureSensorsmap.get(sensorId).value = value;
			}
		});
		this.setMoistureSensors(this.state.moistureSensors);
	}
   loadPlanFromServer(){
   	const irrResp = (resp, err)=>{
			if(err){
				console.log('could not load IrrigatonPlan from Server/File: ', err);
			}else{
				const data = resp.data;
				
				// irrigationEntries: bare json-object:
				let irrigationEntries = data.irrigationEntries;
				// setIrrigationEntriesToState takes care and parses them to IrrigationEntry-instances:
				this.setIrrigationEntriesToState(irrigationEntries);
			}
   	};
   	httpGET('/getPlan', irrResp);
   }
   parseJSONobjToIrrigationEntryInstance(objEntries){
   	return objEntries.map(x=>IrrigationEntry.createFromObj(x));
   }
   setIrrigationEntriesToState(irrigationEntries){
		// in case irrigationEntries are bare json-objects, parse them to IrrigationEntry-instances
		irrigationEntries = this.parseJSONobjToIrrigationEntryInstance(irrigationEntries);
		
   	irrigationEntries.sort(IrrigationEntry.Comparator);
   	
   	this.setState({irrigationEntries: irrigationEntries});
   }
   showHideDeveloperOptions(){
   	const curState = this.state.showDeveloperOptions;
   	let btn = document.getElementById('DeveloperOptionsBlock');
   	btn.style.display = !curState ? 'inline-block' : 'none';
   	this.setState({showDeveloperOptions: !curState});
   }
   setUnixDayOffset(){
   	const slctn = document.getElementById('UnixDayOffsetSelection');
   	const offset = slctn.options[slctn.selectedIndex].value;
   	console.log('offset: ', offset);
   	const data = {
   		offset
   	};
   	httpPOST('/setArduinoUnixDayOffset', data);
   }
   requestMoistureSensorData(){
   	httpGET('/requestMoistureSensorData', (resp, err)=>{
			if(err){
				console.log('could not load MoistureSensorData: ', err);
			}else{
				const sensors = resp.data;
				console.log('requestMoistureSensorData: resp: ', resp);
				this.setMoistureSensors(sensors);
			}
		});
   }
   sendSensorDataToServer(){
   	let sensors = this.state.moistureSensors;
   	let data = {
   		sensors: sensors
   	}
   	httpPOST('/setMoistureSensorData', data);
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
   
   genRecurringDOWSelection(){
		const daysOfWeek = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
		
   	const recurringDowSelection = (
			<div id="RecurringScheduleDateBlock">
				<div className="ScheduleDateToggle">
					<div className="ScheduleDateToggleBlock">
						<div 
								className={"checkbox " + (this.entireWeekSelected() ? "checked" : "unchecked")} 
								onClick={()=>{
										if(this.entireWeekSelected()){
											this.deSelectAllDays();
										}else{
											this.selectAllDays();
										}
									}
								}
						>
							{this.entireWeekSelected() ? String.fromCharCode(10003) : ""}
						</div>
						<div className={"checkboxLabel "+ (this.entireWeekSelected() ? "checked" : "unchecked")}>
							täglich
						</div>
					</div>
				</div>
				{daysOfWeek.map((dayOfWeek, i)=>
					<div className="ScheduleDateToggle"
							key={i}>
						<div 
								className={"checkbox " + (this.state.curSelection.daySelected(i) ? "checked" : "unchecked")} 
									onClick={()=>{
										if(this.daySelected(i)){
											this.deSelectDay(i)
										}else{
											this.selectDay(i)
										}
									}}
						>
							{this.state.curSelection.daySelected(i) ? String.fromCharCode(10003) : ""}
						</div>
						<div 
							className={"checkboxLabel " + (this.state.curSelection.daySelected(i) ? "checked" : "unchecked")}>
							{dayOfWeek}
						</div>
					</div>
				)}
			</div>
		);
		return recurringDowSelection;
   }
   
   genOneTimerDateSelection(){
   	const oneTimerDateSelection = (
			<div id="OneTimerScheduleDateBlock">
				<input type="date"
						 id='OneTimerDateSelection'
						 className="OneTimerDateSelection"
						 defaultValue={new Date(this.state.curSelection.begin * 1000).toISOString().substr(0, 10)}/>
			</div>
		);
		return oneTimerDateSelection;
   }

	render(){
		const curSel = this.state.curSelection;
		console.log('render: curSel: ', curSel.begin);
		const begin = curSel.begin;
		const duration = curSel.duration;
		
		const beginDay = begin % 86400;
		
		const beginHours = evalHours(beginDay);
		const beginMins  = evalMins(beginDay);
		const beginSecs  = evalSecs(beginDay);
		
		const durationMins  = evalMins(duration);
		const durationSecs  = evalSecs(duration);
		
		const manualDuration = this.state.manualDuration;
		const manualDurationMins = evalMins(manualDuration);
		const manualDurationSecs = evalSecs(manualDuration);
		
		const ShowHideDevOptnBtnCssClasses = "IrrigationButton DeveloperButton " + (this.state.showDeveloperOptions ? "ShowButton" : "HideButton");
		const ShowHideDevOptnBtnTxt = this.state.showDeveloperOptions ? "hide developer options" : "show developer options";
		
		const moistureSensors = this.state.moistureSensors;
		console.log('render: moistureSensors: ', moistureSensors);
		
		let irrigationPinTags = [];
		let irrigationIndicatorTags = [];
		for(let i=0; i < 16; ++i){
			irrigationPinTags.push('Pin ' + i);
			irrigationIndicatorTags.push('Multiplexer Pin: ' + i);
		}
		
		const irrigationEntryClassSelectorTabs = [
			{
				label: 'periodisch',
			 	onClick: ()=>{
			 		this.updateUserInputToCurSelection();
			 		this.setState({
			 			irrigationEntrySelection: 'RECURRING',
			 			curSelection: this.state.lastRecurringIE
			 		});
			 	}
			},
			{
				label: 'einmalig',
				onClick: ()=>{
					this.updateUserInputToCurSelection();
			 		this.setState({
			 			irrigationEntrySelection: 'ONE_TIMER',
			 			curSelection: this.state.lastOneTimerIE
			 		});
				}
			}
		];
		
		let irrigationEntrySelectionDiv;
		if(this.state.irrigationEntrySelection === 'RECURRING'){
			irrigationEntrySelectionDiv = this.genRecurringDOWSelection();
		}else{
			irrigationEntrySelectionDiv = this.genOneTimerDateSelection();
		}
		
		return (
		<div id="IrrigationMain">
			<div id="WarningMessageDiv">
				<div id="WarningMessageBckgrnd">
					<div id="WarningMessage">
						Nila: Iiiih bin wundascheeee!!!
					</div>
					<div id="WarningMessageCloseBtn"
							onClick={this.hideWarning}>
						Ok
					</div>
				</div>
			</div>
			
			<div id="IrrigationHeading">
				Bewässerung Balkonien
			</div>
			<div className="IrrigationBlock"
					id="ManualIrrigation">
				<div className="IrrigationHeading">
					Manuelle Bewässerung
				</div>
				<div id="ManualIrrigationSelection">
						<div id="ManualIrrigationSelectionLabel">
							Bewässerung starten für
						</div>
						<div className="ManualIrrigationSelectionTextInputDiv">
							<input type="text" id="ManualIrrigationTimeMins"
								className="ManualIrrigationTimeInput"
								required
		       				defaultValue={manualDurationMins}
		       				size="2"/>
	       				<div className="ManualIrrigationSelectionMinsLabel">
	       					min
	       				</div>
	       				<input type="text" id="ManualIrrigationTimeSecs"
		       				className="ManualIrrigationTimeInput"
								required
		       				defaultValue={manualDurationSecs}
		       				size="2"/>
		       			<div className="ManualIrrigationSelectionMinsLabel">
								sek
							</div>
							
							<RotatingButton
									  onClicked={this.startManualIrrigation}
									  label={'Start!'}
							/>
						</div>
					<br/>
							  
					<div id="ManualIrrigationSep" className="IrrigationSep">
					</div>
					
					<RotatingButton
							  onClicked={()=>{
							  		this.abortCurrentIrrigation();
							  	}}
							  label='Aktuell laufende Bewässerung stoppen!'
							  buttonType="WARNING"
					/>
				</div>
			</div>
			
			<div className="IrrigationBlock TableBlock"
					id="ScheduledIrrigation">
				<div className="IrrigationHeading">
					Bewässerungsplan
				</div>
				
				<div id="ScheduleTable">
					<IrrigationTable entries={this.state.irrigationEntries}
										  rowClicked={rowId => this.tableRowClicked(rowId)}
										  deleteRow={rowId => this.deleteTableRow(rowId)}/>
				</div>
				
				<div id='ClearIrrigationPlanBtn'>
					<RotatingButton
							  onClicked={()=>{
							  		this.clearIrrigationPlan();
							  	}}
							  label='alle Einträge löschen'
							  buttonType='WARNING'
					/>
				</div>
				
				<div className="IrrigationSep">
				</div>
				
				<div id="ScheduledSelection">
						<div id="ScheduledSelectionDate">
							<div id='IrrigationEntryTypeSelTab'>
								{
									<SelectionTab tabs={irrigationEntryClassSelectorTabs}/>
								}
							</div>
							<br/>
							{irrigationEntrySelectionDiv}
						</div>
						<div className="ScheduleSelectionTextInputDiv">
							<div className="ScheduleSelectionTextInputDivLabel">
								Bewässerungsbeginn:
							</div>
							<div className="ScheduleSelectionTextInputDivInput">
								<div id="ScheduledSelectionTime">
									<input type="text" id="ScheduledSelectionHours"
										className="ScheduledSelectionTime"
										required
				       				defaultValue={beginHours}
				       				onChange={()=>{}}
				       				size="2"/>
				       			hh
				       			<input type="text" id="ScheduledSelectionMinutes"
				       				className="ScheduledSelectionTime"
										required
				       				defaultValue={beginMins}
				       				onChange={()=>{}}
				       				size="2"/>
				       			mm
				       			<input type="text" id="ScheduledSelectionSeconds"
				       				className="ScheduledSelectionTime"
										required
				       				defaultValue={beginSecs}
				       				onChange={()=>{}}
				       				size="2"/>
				       			ss
			       			</div>
			       		</div>
			       	</div>
					<br/>
					<br/>
						<div className="ScheduleSelectionTextInputDiv">
							<div className="ScheduleSelectionTextInputDivLabel">
								Bewässerungsdauer:
							</div>
							<div className="ScheduleSelectionTextInputDivInput">
								<div id="ScheduledSelectionTime">
				       			<input type="text" id="ScheduledSelectionDurationMinutes"
				       				className="ScheduledSelectionTime"
										required
				       				defaultValue={durationMins}
				       				onChange={()=>{}}
				       				size="2"/>
				       			mm
				       			<input type="text" id="ScheduledSelectionDurationSeconds"
				       				className="ScheduledSelectionTime"
										required
				       				defaultValue={durationSecs}
				       				onChange={()=>{}}
				       				size="2"/>
				       			ss
				       		</div>
		       			</div>
		       		</div>
	       		<br/>
	       		<br/>

					{this.genRotatingButtonWithMargins(this.addSelectedIrrigationEntry,
															'hinzufügen')}
				</div>

			</div>
			
			
			
			<div className="IrrigationBlock"
					id="MoistureSensorsBlock">
				<div className="IrrigationHeading">
					Feuchtigkeitssensoren
				</div>
				<div id="MoistureSensorsSelection">
					{this.state.moistureSensors.map((sensor, index)=>
					
						<div key={index} className="MoistureSensorSliderDiv">
						
							<div className="MoistureSensorSliderLabel">
								<input type="text"
										 className="ManualIrrigationTimeInput FeuchtigkeitssensorLabel"
										 value={sensor.label}
										 onChange={(e)=>{this.setMoistureSensorLabel(e.target.value, sensor)}}
										 size="10"
								/>
							</div>
							<div className="MoistureSensorPinDropDown">
								<DropDown tags={irrigationPinTags}
											 labels={irrigationIndicatorTags}
											 selectedId={sensor.pin}
											 itemClicked={(pinId)=>this.setMoistureSensorPin(pinId, sensor)}
								/>
							</div>
							<div className="SlideBarDivIrgtn">
								<SlideBar sliderVal={sensor.sensitivity}
											 onMouseUp={(sliderVal)=>{
											 	this.setMoistureSensorSensitivity(sliderVal, sensor);
											 }}
											 label="Sensitivität"
								/>
							</div>
							<div className="IndicatorBarDivIrgtn">
								<IndicatorBar 
										value={sensor.value}
										label="aktueller Wert"
								/>
							</div>
						</div>
					)}
				</div>
			</div>			
			
			
			<br/>
			
			<div>
				<RotatingButton
				  onClicked={()=>{
				  		this.showHideDeveloperOptions();
				  	}}
				  label={ShowHideDevOptnBtnTxt}
				  buttonType='DEVELOPER'
				  id='ShowDeveloperOptionsBtn'
				/>
			</div>
			
			
			<br/>
			
			<div className="IrrigationBlock"
					id="DeveloperOptionsBlock">
				<div className="IrrigationHeading">
					Developer Options
				</div>
				<div id="DeveloperOptionsSelection">
					<div id="DevBtnLst">
						<div className="DevBtnLstItm">
							<RotatingButton
							  onClicked={()=>{
							  		this.getUnixTime();
							  	}}
							  label='GetUnixTime'
							  buttonType='DEVELOPER SMALL'
							/>
						</div><div className="DevBtnLstItm">
							<RotatingButton
							  onClicked={()=>{
							  		this.setUnixTime();
							  	}}
							  label='SetUnixTime'
							  buttonType='DEVELOPER SMALL'
							/>
						</div><div className="DevBtnLstItm">
							<div className="IrrigationSep"></div>
						</div><div className="DevBtnLstItm">
							<RotatingButton
							  onClicked={()=>{
							  		this.sendPlanToArduino();
							  	}}
							  label='send Plan to Arduino'
							  buttonType='DEVELOPER SMALL'
							/>
						</div><div className="DevBtnLstItm">
							<RotatingButton
							  onClicked={()=>{
							  		this.loadPlanFromServer();
							  	}}
							  label='receive Plan'
							  buttonType='DEVELOPER SMALL'
							/>
						</div><div className="DevBtnLstItm">
							<div id="UnixDayOffset">
								<select id="UnixDayOffsetSelection" defaultValue="3">
									<option value="0">0</option>
									<option value="1">1</option>
									<option value="2">2</option>
									<option value="3">3</option>
									<option value="4">4</option>
									<option value="5">5</option>
									<option value="6">6</option>
								</select>
								<RotatingButton
								  onClicked={()=>{
								  		this.setUnixDayOffset();
								  	}}
								  label='set unix day offset'
								  buttonType='DEVELOPER SMALL'
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div id="IrrigationBottomBuffer">
			</div>
		</div>
		);
	}
}

export default withRouter( Irrigation );


