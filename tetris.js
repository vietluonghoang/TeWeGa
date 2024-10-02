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
nextPieceCanvas.height = 70; // Reduced from 120 to 90
heldPieceCanvas.width = 150;
heldPieceCanvas.height = 70; // Reduced from 120 to 90

const SHAPES = [
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[1,1], [1,1]], // O
    [[0,1,0], [1,1,1], [0,0,0]], // T
    [[0,1,1], [1,1,0], [0,0,0]], // S
    [[1,1,0], [0,1,1], [0,0,0]], // Z
    [[1,0,0], [1,1,1], [0,0,0]], // J
    [[0,0,1], [1,1,1], [0,0,0]]  // L
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
    EASY: { speed: 500, score_multiplier: 1 },
    MEDIUM: { speed: 350, score_multiplier: 1.5 },
    HARD: { speed: 150, score_multiplier: 2 }
};

let currentDifficulty = DIFFICULTY_LEVELS.EASY;
let nextPiece = null;
let heldPiece = null;
let canHold = true;

let startTime; // Add this near the top of your file with other variable declarations

let gameMode = 'Classic';
let isPaused = false;
let lastTime = 0;

// Add these near the top of your file with other variable declarations
let level = 1;
let combo = 0;
let lastClearWasTetris = false;
let lastMoveWasTSpin = false;

const LEVEL_UP_LINES = 10;
const BASE_SCORES = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    MINI_TSPIN: 100,
    TSPIN: 400,
    MINI_TSPIN_SINGLE: 200,
    TSPIN_SINGLE: 800,
    TSPIN_DOUBLE: 1200,
    TSPIN_TRIPLE: 1600
};

function focusCanvas() {
    canvas.focus();
}

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

function drawPieceInCanvas(piece, canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (piece) {
        const pieceSize = Math.floor(BLOCK_SIZE * 0.75); // 75% of the main grid block size
        const maxPieceWidth = 4 * pieceSize;
        const maxPieceHeight = 4 * pieceSize;
        
        // Calculate the actual piece dimensions
        const pieceWidth = piece.shape[0].length * pieceSize;
        const pieceHeight = piece.shape.length * pieceSize;
        
        // Center the piece both horizontally and vertically
        const offsetX = Math.floor((canvas.width - pieceWidth) / 2);
        const offsetY = Math.floor((canvas.height - pieceHeight) / 2);

        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = COLORS[piece.shapeIndex];
                    ctx.fillRect(
                        offsetX + x * pieceSize, 
                        offsetY + y * pieceSize, 
                        pieceSize, 
                        pieceSize
                    );
                    ctx.strokeStyle = 'black';
                    ctx.strokeRect(
                        offsetX + x * pieceSize, 
                        offsetY + y * pieceSize, 
                        pieceSize, 
                        pieceSize
                    );
                }
            });
        });
    }
}

function drawNextPiece() {
    drawPieceInCanvas(nextPiece, nextPieceCanvas);
}

function drawHeldPiece() {
    drawPieceInCanvas(heldPiece, heldPieceCanvas);
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
    document.querySelectorAll('.difficultyButton').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.difficulty === level);
    });
    focusCanvas();
}

function changeGameMode(mode) {
    gameMode = mode;
    document.querySelectorAll('.modeButton').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.mode === mode);
    });
    // Implement game mode specific logic here
    focusCanvas();
}

function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pauseButton');
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    pauseButton.classList.toggle('resume', isPaused);
    
    if (!isPaused) {
        // Resume the game loop
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
    focusCanvas();
}

function restartGame() {
    initializeGame();
    // No need to call focusCanvas() here as it's now part of initializeGame
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
    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000); // Time in seconds
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    const infoContent = document.getElementById('infoContent');
    infoContent.innerHTML = `
        <p>Score: ${score}</p>
        <p>Lines: ${linesCleared}</p>
        <p>Level: ${level}</p>
        <p>Time: ${minutes}:${seconds.toString().padStart(2, '0')}</p>
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
    let rotated;
    const pieceType = currentPiece.shapeIndex;

    if (pieceType === 1) { // O piece
        rotated = currentPiece.shape; // O piece doesn't rotate
    } else if (pieceType === 0) { // I piece
        rotated = rotateIPiece(currentPiece.shape);
    } else if (pieceType === 2) { // T piece
        rotated = rotateTpiece(currentPiece.shape);
    } else {
        rotated = rotatePiece(currentPiece.shape);
    }

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

    if (kicked) {
        lastMoveWasTSpin = checkTSpin();
    }

    if (!kicked) {
        currentPiece.shape = prevShape;
        currentPiece.x = prevX;
        currentPiece.y = prevY;
    }

    updateCanvas();
}

function rotateIPiece(shape) {
    // Four states of I piece
    const states = [
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
        [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
    ];
    
    // Find current state and return next state
    for (let i = 0; i < states.length; i++) {
        if (JSON.stringify(shape) === JSON.stringify(states[i])) {
            return states[(i + 1) % states.length];
        }
    }
    
    // If not found (shouldn't happen), return original shape
    return shape;
}

function rotateTpiece(shape) {
    // Four states of T piece
    const states = [
        [[0,1,0], [1,1,1], [0,0,0]],
        [[0,1,0], [0,1,1], [0,1,0]],
        [[0,0,0], [1,1,1], [0,1,0]],
        [[0,1,0], [1,1,0], [0,1,0]]
    ];
    
    // Find current state and return next state
    for (let i = 0; i < states.length; i++) {
        if (JSON.stringify(shape) === JSON.stringify(states[i])) {
            return states[(i + 1) % states.length];
        }
    }
    
    // If not found (shouldn't happen), return original shape
    return shape;
}

function rotatePiece(shape) {
    // Standard rotation for other pieces
    return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
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
    
    // Reset canHold flag
    canHold = true;
    
    // Generate new piece
    currentPiece = newPiece();
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
    const rowsCleared = completedRows.length;
    let scoreIncrease = 0;

    // Determine if the last move was a T-Spin
    const isTSpin = checkTSpin();

    // Calculate score based on lines cleared and T-Spin
    if (rowsCleared > 0) {
        if (isTSpin) {
            switch (rowsCleared) {
                case 1:
                    scoreIncrease = lastMoveWasTSpin ? BASE_SCORES.TSPIN_SINGLE : BASE_SCORES.MINI_TSPIN_SINGLE;
                    break;
                case 2:
                    scoreIncrease = BASE_SCORES.TSPIN_DOUBLE;
                    break;
                case 3:
                    scoreIncrease = BASE_SCORES.TSPIN_TRIPLE;
                    break;
            }
        } else {
            switch (rowsCleared) {
                case 1:
                    scoreIncrease = BASE_SCORES.SINGLE;
                    break;
                case 2:
                    scoreIncrease = BASE_SCORES.DOUBLE;
                    break;
                case 3:
                    scoreIncrease = BASE_SCORES.TRIPLE;
                    break;
                case 4:
                    scoreIncrease = BASE_SCORES.TETRIS;
                    break;
            }
        }

        // Apply back-to-back bonus
        if ((rowsCleared === 4 || isTSpin) && lastClearWasTetris) {
            scoreIncrease *= 1.5;
        }

        // Apply combo bonus
        if (combo > 0) {
            scoreIncrease += 50 * combo * level;
        }

        // Apply level multiplier
        scoreIncrease *= level;

        // Update score and lines cleared
        score += Math.floor(scoreIncrease);
        linesCleared += rowsCleared;

        // Update combo
        combo++;

        // Check for level up
        if (linesCleared >= level * LEVEL_UP_LINES) {
            levelUp();
        }

        // Update lastClearWasTetris
        lastClearWasTetris = (rowsCleared === 4 || isTSpin);
    } else {
        // Reset combo if no lines were cleared
        combo = 0;
    }

    // Clear the rows and update the board
    completedRows.forEach(y => {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
    });

    // Reset completedRows
    completedRows = [];

    // Update display
    drawScore();
    updateCanvas();
}

function checkTSpin() {
    // This is a simplified T-Spin detection.
    // A full implementation would be more complex.
    if (currentPiece.shapeIndex !== 2) return false; // Not a T piece
    
    let cornersFilled = 0;
    const corners = [
        [-1, -1], [1, -1], [-1, 1], [1, 1]
    ];
    
    corners.forEach(([dx, dy]) => {
        const newX = currentPiece.x + dx;
        const newY = currentPiece.y + dy;
        if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
            cornersFilled++;
        }
    });
    
    return cornersFilled >= 3;
}

function levelUp() {
    level++;
    // Increase game speed
    currentDifficulty.speed = Math.max(currentDifficulty.speed - 50, 100);
}

let dropCounter = 0;

function update(deltaTime) {
    if (isPaused) return; // Exit early if the game is paused

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
                initializeGame(); // Reset the game, including the elapsed time
            } else {
                merge();
            }
            isLocking = false;
            lockTimer = 0;
            flashCounter = 0;
        }
    }

    updateCanvas();
    drawScore(); // This will now include the time
    drawNextPiece();
    drawHeldPiece();
}

function draw() {
    updateCanvas();
    drawScore();
    drawNextPiece();
    drawHeldPiece();
}

function gameLoop(currentTime) {
    if (isPaused) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', event => {
    if (isPaused) return; // Exit early if the game is paused

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

// Modify the game initialization
function initializeGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    linesCleared = 0;
    currentPiece = newPiece();
    nextPiece = generatePiece();
    canHold = true;
    heldPiece = null;
    startTime = new Date(); // Reset the start time
    isPaused = false;
    document.getElementById('pauseButton').textContent = 'Pause';
    document.getElementById('pauseButton').classList.remove('resume');
    changeGameMode('Classic');
    changeDifficulty('EASY');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Focus the canvas after initialization
    focusCanvas();
}

// Event listeners for new buttons
document.querySelectorAll('.modeButton').forEach(btn => {
    btn.addEventListener('click', () => {
        changeGameMode(btn.dataset.mode);
        focusCanvas();
    });
});

document.querySelectorAll('.difficultyButton').forEach(btn => {
    btn.addEventListener('click', () => {
        changeDifficulty(btn.dataset.difficulty);
        focusCanvas();
    });
});

document.getElementById('pauseButton').addEventListener('click', () => {
    togglePause();
    focusCanvas();
});

document.getElementById('restartButton').addEventListener('click', () => {
    restartGame();
    focusCanvas();
});

// When the window loads, initialize the game
window.addEventListener('load', initializeGame);

// Replace the current game initialization at the bottom of the file with:
initializeGame();