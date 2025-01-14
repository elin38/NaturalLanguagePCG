class TinyTownGen extends Phaser.Scene {
    constructor() {
        super("TinyTownGen");
    }

    preload() {
        this.load.path = "./assets/";
        this.load.image("tinytown-tileset", "tilemap_packed.png");
    }

    init() {
        this.TILESIZE = 16; // Adjust based on your tileset's native tile size
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;
        this.mapHeight = 25;
        this.mapWidth = 40;

        // Specify the number of partitions
        this.numHorizontalPartitions = 4; // Number of horizontal squares
        this.numVerticalPartitions = 4;   // Number of vertical squares
    }

    create() {
        this.generateGrass();
        this.partitionMap(); // Partition the map into specified dimensions
        this.input.keyboard.on("keydown-E", () => {
            this.scene.start("extractScene"); // Switch to the other scene
        });
        this.input.keyboard.on("keydown-R", () => {
            this.scene.start("TileLabelScene"); // Switch to the other scene
        });
    }

    generateGrass() {
        const Grass = [];

        // Fill the array with tile index 0
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const noiseValue = noise.simplex2(x / this.sampleScale, y / this.sampleScale);
                console.log(noiseValue);
                let tile;
                if (noiseValue > 0.5) {
                    tile = 0;
                } else if (noiseValue > 0) {
                    tile = 1;
                } else {
                    tile = 2;
                }
                row.push(tile);
            }
            Grass.push(row);
        }

        // Create a Tilemap from the data
        const map = this.make.tilemap({
            data: Grass,
            tileWidth: this.TILESIZE,
            tileHeight: this.TILESIZE,
        });

        // Add the tileset image
        const tileset = map.addTilesetImage("tinytown-tileset", null, this.TILESIZE, this.TILESIZE);

        // Create a layer and display it
        this.layer = map.createLayer(0, tileset, 0, 0);
        this.layer.setScale(this.SCALE); // Scale the layer if needed
    }

    partitionMap() {
        // Calculate the size of each partition dynamically
        const squareWidth = Math.floor(this.mapWidth / this.numHorizontalPartitions);
        const squareHeight = Math.floor(this.mapHeight / this.numVerticalPartitions);

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xFF0000, 1); // Red lines for the grid

        // Draw vertical grid lines
        for (let x = 0; x <= this.mapWidth; x += squareWidth) {
            graphics.beginPath();
            graphics.moveTo(x * this.TILESIZE * this.SCALE, 0);
            graphics.lineTo(x * this.TILESIZE * this.SCALE, this.mapHeight * this.TILESIZE * this.SCALE);
            graphics.strokePath();
        }

        // Draw horizontal grid lines
        for (let y = 0; y <= this.mapHeight; y += squareHeight) {
            graphics.beginPath();
            graphics.moveTo(0, y * this.TILESIZE * this.SCALE);
            graphics.lineTo(this.mapWidth * this.TILESIZE * this.SCALE, y * this.TILESIZE * this.SCALE);
            graphics.strokePath();
        }
    }
}
