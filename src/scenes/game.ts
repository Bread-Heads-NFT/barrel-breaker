import * as Phaser from 'phaser';
import Player from '../components/player';
import Controls from '../components/controls/controls';
import Login from './login';

const TILE_SIZE = 64;

class Position {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export default class Game extends Phaser.Scene {
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    controls: Controls;
    player: Player;
    gameSpeed = 10;
    isGameRunning = false;
    respawnTime = 0;
    score = 0;
    jumpSound: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    hitSound: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    reachSound: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    ground: Phaser.GameObjects.TileSprite;
    scoreText: Phaser.GameObjects.Text;
    highScoreText: Phaser.GameObjects.Text;
    text: Phaser.GameObjects.Text;
    environment: Phaser.GameObjects.Group;
    gameOverScreen: Phaser.GameObjects.Container;
    gameOverText: Phaser.GameObjects.Image;
    restart: Phaser.GameObjects.Image;
    obstacles: Phaser.Physics.Arcade.Group;
    barrels: Phaser.Physics.Arcade.Group;
    monkeys: Phaser.Physics.Arcade.Group;
    startTrigger: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    constructor() {
        super('Game');
    }

    preload() {
    }

    create() {
        const { width, height } = this.sys.canvas;
        let graphics = this.add.graphics();
        graphics.fillGradientStyle(0x03E1FF, 0x00FFA3, 0xDC1FFF, 0x03E1FF, 1);
        graphics.fillRect(0, 0, width, height);

        this.jumpSound = this.sound.add('jump', { volume: 0.2 });
        this.hitSound = this.sound.add('hit', { volume: 0.2 });
        this.reachSound = this.sound.add('reach', { volume: 0.2 });

        this.startTrigger = this.physics.add.sprite(0, 10, null).setSize(30, 30).setOrigin(0, 0).setImmovable().setVisible(false);
        this.ground = this.add.tileSprite(0, height, 88, 26, 'ground').setOrigin(0, 1)

        this.scoreText = this.add.text(width, 0, "00000", { color: "#535353", font: '900 35px Courier', resolution: 5 })
            .setOrigin(1, 0)
            .setAlpha(0);

        this.highScoreText = this.add.text(0, 0, "00000", { color: "#535353", font: '900 35px Courier', resolution: 5 })
            .setOrigin(1, 0)
            .setAlpha(0);

        this.text = this.add.text(width / 2, height / 2, "Barrel Breaker\nPress SPACE or Tap the Screen to begin", { color: "#535353", font: '900 35px Courier', resolution: 5, align: "center" });
        this.text.setOrigin(0.5);

        this.environment = this.add.group();
        this.environment.addMultiple([
            this.add.image(width / 2, 170, 'cloud'),
            this.add.image(width - 80, 80, 'cloud'),
            this.add.image((width / 1.3), 100, 'cloud')
        ]);
        this.environment.setAlpha(0);

        this.gameOverScreen = this.add.container(width / 2, height / 2 - 50).setAlpha(0)
        this.gameOverText = this.add.image(0, 0, 'game-over');
        this.restart = this.add.image(0, 80, 'restart').setInteractive();
        this.gameOverScreen.add([
            this.gameOverText, this.restart
        ])

        this.obstacles = this.physics.add.group();
        this.barrels = this.physics.add.group();
        this.monkeys = this.physics.add.group();

        this.player = new Player(
            this,
            0,
            height - 10
        );

        this.anims.create({
            key: "rescue",
            frames: this.anims.generateFrameNumbers("monke", {
                frames: [0, 1, 2, 3]
            })
        });

        this.initStartTrigger();
        this.initColliders();
        this.handleInputs();
    }

    update(time, delta) {
        if (!this.isGameRunning) { return; }

        this.ground.tilePositionX += this.gameSpeed;
        Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);
        Phaser.Actions.IncX(this.barrels.getChildren(), -this.gameSpeed);
        Phaser.Actions.IncX(this.monkeys.getChildren(), -this.gameSpeed);
        Phaser.Actions.IncX(this.environment.getChildren(), - 0.5);

        this.respawnTime += delta * this.gameSpeed * 0.08;
        if (this.respawnTime >= 1500) {
            this.placeObstacle();
            this.respawnTime = 0;
        }

        this.obstacles.getChildren().forEach(obstacle => {
            let obs = obstacle as Phaser.Physics.Arcade.Sprite;
            if (obs.getBounds().right < 0) {
                this.obstacles.killAndHide(obstacle);
            }
        });

        this.barrels.getChildren().forEach(barrel => {
            let obs = barrel as Phaser.Physics.Arcade.Sprite;
            if (obs.getBounds().right < 0) {
                this.barrels.killAndHide(barrel);
            }
        });

        this.monkeys.getChildren().forEach(monkey => {
            let obs = monkey as Phaser.Physics.Arcade.Sprite;
            if (obs.getBounds().right < 0) {
                this.monkeys.killAndHide(monkey);
            }
        });

        this.environment.getChildren().forEach(env => {
            let obs = env as Phaser.Physics.Arcade.Sprite;
            if (obs.getBounds().right < 0) {
                obs.x = this.sys.canvas.width + 30;
            }
        });

        if (this.player.body.deltaAbsY() > 0) {
            this.player.anims.stop();
            // this.player.setTexture('dino', 0);
        } else {
            this.player.body.height <= 58 ? this.player.play('stop', true) : this.player.play('right', true);
        }

        this.handleScore();
    }

    initStartTrigger() {
        const { width, height } = this.sys.canvas;
        this.physics.add.overlap(this.startTrigger, this.player, () => {
            if (this.startTrigger.y === 10) {
                this.startTrigger.body.reset(0, height - 10);
                return;
            }

            this.startTrigger.disableBody(true, true);

            this.text.visible = false;

            const startEvent = this.time.addEvent({
                delay: 1000 / 60,
                loop: true,
                callbackScope: this,
                callback: () => {
                    console.log('start');
                    this.player.setVelocityX(80);
                    this.player.play('right');

                    if (this.ground.width < width) {
                        this.ground.width += 17 * 2;
                    }

                    if (this.ground.width >= 1000) {
                        this.ground.width = width;
                        this.isGameRunning = true;
                        this.player.setVelocityX(0);
                        this.scoreText.setAlpha(1);
                        this.environment.setAlpha(1);
                        startEvent.remove();
                    }
                }
            });
        }, null, this)
    }

    initColliders() {
        this.physics.add.collider(this.player, this.obstacles, () => {
            this.highScoreText.x = this.scoreText.x - this.scoreText.width - 20;

            const highScore = this.highScoreText.text.substr(this.highScoreText.text.length - 5);
            const newScore = Number(this.scoreText.text) > Number(highScore) ? this.scoreText.text : highScore;

            this.highScoreText.setText('HI ' + newScore);
            this.highScoreText.setAlpha(1);

            this.physics.pause();
            this.isGameRunning = false;
            this.anims.pauseAll();
            this.respawnTime = 0;
            this.gameSpeed = 10;
            this.gameOverScreen.setAlpha(1);
            this.score = 0;
            this.hitSound.play();
        }, null, this);


        this.physics.add.collider(this.player, this.barrels, (obj1, obj2) => {
            this.score++;
            this.hitSound.play();
            const barrel = obj2 as Phaser.Physics.Arcade.Sprite;
            let monke = this.monkeys.create(barrel.x, this.sys.canvas.height - 10, 'monke')
                .setScale(2)
                .setOrigin(0, 1);
            monke.play('rescue');
            obj2.destroy();
        }, null, this);
    }

    handleInputs() {
        this.restart.on('pointerdown', () => {
            this.player.setVelocityY(0);
            this.player.height = 92;
            this.physics.resume();
            this.obstacles.clear(true, true);
            this.isGameRunning = true;
            this.gameOverScreen.setAlpha(0);
            this.anims.resumeAll();
        })

        this.input.keyboard.on('keydown-SPACE', () => {
            console.log('space');
            if (!this.player.body.onFloor() || this.player.body.velocity.x > 0) { return; }

            this.jumpSound.play();
            this.player.height = 92;
            this.player.setVelocityY(-1600);
        })

        this.input.on('pointerdown', () => {
            console.log('pointer');
            if (!this.player.body.onFloor() || this.player.body.velocity.x > 0) { return; }

            this.jumpSound.play();
            this.player.height = 92;
            // this.player.body.offset.y = 0;
            this.player.setVelocityY(-1600);
            // this.player.setTexture('dino', 0);
        })
    }

    handleScore() {
        //     this.time.addEvent({
        //         delay: 1000 / 10,
        //         loop: true,
        //         callbackScope: this,
        //         callback: () => {
        //             if (!this.isGameRunning) { return; }

        //             this.score++;
        //             this.gameSpeed += 0.01

        //             if (this.score % 100 === 0) {
        //                 this.reachSound.play();

        //                 this.tweens.add({
        //                     targets: this.scoreText,
        //                     duration: 100,
        //                     repeat: 3,
        //                     alpha: 0,
        //                     yoyo: true
        //                 })
        //             }

        //             // const score = Array.from(String(this.score), Number);
        const score = String(this.score).split('');
        for (let i = 0; i < 5 - String(this.score).length; i++) {
            score.unshift('0');
        }

        this.scoreText.setText(score.join(''));
        // }
        //     })
    }

    placeObstacle() {
        const { width, height } = this.sys.canvas;
        const obstacleNum = Math.floor(Math.random() * 100) + 1;
        const distance = Phaser.Math.Between(600, 900);

        let obstacle;
        if (obstacleNum > 99) {
            const enemyHeight = [20, 50, 80];
            obstacle = this.obstacles.create(width + distance, height - enemyHeight[Math.floor(Math.random() * 3)], 'secret')
                .setScale(.1, .1);
            (obstacle as Phaser.Physics.Arcade.Sprite).setFlipX(true);
            // .setOrigin(0, 1);
        } else if (obstacleNum > 90) {
            const enemyHeight = [20, 50, 80];
            obstacle = this.obstacles.create(width + distance, height - enemyHeight[Math.floor(Math.random() * 3)], 'missile')
                .setOrigin(0, 1);
        } else if (obstacleNum > 50) {
            obstacle = this.obstacles.create(width + distance, height - 10, 'tnt-barrel')
                .setScale(2)
                .setOrigin(0, 1);
        } else {
            obstacle = this.barrels.create(width + distance, height - 10, 'smb-barrel')
                .setScale(2)
                .setOrigin(0, 1);
        }

        obstacle.setImmovable();
    }

}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    backgroundColor: '#000000',
    width: 1000,
    height: 340,
    scene: [Login, Game],
    scale: {
        mode: Phaser.Scale.FIT,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        },
    },
};

const game = new Phaser.Game(config);
