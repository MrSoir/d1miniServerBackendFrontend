const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const IrrigaitonRouter = require('./server/IrrigationRouter');

const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'build')));


app.use('/irrigation', IrrigaitonRouter);
app.get('/*', function(req, res) {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, ()=>{
	console.log('Server is running on Port: ' + PORT);
});