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
        this.TILESIZE = 16; // Adjust based on your tileset's native tile size
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;
        this.mapHeight = 24;
        this.mapWidth = 40;

        // Specify the number of partitions
        this.numHorizontalPartitions = 4; // Number of horizontal squares
        this.numVerticalPartitions = 4;   // Number of vertical squares
    }

    create() {
        this.generateGrass();
        this.partitionMap(); // Partition the map into specified dimensions
        this.createInputBox();

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
        this.houseLayer.setScale(this.SCALE); // Scale the layer if needed
        this.houseLayer.setDepth(2);

        // Load house data from JSON (cached after preload)
        var HousePreset = this.cache.json.get('HouseData');
        var FencePreset = this.cache.json.get('FenceData');
        var ForestPreset = this.cache.json.get('ForestData');

        console.log('This is house preset', HousePreset);

        // Example: Generate house1 at position (5, 5)
        this.generate(HousePreset.house1, 2, 2);
        this.generate(HousePreset.house2, 13, 2);
        this.generate(HousePreset.house3, 13, 13);
        this.generate(HousePreset.house4, 3, 12);

        this.generate(FencePreset.Fence1, 23, 20);
        this.generate(FencePreset.Fence2, 13, 18);
        this.generate(FencePreset.Fence3, 3, 20);

        this.generate(ForestPreset.Forest1, 2, 6);
        this.generate(ForestPreset.Forest2, 12, 6);

        const layerData = this.houseLayer.layer.data.flat().map(tile => tile.index); // Flatten 2D array and extract tile indexes
        const houseLocations = extractHouses(layerData, this.houseLayer.layer.width);

        console.log(houseLocations);

        // Group house tiles into clusters and draw bounding boxes
        const houseClusters = groupHouseTiles(houseLocations, this.houseLayer.layer.width);

        const clusterDescriptions = houseClusters.map(cluster => {
            const topLeft = {
                x: Math.min(...cluster.map(tile => tile.x)),
                y: Math.min(...cluster.map(tile => tile.y))
            };
            const bottomRight = {
                x: Math.max(...cluster.map(tile => tile.x)),
                y: Math.max(...cluster.map(tile => tile.y))
            };
            return {
                topLeft,
                bottomRight,
                description: "A House" // Placeholder description
            };
        });
    
        // Update landmarks div
        updateLandmarks(clusterDescriptions);

        houseClusters.forEach(cluster => {
            drawBoundingBox(this, cluster);
        });

        this.input.keyboard.on("keydown-E", () => {
            this.scene.start("extractScene"); // Switch to another scene
        });
        this.input.keyboard.on("keydown-R", () => {
            this.scene.start("TileLabelScene"); // Switch to another scene
        });

        
    }

    createInputBox() {
        // const inputBox = this.add.dom(0, 0).createFromHTML(`
        //     <input type="text" id="inputText" placeholder="Type something..." />
        //     <button id="submitText">Submit</button>
        // `);
    
        const inputText = document.getElementById('inputText');
        const submitButton = document.getElementById('submitText');
    
        // Add an event listener for when the user submits text
        submitButton.addEventListener('click', () => {
            const text = inputText.value;
            this.sendTextToLLM(text);
        });
    }
    

    generateGrass() {
        const Grass = [];

        // Fill the array with tile index 0
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const noiseValue = noise.simplex2(x / this.sampleScale, y / this.sampleScale);
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
        this.layer.setDepth(1);
    }

    generate(info, startX, startY) {
        const width = info.width; // House width in tiles
        const height = info.height; // House height in tiles
        const data = info.data; // Array of tile indices for the house
    
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const tileIndex = data[row * width + col];
                this.houseLayer.putTileAt(tileIndex, startX + col, startY + row);
            }
        }
    }    

    partitionMap() {
        // Calculate the size of each partition dynamically
        const squareWidth = Math.floor(this.mapWidth / this.numHorizontalPartitions);
        const squareHeight = Math.floor(this.mapHeight / this.numVerticalPartitions);

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xFF0000, 1); // Red lines for the grid
        graphics.setDepth(3);

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


// Extract house tile indices
function extractHouses(layerData, layerWidth) {
    const houseTileNumbers = [
        48, 49, 50, 51, 52, 53, 54, 55,
        60, 61, 62, 63, 64, 65, 66, 67,
        72, 73, 74, 75, 76, 77, 78, 79,
        84, 85, 86, 87, 88, 89, 90, 91,
        96, 97, 98, 99, 100, 101, 102,
        108, 109, 110, 111, 112, 113, 114,
        120, 121, 122, 123, 124, 125, 126
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

// Group connected house tiles into clusters
function groupHouseTiles(houseLocations, layerWidth) {
    const visited = new Set();
    const clusters = [];

    const isNeighbor = (a, b) => 
        (a.x === b.x && Math.abs(a.y - b.y) === 1) || 
        (a.y === b.y && Math.abs(a.x - b.x) === 1);

    const floodFill = (startTile) => {
        const cluster = [];
        const stack = [startTile];

        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.x},${current.y}`;
            if (visited.has(key)) continue;

            visited.add(key);
            cluster.push(current);

            houseLocations.forEach(tile => {
                const tileKey = `${tile.x},${tile.y}`;
                if (!visited.has(tileKey) && isNeighbor(current, tile)) {
                    stack.push(tile);
                }
            });
        }

        return cluster;
    };

    houseLocations.forEach(tile => {
        const key = `${tile.x},${tile.y}`;
        if (!visited.has(key)) {
            clusters.push(floodFill(tile));
        }
    });

    return clusters;
}

function updateLandmarks(clusterDescriptions) {
    const landmarksDiv = document.getElementById('landmarks');
    landmarksDiv.innerHTML = ""; // Clear previous content

    clusterDescriptions.forEach(({ topLeft, bottomRight, description }, index) => {
        const div = document.createElement('div');
        div.className = 'landmark';
        div.innerHTML = `
            <strong>House ${index + 1}:</strong>
            <br>[(${topLeft.x}, ${topLeft.y}), (${bottomRight.x}, ${bottomRight.y})]
            <br>Description: ${description}
        `;
        landmarksDiv.appendChild(div);
    });
}


// Draw a bounding box around a cluster of house tiles
function drawBoundingBox(scene, cluster) {
    const minX = Math.min(...cluster.map(tile => tile.x)) * scene.TILESIZE;
    const minY = Math.min(...cluster.map(tile => tile.y)) * scene.TILESIZE;
    const maxX = (Math.max(...cluster.map(tile => tile.x)) + 1) * scene.TILESIZE;
    const maxY = (Math.max(...cluster.map(tile => tile.y)) + 1) * scene.TILESIZE;

    const graphics = scene.add.graphics();
    graphics.lineStyle(2, 0x00ff00, 1);
    graphics.strokeRect(minX, minY, maxX - minX, maxY - minY);

    graphics.setDepth(4);
    graphics.setScale(2.0);
}
