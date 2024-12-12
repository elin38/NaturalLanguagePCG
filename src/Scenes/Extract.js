class Extract extends Phaser.Scene {
    constructor() {
        super("extractScene");
    }

    preload() {
    }

    init() {
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;
    }

    create() {
        // Create a new tilemap which uses 16x16 tiles, and is 40 tiles wide and 25 tiles tall
        this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE, this.TILEHEIGHT, this.TILEWIDTH);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");

        // Create the layers
        this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
        this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
        this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);

        // Extract house tiles
        const layerData = this.housesLayer.layer.data.flat().map(tile => tile.index); // Flatten 2D array and extract tile indexes
        const houseLocations = extractHouses(layerData, this.housesLayer.layer.width);
        console.log("House Locations:", houseLocations);

        houseLocations.forEach(location => { //adds a dot to where the house tiles are
            const centerX = this.tileXtoWorld(location.x) + this.TILESIZE / 2;
            const centerY = this.tileYtoWorld(location.y) + this.TILESIZE / 2;
    
            const dot = this.add.graphics();
            dot.fillStyle(0xff0000, 1);
            dot.fillCircle(centerX, centerY, 2);
        });

        // Create townsfolk sprite
        my.sprite.purpleTownie = this.add.sprite(this.tileXtoWorld(5), this.tileYtoWorld(5), "purple").setOrigin(0,0);

        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);
    }

    update() {
    }

    tileXtoWorld(tileX) {
        return tileX * this.TILESIZE;
    }

    tileYtoWorld(tileY) {
        return tileY * this.TILESIZE;
    }
}

function extractHouses(layerData, layerWidth) {
    const houseTileNumbers = [
        49, 50, 51, 52, 53, 54, 55, 56,
        61, 62, 63, 64, 65, 66, 67, 68,
        73, 74, 75, 76, 77, 78, 79, 80,
        85, 86, 87, 88, 89, 90, 91, 92,
        97, 98, 99, 100, 101, 102, 103,
        109, 110, 111, 112, 113, 114, 115,
        121, 122, 123, 124, 125, 126, 127
    ];
    const houseLocations = [];

    // Loop through the layer data
    layerData.forEach((tileNumber, index) => {
        if (houseTileNumbers.includes(tileNumber)) {
            const x = index % layerWidth;
            const y = Math.floor(index / layerWidth);
            houseLocations.push({ x, y });
        }
    });

    return houseLocations;
}
