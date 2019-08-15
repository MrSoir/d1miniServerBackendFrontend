const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

let socketIO = require('socket.io')(server);

const IrrigaitonRouter = require('./src/server/IrrigationRouter');
const LEDstripRouter = require('./src/server/LEDstripRouter');

IrrigaitonRouter.setApp(app);
IrrigaitonRouter.setSocketIO(socketIO);

LEDstripRouter.setApp(app);

const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'build')));

app.use('/irrigation', IrrigaitonRouter);
app.use('/LEDstripServer', LEDstripRouter);

app.get('/*', function(req, res) {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

server.listen(PORT, ()=>{
	console.log('Server is running on Port: ' + PORT);
});