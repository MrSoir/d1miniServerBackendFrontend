import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";
import axios from 'axios';
import socketIOClient from "socket.io-client";

// modules_frontend_backend:
import SF from 'staticfunctions';
import IE from 'irrigationentry';

// local files:
import SlideBar from '../SlideBar';
import IndicatorBar from '../IndicatorBar';
import RotatingButton from '../RotatingButton';
import './Irrigation.css';

const arraysEqual = SF.arraysEqual;
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
const SOCKET_ID = 'AI0';
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
	if(relUrlPath.includes('?')){
		return url += '&socketId=' + SOCKET_ID + '&arduinoId=' + ARDUINO_ID;
	}else{
		return url += '?socketId=' + SOCKET_ID + '&arduinoId=' + ARDUINO_ID;
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

function evalCurrentUnixTime()
{
	var d = new Date();
	const gmtOffsInMins = d.getTimezoneOffset();
	var secondsSinceEpoch = Math.round(d.getTime() / 1000)- gmtOffsInMins * 60;
	return secondsSinceEpoch;
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
						<th>Wochentag(e)</th> 
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
		return (
			<tr className="IrrigationTableRow"
				onClick={()=>this.props.onClicked()}>
				<td>{this.props.id + 1}</td>
				<td>{this.props.irrigationEntry.getDaysString()}</td>
				<td>{this.props.irrigationEntry.getBeginString()}</td>
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
		
		console.log('beforeSorting: irentries: ', irentries);
		irentries = irentries.sort(IrrigationEntry.Comparator);
		console.log('after Sorting: irentries: ', irentries);
		
		let curSelection = new RecurringIE(
											[0,1,2,3,4,5,6],
											8 * 60 * 60 + 0 * 60 + 0,
											1 * 60 + 0);
											
		let genMoistSensor = (id)=>{
			return {
				label: "Sensor " + id,
				sensitivity: 0.5 * id,
				value: 0.1 * id
			}
		};
		let moistureSensors = new Map();
		moistureSensors.set(0, genMoistSensor(0));
		moistureSensors.set(1, genMoistSensor(1));
		moistureSensors.set(2, genMoistSensor(2));
		
		this.state = {
			curSelection,
			irrigationEntries: irentries,
			manualDuration: 0 * 60 + 30,
			showDeveloperOptions: false,
			moistureSensors
		}
		this.entireWeekSelected = this.entireWeekSelected.bind(this);
		this.selectDay = this.selectDay.bind(this);
		this.selectAllDays = this.selectAllDays.bind(this);
		this.deSelectAllDays = this.deSelectAllDays.bind(this);
		this.daySelected = this.daySelected.bind(this);
		this.tableRowClicked = this.tableRowClicked.bind(this);
		this.deleteTableRow = this.deleteTableRow.bind(this);
		this.addSelectedRecurringIE = this.addSelectedRecurringIE.bind(this);
		this.setDuration = this.setDuration.bind(this);
		this.setBegin = this.setBegin.bind(this);
		this.getBegin = this.getBegin.bind(this);
		this.getDuration = this.getDuration.bind(this);
		this.updateMaualDuration = this.updateMaualDuration.bind(this);
		this.startManualIrrigation = this.startManualIrrigation.bind(this);
		this.abortCurrentIrrigation = this.abortCurrentIrrigation.bind(this);
		this.clearIrrigationPlan = this.clearIrrigationPlan.bind(this);
		this.setIrrigationEntriesToState = this.setIrrigationEntriesToState.bind(this);
		
		this.onMoistureSensorSensitivityChanged = this.onMoistureSensorSensitivityChanged.bind(this);
		this.onMoistureSensorDataChanged = this.onMoistureSensorDataChanged.bind(this);
		this.setMoistureSensorLabel = this.setMoistureSensorLabel.bind(this);
		
		// developer-functions:
		this.getUnixTime = this.getUnixTime.bind(this);
		this.setUnixTime = this.setUnixTime.bind(this);
		
		this.sendPlanToArduino = this.sendPlanToArduino.bind(this);
		this.loadPlanFromServer = this.loadPlanFromServer.bind(this);
		
		this.receiveSensorData = this.receiveSensorData.bind(this);
		this.receiveMoistureSensorData = this.receiveMoistureSensorData.bind(this);
		
		this.showHideDeveloperOptions = this.showHideDeveloperOptions.bind(this);
		
		this.setUnixDayOffset = this.setUnixDayOffset.bind(this);
	}
	componentWillMount(){
   }
   componentDidMount(){
   	this.loadPlanFromServer();
//		this.receiveSensorData();
		
		this.connectSocketIO();
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
			socket.emit('setId', {id: SOCKET_ID});
		});
   }
   disconnectSocket(){
   	if(socket){
   		console.log('client: socket-io: disconnect!');
   		socket.emit('disconnect', {id: SOCKET_ID});
   	}
   }
   
   tableRowClicked(rowId){
   	if(this.state.irrigationEntries.length <= rowId)
   		return;
		
   	const curSelection = this.state.irrigationEntries[rowId].copy();
   	
   	this.setState({curSelection});
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
   
   addSelectedRecurringIE(){
   	let irrigationEntries = this.state.irrigationEntries;
   	let curSelection = this.state.curSelection.copy();
   	
   	console.log('curSelection: ', curSelection);
   	
   	if(!curSelection.daysOfWeek || curSelection.daysOfWeek.length === 0){
   		this.showWarning("Es muss mindestens ein Wochentag ausgewählt werden!", 1000);
   		return;
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
   	
		// send new entry to Arduino:
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
   	console.log('getUnixTime -> current browser-unix time: ' + evalCurrentUnixTime());
   	httpGET('/getArduinoUnixTime');
   }
   setUnixTime(){
   	httpGET('/setArduinoUnixTime');
   }
   sendPlanToArduino(){
   	httpGET('/updateArduinosIrrigationPlan');
   }
   receiveSensorData(){
		this.receiveMoistureSensorData();
   }
   receiveMoistureSensorData(){
   	const irrResp = (resp, err)=>{
   		if(err){
   			console.log('Arduino-ERROR: ', err);
   		}else{
   			let sensorData = resp.data;
   			console.log('sensorData: ', sensorData);
   			if(!!sensorData){
   				this.setState({moistureSensors: sensorData});
   			}else{
   				console.log('no moisture sensor data recevied!');
   			}
   		}
   	};
   	httpGET('/getMoistureSensorData', irrResp);
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
   	httpGET('/getIrrigationPlan', irrResp);
   }
   parseJSONobjToIrrigationEntryInstance(objEntries){
   	return objEntries.map(x=>IrrigationEntry.createFromObj(x));
   }
   setIrrigationEntriesToState(irrigationEntries){
		// in case irrigationEntries are bare json-objects, parse them to IrrigationEntry-instances
		irrigationEntries = this.parseJSONobjToIrrigationEntryInstance(irrigationEntries);
		
		console.log('before sorting: ', irrigationEntries);
   	irrigationEntries.sort(IrrigationEntry.Comparator);
   	console.log('after sorting: ', irrigationEntries);
   	
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
   
   onMoistureSensorSensitivityChanged(val, sensorId){
   	if(this.state.moistureSensors.size > sensorId){
   		let sensors = this.state.moistureSensors;
   		sensors.get(sensorId).sensitivity = val;
   		
   		this.setState({moistureSensors: sensors});
   		httpPOST('/setMoistureSensorData', sensors);
   	}else{
   		console.log('onMoistureSensorSensitivityChanged - sensorId > array!!!');
   	}
   }
   onMoistureSensorDataChanged(sensorData){
   	if(!!sensorData){
   		this.setState({moistueSensors: sensorData});
   	}
   }
   requestMoistureSensorData(){
   	httpGET('/requestMoistureSensorData', (resp, err)=>{
			if(err){
				console.log('could not load MoistureSensorData: ', err);
			}else{
				const sensors = resp.data;
				console.log('requestMoistureSensorData: resp: ', resp);
				this.setState({moistureSensors: sensors});
			}
		});
   }
   setMoistureSensorLabel(label, sensorId){
   	console.log('label: ', label, '	sensorId: ', sensorId);
      if(this.state.moistureSensors.length > sensorId){
   		let sensors = this.state.moistureSensors;
   		sensors.get(sensorId).label = label;
   		
   		this.setState({moistureSensors: sensors});
   		httpPOST('/setMoistureSensorData', sensors);
   	}else{
   		console.log('onMoistureSensorSensitivityChanged - sensorId > array!!!');
   	}
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

	render(){
		const daysOfWeek = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
		
		const curSel = this.state.curSelection;
		const begin = curSel.begin;
		const duration = curSel.duration;
		
		const beginHours = evalHours(begin);
		const beginMins  = evalMins(begin);
		const beginSecs  = evalSecs(begin);
		
		const durationMins  = evalMins(duration);
		const durationSecs  = evalSecs(duration);
		
		const manualDuration = this.state.manualDuration;
		const manualDurationMins = evalMins(manualDuration);
		const manualDurationSecs = evalSecs(manualDuration);
		
		const ShowHideDevOptnBtnCssClasses = "IrrigationButton DeveloperButton " + (this.state.showDeveloperOptions ? "ShowButton" : "HideButton");
		const ShowHideDevOptnBtnTxt = this.state.showDeveloperOptions ? "hide developer options" : "show developer options";
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
						Bewässerung starten für
						<input type="text" id="ManualIrrigationTimeMins"
							className="ManualIrrigationTimeInput"
							required
	       				value={manualDurationMins}
	       				size="2"
	       				onChange={this.updateMaualDuration}/>
	       			min
	       			<input type="text" id="ManualIrrigationTimeSecs"
	       				className="ManualIrrigationTimeInput"
							required
	       				value={manualDurationSecs}
	       				size="2"
	       				onChange={this.updateMaualDuration}/>
						sek
					<br/>

					{this.genRotatingButtonWithMargins(this.startManualIrrigation,
															'Start!')}
							  
					<div className="IrrigationSep">
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
							Tag:
							<div id="ScheduleDateBlock">
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
						</div>
						<br/>
						<div className="ScheduleSelectionTextInputDiv">
							<div className="ScheduleSelectionTextInputDivLabel">
								Bewässerungsbeginn:
							</div>
							<div className="ScheduleSelectionTextInputDivInput">
								<div id="ScheduledSelectionTime">
									<input type="text" id="ScheduledSelectionHours"
										className="ScheduledSelectionTime"
										required
				       				value={beginHours}
				       				onChange={(evt)=>{
				       					let x = evt.target.value;//document.getElementById('ScheduledSelectionHours').value;
				       					if(x.length <= 2 && x.length >= 1){
					       					x = valToInteger(x);
					       					
					       					let begin = this.getBegin();
					       					let hours = evalHours(begin);
					       					
					       					begin = begin - (hours * (60 * 60)) + x * 60 * 60;
					       					
					       					this.setBegin(begin);
					       				}
				       				}}
				       				size="2"/>
				       			hh
				       			<input type="text" id="ScheduledSelectionMinutes"
				       				className="ScheduledSelectionTime"
										required
				       				value={beginMins}
				       				onChange={(evt)=>{
				       					let x = evt.target.value;//document.getElementById('ScheduledSelectionMinutes').value;
					       				if(x.length <= 2 && x.length >= 1){
					       					x = valToInteger(x);
					       					
					       					let begin = this.getBegin();
					       					let mins = evalMins(begin);
					       					
					       					begin = begin - (mins * 60) + x * 60;
					       					
					       					this.setBegin(begin);
					       				}
				       				}}
				       				size="2"/>
				       			mm
				       			<input type="text" id="ScheduledSelectionSeconds"
				       				className="ScheduledSelectionTime"
										required
				       				value={beginSecs}
				       				onChange={(evt)=>{
				       					let x = evt.target.value;//document.getElementById('ScheduledSelectionSeconds').value;
				       					if(x.length <= 2 && x.length >= 1){
					       					x = valToInteger(x);
					       					
					       					let begin = this.getBegin();
					       					let secs = evalSecs(begin);
					       					
					       					begin = begin - secs + x;
					       					
					       					this.setBegin(begin);
					       				}
				       				}}
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
				       				value={durationMins}
				       				onChange={()=>{
				       					let x = document.getElementById('ScheduledSelectionDurationMinutes').value;
				       					x = valToInteger(x);
				       					
				       					let duration = this.getDuration();
				       					let mins = evalMins(duration);
				       					
				       					duration = duration - (mins * 60) + x * 60;
				       					
				       					this.setDuration(duration);
				       				}}
				       				size="2"/>
				       			mm
				       			<input type="text" id="ScheduledSelectionDurationSeconds"
				       				className="ScheduledSelectionTime"
										required
				       				value={durationSecs}
				       				onChange={()=>{
				       					let x = document.getElementById('ScheduledSelectionDurationSeconds').value;
				       					x = valToInteger(x);
				       					
				       					let duration = this.getDuration();
				       					let secs = evalSecs(duration);
				       					
				       					duration = duration - secs + x;
				       					
				       					this.setDuration(duration);
				       				}}
				       				size="2"/>
				       			ss
				       		</div>
		       			</div>
		       		</div>
	       		<br/>
	       		<br/>

					{this.genRotatingButtonWithMargins(this.addSelectedRecurringIE,
															'hinzufügen')}
				</div>

			</div>
			
			
			
			<div className="IrrigationBlock"
					id="MoistureSensorsBlock">
				<div className="IrrigationHeading">
					Feuchtigkeitssensoren
				</div>
				<div id="MoistureSensorsSelection">
					{[...this.state.moistureSensors].map(([id, sensor])=>
						<div key={id}
								className="MoistureSensorSliderDiv">
							<div className="MoistureSensorSliderDivLeft">
								<input type="text"
										 className="ManualIrrigationTimeInput FeuchtigkeitssensorLabel"
										 defaultValue={sensor.label}
										 onChange={(e)=>{this.setMoistureSensorLabel(e.target.value, id)}}/>
							</div>
							<div className="MoistureSensorSliderDivCenter MoistureSlideBarDiv">
								<SlideBar defaultValue={sensor.sensitivity}
											 onMouseUp={(sliderVal)=>{
											 	this.onMoistureSensorSensitivityChanged(sliderVal, id)
											 }}
											 label="Sensitivität"
								/>
							</div>
							<div className="MoistureSensorSliderDivRight MoistureSlideBarDiv MoistureSlideBarSmall">
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
		</div>
		);
	}
}

export default withRouter( Irrigation );


