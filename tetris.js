const playboard = document.getElementById('playboard');
const gameOverPopup = document.getElementById('game-over-popup');
const retryButton = document.getElementById('retry-button');

const ROWS = 20;
const COLS = 10;
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let currentShape = null;
let gameInterval = null;
let isGameOver = false;

// Define the 7 Tetrimino shapes
const SHAPES = [
    // I-shape
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J-shape
    [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    // L-shape
    [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    // O-shape
    [
        [1, 1],
        [1, 1]
    ],
    // S-shape
    [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    // T-shape
    [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    // Z-shape
    [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
];

// Initialize the game
function init() {
    createGrid();
    spawnShape();
    gameInterval = setInterval(moveShapeDown, 500); // Moves down 2 cells every second
}

// Create the playboard grid in the DOM
function createGrid() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            playboard.appendChild(cell);
        }
    }
}

// Spawn a random Tetrimino shape
function spawnShape() {
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    currentShape = {
        shape: randomShape,
        position: { x: Math.floor(COLS / 2) - Math.floor(randomShape[0].length / 2), y: 0 } // Spawn at the top
    };
    drawShape();
}

// Move the shape down
function moveShapeDown() {
    if (!canMoveDown()) {
        lockShape();
        spawnShape();
        return;
    }
    currentShape.position.y += 1;
    drawShape();
}

// Check if shape can move down
function canMoveDown() {
    return currentShape.shape.every((row, y) => {
        return row.every((cell, x) => {
            if (cell === 1) {
                const newX = currentShape.position.x + x;
                const newY = currentShape.position.y + y + 1;
                
                // Check if out of bounds or blocked
                if (newY >= ROWS || grid[newY][newX]) {
                    return false;
                }
            }
            return true;
        });
    });
}

function moveShape(direction) {
    const newPosition = currentShape.position.x + direction;

    // Check if the shape can move in the desired direction
    if (canMove(newPosition)) {
        currentShape.position.x = newPosition;
        drawShape();
    }
}

function canMove(newPosition) {
    return currentShape.shape.every((row, y) => {
        return row.every((cell, x) => {
            if (cell === 1) {
                const newX = newPosition + x;
                const newY = currentShape.position.y + y;

                // Check if the new position is within the grid bounds and not blocked
                if (newX < 0 || newX >= COLS || grid[newY] && grid[newY][newX]) {
                    return false;
                }
            }
            return true;
        });
    });
}

function rotateShape() {
    const newShape = currentShape.shape[0].map((val, index) =>
        currentShape.shape.map(row => row[index]).reverse()
    );

    // Check if the rotated shape will fit inside the grid
    if (canRotate(newShape)) {
        currentShape.shape = newShape;
        drawShape();
    }
}

function canRotate(newShape) {
    return newShape.every((row, y) => {
        return row.every((cell, x) => {
            if (cell === 1) {
                const newX = currentShape.position.x + x;
                const newY = currentShape.position.y + y;

                // Check if the new shape is within bounds and not colliding
                if (newX < 0 || newX >= COLS || newY >= ROWS || (grid[newY] && grid[newY][newX])) {
                    return false;
                }
            }
            return true;
        });
    });
}

// Lock the shape in place and reset for the next shape
function lockShape() {
    currentShape.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const posX = currentShape.position.x + x;
                const posY = currentShape.position.y + y;
                if (posY >= 0) {
                    grid[posY][posX] = 1; // Mark the grid as occupied
                }
            }
        });
    });
    drawLockedShapes(); // Draw all locked shapes on the grid
    checkForClearRows(); // Check if any rows should be cleared
    spawnShape(); // Spawn the next shape
}


// Check for any filled rows and clear them
function checkForClearRows() {
    // This will be implemented to clear full rows
}

// Draw the shape on the grid
function drawShape() {
    clearGrid();
    
    currentShape.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const posX = currentShape.position.x + x;
                const posY = currentShape.position.y + y;

                if (posY >= 0) { // Don't draw outside the visible grid
                    const cellDiv = playboard.children[posY * COLS + posX];
                    cellDiv.style.backgroundColor = 'blue'; // Color the Tetrimino
                }
            }
        });
    });
}

function drawLockedShapes() {
    grid.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const cellDiv = playboard.children[y * COLS + x];
                cellDiv.style.backgroundColor = 'gray'; // Color locked shapes
            }
        });
    });
}

// Clear the grid for redrawing
function clearGrid() {
    const cells = playboard.querySelectorAll('div');
    cells.forEach(cell => {
        cell.style.backgroundColor = 'transparent';
    });
}

// Show game over popup (not used yet)
function showGameOverPopup() {
    gameOverPopup.style.visibility = 'visible';
}

// Handle retry button click (not used yet)
retryButton.addEventListener('click', () => {
    gameOverPopup.style.visibility = 'hidden';
    resetGame();
});

// Reset the game
function resetGame() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    clearGrid();
    isGameOver = false;
    spawnShape();
    gameInterval = setInterval(moveShapeDown, 500);
}

// Keydown event listener for arrow keys and space bar
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        moveShape(-1); // Move left
    } else if (event.key === 'ArrowRight') {
        moveShape(1); // Move right
    } else if (event.key === 'ArrowDown') {
        moveShapeDown(); // Move down faster
    } else if (event.key === ' ') {
        rotateShape(); // Rotate the shape
    }
});


init();
