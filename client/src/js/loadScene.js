import {player} from "./player.js";
import * as cookie from "./cookie.js";

export class LoadScene extends Phaser.Scene {
    constructor() {
        super({ key: "LoadScene" });
        // 로그인 기록 확인 (현재는 닉네임으로 대충 처리함)
        var username = cookie.getCookie("username");

        if (username != "" && username != "null") {
            player.askReturnPlayer(username);
        } else {
            player.askNewPlayer();
        }
    }

    // 실제 게임에서 사용할 데이터들을 로드하는 곳!
    preload () {
        this.load.image('title', '/src/assets/img/title.png');
        this.load.image('background', '/src/assets/img/menu_background.png');
        this.load.image('waitPage', '/src/assets/img/wait.png');
        this.load.image('menu', '/src/assets/img/menu.png');
        this.load.image('player', '/src/assets/img/player.png');
        this.load.image('counter', '/src/assets/img/counter.png');
        this.load.spritesheet('cards', '/src/assets/cards/cards.png', {frameWidth: 308, frameHeight: 408});
        this.load.spritesheet('chosen_cards', '/src/assets/cards/chosen_cards.png', {frameWidth: 308, frameHeight: 408});
        player.game = this.game;
        player.sounds = {};
        player.obj = {};
    }

    // 게임에서 사용할 데이터가 적용되는 곳!
    create () {
        this.game.events.on('visible',function(){
            console.log('visible');
        });
        if (player.load)
        {
            this.scene.stop();
            this.game.scene.start('MainScene');
        }
    }
};