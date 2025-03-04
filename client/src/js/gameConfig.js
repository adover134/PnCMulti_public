import {GameScene} from "./gameScene.js";
import {MainScene} from "./mainScene.js";
import {LoadScene} from "./loadScene.js";
import {WaitingScene} from "./waitingScene.js";
import {TestScene} from "./testScene.js";
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

export const gameConfig = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    backgroundColor: "#ee7272",
    scene: [LoadScene, MainScene, WaitingScene, GameScene, TestScene],
    plugins: {
        scene: [{
            key: 'rexUI',
            plugin: UIPlugin,
            mapping: 'rexUI'
        }]
    }
};