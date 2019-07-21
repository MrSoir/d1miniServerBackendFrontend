const express = require('express');
const axios = require('axios');
const SF = require('./StaticFunctions');
const IrrigationRouter = express.Router();
const fs = require('fs');

//let IPSchema = require('./IrrigationPlan.model');


//---------------constants---------------


const ARDUINO_IP = 'http://192.168.2.110';

const IP_JSON_FILE_NAME = './server/IrrigationPlan.json';


//---------------url-functions---------------


function objToUrlParameterStr(x){
  let strObj = [];

  for(let v in x){
    strObj.push( String(v) + '=' + x[v] );
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
			if(!!err){
				srcResp.status(400).send(err);
			}else{
				srcResp.status(200).send(resp.data);
			}
		};
	}
	console.log('data: ', data);
	baseURL = SF.eraseLeadingSlash( SF.erasePaddingSlash(baseURL) );
	
	const tarURL = urlFromParams(baseURL, data);
	
	const absTarURL = ARDUINO_IP + '/' + tarURL;
	console.log('requesting: ', absTarURL);
	
	axios.get(absTarURL, data)
		  		.then((resp, err) =>{
		  			if(!!err){
		  				console.log('httpGET_Arduino -> then-ERROR: ', err);
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
		  			console.log('httpGET_Arduino -> axios.GET-ERROR: ', err);
		  			callback(null, err);
		  		});
}


//---------------routes---------------


/*IrrigationRouter.route('/').get(function(req, res) {
	httpGET_Arduino('/', req.body, res);
});*/

IrrigationRouter.route('/sendIrrigationPlanToArduino').post(function(req, res) {
	httpGET_Arduino('/sendIrrigationPlan', req.body, res);
});
IrrigationRouter.route('/getIrrigationPlanFromArduino').get(function(req, res) {
	httpGET_Arduino('/getIrrigationPlan', req.body, res);
});
IrrigationRouter.route('/saveIrrigationPlan').post((req,res)=>{
	fs.writeFile(IP_JSON_FILE_NAME, JSON.stringify(req.body), (err)=>{
		if(err){
			console.log(err);
			res.status(400).send('could not save IrrigationPlan to File!');
		}else{
			const msg = 'Successfully written IrrigationPlan to File!';
			console.log(msg);
			res.status(200).send(msg);
		}
	});
});
IrrigationRouter.route('/loadIrrigationPlanFromFile').get((req,res)=>{	
	fs.readFile(IP_JSON_FILE_NAME, "utf-8", (err, data)=>{
		if(err){
			console.log(err);
			res.status(400).send('could not load IrrigationPlan from File!');
		}else{
			const msg = 'Successfully loaded IrrigationPlan from File!';
			console.log(msg, data);
			res.status(200).send(data);
		}
	});
});
IrrigationRouter.route('/clearArduinoIrrigationPlan').get(function(req, res) {
	httpGET_Arduino('/clearIrrigationPlan', req.body, res);
});

IrrigationRouter.route('/startManualIrrigation').post(function(req, res) {
	console.log('req: ', req);
	httpGET_Arduino('/startManualIrrigation', req.body, res);
});
IrrigationRouter.route('/stopCurrentIrrigation').get(function(req, res) {
	httpGET_Arduino('/stopCurrentIrrigation', req.body, res);
});

IrrigationRouter.route('/getArduinoUnixTime').get(function(req, res) {
	httpGET_Arduino('/getUnixTime', req.body, res);
});

IrrigationRouter.route('/setArduinoServerIpAndPort').get((req,res)=>{
	const data = {
		ip: "raspberrypi",
		port: "8080"
	};
	httpGET_Arduino('/setServerIPAndPort', data, res);
});

IrrigationRouter.route('/getServerUnixTime').get(function(req, res){
	res.status(200).send({UNIX: SF.evalCurrentUnixTime()});
});
IrrigationRouter.route('/setArduinoUnixTime').post(function(req, res) {
	console.log('server-UnixTime:  ', evalCurrentUnixTime());
	console.log('browser-UnixTime: ', req.body);
	httpGET_Arduino('/setUnixTime', req.body, reCs);
});
IrrigationRouter.route('/setUnixDayOffset').post(function(req, res) {
	httpGET_Arduino('/setUnixDayOffset', req.body, res);
});


IrrigationRouter.route('/addIrrigationEntry').post(function(req, res) {
	httpGET_Arduino('/addIrrigationEntry', req.body, res);
});
IrrigationRouter.route('/removeIrrigationEntry').post(function(req, res) {
	httpGET_Arduino('/removeIrrigationEntry', req.body, res);
});


//---------------export---------------


module.exports = IrrigationRouter;