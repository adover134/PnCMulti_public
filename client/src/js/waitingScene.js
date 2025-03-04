export class WaitingScene extends Phaser.Scene {
    
    constructor() {
        super({ key: "WaitingScene" });
    }
    preload() {
        var background = this.add.image(500, 300, 'waitPage');
        background.setDisplaySize(1000, 600);
    }
}