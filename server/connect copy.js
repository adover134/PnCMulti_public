const crypto = require('crypto')

const generateRandomString = (length) => {
    return crypto.randomBytes(length).toString('hex');
};

const express = require('express');
const app = express();

var http = require('http');
var socketio = require('socket.io');
var server = http.createServer(app);
var io = socketio.listen(server);

var session = session({
    secret:generateRandomString(32),
    resave:false,
    saveUninitialized:true
});

server.lastPlayerID = 1;
// Works as Player DB
server.players = [];
// Works as match DB
server.matches = {};
// 현재 진행 중인 match들의 id Array
server.usedMatchIDs = [];

app.use(session);
app.use('/js',express.static(__dirname + 'src/js'));
app.use('/assets',express.static(__dirname + 'src/assets'));

var ios = require("express-socket.io-session");

io.use(ios(session, { autoSave:true }));

var io = require("socket.io")(5500, {
    cors: {
       origin: ['http://localhost:8080'],
    }
});

exports.io = io;
exports.server = server;