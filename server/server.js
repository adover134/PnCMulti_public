var {io, server} = require("./connect.js");

const rand = require('./randomInt.js');
const CardSys = require('./data/card_system.js');
const Player = require('./data/player.js');
const Match = require('./match/match.js');
const Cards = require('./data/cards.json');

// 여기부터는 match 관련 function들 정의
function isMatchIDUsed(id) {
   let check = server.usedMatchIDs.findIndex((e) => e === id);
   if (check === -1) {
      return false;
   }
   else return true;
}
 
// 여기부터는 통신 관련 정의
io.on('connection', (socket) => {
   socket.emit('connection', () => {
   });

   // 이전에 접속한 적이 없는 플레이어가 접속했다면
   socket.on('New Player Connect',function() {
      // 우선 새롭게 플레이어 정보를 작성한다.
      socket.player = new Player.Player (server.lastPlayerID++, `newUser${socket.id}`, socket.id);
      //플레이어에게 cardsystem을 할당한다.
      socket.player.set_card_system(new CardSys.CardSystem());
      // 그 정보를 서버에 저장한다.
      server.players.push(socket.player);
      // 추후 재접속 등을 대비해 클라이언트 측에 쿠키로 이름을 전달한다.
      socket.emit('setName', socket.player.name);
      // 생략 가능, 접속한 플레이어 정보만 모은다.
      socket.emit('allplayers',getAllPlayers());
      // 생략 가능; 다른 기존 접속자들에게 새 플레이어가 접속했음을 알린다.
      socket.broadcast.emit('newplayer',socket.player);
      // 생략 가능; 서버에 신규 플레이어가 접속했음을 로그로 남긴다.
      console.log("New player connected!");
   });
   // 만약 이미 기록이 있는 플레이어가 접속했다면면 닉네임을 받아서서
   socket.on('Return Player Connect',function(name) {
      // 서버에서 동일 닉네임의 플레이어가 있다면
      for(i in server.players) {
         if(name === server.players[i].name) {
            socket.emit('cred callback', false);
            // 그 플레이어 정보를 받는다.
            socket.player = server.players[i];
            // 플레이어의 소켓 정보를 갱신한다.
            socket.player.set_socketID(socket.id);
            // 플레이어 닉네임을 클라이언트에게 전달한다.
            socket.emit('setName', socket.player.name);
            // 재접속 했음을 모두에게 알린다. 생략 가능
            socket.broadcast.emit('chat message', socket.player.name + " joined the chat.");
            // 서버 측에 복귀 유저임을 로그로 띄운다. 생략 가능
            console.log("Returning player, " + name + ", connected!");
            return;
         }
      }
      // 만약 없다면 새 플레이어 정보를 만든다.
      socket.player = new Player.Player (server.lastPlayerID++, name, socket.id, socket);
      //플레이어에게 cardsystem을 할당한다.
      socket.player.set_card_system(new CardSys.CardSystem());
      // 새로 만든 플레이어 정보를 서버에 저장한다.
      server.players.push(socket.player);
      // 추후 재접속 등을 대비해 클라이언트 측에 쿠키로 이름을 전달한다.
      socket.emit('setName', socket.player.name);
      socket.emit('cred callback', true);
      // 새로 접속했음을 서버의 모두에게 알린다. 생략 가능
      socket.broadcast.emit('chat message', socket.player.name + " joined the chat.");
      // 생략 가능; 서버에 신규 플레이어가 접속했음을 로그로 남긴다.
      console.log("New player connected!");
   });
   // 플레이어가 매칭 대기열에 들어가는 경우
   socket.on('Matchmake Start',function(){
      if (socket.player.cardsys.deck[socket.player.cardsys.chosen_deck].length !== 10) {
         console.log("Deck should have 10 cards!");
         socket.emit('Deck Length Error', socket.player.cardsys.deck[socket.player.cardsys.chosen_deck].length);
      }
      else {
         // 대기 중인 다른 플레이어들을 구한다.
         var p = getAllWaitingPlayers();
         var n = p.length;
         var opponent = null;
         if (n === 0) {
            socket.player.waitingForMatch = true;      
            console.log("Player, " + socket.player.name + ", is waiting to be matched.");
            socket.emit('Wait For Match');
         }
         // 대기 중인 플레이어가 있다면
         else {
            for (let player of p) {
               if (player.waitingForMatch) {
                  // player의 대기 여부를 false로 바꾼다.
                  player.waitingForMatch = false;
                  // 해당 플레이어를 상대로 지목한다.
                  opponent = player;
               }
            }
            // 탐색 중인 사이에 이미 다 매칭되었다면 대기열로 들어간다.
            if (opponent === null) {
               socket.player.waitingForMatch = true;
               socket.emit('Wait For Match');
               return;
            }
            // 매치가 준비되었음을 서버의 로그로 남긴다.
            console.log("Match found! Match #" + socket.player.id + " vs #" + opponent.id + " created.");
            // 매치 아이디를 생성한다.
            var x = 0;
            do {
                  x = rand.getRandomInt(0, 2147483647);
            } while(isMatchIDUsed(x));
            // 사용 중인 매치 아이디 배열에 추가한다.
            server.usedMatchIDs.push(x);
            var match = null;
            // 만약 해당 아이디의 매치가 있있다면
            if (Object.keys(server.matches).findIndex((e) => e === x.toString()) !== -1) {
               // 해당 매치를 가져오고
               match = server.matches[x.toString()];
               // 매치를 초기화한다.
               match.init(opponent, socket.player);
            }
            // 반대로 해당 아이디의 매치가 없다면
            else {
               // 상대와 자신으로 새로운 매치 클래스를 생성한다.
               match = new Match.Match(opponent, socket.player, x);
               // 서버의 매치 목록에 추가한다.
               server.matches[match.id] = match;
            }
            // 플레이어가 진행 중인 매치 정보를 갱신한다.
            socket.player.match = match.id;
            // 상대가 진행 중인 매치 정보를 갱신한다.
            opponent.match = match.id;
            // 매치를 준비한다.
            match.ready();
         }
      }
   });
   socket.on('Match Ready', function() {
      var match = server.matches[socket.player.match];
      if (match.a.id === socket.id) {
         match.readya = true;
      }
      else if (match.b.id === socket.id) {
         match.readyb = true;
      }
      if(match.isReady()) {
         match.start();
      }
   });
   socket.on('card info ask', function(id){
      var info = Cards[id].desc;
      socket.emit('card info', {id: id, desc: info});
   });
   socket.on('use card', function(data) {
      var match = server.matches[socket.player.match];
      if (match.a.id === socket.id) {
         match.useCard('a', data);
      }
      else if (match.b.id === socket.id) {
         match.useCard('b', data);
      }
   });
   socket.on('cost submit', function(data) {
      var match = server.matches[socket.player.match];
      if (match.a.id === socket.id) {
         match.applyCardCost(data.d_id, data.info);
      }
      else if (match.b.id === socket.id) {
         match.applyCardCost(data.d_id, data.info);
      }
   });
   socket.on('effect submit', function(data) {
      var match = server.matches[socket.player.match];
      if (match.a.id === socket.id) {
         match.applyCardEffect('a', data.d_id, data.info);
      }
      else if (match.b.id === socket.id) {
         match.applyCardEffect('b', data.d_id, data.info);
      }
   });
   // 블록 사용 신호를 받았다면
   socket.on('block place', function(data) {
      var match = server.matches[socket.player.match];
      if (match.a.id === socket.id) {
         match.state.placeBlock('a', data.point, data.block);
         match.b.emit('opponent block place', data);
      }
      else if (match.b.id === socket.id) {
         match.state.placeBlock('b', data.point, data.block);
         match.a.emit('opponent block place', data);
      }
   });
   // 블록 배치 반영 완료 신호를 받았다면
   socket.on('placement done', function() {
      // 이번 버전에서는 블록 반영 완료 시점에서 바로 점수 계산을 한다.
      var match = server.matches[socket.player.match];
      points = match.state.scoring();
      match.state.a.blocks = null;
      match.state.b.blocks = null;
      console.log(points);
      match.a.emit('scoring end', {score: match.state.a.score, opponent_score: match.state.b.score, points: points});
      match.b.emit('scoring end', {score: match.state.b.score, opponent_score: match.state.a.score, points: points});
   });
   // 점수 계산으로 인한 반영 완료 신호를 받았다면
   socket.on('destruction done', function() {
      // 이번 버전에서는 바로 다음 턴 시작 신호를 보낸다.
      var match = server.matches[socket.player.match];
      if (match.a.id === socket.id) {
         match.state.a.turn_end = true;
      }
      else if (match.b.id === socket.id) {
         match.state.b.turn_end = true;
      }
      // 양측 모두 신호를 받았다면 다음 턴!
      if (match.state.a.turn_end && match.state.b.turn_end) {
         match.state.a.turn_end = false;
         match.state.b.turn_end = false;
         match.state.changePhase();
         if (match.state.turn_num <= 100) {
            match.a.emit('next turn');
            match.b.emit('next turn');
         }
         // 100턴이 끝났으면
         else if (match.state.turn_num === 101) {
            // 게임 종료 처리를 한다.
            match.match_end('max turn');
         }
      }
   });
   socket.on('Hand Ready Done', function(data) {
      var match = server.matches[socket.player.match];
      let side = '';
      if (match.a.id === socket.id) side = 'a';
      else if (match.b.id === socket.id) side = 'b';
      match.ready_trash(side, data.info);
   });
   socket.on('hand check', function() {
      // 이번 버전에서는 바로 다음 턴 시작 신호를 보낸다.
      var match = server.matches[socket.player.match];
      if (match.a.id === socket.id) {
         let dif = 5-match.state.a.hand.cards.length;
         if (dif >= 0){
            if (dif > match.state.a.deck.length())
               match.state.refill_deck(match.state.a);
            match.a.emit('Hand Add', {hand: match.state.drawCard(match.state.a, dif).map((card) => card['id']), purpose: 'ready'});
         }
         else if (dif < 0) {
            match.a.emit('Ready Trash', {info: {id: -1, value: [-dif, -dif]}, purpose: 'ready'});
         }
      }
      else if (match.b.id === socket.id) {
         let dif = 5-match.state.b.hand.cards.length;
         if (dif >= 0){
            if (dif > match.state.b.deck.length())
               match.state.refill_deck(match.state.b);
            match.b.emit('Hand Add', {hand: match.state.drawCard(match.state.b, dif).map((card) => card['id']), purpose: 'ready'});
         }
         else if (dif < 0) {
            match.b.emit('Ready Trash', {info: {id: -1, value: [-dif, -dif]}, purpose: 'ready'});
         }
      }
      match.state.changePhase();
   });
 });

function getAllPlayers(){
   var players = [];
   Object.keys(io.engine.clients).forEach(function(socketID){
      var player = io.engine.clients[socketID].player;
      if(player) players.push(player);
   });
   return players;
}
function getAllWaitingPlayers(){
   var players = [];
   for (const [_, socket] of io.of("/").sockets)
   {
      while (!Object.keys(socket).includes('player'));
      while (!Object.keys(socket.player).includes('waitingForMatch'));
      if (socket.player.waitingForMatch)
         players.push(socket.player);
   }
   return players;
}