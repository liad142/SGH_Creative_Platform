/**
 * Isometric Projection Math Utilities
 * 
 * Standard isometric projection uses a 2:1 tile ratio.
 * TILE_WIDTH and TILE_HEIGHT define the diamond tile dimensions.
 */

// Constants for standard isometric projection
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// Grid dimensions (number of tiles)
export const GRID_SIZE_X = 10;
export const GRID_SIZE_Y = 10;

/**
 * Convert 3D grid coordinates to 2D screen position
 * @param {number} gridX - X position on the grid (0 to GRID_SIZE_X)
 * @param {number} gridY - Y position on the grid (0 to GRID_SIZE_Y)
 * @param {number} gridZ - Z (height/elevation) position (default 0)
 * @returns {{ screenX: number, screenY: number }} Screen pixel coordinates
 */
export const gridToScreen = (gridX, gridY, gridZ = 0) => {
    const screenX = (gridX - gridY) * (TILE_WIDTH / 2);
    const screenY = (gridX + gridY) * (TILE_HEIGHT / 2) - (gridZ * TILE_HEIGHT);
    return { screenX, screenY };
};

/**
 * Convert 2D screen position back to 3D grid coordinates
 * Used for mouse hit detection and drag-drop snapping
 * @param {number} screenX - X pixel position
 * @param {number} screenY - Y pixel position
 * @param {number} gridZ - Known Z level (default 0 for floor)
 * @returns {{ gridX: number, gridY: number }} Grid coordinates (may need rounding)
 */
export const screenToGrid = (screenX, screenY, gridZ = 0) => {
    // Adjust screenY to compensate for Z offset
    const adjustedY = screenY + (gridZ * TILE_HEIGHT);

    // Inverse of the isometric projection formula
    const gridX = (screenX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2;
    const gridY = (adjustedY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2;

    return { gridX, gridY };
};

/**
 * Snap screen coordinates to the nearest valid grid position
 * @param {number} screenX - Raw screen X
 * @param {number} screenY - Raw screen Y
 * @param {number} gridZ - Z level
 * @returns {{ gridX: number, gridY: number, screenX: number, screenY: number }}
 */
export const snapToGrid = (screenX, screenY, gridZ = 0) => {
    const { gridX, gridY } = screenToGrid(screenX, screenY, gridZ);

    // Round to nearest integer grid position
    const snappedGridX = Math.round(gridX);
    const snappedGridY = Math.round(gridY);

    // Clamp to valid grid bounds
    const clampedX = Math.max(0, Math.min(GRID_SIZE_X - 1, snappedGridX));
    const clampedY = Math.max(0, Math.min(GRID_SIZE_Y - 1, snappedGridY));

    // Convert back to screen coordinates
    const snappedScreen = gridToScreen(clampedX, clampedY, gridZ);

    return {
        gridX: clampedX,
        gridY: clampedY,
        screenX: snappedScreen.screenX,
        screenY: snappedScreen.screenY
    };
};

/**
 * Calculate the z-index for proper depth sorting
 * Items with higher gridX + gridY appear in front (larger z-index)
 * @param {number} gridX 
 * @param {number} gridY 
 * @param {number} gridZ 
 * @returns {number} CSS z-index value
 */
export const calculateZIndex = (gridX, gridY, gridZ = 0) => {
    // Base z-index ensures floor tiles are behind assets
    const BASE_Z = 100;
    return BASE_Z + gridX + gridY + gridZ;
};

/**
 * Generate the floor tile grid positions
 * @returns {Array<{ x: number, y: number, screenX: number, screenY: number, zIndex: number }>}
 */
export const generateFloorGrid = () => {
    const tiles = [];

    for (let x = 0; x < GRID_SIZE_X; x++) {
        for (let y = 0; y < GRID_SIZE_Y; y++) {
            const { screenX, screenY } = gridToScreen(x, y, 0);
            tiles.push({
                x,
                y,
                screenX,
                screenY,
                zIndex: x + y // Floor tiles have base z-index
            });
        }
    }

    return tiles;
};

/**
 * Calculate the container dimensions needed to fit the entire isometric grid
 * @returns {{ width: number, height: number, offsetX: number, offsetY: number }}
 */
export const getGridContainerDimensions = () => {
    // Calculate the extreme points of the grid
    const topLeft = gridToScreen(0, GRID_SIZE_Y - 1, 0);
    const topRight = gridToScreen(GRID_SIZE_X - 1, 0, 0);
    const bottomLeft = gridToScreen(0, 0, 0);
    const bottomRight = gridToScreen(GRID_SIZE_X - 1, GRID_SIZE_Y - 1, 0);

    const minX = Math.min(topLeft.screenX, bottomLeft.screenX);
    const maxX = Math.max(topRight.screenX, bottomRight.screenX);
    const minY = Math.min(topRight.screenY, topLeft.screenY);
    const maxY = Math.max(bottomLeft.screenY, bottomRight.screenY);

    // Add padding for assets that extend above/below tiles
    const padding = 200;

    return {
        width: maxX - minX + TILE_WIDTH + padding * 2,
        height: maxY - minY + TILE_HEIGHT + padding * 2,
        offsetX: -minX + padding,
        offsetY: -minY + padding
    };
};
