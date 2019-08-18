const axios = require('axios');
const fs = require('fs');
const SF = require('staticfunctions');
const os = require('os');
const ifaces = os.networkInterfaces();

const ServerStaticFunctions = {
	
	getServerIPv4Address(){
		let serverIPv4Address = '';
		
		Object.keys(ifaces).forEach(function (ifname) {
		  var alias = 0;
		
		  ifaces[ifname].forEach(function (iface) {
		    if ('IPv4' !== iface.family || iface.internal !== false) {
		      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
		      return;
		    }
		    
		    console.log(iface);
		    
		    if(!serverIPv4Address){
		    	serverIPv4Address = iface.address;
		    }
		
		    if (alias >= 1) {
		      // this single interface has multiple ipv4 addresses
		      console.log(ifname + ':' + alias, iface.address);
		    } else {
		      // this interface has only one ipv4 adress
		      console.log(ifname, iface.address);
		    }
		    console.log();
		    ++alias;
		  });
		});
		
		return serverIPv4Address;
	},
	
	getRelUrlPath: function(url){
		let lio = url.lastIndexOf('/');
		return lio > -1 ? url.substring(lio) : url;
	},
	
	addArduinoIdToURL: function(url, arduinoId){
		let relUrlPath = this.getRelUrlPath(url);
		
		if(relUrlPath.includes('?')){
			return url + '&arduinoId=' + arduinoId;
		}else{
			return url + '?arduinoId=' + arduinoId;
		}
	},

	getArduinoId: function(req){
		return (!!req && !!req.query.arduinoId) ? req.query.arduinoId : null;
	},
	getTarFilePath: function(baseFilePath, req){
		let arduinoId = this.getArduinoId(req);
		return !!arduinoId 
						? baseFilePath + arduinoId + '.json'
						: baseFilePath + '.json';
	},
	
	loadDataObjFromRequestSpecificFile: function(baseFileName, tarObjTag, req, callback){
		let tarFilePath = this.getTarFilePath(baseFileName, req);
						
		this.loadFromFile(tarFilePath, (err, dataObjStr)=>{
			let dataObj = {};
			dataObj[tarObjTag] = null;
			
			if(err){
				console.log('could not load LED-Animation from file!', err.code, dataObjStr);
				console.log('returning empty LED-Animation');
			}else{
				const data = JSON.parse(dataObjStr);
				dataObj[tarObjTag] = data;
			}
			console.log('calling load-callback with data: ', dataObj);
			callback(dataObj, null);
		});
	},

	saveDataObjToRequestSpecificFile: function(dataObj, baseFileName, req, callback){
		let tarFilePath = this.getTarFilePath(baseFileName, req);
		
		console.log('saveJSONobjToQualifiedFile: tarFilePath: ', tarFilePath);
		
		this.saveToFile(dataObj, tarFilePath, (err)=>{
			if(err){
				console.log('could not save data to file: ', err.code);
				if(callback){
					callback(err);
				}
			}else{
				const msg = 'Successfully written data to File!';
				console.log(msg);
				if(callback){
					callback(null);
				}
			}
		});
	},

	saveToFile: function(data, fileName, callback){
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
	},
	loadFromFile: function(fileName, callback){
		fs.readFile(fileName, "utf-8", (err, dataObjStr)=>{
			if(err){
				console.log('could not load data from file: ', fileName, '	err: ', err.code, dataObjStr);
				callback(err);
			}else{
				callback(null, dataObjStr);
			}
		});
	},
	
	replaceInvalidURLchars: function(x){
		console.log('replaceInvalidURLchars: str: ', x);
		let str = SF.replaceAll(String(x), '#', '');
		console.log('	replaced: ', str);
		return str;
	},
	
	objToUrlParameterStr: function(x){
	  	let strObj = [];
	
		if(!!x){
			for(let v in x){
				let val = x[v];
				let valStr;
				console.log('v: ', v, '	x: ', x);
				if(Array.isArray(val)){
					valStr = val.map(str => this.replaceInvalidURLchars(str)).join('-');
				}else{
					valStr = this.replaceInvalidURLchars(val);
				}
		   	strObj.push( String(v) + '=' + valStr );
			}
	  	}
	  	
	  	console.log('strObj: ', strObj);
	  	
	  	return strObj.join('&');
	},
	
	urlFromParams: function(baseURL, params){
		const ulrParamsStr = this.objToUrlParameterStr(params);
		return !!ulrParamsStr 
					? baseURL + '?' + ulrParamsStr
					: baseURL;
	},
	
	httpGET_Arduino: function(arduinoIP, baseURL, data, srcResp, callback=undefined){		
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
		
		console.log('httpGet_Arduino -> arduinoIP: ', arduinoIP, '	baseURL: ', baseURL, '	data: ', data);
		
		baseURL = SF.eraseLeadingSlash( SF.erasePaddingSlash(baseURL) );
		
		const tarURL = this.urlFromParams(baseURL, data);
		
		const absTarURL = arduinoIP + '/' + tarURL;
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
};

module.exports = ServerStaticFunctions;


