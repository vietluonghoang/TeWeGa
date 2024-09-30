// Constants for grid size
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30; // Optional: Adjust for visual size

// Tetrimino shapes and rotations
const shapes = [
    [[1, 1, 1, 1]], // I-shape
    [[1, 1], [1, 1]], // O-shape
    [[0, 1, 0], [1, 1, 1]], // T-shape
    [[1, 1, 0], [0, 1, 1]], // S-shape
    [[0, 1, 1], [1, 1, 0]], // Z-shape
    [[1, 0, 0], [1, 1, 1]], // L-shape
    [[0, 0, 1], [1, 1, 1]], // J-shape
];

let grid = [];
let currentShape;
let gameInterval;
let isGameOver = false;

// Helper function to create the grid
function createGrid() {
    grid = [];
    const playboard = document.getElementById('playboard');
    playboard.innerHTML = ''; // Clear previous cells

    for (let row = 0; row < ROWS; row++) {
        const gridRow = [];
        for (let col = 0; col < COLS; col++) {
            gridRow.push(0);
            const cell = document.createElement('div');
            cell.id = `cell-${row}-${col}`;
            cell.style.width = `${CELL_SIZE}px`;
            cell.style.height = `${CELL_SIZE}px`;
            cell.classList.add('cell');
            playboard.appendChild(cell);
        }
        grid.push(gridRow);
    }
}

// Function to spawn a new shape
function spawnShape() {
    const randomIndex = Math.floor(Math.random() * shapes.length);
    currentShape = {
        shape: shapes[randomIndex],
        position: { x: Math.floor(COLS / 2) - 1, y: -1 } // Start just above the grid
    };
    drawShape(); // Draw the shape immediately after spawning
}

// Check if the shape can move to a new position
function canMove(newX, newY) {
    return currentShape.shape.every((row, y) => {
        return row.every((cell, x) => {
            if (cell === 0) {
                return true; // Ignore empty cells
            }

            const posX = newX + x;
            const posY = newY + y;

            // Allow movement if shape is above the grid
            if (posY < 0) {
                return true;
            }

            // Check if it's within grid bounds and not overlapping a locked shape
            if (posX >= 0 && posX < COLS && posY >= 0 && posY < ROWS) {
                return grid[posY][posX] === 0;
            }

            // Prevent out of bounds or collision
            return false;
        });
    });
}

// Draw the current shape on the grid
function drawShape() {
    currentShape.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const posX = currentShape.position.x + x;
                const posY = currentShape.position.y + y;

                if (posY >= 0 && posY < ROWS && posX >= 0 && posX < COLS) {
                    const cellElement = document.getElementById(`cell-${posY}-${posX}`);
                    if (cellElement) {
                        cellElement.classList.add('filled');
                        cellElement.style.backgroundColor = 'black'; // Set the color of the shape here
                    }
                }
            }
        });
    });
}

// Clear the current shape from the grid
function clearShape() {
    currentShape.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const posX = currentShape.position.x + x;
                const posY = currentShape.position.y + y;

                if (posY >= 0 && posY < ROWS && posX >= 0 && posX < COLS) {
                    const cellElement = document.getElementById(`cell-${posY}-${posX}`);
                    if (cellElement) {
                        cellElement.classList.remove('filled');
                        cellElement.style.backgroundColor = ''; // Reset the background color
                    }
                }
            }
        });
    });
}

// Lock the shape in place on the grid
function lockShape() {
    currentShape.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const posX = currentShape.position.x + x;
                const posY = currentShape.position.y + y;
                if (posY >= 0 && posY < ROWS && posX >= 0 && posX < COLS) {
                    grid[posY][posX] = 1;
                }
            }
        });
    });
}

// Move the shape
function moveShape(dx, dy) {
    if (canMove(currentShape.position.x + dx, currentShape.position.y + dy)) {
        clearShape();
        currentShape.position.x += dx;
        currentShape.position.y += dy;
        drawShape();
    }
}

// Rotate the shape
function rotateShape() {
    const oldShape = currentShape.shape; // Store the old shape
    const newShape = currentShape.shape[0].map((_, index) => currentShape.shape.map(row => row[index])).reverse();

    // Clear the shape from the grid
    clearShape();

    currentShape.shape = newShape; // Set the new shape

    // Check if the new position is valid
    if (!canMove(currentShape.position.x, currentShape.position.y)) {
        currentShape.shape = oldShape; // Revert to the old shape if rotation is invalid
    }

    // Draw the shape in its new orientation if valid
    drawShape();
}


// Check for and clear any full rows
// Check for and clear any full rows
function clearRows() {
    const rowsToClear = [];
    
    // Identify which rows are full
    for (let row = 0; row < ROWS; row++) {
        if (grid[row].every(cell => cell === 1)) {
            rowsToClear.push(row);
        }
    }

    // Clear the identified rows and shift down the rows above
    for (const row of rowsToClear) {
        // Remove the full row from the grid
        grid.splice(row, 1);
        // Add a new empty row at the top
        grid.unshift(new Array(COLS).fill(0));

        // Update DOM to reflect the cleared row
        for (let col = 0; col < COLS; col++) {
            const cellElement = document.getElementById(`cell-${row}-${col}`);
            if (cellElement) {
                cellElement.classList.remove('filled');
                cellElement.style.backgroundColor = ''; // Reset the background color
            }
        }
    }

    // Redraw the entire grid to reflect the current state
    redrawGrid();
}


// Redraw the grid based on the current state of the grid array
function redrawGrid() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cellElement = document.getElementById(`cell-${row}-${col}`);
            if (cellElement) {
                if (grid[row][col] === 1) {
                    cellElement.classList.add('filled');
                    cellElement.style.backgroundColor = 'black'; // Set the color of the filled cell
                } else {
                    cellElement.classList.remove('filled');
                    cellElement.style.backgroundColor = ''; // Reset the background color for empty cells
                }
            }
        }
    }
}

// End game check and logic
function checkGameOver() {
    if (grid[0].some(cell => cell === 1)) {
        clearInterval(gameInterval); // Stop the game loop
        document.getElementById('game-over').style.display = 'block'; // Show game over popup
        isGameOver = true;
    }
}

// Game loop: move shape down and check for locking
function gameLoop() {
    if (isGameOver) return;

    if (canMove(currentShape.position.x, currentShape.position.y + 1)) {
        moveShape(0, 1);
    } else {
        lockShape();
        clearRows();
        checkGameOver();
        if (!isGameOver) {
            spawnShape(); // Spawn a new shape if game is not over
        }
    }
}

// Event listener for controls
document.addEventListener('keydown', (event) => {
    if (isGameOver) return;

    switch (event.key) {
        case 'ArrowLeft':
            moveShape(-1, 0);
            break;
        case 'ArrowRight':
            moveShape(1, 0);
            break;
        case 'ArrowDown':
            moveShape(0, 1);
            break;
        case ' ':
            rotateShape();
            break;
    }
});

// Initialize the game
function startGame() {
    isGameOver = false;
    document.getElementById('game-over').style.display = 'none';
    createGrid();
    spawnShape();
    drawShape();
    gameInterval = setInterval(gameLoop, 500); // Shape moves every 500ms
}

// Retry button click event
document.getElementById('retry-btn').addEventListener('click', startGame);

// Start the game on page load
startGame();
