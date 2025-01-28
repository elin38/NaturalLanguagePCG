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
            console.log("saving");
            this.saveMultipleMapsAsZip(10);
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
            // "regen": () => this.generateStructures(housePresets, fencePresets, forestPresets),
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

        // Fill the array with tile index 0
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const noiseValue = noise.simplex2(x / 10, y / 10);
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
    
    saveMapAsImage(route) {
        this.game.renderer.snapshot((image) => {
            const link = document.createElement('a');
            link.href = image.src;
            link.download = route;
            link.click();
        });
    }

    saveLandmarks(route) {
        const landmarksDiv = document.getElementById('landmarks');
            if (!landmarksDiv || landmarksDiv.innerText.trim() === "") {
            console.log("No landmarks to save.");
            return;
        }
        const landmarksText = landmarksDiv.innerText;
        const blob = new Blob([landmarksText], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = route;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    saveMultipleMapsAsZip(numMaps = 10) {
        const parentZip = new JSZip();
    
        // Get the structure presets
        const housePresets = Object.values(this.cache.json.get("HouseData"));
        const fencePresets = Object.values(this.cache.json.get("FenceData"));
        const forestPresets = Object.values(this.cache.json.get("ForestData"));
    
        // Helper function to delay execution
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
        const createSingleMapFolder = async (index) => {
            const mapFolder = parentZip.folder(`Map_${index + 1}`); // Create a folder for each map
    
            // Regenerate the map
            this.generateStructures(housePresets, fencePresets, forestPresets);
    
            // Delay to allow Phaser to render updates
            await delay(100);
    
            // Capture the map image and add it to the folder
            await new Promise((resolve) => {
                this.game.renderer.snapshot((image) => {
                    const imgData = image.src.split(",")[1]; // Get base64 data
                    mapFolder.file(`map_${index + 1}.png`, imgData, { base64: true });
                    resolve();
                });
            });
    
            // Add landmarks text to the folder
            const landmarksDiv = document.getElementById("landmarks");
            if (landmarksDiv && landmarksDiv.innerText.trim() !== "") {
                const landmarksText = landmarksDiv.innerText;
                mapFolder.file(`landmarks_${index + 1}.txt`, landmarksText);
            }
        };
    
        // Create all the map folders sequentially
        const createAllMaps = async () => {
            for (let i = 0; i < numMaps; i++) {
                await createSingleMapFolder(i);
            }
    
            // Generate the parent ZIP and trigger download
            const finalContent = await parentZip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(finalContent);
            link.download = "all_maps.zip";
            link.click();
            URL.revokeObjectURL(link.href);
        };
    
        createAllMaps();
    }
}

function updateLandmarks(clusterDescriptions) {
    const landmarksDiv = document.getElementById('landmarks');
    landmarksDiv.innerHTML = "";

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