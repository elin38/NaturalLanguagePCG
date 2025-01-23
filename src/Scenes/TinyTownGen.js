class TinyTownGen extends Phaser.Scene {
    constructor() {
        super("TinyTownGen");
    }

    preload() {
        this.load.path = "./assets/";
        this.load.image("tinytown-tileset", "tilemap_packed.png");
        this.load.json('HouseData', 'HousePreset.json');
        this.load.json('FenceData', 'FencePreset.json');
        this.load.json('ForestData', 'ForestPreset.json');
    }

    init() {
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;
        this.mapHeight = 24;
        this.mapWidth = 40;

        this.numHorizontalPartitions = 4;
        this.numVerticalPartitions = 4;

        // Initialize counters
        this.houseCount = 0;
        this.fenceCount = 0;
        this.forestCount = 0;
    }

    create() {
        this.generateGrass();

        const inputElement = document.getElementById('inputText');
        const buttonElement = document.getElementById('submitText');

        buttonElement.addEventListener('click', () => {
            const userInput = inputElement.value.trim();
            this.handleUserCommand(userInput);
        });

        const saveButton = document.getElementById('saveMap');
        saveButton.addEventListener('click', () => {
            this.saveMapAsImage();
        });

        const Empty = [];
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                row.push(-1);
            }
            Empty.push(row);
        }

        const map = this.make.tilemap({
            data: Empty,
            tileWidth: this.TILESIZE,
            tileHeight: this.TILESIZE,
        });

        const tileset = map.addTilesetImage("tinytown-tileset", null, this.TILESIZE, this.TILESIZE);
        this.houseLayer = map.createLayer(0, tileset, 0, 0);
        this.houseLayer.setScale(this.SCALE);
        this.houseLayer.setDepth(2);

        const HousePreset = this.cache.json.get('HouseData');
        const FencePreset = this.cache.json.get('FenceData');
        const ForestPreset = this.cache.json.get('ForestData');

        const housePresets = Object.values(HousePreset);
        const fencePresets = Object.values(FencePreset);
        const forestPresets = Object.values(ForestPreset);

        this.input.keyboard.on("keydown-P", () => {
            for (let x = 0; x < 5; x += 1) {
                this.generateStructures(housePresets, fencePresets, forestPresets);
            }
        });
        
        this.generateStructures(housePresets, fencePresets, forestPresets);
    }

    generateStructures(housePresets, fencePresets, forestPresets) {
        this.houseLayer.forEachTile((tile) => {
            if (tile) {
                this.houseLayer.removeTileAt(tile.x, tile.y);
            }
        });
    
        const partitionWidth = Math.floor(this.mapWidth / this.numHorizontalPartitions);
        const partitionHeight = Math.floor(this.mapHeight / this.numVerticalPartitions);
        const usedTiles = new Set();
        const clusterDescriptions = [];

        for (let row = 0; row < this.numVerticalPartitions; row++) {
            for (let col = 0; col < this.numHorizontalPartitions; col++) {
                const startX = col * partitionWidth;
                const startY = row * partitionHeight;

                const structureType = Phaser.Math.Between(0, 2);
                let preset;
                let description = "";
                let itemCount = 0;

                if (structureType === 0) {
                    preset = Phaser.Utils.Array.GetRandom(housePresets);
                    description = "House";
                    itemCount = ++this.houseCount;
                } else if (structureType === 1) {
                    preset = Phaser.Utils.Array.GetRandom(fencePresets);
                    description = "Fenced Area";
                    itemCount = ++this.fenceCount;
                } else {
                    preset = Phaser.Utils.Array.GetRandom(forestPresets);
                    description = "Forest";
                    itemCount = ++this.forestCount;
                }

                const maxStartX = startX + partitionWidth - preset.width;
                const maxStartY = startY + partitionHeight - preset.height;
                const posX = Phaser.Math.Between(startX, maxStartX);
                const posY = Phaser.Math.Between(startY, maxStartY);

                if (this.isPlacementValid(preset, posX, posY, usedTiles)) {
                    this.generate(preset, posX, posY);
                    this.markOccupied(preset, posX, posY, usedTiles);

                    clusterDescriptions.push({
                        topLeft: { x: posX, y: posY },
                        bottomRight: { x: posX + preset.width - 1, y: posY + preset.height - 1 },
                        description: `${description} ${itemCount}`,
                    });

                    // this.drawBoundingBox(posX, posY, preset.width, preset.height);
                }
            }
        }

        updateLandmarks(clusterDescriptions);
    }

    handleUserCommand(command) {
        const commands = {
            "generate grass": () => this.generateGrass(),
            "restart": () => this.scene.restart(),
        };

        if (commands[command.toLowerCase()]) {
            commands[command.toLowerCase()]();
        } else {
            console.log(`Unknown command: ${command}`);
        }
    }

    isPlacementValid(preset, startX, startY, usedTiles) {
        for (let row = 0; row < preset.height; row++) {
            for (let col = 0; col < preset.width; col++) {
                const tile = `${startX + col},${startY + row}`;
                if (usedTiles.has(tile)) return false;
            }
        }
        return true;
    }

    markOccupied(preset, startX, startY, usedTiles) {
        for (let row = 0; row < preset.height; row++) {
            for (let col = 0; col < preset.width; col++) {
                const tile = `${startX + col},${startY + row}`;
                usedTiles.add(tile);
            }
        }
    }

    drawBoundingBox(startX, startY, width, height) {
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x00ff00, 1);
        graphics.strokeRect(
            startX * this.TILESIZE * this.SCALE,
            startY * this.TILESIZE * this.SCALE,
            width * this.TILESIZE * this.SCALE,
            height * this.TILESIZE * this.SCALE
        );
        graphics.setDepth(4);
    }

    generateGrass() {
        const Grass = [];
    
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const options = [0, 1, 2];
                const randomValue = options[Math.floor(Math.random() * options.length)];
                row.push(randomValue);
            }
            Grass.push(row);
        }
    
        const map = this.make.tilemap({
            data: Grass,
            tileWidth: this.TILESIZE,
            tileHeight: this.TILESIZE,
        });
    
        const tileset = map.addTilesetImage("tinytown-tileset", null, this.TILESIZE, this.TILESIZE);
        this.layer = map.createLayer(0, tileset, 0, 0);
        this.layer.setScale(this.SCALE);
        this.layer.setDepth(1);
    }
    
    generate(info, startX, startY) {
        const width = info.width;
        const height = info.height;
        const data = info.data;

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const tileIndex = data[row * width + col];
                this.houseLayer.putTileAt(tileIndex, startX + col, startY + row);
            }
        }
    }

    partitionMap() {
        const squareWidth = Math.floor(this.mapWidth / this.numHorizontalPartitions);
        const squareHeight = Math.floor(this.mapHeight / this.numVerticalPartitions);

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xFF0000, 1);
        graphics.setDepth(3);

        for (let x = 0; x <= this.mapWidth; x += squareWidth) {
            graphics.beginPath();
            graphics.moveTo(x * this.TILESIZE * this.SCALE, 0);
            graphics.lineTo(x * this.TILESIZE * this.SCALE, this.mapHeight * this.TILESIZE * this.SCALE);
            graphics.strokePath();
        }

        for (let y = 0; y <= this.mapHeight; y += squareHeight) {
            graphics.beginPath();
            graphics.moveTo(0, y * this.TILESIZE * this.SCALE);
            graphics.lineTo(this.mapWidth * this.TILESIZE * this.SCALE, y * this.TILESIZE * this.SCALE);
            graphics.strokePath();
        }
    }
    
    saveMapAsImage() {
        this.game.renderer.snapshot((image) => {
            const link = document.createElement('a');
            link.href = image.src;
            link.download = 'maps/map.png';
            link.click();
        });
    }

    information (numExports) {
        for (let x = 0; x < numExports; x += 1) {
            saveMapAsImage();
            exportLandmarks(clusterDescriptions);
        }
    }
}

function updateLandmarks(clusterDescriptions) {
    const landmarksDiv = document.getElementById('landmarks');
    landmarksDiv.innerHTML = "";

    const exportButton = document.createElement('button');
    exportButton.textContent = "Export Landmarks";
    exportButton.onclick = () => exportLandmarks(clusterDescriptions);
    landmarksDiv.appendChild(exportButton);

    clusterDescriptions.forEach(({ topLeft, bottomRight, description }) => {
        const div = document.createElement('div');
        div.className = 'landmark';
        div.innerHTML = `
            <strong>${description}:</strong>
            <br>[(${topLeft.x}, ${topLeft.y}), (${bottomRight.x}, ${bottomRight.y})]
        `;
        landmarksDiv.appendChild(div);
    });
}

function exportLandmarks(clusterDescriptions) {
    // Create a string to store all the landmark data
    let landmarksText = "Landmarks:\n\n";

    clusterDescriptions.forEach(({ topLeft, bottomRight, description }) => {
        landmarksText += `Description: ${description}\n`;
        landmarksText += `Top-Left: (${topLeft.x}, ${topLeft.y})\n`;
        landmarksText += `Bottom-Right: (${bottomRight.x}, ${bottomRight.y})\n\n`;
    });

    // Create a Blob from the text
    const blob = new Blob([landmarksText], { type: 'text/plain' });

    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'landmarks.txt';

    // Simulate a click to trigger the download
    link.click();

    // Clean up the URL object
    URL.revokeObjectURL(link.href);
}