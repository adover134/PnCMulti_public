const express = require('express');
const app = express();
var server = require('http').Server(app);

// Works as Card DB
const CardIndex = require('./data/cards.json')

app.use('/js',express.static(__dirname + 'src/js'));
app.use('/assets',express.static(__dirname + 'src/assets'));

export var io = require("socket.io")(5500, {
    cors: {
       origin: ['http://localhost:8080'],
    }
 });