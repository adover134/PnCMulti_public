const MatchPhase = {
    READY : 0,
    MAIN : 1,
    PUZZLE : 2
};

import { getRandomInt } from "../randomInt.js";
import {Deck} from "./match_deck.js";
import { Hand } from "./match_hand.js";
import { Trash } from "./match_trash.js";

var initial_turn_info = {
    trash: 0,
    activate: 0,
    banish: 0,
    hand_to_deck: 0,
    draw: 0,
    reduce_base: 0,
    reduce_add: 0,
    increase_base: 0,
    increase_add: 0,
    destroy_p: 0,
    destroy_op: 0,
    move_p: 0,
    move_op: 0
};

export class MatchState {
    constructor() {
        var x = getRandomInt(0, 2);
        if (x === 0)
            this.turn = 'a';
        else this.turn = 'b';
        this.turn_num = 1;
        this.phase = MatchPhase.MAIN;
        this.draws = 0;
        this.card = null;
        this.user = null;
        this.a = {
            prizeToken: 0,
            deck: new Deck(),
            hand: new Hand(),
            trash: new Trash(),
            score: 0,
            unit: null,
            turn_end: false,
            this_turn_info: Object.assign({}, initial_turn_info),
            blocks: null
        }
        this.b = {
            prizeToken: 0,
            deck: new Deck(),
            hand: new Hand(),
            trash: new Trash(),
            score: 0,
            unit: null,
            turn_end: false,
            this_turn_info: Object.assign({}, initial_turn_info),
            blocks: null
        }
        this.board = [
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
        ]
    }

    drawCard(side, n=1) {
        var cards = [];
        for(var i = 0; i < n; i++) {
            var c = side.deck.draw();
            side.hand.add_card(c);
            cards.push(c);
        }
        return cards;
    }

    trash(side, Cards) {
        let trashed = side.hand.remove(Cards);
        console.log("trashes", Cards);
        side.trash.add_cards(trashed);
        /*if (this.phase === MatchPhase.READY) {
            return 'to main';
        }
        else 'ok';*/
    }

    refill_deck(side) {
        side.deck.add_cards(side.trash.cards);
        side.trash.clean();
    }

    checkCardCondition (Card) {
        
    }

    checkBlockAvailable (block) {
        var available = false;
        var len = block[0].length;
        for (let x=0;x<10;x++){
            for (let y=0;y<10;y++) {
                for (let i=0;i<4;i++) {
                    // 4개 방향 각각에 대해서
                    let a = true;
                    let s = block[i];
                    for (let j=0;j<len;j++) {
                        // 현재 칸을 왼쪽 위로 취급했을 때 각 조각의 배치 가능 여부를 확인한다.
                        if ((x+s[j][0] >= 10) || (y+s[j][1] >= 10) || (Object.keys(this.board[x+s[j][0]][y+s[j][1]]).length !== 0)) {
                            a = false;
                        }
                    }
                    if (a === true) {
                        available = true;
                    }
                }
            }
        }
        return available;
    }

    placeBlock(side, point, block) {
        block.forEach((p) => {
            this.board[point[0]+p[0]][point[1]+p[1]]={side: side, score: 400};
        });
        console.log(this.board);
    }

    checkLines() {
        // Check for completed lines (assuming 10x10 grid)
        let fullLineX = [], fullLineY = [], points = [];
        for (let i = 0; i < 10; i++) {
            // Check if one of a line is full
            fullLineY.push(true);
            fullLineX.push(true);
            for (let x = 0; x < 10; x++) {
                if (Object.keys(this.board[i][x]).length === 0) {
                    fullLineY[i] = false;
                    break;
                }
            }
            for (let x = 0; x < 10; x++) {
                if (Object.keys(this.board[x][i]).length === 0) {
                    fullLineX[i] = false;
                    break;
                }
            }
        }
        for (let i=0;i<10;i++)
        {
            if (fullLineX[i] === true)
                for (let x=0;x<10;x++)
                    points.push([x, i]);
            if (fullLineY[i] === true)
                for (let x=0;x<10;x++)
                    if (fullLineX[x] === false)
                        points.push([i, x]);
        }
        var Ascore = 0;
        var Bscore = 0;
        for (let i=0;i<points.length;i++)
        {
            if (this.board[points[i][0]][points[i][1]].side === 'a')
                Ascore = Ascore + this.board[points[i][0]][points[i][1]].score;
            else if (this.board[points[i][0]][points[i][1]].side === 'b')
                Bscore = Bscore + this.board[points[i][0]][points[i][1]].score;
            this.board[points[i][0]][points[i][1]] = {};
        }
        return {a: Ascore, b: Bscore, p: points};
    }

    scoring() {
        var data = this.checkLines();
        this.a.score = this.a.score + data.a;
        this.b.score = this.b.score + data.b;
        if (this.turn === 'a')
            this.a.score = this.a.score + data.b;
        else if (this.turn === 'b')
            this.b.score = this.b.score + data.a;
        return data.p;
    }

    changePhase() {
        this.phase = (this.phase + 1) % 3;
        if (this.phase === MatchPhase.READY) {
            this.turn_num = this.turn_num + 1;
            if (this.turn === 'a') this.turn = 'b';
            else if (this.turn === 'b') this.turn = 'a';
            this.a.this_turn_info = Object.assign({}, initial_turn_info);
            this.b.this_turn_info = Object.assign({}, initial_turn_info);
        }
    }
}
