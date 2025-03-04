import {MatchState} from "./match_state.js";
import BlockIndex from "../data/blocks.json" with { type: "json" };
import {io, server} from "../connect.js";

const CardType = {
    UNIT : 0,
    SKILL : 1,
    TRAP : 2
};

const Faction = {
    LEAGUE : 0,
    FLARE : 1,
    WATER : 2,
    EARTH : 3,
    LIGHT : 4,
    VIRTUAL : 5
}

const Player = {
    Player: 0,
    Opponent: 1
}

const Target = {
    Score: 0,
    Hand: 1,
    Deck: 2,
    Trash: 3,
    Board: 4,
    Piece: 5
}

const ScoreSubject = {
    None: 0,
    CostNum: 1
}

const HandSubject = {
    ToDeck: 0,
    ToTrash: 1
}

const DeckSubject = {
    ToHand: 0
}

const TrashSubject = {
    ToHand: 0
}

const BoardSubject = {
    Move: 0,
    BaseScore: 1,
    AddScore: 2,
    ContEffect: 3,
    ContState: 4
}

const PieceSubject = {
    Move: 0,
    BaseScore: 1,
    AddScore: 2,
    ContEffect: 3,
    ContState: 4
}


export class Match {
    constructor(a, b, x) {
        // a와 b는 각각 플레이어 a와 플레이어 b의 socket인 걸로!
        for (const [_, socket] of io.of("/").sockets) if (socket.id === a.socketID) this.a = socket;
        for (const [_, socket] of io.of("/").sockets) if (socket.id === b.socketID) this.b = socket;
        this.id = x;
        this.roomid = "M" + this.id.toString();
        // 두 플레이어를 모두 매치 방으로 입장시킨다.
        this.a.join(this.roomid);
        this.b.join(this.roomid);
        this.state = new MatchState();
        this.readya = false;
        this.readyb = false;
        this.dead = false;
    }

    init(a, b) {
        for (const [_, socket] of io.of("/").sockets) if (socket.id === a.socketID) this.a = socket;
        for (const [_, socket] of io.of("/").sockets) if (socket.id === b.socketID) this.b = socket;
        this.a.join(this.roomid);
        this.b.join(this.roomid);
        this.state = new MatchState();
        this.readya = false;
        this.readyb = false;
        this.dead = false;
    }

    isReady() {
        return this.readya && this.readyb;
    }

    ready() {
        // 카드 정보들을 얻고, 두 플레이어에게 전달한다.
        this.state.a.deck.from_data(this.a.player.cardsys.deck[this.a.player.cardsys.chosen_deck]);
        this.state.b.deck.from_data(this.b.player.cardsys.deck[this.b.player.cardsys.chosen_deck]);
        this.a.emit('Match Init', {side: 'a', deck: this.a.player.cardsys.deck[this.a.player.cardsys.chosen_deck], opponent_deck: this.b.player.cardsys.deck[this.b.player.cardsys.chosen_deck]});
        this.b.emit('Match Init', {side: 'b', deck: this.b.player.cardsys.deck[this.b.player.cardsys.chosen_deck], opponent_deck: this.a.player.cardsys.deck[this.a.player.cardsys.chosen_deck]});
        
        // 각 플레이어마다 5장을 드로우하고 그 결과를 플레이어에게 전달한다.
        this.a.emit('Hand Init', this.state.drawCard(this.state.a, 5).map((card) => card['id']));
        this.b.emit('Hand Init', this.state.drawCard(this.state.b, 5).map((card) => card['id']));
    }

    start() {
        console.log("Starting match between " + this.a.player.name + " and " + this.b.player.name + "!");
        // 각 플레이어에게 선후공 여부 전달
        if (this.state.turn === 'a') {
            this.a.emit('Turn Set', 'first');
            this.b.emit('Turn Set', 'second');
        }
        else if (this.state.turn === 'b') {
            this.b.emit('Turn Set', 'first');
            this.a.emit('Turn Set', 'second');
        }
    }

    ready_trash(side, cards) {
        var chosen_cards = this.state.a.hand.cards.filter((e) => cards.includes(e.id));
        if (side === 'a') {
            this.state.trash(this.state.a, chosen_cards);
            this.a.emit('Trash From Hand', {chosen_cards: cards});
        }
        else if(side === 'b') {
            this.state.trash(this.state.b, chosen_cards);
            this.b.emit('Trash From Hand', {chosen_cards: cards});
        }
    }

    // 사용한 플레이어와 해당 플레이어의 덱 기준 사용 카드 번호를 받아서
    // 사용한 카드는 트래쉬하고
    // 사용한 카드가 유닛 카드라면 정보를 저장한 후 블록 정보를 해당 플레이어에게 보낸다.
    // 주문 카드라면 사용 가능 여부를 확인한 뒤, 코스트의 처리에 정보가 필요하다면 정보 요청을 보내고 필요 없다면 바로 처리한다.
    useCard(side, id) {
        var game_over = false;
        if (side === 'a') {
            this.state.user = 'a';
            let card = this.state.a.hand.cards.find((e) => e.id === id);
            if (card.type === 'SKILL') {
                // 카드 사용 실패 여부를 나타내는 변수
                let fail = false;
                // 조건 만족 여부 확인
                let condition = card.effect.condition;
                if (Object.keys(condition).length !== 0)
                {
                    
                }                
                // 조건 불만족 시 'Return Card To Hand' 신호로 입력된 id와 조건 불만족임을 보낸다.
                if (fail)
                {
                    this.a.emit('Return Card To Hand', {id: id, cause: 'Condition'});
                }
                // 코스트 처리 가능 여부 확인
                let cost = card.effect.cost;
                if (Object.keys(cost).length !== 0)
                {
                    if (cost.target === 0) {
                        if (typeof cost.value !== 'number')
                        {
                            
                        }
                        else {
                            fail = false;
                        }
                    }
                    else if (cost.target === 1){
                        let val = cost.value;
                        if (cost.player === 0)
                            if (this.state.a.hand.cards.length < val[0])
                                fail = true;
                        else if (cost.player === 1)
                            if (this.state.b.hand.cards.length < val[0])
                                fail = true;
                    }
                    // 보드 위의, 대상 플레이어의 조각들에 대한 처리를 하는 코스트
                    else if (cost.target === 4) {

                    }
                }
                if (fail)
                {
                    // 코스트 처리 불가 시 'Return Card To Hand' 신호로 입력된 id와 코스트 처리 불가능임을 보낸다.
                    this.a.emit('Return Card To Hand', {id: id, cause: 'Cost'});
                }
                else {
                    // 아니라면 코스트 처리를 요청한다.
                    this.a.emit('Ask Cost', {id: id, info: cost});
                }
            }
            // 유닛 카드의 경우
            else if (card.type === 'UNIT')
            {
                this.state.a.hand.cards = this.state.a.hand.cards.filter((Card) => Card.id !== card.id);
                this.state.a.trash.add_card(card);
                this.state.a.unit = card;
                let blockinfo = card.blocks;
                var blocks = [];
                for (let i=0;i<blockinfo.length;i++){
                    blocks.push(BlockIndex[blockinfo[i][0]][blockinfo[i][1]]);
                    if (this.state.checkBlockAvailable(blocks[i]) === false)
                        game_over = true;
                }
                if (!game_over) {
                    this.state.a.blocks = blocks;
                    this.a.emit('block info', {card: id, blocks: blocks});
                    this.state.changePhase();
                }
                else if (game_over) {
                    this.match_end('A cannot place');
                }
            }
        }
        else if (side === 'b') {
            this.state.user = 'b';
            let card = this.state.b.hand.cards.find((e) => e.id === id)
            if (card.type === 'SKILL') {
                // 카드 사용 실패 여부를 나타내는 변수
                let fail = false;
                // 조건 만족 여부 확인
                let condition = card.effect.condition;
                if (Object.keys(condition).length !== 0)
                {
                    
                }                
                // 조건 불만족 시 'Return Card To Hand' 신호로 입력된 id와 조건 불만족임을 보낸다.
                if (fail)
                {
                    this.b.emit('Return Card To Hand', {id: id, cause: 'Condition'});
                }
                // 코스트 처리 가능 여부 확인
                let cost = card.effect.cost;
                if (Object.keys(cost).length !== 0)
                {
                    if (cost.target === 0) {
                        if (typeof cost.value !== 'number')
                        {

                        }
                        else {
                            fail = false;
                        }
                    }
                    else if (cost.target === 1){
                        let val = cost.value;
                        if (cost.player === 0)
                            if (this.state.b.hand.cards.length < val[0])
                                fail = true;
                        else if (cost.player === 1)
                            if (this.state.a.hand.cards.length < val[0])
                                fail = true;
                    }
                    // 보드 위의, 대상 플레이어의 조각들에 대한 처리를 하는 코스트
                    else if (cost.target === 4) {

                    }
                }
                if (fail)
                {
                    // 코스트 처리 불가 시 'Return Card To Hand' 신호로 입력된 id와 코스트 처리 불가능임을 보낸다.
                    this.b.emit('Return Card To Hand', {id: id, cause: 'Cost'});
                }
                else {
                    // 아니라면 코스트 처리를 요청한다.
                    this.b.emit('Ask Cost', {id: id, info: cost});
                }
            }
            else if (card.type === 'UNIT')
            {
                this.state.b.hand.cards = this.state.b.hand.cards.filter((Card) => Card.id !== card.id);
                this.state.b.trash.add_card(card);
                this.state.a.unit = card;
                let blockinfo = card.blocks;
                var blocks = [];
                for (let i=0;i<blockinfo.length;i++){
                    blocks.push(BlockIndex[blockinfo[i][0]][blockinfo[i][1]]);
                    if (this.state.checkBlockAvailable(blocks[i]) === false)
                        game_over = true;
                }
                if (!game_over) {
                    this.state.b.blocks = blocks;
                    this.b.emit('block info', {card: id, blocks: blocks});
                    this.state.changePhase();
                }
                else if (game_over) {
                    this.match_end('B cannot place');
                }
            }
        }
    }

    // side, 카드 id, 코스트 정보를 받아서 카드를 처리한다.
    applyCardCost(id, cost) {
        let card = null;
        // 코스트 종류에 따라서 코스트를 처리한다.
        if (this.state.user === 'a') {
            card = this.state.a.hand.cards.find((e) => e.id === id);
        }
        else if (this.state.user === 'b') {
            card = this.state.b.hand.cards.find((e) => e.id === id);
        }
        let ccost = card.effect.cost;
        if (ccost.target === 0) {
            if (this.state.user === 'a'){
                if (ccost.player === 0)
                    this.state.a.score = this.state.a.score + cost;
                else if (ccost.player === 1)
                    this.state.b.score = this.state.b.score + cost;
            }
            else if (this.state.user === 'b') {
                if (ccost.player === 0)
                    this.state.b.score = this.state.b.score + cost;
                else if (ccost.player === 1)
                    this.state.a.score = this.state.a.score + cost;
            }
            this.a.emit('My Score Update', {score: this.state.a.score})
            this.a.emit('Opponent Score Update', {score: this.state.b.score})
            this.b.emit('My Score Update', {score: this.state.b.score})
            this.b.emit('Opponent Score Update', {score: this.state.a.score})
        }
        else if (ccost.target === 1) {
            if (ccost.subject === 1) {
                // 선택된 카드들을 구해야 한다.
                let chosen_cards = [];
                if (this.state.user === 'a') {
                    // 자신 카드라면 id를 기준으로 카드를 처리한다.
                    if (ccost.player === 0)
                    {
                        chosen_cards = this.state.a.hand.cards.filter((e) => cost.includes(e.id));
                        this.state.trash(this.state.a, [...cost]);
                        this.a.emit('Trash From Hand', {chosen_cards: [...cost]});
                    }
                }
                else if (this.state.user === 'b') {
                    if (ccost.player === 0)
                    {
                        chosen_cards = this.state.b.hand.cards.filter((e) => cost.includes(e.id));
                        this.state.trash(this.state.b, [...cost]);
                        this.b.emit('Trash From Hand', {chosen_cards: [...cost]});
                    }
                }

            }
        }
        // 스킬 종류에 따라서 플레이어의 정보가 필요하다면 정보를 요청한다.
        // 스킬 처리 가능 여부 확인
        let effect = card.effect.effect;
        // 점수 조작 효과
        if (effect.target === 0){
            let value = eval(effect.value);
            let ef = Object.assign({}, effect);
            ef.value = value;
            if (effect.player === 0) {
                if (this.state.user === 'a'){
                    this.a.emit('Ask Effect', {id: id, info: ef})
                }
                else if (this.state.user === 'b'){
                    this.b.emit('Ask Effect', {id: id, info: ef})
                }
            }
            else if (effect.player === 1) {
                if (this.state.user === 'a'){
                    this.b.emit('Ask Effect', {id: id, info: ef})
                }
                else if (this.state.user === 'b'){
                    this.a.emit('Ask Effect', {id: id, info: ef})
                }
            }
        }
        // 핸드 조작 효과
        else if (effect.target === 1){
            let val = cost.value;
            if (cost.player === 0)
                if (this.state.b.hand.cards.length < val[0])
                    fail = true;
            else if (cost.player === 1)
                if (this.state.a.hand.cards.length < val[0])
                    fail = true;
        }
        // 덱 조작 효과
        else if (effect.target === 2) {
            if (this.state.user === 'a'){
                this.a.emit('Ask Effect', {id: id, info: effect})
            }
            else if (this.state.user === 'b'){
                this.b.emit('Ask Effect', {id: id, info: effect})
            }
        }
        // 보드 위의, 대상 플레이어의 조각들에 대한 처리를 하는 효과
        else if (effect.target === 4) {

        }
    }

    applyCardEffect(side, id, info) {
        // 핸드에서 id에 해당하는 카드를 trash한다.
        let card = null;
        if (side === 'a') {
            card = this.state.a.hand.cards.find((e) => e.id === id);
            this.state.trash(this.state.a, [id]);
            this.a.emit('Trash From Hand', {chosen_cards: [id]});
        }
        else if (side === 'b') {
            card = this.state.b.hand.cards.find((e) => e.id === id);
            this.state.trash(this.state.b, [id]);
            this.b.emit('Trash From Hand', {chosen_cards: [id]});
        }
        let effect = info;
        // 점수 조작 효과
        if (effect.target === 0){
            let value = eval(effect.value);
            if (effect.player === 0) {
                if (side === 'a'){
                    this.state.a.score = this.state.a.score+value;
                    this.a.emit('My Score Update', {score: this.state.a.score});
                    this.b.emit('Opponent Score Update', {score: this.state.a.score});
                }
                else if (side === 'b'){
                    this.state.b.score = this.state.b.score+value;
                    this.b.emit('My Score Update', {score: this.state.b.score});
                    this.a.emit('Opponent Score Update', {score: this.state.b.score});
                }
            }
            else if (effect.player === 1) {
                if (side === 'a'){
                    this.state.b.score = this.state.b.score+value;
                    this.a.emit('Opponent Score Update', {score: this.state.b.score});
                    this.b.emit('My Score Update', {score: this.state.b.score});
                }
                else if (side === 'b'){
                    this.state.a.score = this.state.a.score+value;
                    this.b.emit('Opponent Score Update', {score: this.state.a.score});
                    this.a.emit('My Score Update', {score: this.state.a.score});
                }
            }
        }
        // 핸드 조작 효과
        else if (effect.target === 1){
            let val = effect.value;
            if (cost.player === 0)
                if (this.state.b.hand.cards.length < val[0])
                    fail = true;
            else if (cost.player === 1)
                if (this.state.a.hand.cards.length < val[0])
                    fail = true;
        }
        // 덱으로부터 카드를 옮기는 효과
        else if (effect.target === 2) {
            let val = effect.value;
            // 장 수가 조건으로 정해져 있다면
            if (typeof val !== 'number')
            {

            }
            // 만약 옮기는 장 수가 숫자로 정해져 있다면
            else{
                // 핸드로 옮길 때
                if (effect.subject === 0){
                    // 자신에게 적용한다면
                    if (effect.player === 0)
                    {
                        // 플레이어가 a라면
                        if (side === 'a'){
                            // a의 덱 장 수가 부족하다면 리필

                            if (this.state.a.deck.length() < val)
                                this.state.refill_deck(this.state.a);
                            // 지정된 장 수만큼 드로우한다.
                            if (this.state.a.deck.length() < val)
                            {
                                let k = this.state.drawCard(this.state.a, this.state.a.deck.length()).map((card) => card['id']);
                                this.a.emit('Hand Add', {hand: k});
                            }
                            else
                            {
                                let k = this.state.drawCard(this.state.a, val).map((card) => card['id']);
                                this.a.emit('Hand Add', {hand: k});
                            }
                            this.state.a.this_turn_info.draw = this.state.a.this_turn_info.draw+val;
                        }
                        // 플레이어가 b라면, 방법은 동일
                        else if (side === 'b'){
                            if (this.state.b.deck.length() < val)
                                this.state.refill_deck(this.state.b);
                            if (this.state.b.deck.length() < val)
                            {
                                let k = this.state.drawCard(this.state.b, this.state.b.deck.length()).map((card) => card['id']);
                                this.b.emit('Hand Add', {hand: k});
                            }
                            else
                            {
                                let k = this.state.drawCard(this.state.b, val).map((card) => card['id']);
                                this.b.emit('Hand Add', {hand: k});
                            }
                            this.state.b.this_turn_info.draw = this.state.b.this_turn_info.draw+val;
                        }
                    }
                    // 상대에게 적용한다면, 적용 플레이어만 반대로
                    else if (effect.player === 1)
                    {
                        if (side === 'a'){
                            if (this.state.b.deck.length() < val)
                                this.state.refill_deck(this.state.b);
                            this.b.emit('Hand Add', this.state.drawCard(this.state.b, val).map((card) => card['id']));
                            this.state.b.this_turn_info.draw = this.state.b.this_turn_info.draw+val;
                        }
                        // 효과 발동자가 b일 때
                        else if (side === 'b'){
                            if (this.state.a.deck.length() < val)
                                this.state.refill_deck(this.state.a);
                            this.a.emit('Hand Add', this.state.drawCard(this.state.a, val).map((card) => card['id']));
                            this.state.a.this_turn_info.draw = this.state.a.this_turn_info.draw+val;
                        }
                    }
                }                
            }
        }
        // 보드 위의, 대상 플레이어의 조각들에 대한 처리를 하는 효과
        else if (effect.target === 4) {

        }

        // 효과 처리 결과 현재 턴인 플레이어의 핸드가 0장이 되면 패배 처리한다.
        if ((this.state.turn === 'a') && (this.state.a.hand.length() === 0))
        {
            this.match_end ('A no hand');
        }
        else if ((this.state.turn === 'b') && (this.state.b.hand.length() === 0))
        {
            this.match_end ('B no hand');
        }
    }

    sync() {
        io.emit('sync', a);
    }

    disconnect(socket) {
        //io.to(this.roomid).emit('player left match', socket);
        if(socket.id === this.a.socketID) {
            if(this.b.bot !== true) {
                io.sockets.connected[this.b.socketID].emit('match disconnect', {reason:"Disconnect"});
            }
        }
        if(socket.id === this.b.socketID) {
            if(this.a.bot !== true) {
                io.sockets.connected[this.a.socketID].emit('match disconnect', {reason:"Disconnect"});
            }
        }
        // 만약 상대도 나갔다면 매치 종료
        if (this.a === null && this.b === null) {
            this.match_end();
        }
        server.usedMatchIDs[this.id] = -1;
    }

    match_end(cause) {
        var win = 'A';
        if (cause === 'max turn') {
            if (this.state.a.score > this.state.b.score) {
                win = 'A';
            }
            else if (this.state.a.score < this.state.b.score) {
                win = 'B';
            }
            else win = 'none';
        }
        else if (cause === 'A cannot place' || cause === 'A no hand') {
            win = 'B';

        }
        else if (cause === 'B cannot place' || cause === 'B no hand') {
            win = 'A';
        }
        if (win === 'A'){
            this.a.emit('match end', {cause: cause, result: 'win', p_score: this.state.a.score, op_score: this.state.b.score});
            this.b.emit('match end', {cause: cause, result: 'lose', p_score: this.state.b.score, op_score: this.state.a.score});
        }
        else if (win === 'B'){
            this.a.emit('match end', {cause: cause, result: 'lose', p_score: this.state.a.score, op_score: this.state.b.score});
            this.b.emit('match end', {cause: cause, result: 'win', p_score: this.state.b.score, op_score: this.state.a.score});
        }
        else {
            this.a.emit('match end', {cause: cause, result: 'draw', p_score: this.state.a.score, op_score: this.state.b.score});
            this.b.emit('match end', {cause: cause, result: 'draw', p_score: this.state.b.score, op_score: this.state.a.score});
        }
    }
}