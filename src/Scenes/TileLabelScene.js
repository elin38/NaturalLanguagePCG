class TileLabelScene extends Phaser.Scene {
    constructor() {
        super("TileLabelScene");
    }

    preload() {
        this.load.path = "./assets/";
        this.load.image("tinytown-tileset", "tilemap_packed.png");
    }

    create() {
        const TILESIZE = 16; // Size of a single tile in the tileset
        const SCALE = 4.0; // Scale for better visibility
        const ROWS = 11; // Number of rows in your tileset
        const COLS = 12; // Number of columns in your tileset
        const TOTAL_TILES = ROWS * COLS;

        // Add the tileset as a static image
        const tilesetImage = this.add.image(0, 0, "tinytown-tileset");
        tilesetImage.setOrigin(0, 0);
        tilesetImage.setScale(SCALE);

        // Add labels for each tile index
        const textStyle = {
            fontSize: "12px",
            fill: "#ffffff",
            backgroundColor: "#000000",
            align: "center",
        };

        for (let i = 0; i < TOTAL_TILES; i++) {
            const row = Math.floor(i / COLS);
            const col = i % COLS;

            const x = col * TILESIZE * SCALE + TILESIZE * SCALE / 2;
            const y = row * TILESIZE * SCALE + TILESIZE * SCALE / 2;

            this.add.text(x, y, `${i}`, textStyle)
                .setOrigin(0.5, 0.5)
                .setDepth(1); // Place above tileset
        }

        // Optionally allow returning to another scene by pressing a key
        this.input.keyboard.on("keydown-ESC", () => {
            this.scene.start("TinyTownGen"); // Switch back to the main scene
        });
    }
}
