const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const SF = require('staticfunctions');
const SSF = require('serverstaticfunctions');

let socketIO = require('socket.io')(server);

const IrrigationRouter = require('./src/server/IrrigationRouter');
const LEDstripRouter = require('./src/server/LEDstripRouter');

const PORT = 8080;


//-----------functions-----------

function evalServerIp(){
	let serverIPv4 = SSF.getServerIPv4Address();
	
	let serverData = {
		ipv4: serverIPv4,
		port: PORT
	};
	return serverData;
}
function updateServerIpToRouters(){
	let serverIPv4 = evalServerIp();
	console.log('updateServerIpToRouters: ', serverIPv4);
	IrrigationRouter.setServerIp(serverIPv4);
	LEDstripRouter.setServerIp(serverIPv4);
}


//-----------initializing routers-----------

IrrigationRouter.setApp(app);
LEDstripRouter.setApp(app);

updateServerIpToRouters();

IrrigationRouter.setSocketIO(socketIO);

setInterval(updateServerIpToRouters, 10000);


//------------------------------------------

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'build')));

app.use('/irrigation', 		IrrigationRouter);
app.use('/LEDstripServer', LEDstripRouter);

app.get('/*', function(req, res) {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

server.listen(PORT, ()=>{
	console.log('Server is running on Port: ' + PORT);
});