import * as Phaser from 'phaser';
import { getWallets, Wallet } from '@wallet-standard/core';

export default class Login extends Phaser.Scene {
    wallets: Wallet[] = [];
    constructor() {
        super('Bread Maze Login');
    }

    preload() {
        this.load.audio('jump', 'assets/jump.m4a');
        this.load.audio('hit', 'assets/hit.m4a');
        this.load.audio('reach', 'assets/reach.m4a');
        this.load.image('ground', 'assets/ground.png');
        this.load.image('restart', 'assets/restart.png');
        this.load.image('game-over', 'assets/game-over.png');
        this.load.image('cloud', 'assets/cloud.png');
        this.load.image('controls', 'assets/Controls.png')
        this.load.image('tnt-barrel', 'assets/tnt_barrel.png')
        this.load.image('smb-barrel', 'assets/smb_barrel.png')
        this.load.image('missile', 'assets/missile.png')
        this.load.image('secret', 'assets/secret.png')
        this.load.spritesheet('monke', 'assets/monke.png', { frameWidth: 32, frameHeight: 80 });
        this.load.spritesheet('player', 'assets/Player.png', { frameWidth: 32, frameHeight: 32 });
        const { get: getAllWallets, on: onWallets } = getWallets();
        getAllWallets().forEach((wallet: Wallet) => {
            this.textures.addBase64(wallet.name, wallet.icon);
            this.wallets.push(wallet);
        });
    }

    create() {
        this.add.text(this.sys.canvas.width / 2, 32, 'Login:', { fontSize: '64px' }).setOrigin(0.5);
        this.wallets.forEach((wallet: Wallet, index: number) => {
            let icon = this.add.image(this.sys.canvas.width / 2, 128 * (index + 1), this.wallets[index].name).setDisplaySize(64, 64);
            icon.setInteractive();
            icon.on('pointerdown', () => {
                wallet.features['standard:connect']['connect']().then((res: any) => {
                    console.log(res);
                    this.scene.start('Game', { wallet: wallet.accounts[0].address });
                })
            })
        });
        // this.scene.start('Game');
    }
}