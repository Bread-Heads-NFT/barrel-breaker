import * as Phaser from 'phaser';
import Controls from './controls/controls'

export default class Player extends Phaser.Physics.Arcade.Sprite {
    public body: Phaser.Physics.Arcade.Body;
    private isFrozen: Boolean = false;
    private isAlive: Boolean = true;
    private invincibleTimer: Phaser.Time.TimerEvent | null = null;
    private invincible: boolean = false;

    SPEED = 200;
    JUMP_SPEED = 600;
    BOUNCE_SPEED = 200;
    SCALE = 1.5;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        scene.physics.world.enable(this);
        this.body.setCollideWorldBounds(true);

        this.scene = scene

        // scene.anims.create({
        //   key: 'walk',
        //   frames: scene.anims.generateFrameNames('player'),
        //   frameRate: 8,
        //   repeat: -1
        // })
        // this.play('walk')

        // this.setVisible(false)

        this.setScale(this.SCALE);
        // this.setOrigin(0, 1)
        // this.setDragX(1500)
        this.body.setSize(20, 32)
        // this.body.setOffset(25, 24)

        this.createAnimations(this.scene);
    }

    update(cursors: any, controls: Controls) {
        // console.log(this);
        // if (this.isFrozen || !this.isAlive) return

        // check if out of camera and kill
        // if (this.body.right < 0 || this.body.left > this.scene.cameras.main.getBounds().width || this.body.top > this.scene.cameras.main.getBounds().height) {
        //     console.log('dying');
        //     this.die()
        // }

        // controls left & right
        if (cursors.left.isDown || controls.leftIsDown) {
            this.moveLeft();
        } else if (cursors.right.isDown || controls.rightIsDown) {
            this.moveRight();
        } else if (cursors.up.isDown || controls.upIsDown) {
            this.moveUp();
        } else if (cursors.down.isDown/* || controls.rightIsDown*/) {
            this.moveDown();
        } else {
            this.stand();
        }
    }

    moveLeft(): void {
        if (this.isFrozen) return;

        this.body?.setVelocityX(-this.SPEED);
        this.body?.setVelocityY(0);

        this.anims.play("left", true);
    }

    moveRight(): void {
        if (this.isFrozen) return;

        this.body?.setVelocityX(this.SPEED);
        this.body?.setVelocityY(0);

        this.anims.play("right", true);
    }

    moveUp(): void {
        if (this.isFrozen) return;

        this.body?.setVelocityX(0);
        this.body?.setVelocityY(-this.SPEED);

        this.anims.play("up", true);
    }

    moveDown(): void {
        if (this.isFrozen) return;

        this.body?.setVelocityX(0);
        this.body?.setVelocityY(this.SPEED);

        this.anims.play("down", true);
    }

    stand(): void {
        this.body?.setVelocityX(0);
        this.body?.setVelocityY(0);

        this.anims.play("stop", true);
    }

    private createAnimations(scene: Phaser.Scene) {
        scene.anims.create({
            key: "stop",
            frames: scene.anims.generateFrameNumbers("player", {
                frames: [0]
            })
        });
        scene.anims.create({
            key: "right",
            frames: scene.anims.generateFrameNumbers("player", {
                frames: [3, 4, 5]
            }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: "left",
            frames: scene.anims.generateFrameNumbers("player", {
                frames: [6, 7, 8]
            }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: "up",
            frames: scene.anims.generateFrameNumbers("player", {
                frames: [9, 10, 11]
            }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: "down",
            frames: scene.anims.generateFrameNumbers("player", {
                frames: [0, 1, 2]
            }),
            frameRate: 8,
            repeat: -1
        });
    }
}