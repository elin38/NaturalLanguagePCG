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

        // Group house tiles into clusters and draw bounding boxes
        const houseClusters = groupHouseTiles(houseLocations, this.housesLayer.layer.width);

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

// Extract house tile indices
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
}
