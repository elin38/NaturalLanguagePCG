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

        noise.seed(Math.random());

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
        // Reset counters before generating a new map
        this.houseCount = 0;
        this.fenceCount = 0;
        this.forestCount = 0;
    
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

                switch (structureType) {
                    case 0:
                        preset = Phaser.Utils.Array.GetRandom(housePresets);
                        itemCount = ++this.houseCount;
                        break;
                    case 1:
                        preset = Phaser.Utils.Array.GetRandom(fencePresets);
                        itemCount = ++this.fenceCount;
                        break;
                    case 2:
                        preset = Phaser.Utils.Array.GetRandom(forestPresets);
                        itemCount = ++this.forestCount;
                        break;
                }

                description = {presetCode: preset.name, textDescription: ""};

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
                        description: description,
                    });
                }
            }
        }
        updateDescriptiveText(clusterDescriptions);
        updateLandmarks(clusterDescriptions);
        // this.input.keyboard.on("keydown-E", () => {
        //     this.scene.start("extractScene");
        // });
        // this.input.keyboard.on("keydown-R", () => {
        //     this.scene.start("TileLabelScene");
        // });
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
            <strong>${description.presetCode}:</strong> <i>${description.textDescription}</i>
            <br>[(${topLeft.x}, ${topLeft.y}), (${bottomRight.x}, ${bottomRight.y})]
        `;
        landmarksDiv.appendChild(div);
    });
}

function updateDescriptiveText(clusterDescriptions) {
    let englishIdList = [];
    for(quadrent of clusterDescriptions) {
        let descriptionText = "";
        let currentCode = quadrent.description.presetCode
        switch (currentCode.slice(0,2)) {
            case "Ho":
                descriptionText += "House";
                switch (Number(currentCode[currentCode.length - 1])) {
                    case 1:
                        descriptionText += ", 1 story house, House with grey roof, House with orange wood walls, House with 1 chimney, Skinny house, House with 1 door, House with 0 windows"
                        englishIdList.push("Grey roofed 1 story Skinny House");
                        break;
                    case 2:
                        descriptionText += ", 1 story house, House with orange roof, House with grey stone walls, House with 1 chimney, Skinny house, House with 1 door, House with 0 windows"
                        englishIdList.push("Orange roofed 1 story Skinny House");
                        break;
                    case 3:
                        descriptionText += ", 1 story house, House with grey roof, House with orange wood walls, House with 2 chimneys, Wide house, House with 1 door, house with 1 window"
                        englishIdList.push("Grey roofed 1 story Wide House");
                        break;
                    case 4:
                        descriptionText += ", 4 story house, House with orange roof, House with grey stone walls, House with 2 chimneys, Skinny house, House with 2 doors, House with 2 windows"
                        englishIdList.push("Orange roofed 4 story Skinny House");
                        break;
                    case 5:
                        descriptionText += ", 2 story house, House with orange roof, House with grey stone walls, House with 2 chimneys, Wide house, House with 1 door, House with 2 windows"
                        englishIdList.push("Orange roofed 2 story Wide House");
                        break;
                    case 6:
                        descriptionText += ", 2 story house, House with orange roof, House with grey stone walls, House with 1 chimney, Skinny house, House with 1 door, House with 1 window"
                        englishIdList.push("Orange roofed 2 story Skinny House");
                        break;
                    case 7:
                        descriptionText += ", 2 story house, House with grey roof, House with orange wood walls, House with 1 chimney, Skinny house, House with 1 door, House with 1 window"
                        englishIdList.push("Grey roofed 2 story Skinny House");
                        break;
                }
                break;
            case "Fe":
                descriptionText += "Fenced Area";
                switch (Number(currentCode[currentCode.length - 1])) {
                    case 1:
                        descriptionText += ", Square fence, 3 by 3 fence, 1 fenced in tile, Small fenced area, Fence with centered entrance"
                        englishIdList.push("3x3 Fenced Area with a centered entrance");
                        break;
                    case 2:
                        descriptionText += ", Square fence, 5 by 5 fence, 9 fenced in tiles, Medium fenced area, Fence with centered entrance"
                        englishIdList.push("5x5 Fenced Area with a centered entrance");
                        break;
                    case 3:
                        descriptionText += ", Rectangular fence, 3 by 5 fence, 3 fenced in tiles, small fenced area, Wide fence, Fence with centered entrance"
                        englishIdList.push("3x5 Fenced Area with a centered entrance");
                        break;
                    case 4:
                        descriptionText += ", Rectangular fence, 4 by 7 fence, 10 fenced in tiles, Medium fenced area, Wide fence, Fence with left entrance"
                        englishIdList.push("4x7 Fenced Area with a left entrance");
                        break;
                    case 5:
                        descriptionText += ", Rectangular fence, 4 by 7 fence, 10 fenced in tiles, Medium fenced area, Wide fence, Fence with right entrance"
                        englishIdList.push("4x7 Fenced Area with a right entrance");
                        break;
                    case 6:
                        descriptionText += ", Rectangular fence, 5 by 6 fence, 12 fenced in tiles, Large fenced area, Wide fence, Fence with right entrance"
                        englishIdList.push("5x6 Fenced Area with a right entrance");
                        break;
                    case 7:
                        descriptionText += ", Rectangular fence, 5 by 6 fence, 12 fenced in tile, Large fenced area, Wide fence, Fence with right entrance"
                        englishIdList.push("5x6 Fenced Area with a right entrance");
                        break;
                    case 8:
                        descriptionText += ", Rectangular fence, 5 by 6 fence, 12 fenced in tiles, Large fenced area, Wide fence, Fence with left entrance"
                        englishIdList.push("5x6 Fenced Area with a left entrance");
                        break;
                    case 9:
                        descriptionText += ", Rectangular fence, 6 by 5 fence, 12 fenced in tiles, Large fenced area, Tall fence, Fence with left entrance"
                        englishIdList.push("6x5 Fenced Area with a left entrance");
                        break;
                    case 0:
                        descriptionText += ", Rectangular fence, 6 by 5 fence, 12 fenced in tiles, Large fenced area, Tall fence, Fence with right entrance"
                        englishIdList.push("6x5 Fenced Area with a right entrance");
                        break;
                }    
                break;
            case "Fo":
                descriptionText += "Forest";
                switch (Number(currentCode[currentCode.length - 1])) {
                    case 1:
                        descriptionText += ", Forest with 2 mushrooms, Mostly green forest, Forest with 0 beehives, Small forest"
                        englishIdList.push("Small Green Forest");
                        break;
                    case 2:
                        descriptionText += ", Forest with 1 mushroom, Mostly yellow forest, Forest with 1 beehive, Small forest"
                        englishIdList.push("Small Yellow Forest");
                        break;
                    case 3:
                        descriptionText += ", Forest with 4 mushrooms, Mostly green forest, Forest with 0 beehives, Medium forest"
                        englishIdList.push("Medium Green Forest");
                        break;
                    case 4:
                        descriptionText += ", Forest with 3 mushrooms, Mostly yellow forest, Forest with 1 beehive, Medium forest"
                        englishIdList.push("Medium Yellow Forest");
                        break;
                    case 5:
                        descriptionText += ", Forest with 5 mushrooms, Mostly green forest, Forest with 1 beehive, Large Forest"
                        englishIdList.push("Large Green Forest");
                        break;
                }
                break;
        }
        quadrent.description.textDescription = descriptionText;
    }

    for(let i = 0; i < clusterDescriptions.length; i++) {
        let currentDescription = clusterDescriptions[i].description.textDescription
        if (i - 1 > 0) { //Left
            currentDescription += ", " + englishIdList[i] + " with a " + englishIdList[i - 1] + " to the left"
        }   
        if (i + 1 < clusterDescriptions.length) { //Right
            currentDescription += ", " + englishIdList[i] + " with a " + englishIdList[i + 1] + " to the right"

        }
        if (i - 4 > 0) { //Above
            currentDescription += ", " + englishIdList[i] + " with a " + englishIdList[i - 4] + " above it"
        }
        if (i + 4 < clusterDescriptions.length) { //Below
            currentDescription += ", " + englishIdList[i] + " with a " + englishIdList[i + 4] + " below it"
        }
        clusterDescriptions[i].description.textDescription = currentDescription;
    }
}
