const express = require('express');
const axios = require('axios');
const IrrigationRouter = express.Router();
const fs = require('fs');

//let IPSchema = require('./IrrigationPlan.model');

// modules_frontend_backend:
const IE = require('irrigationentry');
const SF = require('staticfunctions');

const IrrigationEntry = IE.IrrigationEntry;
const RecurringIE = IE.RecurringIE;
const OneTimerIE = IE.OneTimerIE;


//---------------constants---------------

const ARDUINO_IP = 'http://esp_0b9e2e';//192.168.2.111';

const IRGTNPLAN_JSON_BASE_FILE_NAME 		= __dirname + '/IrrigationPlan';
const MOISTURE_SENSOR_DATA_BASE_FILE_NAME = __dirname + '/MoisturesSensorData';

const SERVER_IP 	= "raspberrypi";
const SERVER_PORT = "8080";

const sockets = new Map();

//---------------url-functions---------------

IrrigationRouter.setApp = (app)=>{
	this.app = app;
};

function generateSocketId(socket){
	// wichtig: newId bei 1 starten lassen
	// pain in the ass: falls socketId === 0 gesetzt wird, also die allererste => if(socketId) === false!!!
	// => socketId darf niemals 0 sein!!!
	let newId = 1;
	
	while(sockets.has(newId)){
		++newId;
	}
	
	sockets.set(newId, socket);
	
	return newId;
}
function deleteSocket(socketId){
	sockets.delete(socketId);
}
IrrigationRouter.setSocketIO = (socketIO)=>{
	this.socketIO = socketIO;
	
	socketIO.on('connection', socket=>{
		const socketId = generateSocketId(socket);
		console.log('\nSERVER: socket-io: client connected! (socketId: ' + socketId + ')');
		
		socket.on('disconnect', data=>{
			console.log('\nSERVER: socket-io: disconnect: ', data);
			deleteSocket(socketId);
		});
		socket.on('getMoistureSensorValues', ()=>{
			let httpCallback = (arduinoResp, err)=>{
				if(err){
					console.log('failed to load moisture sensor values - ', err.code);
				}else{
					let sensorValues = arduinoResp.data;
					console.log('sensorValues: ', sensorValues);
					let sensors = sensorValues.sensors;
					console.log('sensors: ', sensors);
					
					// komplett absurder bullshit, aber aus irgend einem grund wirft der server ohne folgende zeile einen exception aus...:
					let retValue = {
						sensors: sensorValues.sensors
					};
					socket.emit('setMoistureSensorValues', retValue);
				}
			}
			
			let arduinoRequestURL = '/getMoistureSensorValues';
			httpGET_Arduino(arduinoRequestURL, null, null, httpCallback);
		});
		socket.emit('connectionEstablished', {id: socketId});
	});
};


function objToUrlParameterStr(x){
  	let strObj = [];

	if(!!x){
		for(let v in x){
	   	strObj.push( String(v) + '=' + x[v] );
		}
  	}
  	
  	console.log('strObj: ', strObj);
  	
  	return strObj.join('&');
}

function urlFromParams(baseURL, params){
	const ulrParamsStr = objToUrlParameterStr(params);
	return !!ulrParamsStr 
				? baseURL + '?' + ulrParamsStr
				: baseURL;
}
function httpGET_Arduino(baseURL, data, srcResp, callback=undefined){
	if(!callback){
		callback = (resp, err)=>{
			if(!srcResp){
				return;
			}
			if(!!err){
				srcResp.status(400).send(err);
			}else{
				srcResp.status(200).send(resp.data);
			}
		};
	}
	
	baseURL = SF.eraseLeadingSlash( SF.erasePaddingSlash(baseURL) );
	
	const tarURL = urlFromParams(baseURL, data);
	
	const absTarURL = ARDUINO_IP + '/' + tarURL;
	console.log('requesting: ', absTarURL);
	
	axios.get(absTarURL, data)
		  		.then((resp, err) =>{
		  			if(!!err){
		  				console.error('httpGET_Arduino -> then-ERROR: ', err);
		  				callback(null, err);
		  			}else{
		  				const response = {
		  					data: resp.data,
		  					status: resp.status
		  				}
		  				console.log('Arduino-response: ', response);
		  				
		  				callback(resp, null);
		  			}
		  		}).catch(err=>{
		  			console.error('httpGET_Arduino -> axios.GET-ERROR: ', err.code);
		  			callback(null, err);
		  		});
}
function httpPOST_Arduino(baseURL, data, srcResp, callback=undefined){
	if(!callback){
		callback = (resp, err)=>{
			if(!srcResp){
				return;
			}
			if(!!err){
				srcResp.status(400).send(err);
			}else{
				srcResp.status(200).send(resp.data);
			}
		};
	}
	
	baseURL = SF.eraseLeadingSlash( SF.erasePaddingSlash(baseURL) );
	
	const tarURL = baseURL;//urlFromParams(baseURL, data);
	
	const absTarURL = ARDUINO_IP + '/' + tarURL;
	console.log('requesting: ', absTarURL);
	
	axios.post(absTarURL, data)
		  		.then((resp, err) =>{
		  			if(!!err){
		  				console.error('httpGET_Arduino -> then-ERROR: ', err);
		  				callback(null, err);
		  			}else{
		  				const response = {
		  					data: resp.data,
		  					status: resp.status
		  				}
		  				console.log('Arduino-response: ', response);
		  				
		  				callback(resp, null);
		  			}
		  		}).catch(err=>{
		  			console.error('httpGET_Arduino -> axios.GET-ERROR: ', err.code);
		  			callback(null, err);
		  		});
}

function parseArduinoIrrigationEntriesStrToPlan(entriesStr){
	let entries = IrrigationEntry.parseArdiunoIrrigationEntriesString(entriesStr);
	let plan = {
		irrigationEntries: entries
	};
	return plan;
}

//---------------routes---------------

IrrigationRouter.route('/getIrrigationPlanFromArduino').get(function(req, srcResp) {	
	let callback = (ardResp, err)=>{
		if(err){
			srcResp.status(400).send(err);
		}else{
			let entriesStr = ardResp.data;
			let plan = parseArduinoIrrigationEntriesStrToPlan(entriesStr);
			srcResp.status(200).send(plan);
		}
	};
	httpGET_Arduino('/getIrrigationPlan', req.body, srcResp, callback);
});

IrrigationRouter.route('/updateArduinosIrrigationPlan').get(function(req, res) {
	loadIrrigationPlanFromFile((plan, err)=>{
		if(err){
			res.status(400).status('could not update arduino-irrigation-plan with server-plan!');
		}else{
			sendIrrigationPlanToArduino(plan, res);
		}
	}, req);
});

IrrigationRouter.route('/getPlan').get((req,res)=>{
	loadIrrigationPlanFromFile((irrigationPlan, err)=>{
		if(err){
			res.status(400).send('no data on server!');
		}else{
			res.status(200).send(irrigationPlan);
		}
	}, req);
});

IrrigationRouter.route('/setIrrigationPlan').post((req,res)=>{
	const dataObj = req.body;
	
	setIrrigationPlan(dataObj, (err)=>{
		if(err){
			res.status(400).send('could not save IrrigationPlan to File!');
		}else{
			res.status(200).send(dataObj);
		}
	}, req);
});

IrrigationRouter.route('/clearIrrigationPlan').get(function(req, res) {
	let clearedPlan = {irrigationEntries: []};
	setIrrigationPlan(clearedPlan, (err)=>{
		if(err){
			res.status(400).send('failed to clear IrrigationPlan!');
		}else{
			res.status(200).send(clearedPlan);
		}
	}, req);
});

function getSocketId(req){
	if(!!req && !!req.query.socketId){
		let socketId = parseInt(req.query.socketId);
		return isNaN(socketId) ? null : socketId;
	}
	return null;
}
function getArduinoId(req){
	return (!!req && !!req.query.arduinoId) ? req.query.arduinoId : null;
}

function parseRequestObjToIrrigationEntryInstace(ieObj){
	return IrrigationEntry.createFromObj(ieObj);
}
IrrigationRouter.route('/addIrrigationEntry').post(function(req, res) {
	console.log('addIrrigationEntry: ', req.body);
	let entryToAdd = parseRequestObjToIrrigationEntryInstace(req.body);
	
	console.log('entryToAdd: ', entryToAdd);
	
	const callback = (irrigationPlan, loadErr)=>{
		if(loadErr){
			let msg = 'could not add irrigationEntry - loadIrrigationPlanFromFile-Error ';
			console.log(msg, loadErr);
			res.status(400).send(msg);
		}else{
			irrigationPlan.irrigationEntries.push( entryToAdd );
			const callback = (setErr)=>{
				if(setErr){
					let msg = 'could not add irrigationEntry - setIrrigationPlan-Error ';
					console.log(msg, loadErr);
					res.status(400).send(msg);
				}else{
					res.status(200).send(irrigationPlan);
				}
			};
			setIrrigationPlan(irrigationPlan, callback, req);
		}
	};
	
	loadIrrigationPlanFromFile(callback, req);
});

IrrigationRouter.route('/removeIrrigationEntry').post(function(req, res) {
	console.log('removeIrrigationEntry: ', req.body);
	let entryToRemove = parseRequestObjToIrrigationEntryInstace(req.body);
	console.log('entryToRemove: ', entryToRemove);
	
	loadIrrigationPlanFromFile((irrigationPlan, loadErr)=>{
		if(loadErr){
			let msg = 'could not remove irrigationEntry - loadIrrigationPlanFromFile-Error ';
			console.log(msg, loadErr);
			res.status(400).send(msg);
		}else{
			let entries = irrigationPlan.irrigationEntries;
			
			for(let i=0; i < entries.length;){
				if( entryToRemove.equals(entries[i]) ){
					console.log('entries equal: ', i, entryToRemove, entries[i]);
					entries.splice(i,1);
				}else{
					++i;
				}
			}
			const callback = (setErr)=>{
				if(setErr){
					let msg = 'could not remove irrigationEntry - setIrrigationPlan-Error ';
					console.log(msg, loadErr);
					res.status(400).send(msg);
				}else{
					res.status(200).send(irrigationPlan);
				}
			};
			setIrrigationPlan(irrigationPlan, callback, req);
		}
	}, req);
});


//-----------------------------------------------------

function setIrrigationPlan(dataObj, callback, req){
	if( !dataObj ){
		console.log('setIrrigationPlan - data undefined!!!');
		return;
	}
	
	const stdrdzdIrrigationPlan = {
		irrigationEntries: Object.values(dataObj)[0] // ensure that object-entry is irrigationEntries
	};
	
	saveIrrigationPlanToFile(stdrdzdIrrigationPlan, (err)=>{
		if(err){
			callback(err);
		}else{
			console.log('sending irrigation-plan to arduion');
			
			sendIrrigationPlanToArduino(stdrdzdIrrigationPlan);
			
			callback(null);
			
			sendUpdatedPlanToAllConnectedSockets(stdrdzdIrrigationPlan);
			
/*			let socketId = getSocketId(req);
			
			console.log('setIrrigationPlan - about to send updated irrigation-plan via socket: ', socketId);
			
			if(socketId){
				console.log('sockets.has(socketId): ', sockets.has(socketId));
				if(sockets.has(socketId)){
					console.log('send updated irrigation-plan via socket');
					sockets.get(socketId).emit('planUpdated', stdrdzdIrrigationPlan);
				}
			}*/
		}
	}, req);
}
function sendUpdatedPlanToAllConnectedSockets(stdrdzdIrrigationPlan){
	sendUpdatedDataToAllConnectedSockets('planUpdated', stdrdzdIrrigationPlan);
}
function sendUpdatedSensorDataToAllConnectedSockets(sensorData){
	sendUpdatedDataToAllConnectedSockets('moistureSensorDataUpdated', sensorData);
}
function sendUpdatedDataToAllConnectedSockets(targetSocketUrl, data){
	let sckts = [...sockets.values()];
	sckts.forEach(sckt=>{
		sckt.emit(targetSocketUrl, data);
	});
}

function sendIrrigationPlanToArduino(irrigationPlan, res){
	// res can be null/undefined - no problem!
	
	console.log('sendIrrigationPlanToArduino: irrigationPlan: ', irrigationPlan);
	
	const entries = irrigationPlan.irrigationEntries;
	
	let arduinoPlanStr = entries.length > 0
					? entries.map(ie=>ie.getUnformattedArduinoString()).join('|')
					: '';
					
	console.log('sendIrrigationPlanToArduino: arduinoPlanStr: ', arduinoPlanStr);	
	
	let arduinoIrrigationPlan = {
		entries: arduinoPlanStr
	};
	
	httpGET_Arduino('/setIrrigationPlan', arduinoIrrigationPlan, res);
}

IrrigationRouter.route('/getMoistureSensorValues').get((req,websiteResp)=>{
	let callback = (arduinoResp, err)=>{
		if(err){
			websiteResp.status(400).send('failed to load moisture sensor values - ', err.code);
		}else{
			let sensorValues = arduinoResp.data;
			console.log('sensorValues: ', sensorValues);
			let sensors = sensorValues.sensors;
			console.log('sensors: ', sensors);
			
			// komplett absurder bullshit, aber aus irgend einem grund wirft der server ohne folgende zeile einen exception aus...:
			let retValue = {
				sensors: sensorValues.sensors
			};
			websiteResp.status(200).send(retValue);
		}
	}
	
	let arduinoRequestURL = '/getMoistureSensorValues';
	
	httpGET_Arduino(arduinoRequestURL, null, null, callback);
});

//-----

function getTarFilePath(baseFilePath, req){
	let arduinoId = getArduinoId(req);
	return !!arduinoId 
					? baseFilePath + arduinoId + '.json'
					: baseFilePath + '.json';
} 

function removeExpiredIrrigationEntriesINPLACE(entries){
	let curUnix = SF.evalCurrentUnixTime();
	for(let i=0; i < entries.length; ){
		let ie = entries[i];
		if(ie.type === 1 && (ie.begin + ie.duration) < curUnix){
			entries.splice(i,1);
		}else{
			++i;
		}
	}
	return entries;
}
function loadIrrigationPlanFromFile(callback, req){
	let tarFilePath = getTarFilePath(IRGTNPLAN_JSON_BASE_FILE_NAME, req);
					
	loadFromFile(tarFilePath, (err, dataObjStr)=>{
		let irrigationPlan = {irrigationEntries: []};
		
		if(err){
			console.log('could not load irrigationPlan from file!', err.code, dataObjStr);
			console.log('returning empty irrigationplan');
		}else{
			const data = JSON.parse(dataObjStr);
			const stndrdzdData = {
				'irrigationEntries': Object.values(data)[0]
			};
			stndrdzdData.irrigationEntries = stndrdzdData.irrigationEntries.map((x,cnt)=>{
				return IrrigationEntry.createFromObj(x);
			});
			
			removeExpiredIrrigationEntriesINPLACE(stndrdzdData.irrigationEntries);
			
			irrigationPlan = stndrdzdData;
		}
		console.log('calling load-callback with plan: ', irrigationPlan);
		callback(irrigationPlan, null);
	});
}
function saveIrrigationPlanToFile(irrigationPlan, callback, req){
	let tarFilePath = getTarFilePath(IRGTNPLAN_JSON_BASE_FILE_NAME, req);
	
	console.log('saveIrrigationPlanToFile: tarFilePath: ', tarFilePath);
	
	saveToFile(irrigationPlan, tarFilePath, (err)=>{
		if(err){
			console.log('could not save irrigation-plan to file: ', err.code);
			callback(err);
		}else{
			const msg = 'Successfully written IrrigationPlan to File!';
			console.log(msg);
			callback(null);
		}
	});
}

//-----------------------------------------------------

IrrigationRouter.route('/startManualIrrigation').post(function(req, res) {
	httpGET_Arduino('/startManualTask', req.body, res);
});
IrrigationRouter.route('/stopCurrentIrrigation').get(function(req, res) {
	httpGET_Arduino('/stopCurrentTask', req.body, res);
});

IrrigationRouter.route('/getArduinoUnixTime').get(function(req, res) {
	console.log('getArduinoUnixTime');
	httpGET_Arduino('/getUnixTime', req.body, res);
});

IrrigationRouter.route('/setArduinoServerIpAndPort').get((req,res)=>{
	const data = {
		ip: SERVER_IP,
		port: SERVER_PORT
	};
	httpGET_Arduino('/setServerIPAndPort', data, res);
});

IrrigationRouter.route('/getUnixTime').get(function(req, res){
	res.status(200).send({UNIX: SF.evalCurrentUnixTime()});
});
IrrigationRouter.route('/setArduinoUnixTime').get(function(req, res) {
	let unixTime = SF.evalCurrentUnixTime();
	let timeObj = {
		UNIX: unixTime
	};
	console.log('server-UnixTime:  ', unixTime);
	httpGET_Arduino('/setUnixTime', timeObj, res);
});
IrrigationRouter.route('/setArduinoUnixDayOffset').post(function(req, res) {
	httpGET_Arduino('/setUnixDayOffset', req.body, res);
});


function saveToFile(data, fileName, callback){
	fs.writeFile(fileName, JSON.stringify(data), (err)=>{
		if(err){
			console.log('could not save data to File! - ', err.code);
			if(callback){
				callback(err);
			}
		}else{
			const msg = 'Successfully saved data to File!';
			console.log(msg, data);
			if(callback){
				callback();
			}
		}
	});
}
function loadFromFile(fileName, callback){
	fs.readFile(fileName, "utf-8", (err, dataObjStr)=>{
		if(err){
			console.log('could not load data from file: ', fileName, '	err: ', err.code, dataObjStr);
			callback(err);
		}else{
			callback(null, dataObjStr);
		}
	});
}
function saveMoistureSensorDataToFile(sensorData, req){
	let tarFilePath = getTarFilePath(MOISTURE_SENSOR_DATA_BASE_FILE_NAME, req);
	saveToFile(sensorData, tarFilePath);
	
	sendUpdatedSensorDataToAllConnectedSockets(sensorData);
}
function loadMoistureSensorDataFromFile(callback, req){
	let tarFilePath = getTarFilePath(MOISTURE_SENSOR_DATA_BASE_FILE_NAME, req);
	loadFromFile(tarFilePath, callback);
}


IrrigationRouter.route('/getMoistureSensorData').get(function(req, websiteResp) {		
	loadMoistureSensorDataFromFile( (err, sensorDataJSON)=>{		
		if(err){
			console.log('no moisture-data on serverer!', err);	
			websiteResp.status(400).send('no moisture-data on server!');				
		}else{
			let sensorData = JSON.parse(sensorDataJSON);
			
			console.log('sensorData from file: ', sensorData);
			
			websiteResp.status(200).send(sensorData);
		}
	}, req);
});
IrrigationRouter.route('/setMoistureSensorData').post(function(req, res) {
	let sensorData = req.body;
	
	console.log('received sensor data: ', sensorData);
	
	// saving modified sensitivities and/or labels to file:
	saveMoistureSensorDataToFile(sensorData, req);
	
	// sending Arduino the modified sensitivities
	httpPOST_Arduino('/setMoistureSensorEntries', sensorData);
	
	res.status(200).send("successfully saved moistures sensor data!");
});


//---------------export---------------


module.exports = IrrigationRouter;