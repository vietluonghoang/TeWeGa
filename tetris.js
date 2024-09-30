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
const INFO_FRAME_WIDTH = 5 * BLOCK_SIZE;
const INFO_FRAME_HEIGHT = 4 * BLOCK_SIZE;
const SPACING = 20;

// Set canvas size
canvas.width = GRID_WIDTH + INFO_FRAME_WIDTH + SPACING + GRID_BORDER_WIDTH;
canvas.height = Math.max(GRID_HEIGHT, INFO_FRAME_HEIGHT) + GRID_BORDER_WIDTH;

// Set info frame size and position
infoFrame.style.width = `${INFO_FRAME_WIDTH}px`;
infoFrame.style.height = `${INFO_FRAME_HEIGHT}px`;
infoFrame.style.position = 'absolute';
infoFrame.style.left = `${GRID_WIDTH + SPACING + GRID_BORDER_WIDTH}px`;
infoFrame.style.top = '0px';
infoFrame.style.border = `${INFO_FRAME_BORDER_WIDTH}px solid gray`;
infoFrame.style.backgroundColor = '#f0f0f0';  // Light gray background
infoFrame.style.boxSizing = 'border-box';  // Include border in width/height calculation

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

const SHAPE_BORDER_COLOR = 'white';
const GRID_BORDER_COLOR = '#d0d0d0';

function newPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[shapeIndex];
    return {
        shape: shape,
        color: COLORS[shapeIndex],
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
        shapeIndex: shapeIndex
    };
}

function drawBoard() {
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

            if (value !== 0) {
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

                // Fill the shape
                ctx.fillStyle = currentPiece.color;
                ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);

                // Draw shape border
                ctx.strokeStyle = SHAPE_BORDER_COLOR;
                ctx.lineWidth = 1;
                ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function drawScore() {
    infoFrame.innerHTML = `<p style="margin: 10px;">Score: ${score}</p>`;
}

function updateCanvas() {
    drawBoard();
    drawPiece();
}

function moveDown() {
    currentPiece.y++;
    if (collision()) {
        console.log("Collision detected");
        currentPiece.y--;
        merge();
        removeRows();
        currentPiece = newPiece();
        console.log("New piece created:", JSON.stringify(currentPiece));
        if (collision()) {
            console.log("Game over condition met");
            alert("Game Over! Your score: " + score);
            board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
            score = 0;
        }
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
}

function removeRows() {
    let rowsCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            rowsCleared++;
            y++; // Check the new row that has dropped down
        }
    }
    score += rowsCleared * 100;
    console.log("Rows cleared:", rowsCleared, "New score:", score);
}

let dropCounter = 0;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > 1000) {
        moveDown();
        dropCounter = 0;
    }

    updateCanvas();
    drawScore();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    switch(event.key) {
        case 'ArrowLeft': moveLeft(); break;
        case 'ArrowRight': moveRight(); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotate(); break;
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
update(); // Start the game loop