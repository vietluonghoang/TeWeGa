// tetris.js
const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const infoFrame = document.getElementById('infoFrame');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const GRID_BORDER_WIDTH = 3;
const INFO_FRAME_BORDER_WIDTH = 2;

// Calculate new canvas size
const GRID_WIDTH = COLS * BLOCK_SIZE;
const GRID_HEIGHT = ROWS * BLOCK_SIZE;

// Set main canvas size
canvas.width = GRID_WIDTH;
canvas.height = GRID_HEIGHT;

// Set next piece and held piece canvas sizes
const nextPieceCanvas = document.getElementById('nextPieceCanvas');
const heldPieceCanvas = document.getElementById('heldPieceCanvas');
nextPieceCanvas.width = 150;
nextPieceCanvas.height = 150;
heldPieceCanvas.width = 150;
heldPieceCanvas.height = 150;

const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
];

const COLORS = ['cyan', 'yellow', 'purple', 'green', 'red', 'blue', 'orange'];

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece = null;
let score = 0;
let linesCleared = 0;  // New variable to track total lines cleared

const SHAPE_BORDER_COLOR = 'white';
const GRID_BORDER_COLOR = '#d0d0d0';

let lockDelay = 200; // 0.2 seconds
let lockTimer = 0;
let isLocking = false;
let flashCounter = 0;

let completedRows = [];
const ROW_CLEAR_DELAY = 200; // 500ms total delay before clearing rows
const FLASH_COUNT = 5; // Number of times to flash
let flashWhite = false; // New variable to track flash state

const DIFFICULTY_LEVELS = {
    EASY: { speed: 1000, score_multiplier: 1 },
    MEDIUM: { speed: 750, score_multiplier: 1.5 },
    HARD: { speed: 500, score_multiplier: 2 }
};

let currentDifficulty = DIFFICULTY_LEVELS.EASY;
let nextPiece = null;
let heldPiece = null;
let canHold = true;

// Modify the newPiece function
function newPiece() {
    if (!nextPiece) {
        nextPiece = generatePiece();
    }
    const piece = nextPiece;
    nextPiece = generatePiece();
    return piece;
}

function generatePiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[shapeIndex];
    return {
        shape: shape,
        color: COLORS[shapeIndex],
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: -shape.length,
        shapeIndex: shapeIndex
    };
}

// Add these new functions
function drawNextPiece() {
    const nextPieceCanvas = document.getElementById('nextPieceCanvas');
    const nextCtx = nextPieceCanvas.getContext('2d');
    nextCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

    // Center the piece in the canvas
    const offsetX = (nextPieceCanvas.width - nextPiece.shape[0].length * BLOCK_SIZE) / 2;
    const offsetY = (nextPieceCanvas.height - nextPiece.shape.length * BLOCK_SIZE) / 2;

    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                nextCtx.fillStyle = nextPiece.color;
                nextCtx.fillRect(offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                nextCtx.strokeStyle = SHAPE_BORDER_COLOR;
                nextCtx.strokeRect(offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function drawHeldPiece() {
    const heldPieceCanvas = document.getElementById('heldPieceCanvas');
    const heldCtx = heldPieceCanvas.getContext('2d');
    heldCtx.clearRect(0, 0, heldPieceCanvas.width, heldPieceCanvas.height);

    if (heldPiece) {
        // Center the piece in the canvas
        const offsetX = (heldPieceCanvas.width - heldPiece.shape[0].length * BLOCK_SIZE) / 2;
        const offsetY = (heldPieceCanvas.height - heldPiece.shape.length * BLOCK_SIZE) / 2;

        heldPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    heldCtx.fillStyle = heldPiece.color;
                    heldCtx.fillRect(offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    heldCtx.strokeStyle = SHAPE_BORDER_COLOR;
                    heldCtx.strokeRect(offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
    }
}

function holdPiece() {
    if (canHold) {
        if (heldPiece === null) {
            heldPiece = { ...currentPiece };
            currentPiece = newPiece();
        } else {
            const temp = { ...currentPiece };
            currentPiece = { ...heldPiece, x: Math.floor(COLS / 2) - Math.floor(heldPiece.shape[0].length / 2), y: -heldPiece.shape.length };
            heldPiece = temp;
        }
        canHold = false;
        drawHeldPiece();
    }
}

function changeDifficulty(level) {
    currentDifficulty = DIFFICULTY_LEVELS[level];
    // You might want to adjust other game parameters here based on difficulty
}

function drawBoard() {
    canvas.focus();
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the gameplay grid background
    ctx.fillStyle = '#ffffff';  // White background for the grid
    ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

    // Draw grid cells
    ctx.lineWidth = 1;
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            const drawX = x * BLOCK_SIZE;
            const drawY = y * BLOCK_SIZE;

            if (value === 'flash') {
                if (flashWhite) {
                    ctx.fillStyle = 'white';
                } else {
                    ctx.fillStyle = COLORS[board[y][x] - 1];
                }
                ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            } else if (value !== 0) {
                // Fill colored blocks
                ctx.fillStyle = COLORS[value - 1];
                ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                
                // Draw shape border
                ctx.strokeStyle = SHAPE_BORDER_COLOR;
                ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            } else {
                // Draw grid border for empty cells
                ctx.strokeStyle = GRID_BORDER_COLOR;
                ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });

    // Draw the gameplay grid border
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = GRID_BORDER_WIDTH;
    
    // Adjust the border drawing to ensure equal thickness
    const offset = GRID_BORDER_WIDTH / 2;
    ctx.strokeRect(
        offset, 
        offset, 
        GRID_WIDTH - GRID_BORDER_WIDTH + offset * 2, 
        GRID_HEIGHT - GRID_BORDER_WIDTH + offset * 2
    );
}

function drawPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const drawX = (currentPiece.x + x) * BLOCK_SIZE;
                const drawY = (currentPiece.y + y) * BLOCK_SIZE;

                // Only draw if the piece is within or entering the grid
                if (drawY >= 0) {
                    if (isLocking && Math.floor(flashCounter / 33) % 2 === 0) {
                        ctx.fillStyle = 'white'; // Flash white
                    } else {
                        ctx.fillStyle = currentPiece.color;
                    }
                    ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);

                    ctx.strokeStyle = SHAPE_BORDER_COLOR;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        });
    });
}

function drawScore() {
    infoFrame.innerHTML = `
        <p style="margin: 10px;">Score: ${score}</p>
        <p style="margin: 10px;">Lines: ${linesCleared}</p>
    `;
}

function updateCanvas() {
    drawBoard();
    drawPiece();
}

function moveDown() {
    currentPiece.y++;
    if (collision()) {
        currentPiece.y--;
        if (!isLocking) {
            isLocking = true;
            lockTimer = 0;
        }
    } else {
        isLocking = false;
        lockTimer = 0;
    }
    updateCanvas();
}

function moveLeft() {
    currentPiece.x--;
    if (collision()) {
        currentPiece.x++;
    }
    updateCanvas();
}

function moveRight() {
    currentPiece.x++;
    if (collision()) {
        currentPiece.x--;
    }
    updateCanvas();
}

function rotate() {
    const rotated = currentPiece.shape[0].map((_, i) => 
        currentPiece.shape.map(row => row[i]).reverse()
    );
    const prevShape = currentPiece.shape;
    const prevX = currentPiece.x;
    const prevY = currentPiece.y;

    currentPiece.shape = rotated;

    // Basic wall kick system
    const kicks = [
        [0, 0],   // No kick
        [-1, 0],  // Left
        [1, 0],   // Right
        [0, -1],  // Up
        [-1, -1], // Up-left
        [1, -1],  // Up-right
        [0, 1],   // Down
        [-1, 1],  // Down-left
        [1, 1]    // Down-right
    ];

    // Additional kicks for I shape
    const iKicks = [
        [-2, 0], [2, 0],  // Further left and right
        [0, -2], [0, 2],  // Further up and down
        [-3, 0], [3, 0],  // Even further left and right
        [0, -3], [0, 3]   // Even further up and down
    ];

    const allKicks = currentPiece.shapeIndex === 0 ? [...kicks, ...iKicks] : kicks;

    let kicked = false;
    for (let [kickX, kickY] of allKicks) {
        currentPiece.x += kickX;
        currentPiece.y += kickY;
        if (!collision()) {
            kicked = true;
            break;
        }
        currentPiece.x -= kickX;
        currentPiece.y -= kickY;
    }

    if (!kicked) {
        currentPiece.shape = prevShape;
        currentPiece.x = prevX;
        currentPiece.y = prevY;
    }

    updateCanvas();
}

function collision() {
    return currentPiece.shape.some((row, dy) => 
        row.some((value, dx) => {
            if (value) {
                const newX = currentPiece.x + dx;
                const newY = currentPiece.y + dy;
                return newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX]);
            }
            return false;
        })
    );
}

function merge() {
    console.log("Merging piece:", JSON.stringify(currentPiece));
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    board[boardY][boardX] = currentPiece.shapeIndex + 1;
                    console.log(`Merged at: (${boardX}, ${boardY}), value: ${currentPiece.shapeIndex + 1}`);
                } else {
                    console.warn(`Attempted to merge outside board: (${boardX}, ${boardY})`);
                }
            }
        });
    });
    console.log("Board state after merge:", JSON.stringify(board));

    removeRows();  // This will now set up the delayed row removal
}

function removeRows() {
    completedRows = [];
    for (let y = 0; y <= ROWS - 1; y++) {
        if (board[y].every(cell => cell !== 0)) {
            completedRows.push(y);
        }
    }
    console.log("+++Completed rows: " + JSON.stringify(completedRows));
    if (completedRows.length > 0) {
        flashCompletedRows(0);
    }
}

function flashCompletedRows(currentFlash) {
    if (currentFlash < FLASH_COUNT) {
        completedRows.forEach(y => {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x] !== 0) {
                    board[y][x] = 'flash';
                }
            }
        });
        updateCanvas();
        
        flashWhite = !flashWhite; // Toggle flash state
        
        setTimeout(() => {
            flashCompletedRows(currentFlash + 1);
        }, ROW_CLEAR_DELAY / (FLASH_COUNT * 2));
    } else {
        clearCompletedRows();
    }
}

function clearCompletedRows() {
    completedRows.forEach(y => {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        console.log("+++Cleared row: " + y);
    });
    score += completedRows.length * 100 * currentDifficulty.score_multiplier;
    linesCleared += completedRows.length;  // Update total lines cleared
    completedRows = [];
    drawScore();
    updateCanvas();
}

let dropCounter = 0;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > currentDifficulty.speed) {
        moveDown();
        dropCounter = 0;
    }

    if (isLocking) {
        lockTimer += deltaTime;
        flashCounter += deltaTime;
        if (lockTimer >= lockDelay) {
            if (currentPiece.y < 0) {
                console.log("Game over condition met");
                alert(`Game Over! Your score: ${score}\nLines cleared: ${linesCleared}`);
                board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
                score = 0;
                linesCleared = 0;  // Reset lines cleared
                currentPiece = newPiece();
            } else {
                merge();
                currentPiece = newPiece();
            }
            isLocking = false;
            lockTimer = 0;
            flashCounter = 0;
        }
    }

    updateCanvas();
    drawScore();
    drawNextPiece();
    drawHeldPiece();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    switch(event.key) {
        case 'ArrowLeft': moveLeft(); break;
        case 'ArrowRight': moveRight(); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotate(); break;
        case 'c':
        case 'C':
            holdPiece();
            break;
        case '1':
            changeDifficulty('EASY');
            break;
        case '2':
            changeDifficulty('MEDIUM');
            break;
        case '3':
            changeDifficulty('HARD');
            break;
    }
});

// Debug function to log the current state
function logState() {
    console.log("Current Piece:", currentPiece);
    console.log("Board State:", board);
}

// Add a debug key (e.g., 'D' key)
document.addEventListener('keydown', event => {
    if (event.key === 'd' || event.key === 'D') {
        logState();
    }
});

// Initialize the game
currentPiece = newPiece();
nextPiece = generatePiece();
update(); // Start the game loop