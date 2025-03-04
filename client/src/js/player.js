import { io } from "socket.io-client";
import { CardSystem } from "./card_system.js";
import * as cookie from "./cookie.js";

export var player = {};

player.socket = io.connect('http://localhost:5500');
player.load = false;
player.game = null;
player.opponent_name = null;
player.waiting = false;
player.cardsys = new CardSystem();

player.setUserName = function(newName) {
    player.username = newName;
};

player.setGame = function(game) {
    player.game = game;
};

player.askNewPlayer = function(){
    player.socket.emit('New Player Connect');
};

player.askReturnPlayer = function(username){
    player.socket.emit('Return Player Connect', username)
};

player.socket.on('setName', function(name) {
    player.setUserName(name);
    cookie.setCookie("username", name);
    player.load = true;
});