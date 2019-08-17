const express = require('express');
const axios = require('axios');
const LEDstripRouter = express.Router();


//let IPSchema = require('./IrrigationPlan.model');

// modules_frontend_backend:
const SF 			= require('staticfunctions');
const SERVER_SF 	= require('serverstaticfunctions');


//---------------constants---------------

const ARDUINO_IPS = new Map();
ARDUINO_IPS.set('LED_STRIP_LIVING_ROOM_0', 'http://esp_ed666b');//192.168.2.112');

const LED_ANIMATION_JSON_BASE_FILE_NAME = __dirname + '/LEDstripAnimation';

const SERVER_IP 	= "raspberrypi";
const SERVER_PORT = "8080";

//---------------url-functions---------------

LEDstripRouter.setApp = (app)=>{
	this.app = app;
};


function extractArduinoIpFromRequest(req){
	let arduinoID = SERVER_SF.getArduinoId(req);
	console.log('extractArduinoIpFromRequest -> arduinoID: ', arduinoID);
	return ARDUINO_IPS.get(arduinoID);
}

function httpGET_Arduino(req, baseURL, data, srcResp, callback=undefined){
	let arduinoIP = extractArduinoIpFromRequest(req);
	if(!arduinoIP){
		console.log('could not extract ardunioIP from req!!!');
		if(callback){
			callback(null, 'could not extract ardunioIP from req!!!');
		}
		return;
	}
	console.log('arduinoIP: ', arduinoIP);
	SERVER_SF.httpGET_Arduino(arduinoIP, baseURL, data, srcResp, callback);
}

//---------------routes---------------


LEDstripRouter.route('/setLEDanimation').post(function(req, res) {
	let ledAnim = req.body;
	console.log('/setLEDanimation -> ledAnim: ', ledAnim);
	
	httpGET_Arduino(req, '/setLEDanimation', ledAnim, res);
	
	SERVER_SF.saveDataObjToRequestSpecificFile(ledAnim,
															 LED_ANIMATION_JSON_BASE_FILE_NAME,
															 req);
});

LEDstripRouter.route('/getLEDanimation').get(function(req,res){
	let callback = (ledAnim, err)=>{
		console.log('/getLEDanimation - ledAnim: ', ledAnim, '	err: ', err);
		if(err){
			res.status(400).send('could load LED-Animation!');
		}else{
			res.status(200).send(ledAnim);
		}
	};
	
	SERVER_SF.loadDataObjFromRequestSpecificFile(LED_ANIMATION_JSON_BASE_FILE_NAME, 
																'animation',
																req,
																callback);
});

//-------

LEDstripRouter.route('/turnLEDstripOn').post(function(req, res) {
	httpGET_Arduino(req, '/startManualTask', req.body, res);
});
LEDstripRouter.route('/turnLEDstripOff').get(function(req, res) {
	httpGET_Arduino(req, '/stopCurrentTask', req.body, res);
});

//-------

LEDstripRouter.route('/setBrightness').post(function(req, res) {
	httpGET_Arduino(req, '/setBrightness', req.body, res);
});

//-------

LEDstripRouter.route('/activateMotionSensors').get(function(req, res) {
	httpGET_Arduino(req, '/activateMotionSensors', req.body, res);
});
LEDstripRouter.route('/deactivateMotionSensors').get(function(req, res) {
	httpGET_Arduino(req, '/deactivateMotionSensors', req.body, res);
});

//---------------------

LEDstripRouter.route('/setArduinoServerIpAndPort').get((req,res)=>{
	const data = {
		ip: SERVER_IP,
		port: SERVER_PORT
	};
	httpGET_Arduino(req, '/setServerIPAndPort', data, res);
});

LEDstripRouter.route('/getUnixTime').get(function(req, res){
	res.status(200).send({UNIX: SF.evalCurrentUnixTime()});
});
LEDstripRouter.route('/setArduinoUnixTime').get(function(req, res) {
	let unixTime = SF.evalCurrentUnixTime();
	let timeObj = {
		UNIX: unixTime
	};
	console.log('server-UnixTime:  ', unixTime);
	httpGET_Arduino(req, '/setUnixTime', timeObj, res);
});
LEDstripRouter.route('/setArduinoUnixDayOffset').post(function(req, res) {
	httpGET_Arduino(req, '/setUnixDayOffset', req.body, res);
});



//---------------export---------------



module.exports = LEDstripRouter;



