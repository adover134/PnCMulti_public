const crypto = require('crypto')

const generateRandomString = (length) => {
    return crypto.randomBytes(length).toString('hex');
};

const express = require('express');
const app = express();
const session = require("express-session");
const ios = require("express-socket.io-session");

var http = require('http');
var server = http.createServer(app);

var io = require('socket.io')(5500, {
    cors: {
       origin: ['http://localhost:8080'],
       credentials: true
    }
});

var Session = session({
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

io.use(ios(Session, { autoSave:true }));

app.use(Session);
app.use('/js',express.static(__dirname + 'src/js'));
app.use('/assets',express.static(__dirname + 'src/assets'));

exports.io = io;
exports.server = server;