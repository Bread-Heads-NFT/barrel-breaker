import * as Phaser from 'phaser';
import Player from '../components/player';
import Controls from '../components/controls/controls';

// const level = [
//     [0, 0, 0, 0, 0, 2, 0, 0, 0],
//     [0, 1, 1, 1, 1, 1, 1, 1, 0],
//     [0, 0, 0, 1, 0, 1, 0, 1, 0],
//     [0, 1, 1, 1, 0, 1, 0, 1, 0],
//     [0, 1, 0, 1, 0, 1, 0, 0, 0],
//     [0, 1, 0, 1, 0, 1, 1, 1, 0],
//     [0, 0, 0, 0, 0, 1, 0, 1, 0],
//     [0, 1, 1, 1, 1, 1, 0, 1, 0],
//     [0, 0, 0, 0, 3, 0, 0, 0, 0]
// ];

const TILE_SIZE = 64;

function find_tile(tiles: Phaser.Tilemaps.Tile[][], value: number): [number, number] {
    for (let row of tiles) {
        for (let tile of row) {
            if (tile.index === value) {
                return [tile.x, tile.y];
            }
        }
    }
    return [-1, -1];
}

export default class Game extends Phaser.Scene {
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    controls: Controls;
    player: Player;
    map: Phaser.Tilemaps.Tilemap;
    entrance: Phaser.Tilemaps.Tile[];
    exit: Phaser.Tilemaps.Tile[];
    won: boolean = false;
    level: number[][];

    constructor() {
        super('Bread Maze');
    }

    preload() {
        let size = Math.floor(Math.random()*10 + 9);
        let num = Math.floor(Math.random()*10 + 1);
        let level_name = `maze_${size}_${num}.json`;
        console.log(level_name);
        this.load.json('level', `assets/mazes/${level_name}`);
        this.load.image('tiles', 'assets/Tiles.png');
        this.load.spritesheet('player', 'assets/Player.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        const level = this.cache.json.get('level');
        console.log(level);
        this.map = this.make.tilemap({ data: level, tileWidth: 64, tileHeight: 64 });
        const tiles = this.map.addTilesetImage('tiles');
        const layer = this.map.createLayer(0, tiles, 0, 0);

        this.cameras.main.setBackgroundColor('#000000')
        this.cameras.main.fadeIn()

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        this.input.addPointer(1);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.controls = new Controls(this);

        const [x, y] = find_tile(layer.layer.data, 2);
        this.entrance = this.map.filterTiles((tile) => tile.index === 2);
        this.player = new Player(
            this,
            layer.tileToWorldX(this.entrance[0].x) + TILE_SIZE / 2,
            layer.tileToWorldY(this.entrance[0].y) + TILE_SIZE / 2
        );
        this.exit = this.map.filterTiles((tile) => tile.index === 3);

        this.map.setCollision(0);
        this.physics.add.collider(this.player, layer);

        this.cameras.main.startFollow(this.player);

        console.log(layer.layer.data);
    }

    update() {
        this.player.update(this.cursors, this.controls);
        this.controls.update();

        if (!this.won) {
            this.physics.world.overlapTiles(this.player, this.exit, (tile: Phaser.Tilemaps.Tile) => {
                console.log('win');
                const x = Math.max(10, this.player.x);
                const y = Math.max(10, this.player.y);
                const text = this.add.text(this.player.x, this.player.y, 'You win!', { fontSize: '64px', color: '#F00', strokeThickness: 10 });
                text.setOrigin(0.5, 0.5);
                this.won = true;
            }, null, this);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    backgroundColor: '#000000',
    width: 576,
    height: 576,
    scene: Game,
    scale: {
        mode: Phaser.Scale.FIT,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        },
    },
};

const game = new Phaser.Game(config);
