import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";
import axios from 'axios';
import CurtainButton from '../CurtainButton';
import {arraysEqual} from '../StaticFunctions';
import './Irrigation.css';

// laptop:		192.168.2.109
// arduino:		192.168.2.110
// raspberry:	192.168.2.103

//const BACKEND_PORT = 5000;
//const D1MINI_PORT = 80;
const BACKEND_IP = '/irrigation';//http://raspberrypi.local:' + BACKEND_PORT + '/irrigation';//'http://192.168.2.109';
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

function httpGET(path, data, callback=undefined){
	console.log('httpGET: ');
	console.log('path: ', path);
	console.log('data: ', data);
		  
	_httpGETorPOSThlpr(path, data, callback, axios.get);
}

function httpPOST(path, data, callback=res=>{console.log(res.data)}){
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
	
	const tarURL = erasePaddingSlash(BACKEND_IP) + ensureLeadingSlash(path);
	
	console.log('tarURL: ', tarURL);
	
	axiosFtn(BACKEND_IP + path, data)
		  .then(callback);
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
function evalHours(x){
	return Math.floor(x / (60*60));
}
function evalMins(x){
	return Math.floor((x % (60*60)) / 60);
}
function evalSecs(x){
	return Math.floor((x % (60*60)) % 60);
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


class IrrigationEntry{
	constructor(daysOfWeek, begin, duration){
		this.daysOfWeek = Array.isArray(daysOfWeek) ? daysOfWeek.sort() : IrrigationEntry.dowIntValToArr(daysOfWeek);
		this.begin = begin;
		this.duration = duration;
	}
	
	static dowIntValToArr(intVal){
		let iv = intVal;
		let dow = [];
		for(let i=6; i >= 0; --i){
			let tv = 2 ** i;
			if(iv >= tv){
				dow.push(i);
				iv -= 2**i;
			}
		}
		return dow.sort();
	}
	
	static irrigationEntriesEqual(ies0, ies1){
		if(ies0.length != ies1.length){
			return false;
		}
		let ies0cp = [...ies0].sort(IrrigationEntry.Comparator);
		let ies1cp = [...ies1].sort(IrrigationEntry.Comparator);
		for(let i=0; i < ies0cp.length; ++i){
			if( !ies0cp[i].equals(ies1cp[i]) ){
				return false;
			}
		}
		return true;
	}
	
	static parseEntriesString(entriesStr){
		// entriesStr looks like this:
		// 127,27000,60|127,27300,30|127,27600,30|127,27900,30|127,28200,30|127,72000,60|127,72300,30|127,72600,30|127,72900,30|127,73200,30
		
		const irrEntries = [];
		
		const entriesStrings = entriesStr.split('|');
		
		entriesStrings.map(es=>{
			const vals = es.split(',');
			
			const dow = parseInt(vals[0]);
			const begin = parseInt(vals[1]);
			const duration = parseInt(vals[2]);
			
			irrEntries.push( new IrrigationEntry(dow, begin, duration) );
		});
		
		return irrEntries;
	}
	equals(ie){
		return this.begin === ie.begin &&
				 this.duration === ie.duration &&
				 arraysEqual(this.daysOfWeek, ie.daysOfWeek);
	}
	daysOfWeekToInt()
	{
		return this.daysOfWeek.map(wd => 2**wd).reduce((x0, x1) => x0 + x1);
	}
	copy(){
		return new IrrigationEntry(this.daysOfWeek.map(x=>x), this.begin, this.duration);
	}
	getDaysString(){
		const daysstr = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
		
		if(this.allDaysOfWeek()){
			return 'täglich';
		}else if(this.wochenende()){
			return 'Wochenende';
		}else if(this.unterDerWoche()){
			return 'unter der Woche';
		}else if(this.ascending()){
			const firstDay = daysstr[this.daysOfWeek[0]];
			const lastDay = daysstr[this.daysOfWeek[this.daysOfWeek.length-1]];
			return firstDay + ' - ' + lastDay;
		}

		let tars = '';
		return this.daysOfWeek.map(d=>daysstr[d]).join(', ');
	}
	selectDay(dayId){
		if( !this.daysOfWeek.includes(dayId) ){
			this.daysOfWeek.push(dayId);
		}
		this.daysOfWeek.sort();
	}
	deSelectDay(dayId){
		if( this.daysOfWeek.includes(dayId) ){
			this.daysOfWeek.splice(this.daysOfWeek.indexOf(dayId), 1);
		}
	}
	selectAllDays(){
		this.daysOfWeek = [0,1,2,3,4,5,6];
	}
	deSelectAllDays(){
		this.daysOfWeek = [];
	}
	daySelected(dayId){
		return this.daysOfWeek.includes(dayId);
	}
	allDaysOfWeek(){
		return this.checkForDays( [0,1,2,3,4,5,6] );
	}
	wochenende(){
		return this.checkForDays( [5,6] );
	}
	unterDerWoche(){
		return this.checkForDays( [0,1,2,3,4] );
	}
	checkForDays(refArr){
		return refArr.length === this.daysOfWeek.length &&
				 this.daysOfWeek.every( (d,i) => d===refArr[i] );
	}
	ascending(){
		for(let i=0; i < this.daysOfWeek.length-1; ++i){
			if( this.daysOfWeek[i] + 1 != this.daysOfWeek[i+1] ){
				return false;
			}
		}
		return true;
	}
	getBeginString(){
		const hours = Math.floor(this.begin / (60*60));
		const mins = Math.floor( (this.begin % (60*60)) / 60 );
		const secs = Math.floor( (this.begin % (60*60)) % 60 );
		return `${padZeros(hours)} : ${padZeros(mins)} : ${padZeros(secs)} Uhr`;
	}
	getDurationString(){
		return `${Math.floor(this.duration / 60)} min ${padZeros(this.duration % 60)} sec`;
	}
}

IrrigationEntry.Comparator = (ies0, ies1)=>{
	let dow0int = ies0.daysOfWeekToInt();
	let dow1int = ies1.daysOfWeekToInt();
	
	if(dow0int > dow1int){
		return 1;
	}else if(dow0int < dow1int){
		return -1;
	}else if(ies0.begin > ies1.begin){
		return 1;
	}else if(ies0.begin < ies1.begin){
		return -1;
	}else if(ies0.duration > ies1.duration){
		return 1;
	}else if(ies0.duration < ies1.duration){
		return -1;
	}else{
		return 0;
	}
};

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
		irentries.push(new IrrigationEntry([0,1,2,3,4,5,6],  6*60*60 + 0*60 + 0, 1*60 + 0));
		irentries.push(new IrrigationEntry([0,1,2,3,4,5,6], 22*60*60 + 0*60 + 0, 1*60 + 0));
/*		irentries.push(new IrrigationEntry([5,6], 1*60*60 +  0*60 + 0, 0*60 + 45));*/
		
		let curSelection = new IrrigationEntry(
											[0,1,2,3,4,5,6],
											8 * 60 * 60 + 0 * 60 + 0,
											1 * 60 + 0);
		
		this.state = {
			curSelection,
			irrigationEntries: irentries,
			manualDuration: 0 * 60 + 30,
			showDeveloperOptions: false
		}
		this.entireWeekSelected = this.entireWeekSelected.bind(this);
		this.selectDay = this.selectDay.bind(this);
		this.selectAllDays = this.selectAllDays.bind(this);
		this.deSelectAllDays = this.deSelectAllDays.bind(this);
		this.daySelected = this.daySelected.bind(this);
		this.tableRowClicked = this.tableRowClicked.bind(this);
		this.deleteTableRow = this.deleteTableRow.bind(this);
		this.addSelectedEntry = this.addSelectedEntry.bind(this);
		this.setDuration = this.setDuration.bind(this);
		this.setBegin = this.setBegin.bind(this);
		this.getBegin = this.getBegin.bind(this);
		this.getDuration = this.getDuration.bind(this);
		this.updateMaualDuration = this.updateMaualDuration.bind(this);
		this.startManualIrrigation = this.startManualIrrigation.bind(this);
		this.abortCurrentIrrigation = this.abortCurrentIrrigation.bind(this);
		this.clearIrrigationPlan = this.clearIrrigationPlan.bind(this);
		this.setIrrigationEntriesToState = this.setIrrigationEntriesToState.bind(this);
		
		// developer-functions:
		this.getUnixTime = this.getUnixTime.bind(this);
		this.setUnixTime = this.setUnixTime.bind(this);
		
		this.sendPlanToArduino = this.sendPlanToArduino.bind(this);
		this.sendServerPlanToArduino = this.sendServerPlanToArduino.bind(this);
		this.receivePlan = this.receivePlan.bind(this);
		
		this.showHideDeveloperOptions = this.showHideDeveloperOptions.bind(this);
		
		this.setUnixDayOffset = this.setUnixDayOffset.bind(this);
	}
	getAllWeekdays(){
		return this.state.irrigationEntries.map( ie => ie.daysOfWeekToInt() );
	}
	getAllBegins(){
		return this.state.irrigationEntries.map( ie => ie.begin );
	}
	getAllDurations(){
		return this.state.irrigationEntries.map( ie => ie.duration );
	}
	componentWillMount(){
		//let irrigationEntries = retrieveIrrigationEntries();
		//this.setState({irrigationEntries});
		
		this.receivePlan();
   }
   componentDidMount(){
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
		this.saveIrrigationPlanToServerAndLoadUpdatedServerPlan(irrigationEntries);
//		httpPOST('/saveIrrigationPlan', {irrigationEntCries: irrigationEntries});
   	//requestD1Mini('/clearIrrigationPlan');
   	
//   	this.setIrrigationEntriesToState(irrigationEntries);
//   	this.setState({irrigationEntries});
   }
   deleteTableRow(rowId){
   	if(this.state.irrigationEntries.length <= rowId)
   		return;
   	
   	let irrigationEntries = this.state.irrigationEntries;
   	
   	let ie = irrigationEntries[rowId];
   	const weekdays = ie.daysOfWeekToInt();
   	const begin = ie.begin;
   	const duration = ie.duration;
   	
   	const data = {
   		weekdays,
   		begin,
   		duration
   	};
   	httpPOST('/removeIrrigationEntry', data);
   	//requestD1Mini('/removeIrrigationEntry?weekdays=' + weekdays + '&begin=' + begin + '&duration=' + duration);
   	
   	irrigationEntries.splice(rowId, 1);
   	
   	this.saveIrrigationPlanToServerAndLoadUpdatedServerPlan(irrigationEntries);
   	
//   	this.setIrrigationEntriesToState(irrigationEntries);
//   	this.setState({irrigationEntries});
   }
   saveIrrigationPlanToServerAndLoadUpdatedServerPlan(irrigationEntries){
   	httpPOST('/saveIrrigationPlan', {irrigationEntries: irrigationEntries}, (data, err)=>{
   		if(err){
   			console.log('tried to delete row/IrrigationEntry -> error occured: ', err);
   		}else{
   			console.log('setting removed plan');
   			this.loadIrrigationPlanFromServerAndSetToState();
   		}
   	});
   }
   entireWeekSelected(){
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
   
   addSelectedEntry(){
   	let irrigationEntries = this.state.irrigationEntries;
   	let curSelection = this.state.curSelection.copy();
   	
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
   	
   	const weekdays = curSelection.daysOfWeekToInt();
   	const begin = curSelection.begin;
   	const duration = curSelection.duration;
   	
   	const data = {
   		weekdays,
   		begin,
   		duration
   	};
   	
		// send new entry to Arduino:
   	httpPOST('/addIrrigationEntry', data);
   	
   	
		// save new entry to Server-file:
   	irrigationEntries.push(curSelection);
   	irrigationEntries.sort(IrrigationEntry.Comparator);
   	this.saveIrrigationPlanToServerAndLoadUpdatedServerPlan(irrigationEntries);
//   	httpPOST('/saveIrrigationPlan', {irrigationEntries: irrigationEntries});
   	//requestD1Mini('/addIrrigationEntry?weekdays=' + weekdays + '&begin=' + begin + '&duration=' + duration);
   	
//   	irrigationEntries.push(curSelection);
//   	this.setIrrigationEntriesToState(irrigationEntries);
//   	this.setState({irrigationEntries});
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
   	//requestD1Mini('/startManualIrrigation?duration=' + manualDuration);
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
//   	requestD1Mini('/stopCurrentIrrigation');
   	
   	this.showWarning('laufende Bewässerung abgebrochen!', 1000);
   	setTimeout(()=>{
      	this.hideWarning();
      }, 1000);
   }
   
   showWarning(warningMsg, showButton=true){
   	let warmingMessageDiv = document.getElementById('WarmingMessageDiv');
   	let warmingMessage = document.getElementById('WarmingMessage');
   	
   	let btn = document.getElementById('WarmingMessageCloseBtn');
   	btn.style.display = Number.isInteger(showButton) ? 'none' : 'inline-block';
   	
   	warmingMessage.innerHTML = warningMsg;
   	warmingMessageDiv.style.opacity = '0.0';
   	warmingMessageDiv.style.display = 'block';
   	if(warningMsg.length > 100){
	   	warmingMessageDiv.style.fontSize = '15px';
	   }else{
	   	warmingMessageDiv.style.fontSize = '50px';
   	}
   	setTimeout(()=>{
      	warmingMessageDiv.style.opacity = '1.0';
      	if(Number.isInteger(showButton)){
	      	setTimeout(()=>{
	      		this.hideWarning();
	      	}, showButton);
	      }
      }, 0);
   }
   hideWarning(){
      const warmingMessageDiv = document.getElementById('WarmingMessageDiv');
      warmingMessageDiv.style.opacity = '0';
      setTimeout(()=>{
      	warmingMessageDiv.style.display = 'none';
      }, 1000);
   }
   
   // developer functions:
   getUnixTime(){
   	console.log('getUnixTime -> current unix time: ' + evalCurrentUnixTime());
   	httpGET('/getUnixTime');
//   	requestD1Mini('/getUnixTime');
   }
   setUnixTime(){
   	let unix = evalCurrentUnixTime();
   	console.log('sending unix-time (dayTime: ', daySecondsToPrettyString(unix % 86400), ')');
   	
   	const data = {
   		UNIX: unix
   	}
   	httpPOST('/setUnixTime?UNIX=' + unix, data);
//   	requestD1Mini('/setUnixTime?UNIX=' + unix);
   }
   sendPlanToArduino(){
   	const weekdays = this.getAllWeekdays().join('-');
		const begins = this.getAllBegins().join('-');
		const durations = this.getAllDurations().join('-');
		
		const data = {
			weekdays,
			begin: begins,
			duration: durations
		};
   	httpPOST('/sendIrrigationPlan', data);
//   	requestD1Mini('/sendIrrigationPlan?weekdays=' + weekdays + '&begin=' + begins + '&duration=' + durations);
   }
   sendServerPlanToArduino(){
   	this.loadIrrigationPlanFromServer( (irrigationEntriesFromFile, err)=>{
   		if(err){
   			// warnung wird bereits in loadIrrigationPlanFromServer ausgegeben!
   		}else{
   			this.setIrrigationEntriesToState(irrigationEntriesFromFile);
//   			this.setState({irrigationEntries: irrigationEntriesFromFile});
   			this.sendPlanToArduino();
   		}
   	});
   }
   loadIrrigationPlanFromServer(handler){
   	// loads irrigationEntries from Server/File
   	// AND parses received objects/entries to IrrigationEntry-class-instances
   	httpGET('/loadIrrigationPlanFromFile', null, (resp, err)=>{
			if(err){
				console.log('could not load IrrigatonPlan from Server/File: ', err);
				handler(null, err);
			}else{
				const ip = resp.data;
				let irrigationEntriesFromFile = ip.irrigationEntries;
				irrigationEntriesFromFile = irrigationEntriesFromFile.map(x=>new IrrigationEntry(x.daysOfWeek, x.begin, x.duration));
				handler(irrigationEntriesFromFile, null);
			}
		});
   }
   loadIrrigationPlanFromServerAndSetToState(){
   	this.loadIrrigationPlanFromServer((irrigationEntriesFromFile, err)=>{
   		if(err){
   			// warnung bereits in loadIrrigationPlanFromServer ausgegeben!
   		}else{
   			this.setIrrigationEntriesToState(irrigationEntriesFromFile);
   		}
   	});
   }
   receivePlan(overrideLocalPlan=false){
   	const irrResp = (resp, err)=>{
   		if(!!err){
   			console.log('Arduino-ERROR: ', err);
   		}else{
	   		const irrigEntriesStr = resp.data;
	   		console.log('received IrrigationPlan from Arduino: ', irrigEntriesStr);
	   		const arduinoIrrigationEntries = IrrigationEntry.parseEntriesString(irrigEntriesStr);
	   		console.log('overrideLocalPlan: ', overrideLocalPlan);
	   		if(overrideLocalPlan){
	   			httpPOST('/saveIrrigationPlan', {arduinoIrrigationEntries});
	   		}else{
	   			this.loadIrrigationPlanFromServer( (irrigationEntriesFromFile, err)=>{
	   				if(err){
	   					console.log('could not load IrrigatonPlan from Server/File: ', err);
	   					this.setIrrigationEntriesToState(arduinoIrrigationEntries);
//	   					this.setState({irrigationEntries: arduinoIrrigationEntries});
	   				}else{
	   					console.log('irrigationEntriesFromFile: ', irrigationEntriesFromFile);
	   					
	   					let iesEqual = IrrigationEntry.irrigationEntriesEqual(arduinoIrrigationEntries, irrigationEntriesFromFile);
							if( iesEqual ){
								this.setIrrigationEntriesToState(arduinoIrrigationEntries);
//								this.setState({irrigationEntries: arduinoIrrigationEntries});
							}else{
								// IrrigationEntries from server-file don't match arduino-entries!!!
								let warningMsg = 'Arduino-IrrigationEntries != Server-IrrigationEntries!!!\n';
/*								warningMsg += 'Arduino: ' + JSON.stringify(arduinoIrrigationEntries) + '\n';
								warningMsg += 'Server:  ' + JSON.stringify(irrigationEntriesFromFile);*/
								this.showWarning(warningMsg, 2000);
								this.setIrrigationEntriesToState(irrigationEntriesFromFile);
//								this.setState({irrigationEntries: irrigationEntriesFromFile});
							}
	   				}
	   			});
	   		}
//	   		this.setState({irrigationEntries: arduinoIrrigationEntries});
   		}
   	};
   	httpGET('/getIrrigationPlan', null, irrResp);
//   	requestD1Mini('/getIrrigationPlan');
   }
   setIrrigationEntriesToState(irrigationEntries){
   	let ies = [...irrigationEntries].sort(IrrigationEntry.Comparator);
   	this.setState({irrigationEntries: ies});
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
   	httpPOST('/setUnixDayOffset', data);
//   	requestD1Mini('/setUnixDayOffset?offset=' + offset);
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
			<div id="WarmingMessageDiv">
				<div id="WarmingMessageBckgrnd">
					<div id="WarmingMessage">
						Nila: Iiiih bin wundascheeee!!!
					</div>
					<div id="WarmingMessageCloseBtn"
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
					<button type="button"
							  onClick={()=>{
							  		const btn = document.getElementById('IrrigationMainStart');
							  		btn.style.animationName = 'buttonAnimation';
							  		setTimeout(()=>btn.style.animationName = '', 500);
							  		this.startManualIrrigation();
							  	}}
							  className="IrrigationButton"
							  id="IrrigationMainStart">
						Start!
					</button>
							  
					<div className="IrrigationSep">
					</div>
					
					<button type="button"
								  onClick={this.abortCurrentIrrigation}
								  className="IrrigationButton WarningButton"
								  id="AbortCurrentIrrigation">
						Aktuell laufende Bewässerung stoppen!
					</button>
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
				
				<button type="button"
							  onClick={this.clearIrrigationPlan}
							  className="IrrigationButton WarningButton"
							  id="ClearIrrigationPlanBtn">
					alle Einträge löschen
				</button>
				
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
						Bewässerungsbeginn:
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
					<br/>
					<br/>
						Bewässerungsdauer:
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
	       		<br/>
	       		<br/>
					<button type="button"
								className="IrrigationButton"
							  onClick={this.addSelectedEntry}
							  id="IrrigationMainStart">
						hinzufügen
					</button>
				</div>

			</div>
			
			<br/>
			
			<button type="button"
						  onClick={this.showHideDeveloperOptions}
						  className={ShowHideDevOptnBtnCssClasses}
						  id="DeveloperOptionsHideBtn">
				{ShowHideDevOptnBtnTxt}
			</button>
			
			<br/>
			
			<div className="IrrigationBlock"
					id="DeveloperOptionsBlock">
				<div className="IrrigationHeading">
					Developer Options
				</div>
				<div id="DeveloperOptionsSelection">
					<div id="DevBtnLst">
						<div className="DevBtnLstItm">
							<button type="button"
										  onClick={this.getUnixTime}
										  className="IrrigationButton DeveloperButton"
										  id="GetUnixTimeBtn">
								GetUnixTime
							</button>
						</div><div className="DevBtnLstItm">
							<button type="button"
										  onClick={this.setUnixTime}
										  className="IrrigationButton DeveloperButton"
										  id="SetUnixTimeBtn">
								SetUnixTime
							</button>
						</div><div className="DevBtnLstItm">
							<div className="IrrigationSep"></div>
						</div><div className="DevBtnLstItm">
							<button type="button"
										  onClick={this.sendPlanToArduino}
										  className="IrrigationButton DeveloperButton"
										  id="SendPlanToArduinoBtn">
								send Entire Plan to Arduino
							</button>
						</div><div className="DevBtnLstItm">
							<button type="button"
										  onClick={this.sendServerPlanToArduino}
										  className="IrrigationButton DeveloperButton"
										  id="SendPlanToArduinoBtn">
								send Server Plan to Arduino
							</button>
						</div><div className="DevBtnLstItm">
							<button type="button"
										  onClick={()=>this.receivePlan(false)}
										  className="IrrigationButton DeveloperButton"
										  id="receivePlanBtn">
								receive Plan
							</button>
						</div><div className="DevBtnLstItm">
							<button type="button"
										  onClick={()=>this.receivePlan(true)}
										  className="IrrigationButton DeveloperButton"
										  id="ReceiveAndSavePlanBtn">
								receive Plan and save/override local plan
							</button>
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
								<button type="button"
											  onClick={this.setUnixDayOffset}
											  className="IrrigationButton DeveloperButton"
											  id="SetUnixDayOffsetBtn">
									set unix day offset
								</button>
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


