import {player} from "./player.js";
import * as match from "./match.js";

import {piece} from "./block.js";
import { GameOverBox } from "./gameOverBox.js";
import {grid_zone} from "./grid_zone.js";
import {HandZone} from "./hand_zone.js";
import {main_deck_zone} from "./main_deck_zone.js";
import {trash_zone} from "./trash_zone.js";
import { Button } from "./button.js";
import { CardSelectZone } from "./card select zone.js";
import { InfoZone } from "./info_zone.js";

export class GameScene extends Phaser.Scene {
    
    constructor() {
        super({ key: "GameScene" });
        this.GRID_SIZE = 10;
        this.TILE_SIZE = 38;
        this.SCORE_ZONE_OFFSET_X = 50;
        this.SCORE_ZONE_OFFSET_Y = 50;
        this.BOARD_OFFSET_X = 300;
        this.BOARD_OFFSET_Y = 20;
        this.HAND_OFFSET_X = 300;
        this.HAND_OFFSET_Y = 430;
        this.HAND_WIDTH = 400;
        this.HAND_HEIGHT = 160;
        this.TRASH_ZONE_OFFSET_X = 750;
        this.TRASH_ZONE_OFFSET_Y = 20;
        this.INFO_ZONE_OFFSET_X = 745;
        this.INFO_ZONE_OFFSET_Y = 90;
        this.INFO_WIDTH = 210;
        this.INFO_HEIGHT = 420;
        this.MAIN_DECK_OFFSET_X = 750;
        this.MAIN_DECK_OFFSET_Y = 530;
        this.Phase = 0;
        this.Grid = null;
        this.grid = null;
        this.my_score = 0;
        this.opponent_score = 0;
    }

    ready_phase() {
        let l = this.pieces.length;
        for (let i=0;i<l;i++)
            this.pieces[l-i-1].destroy();
        this.pieces = [];
    }

    spawnPieces(blocks) {
        blocks.forEach((block) => {
            const shape = block[0];
            const Piece = new piece(this, this.pieces.length * 132+this.HAND_OFFSET_X+57, 0+this.HAND_OFFSET_Y+57, block);
            shape.forEach((p) => {
                const block = this.add.rectangle(
                    (p[1]-1) * this.TILE_SIZE, (p[0]-1) * this.TILE_SIZE, this.TILE_SIZE-4, this.TILE_SIZE-4, 0x00aaff
                );
                block.setDepth(1);
                block.setOrigin(0.5, 0.5);
                Piece.add(block); // Add blocks to the piece
            });
            Piece.setDepth(3);
            Piece.setSize((this.TILE_SIZE+1) * 3, (this.TILE_SIZE+1) * 3); // Set size for hit testing
            this.pieces.push(Piece); // Keep track of the piece
            player.cardsys.blocks.push(Piece);
        });
    }

    spawnCards() {
        this.HAND_AREA.position_init();
        this.HAND_AREA.print_cards(this);
    }

    checkSpace(scene) {
        const pieces = scene.pieces;
        let available = false;
        pieces.forEach(piece => {
            if (this.checkSpaces(piece) === true) {
                available = true;
            }
        });
        return available;
    }

    checkSpaces(piece) {
        let checks = [];
        let availability = false;
        let shape = piece.shapes[piece.shape_id];
        let size = shape.length;
        for (let i=0; i<10; i++) {
            for (let j=0; j<10; j++) {
                for (let k=0; k<size; k++) {
                    if ((i+shape[k][0] >= 10) || (j+shape[k][1] >= 10))
                        break;
                    else if ((this.Grid[i+shape[k][0]][j+shape[k][1]] == 0))
                        checks.push(true);
                }
                if (checks.length === size) {
                    availability = true;
                }
                checks = [];
            }
        }
        return availability;
    }

    turnChange() {
        if (player.cardsys.turn) player.cardsys.turn = false;
        else player.cardsys.turn = true;
        player.cardsys.turn_num = player.cardsys.turn_num + 1;
        var k = '';
        if (player.cardsys.turn === true) {
            k = 'Your';
        }
        else if (player.cardsys.turn === false) {
            k = 'Opponent\'s';
        }
        var messagebox = new Button(this, 500, 300);
        messagebox.setSize(980, 100);
        messagebox.set_color(this, 0xaa00ff);
        messagebox.set_text(this, k+' Turn!', '96px', '#0f0');
        messagebox.setDepth(10);
        this.input.enabled = false;
        this.time.delayedCall(1000, () => {
            messagebox.destroy();
            this.input.enabled = true;
        });
        this.time.delayedCall(1000, () => {
            if (player.cardsys.turn === true)
                player.socket.emit('hand check');
        });
    }

    gameOver(data) {
        this.gameover.showBox(data);
    }

    preload() {
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });
        this.load.bitmapFont('gothic', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/assets/fonts/gothic.png', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/assets/fonts/gothic.xml');
        
        this.graphics = this.add.graphics();
        this.GRID_AREA = new grid_zone(this, this.BOARD_OFFSET_X+200, this.BOARD_OFFSET_Y+200);
        this.HAND_AREA = new HandZone(this, this.HAND_OFFSET_X+this.HAND_WIDTH/2, this.HAND_OFFSET_Y+this.HAND_HEIGHT/2);
        this.TRASH_AREA = new trash_zone(this, -200, -200);
        this.MAIN_DECK_AREA = new main_deck_zone(this, -200, -200);
        this.INFO_AREA = new InfoZone(this, this.INFO_ZONE_OFFSET_X+this.INFO_WIDTH/2, this.INFO_ZONE_OFFSET_Y+this.INFO_HEIGHT/2, 210, 420).layout()
        this.Grid = Array.from({ length: this.GRID_SIZE }, () => Array(this.GRID_SIZE).fill(0));
        this.grid = Array.from({ length: this.GRID_SIZE }, () => Array(this.GRID_SIZE).fill(null));
        this.gameover = new GameOverBox(this);
        this.input.topOnly = false;

        this.MyscoreText = this.add.text(this.SCORE_ZONE_OFFSET_X, this.SCORE_ZONE_OFFSET_Y, `My Score : ${this.my_score}`, {
            fontSize: '20px',
            fontFamily: "'Noto Sans KR', sans, serif",
            color: '#ffffff'
        });
        this.OpponentscoreText = this.add.text(this.SCORE_ZONE_OFFSET_X, this.SCORE_ZONE_OFFSET_Y+30, `Op Score : ${this.opponent_score}`, {
            fontSize: '20px',
            fontFamily: "'Noto Sans KR', sans, serif",
            color: '#ffffff'
        });
        
        this.GRID_AREA.drawGrid(this);
    
        this.pieces = [];

        this.message = null;
        
        this.cardSelects = new CardSelectZone(this, -1500, -1000);
        this.cardSelects.setDepth(5);
    }

    create() {
        if (player.cardsys.turn === true) {
            this.message = new Button(this, 500, 300);
            this.message.setSize(980, 100);
            this.message.set_color(this, 0xaa00ff);
            this.message.set_text(this, 'You go first!', '96px', '#0f0');
        }
        else if (player.cardsys.turn === false) {
            this.message = new Button(this, 500, 300);
            this.message.setSize(980, 100);
            this.message.set_color(this, 0xaa00ff);
            this.message.set_text(this, 'You go second!', '96px', '#0f0');
        }
        this.message.setDepth(10);
        this.time.delayedCall(1000, () => {
            this.message.destroy();

            this.ready_phase();
            this.Phase = 1;
        });
    }
}