const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

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

function newPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[shapeIndex];
    return {
        shape: shape,
        color: COLORS[shapeIndex],
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPiece();
    drawScore();
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = COLORS[value - 1];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function drawPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = currentPiece.color;
                ctx.fillRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#fff';
                ctx.strokeRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 25);
}

function moveDown() {
    currentPiece.y++;
    if (collision()) {
        currentPiece.y--;
        merge();
        removeRows();
        currentPiece = newPiece();
        if (collision()) {
            board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
            score = 0;
        }
    }
}

function moveLeft() {
    currentPiece.x--;
    if (collision()) {
        currentPiece.x++;
    }
}

function moveRight() {
    currentPiece.x++;
    if (collision()) {
        currentPiece.x--;
    }
}

function rotate() {
    const rotated = currentPiece.shape[0].map((_, i) => 
        currentPiece.shape.map(row => row[i]).reverse()
    );
    const prevShape = currentPiece.shape;
    currentPiece.shape = rotated;
    if (collision()) {
        currentPiece.shape = prevShape;
    }
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
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPiece.y + y][currentPiece.x + x] = SHAPES.indexOf(currentPiece.shape) + 1;
            }
        });
    });
}

function removeRows() {
    let rowsCleared = 0;
    board = board.filter(row => {
        if (row.every(cell => cell !== 0)) {
            rowsCleared++;
            return false;
        }
        return true;
    });
    while (rowsCleared > 0) {
        board.unshift(Array(COLS).fill(0));
        rowsCleared--;
    }
    score += rowsCleared * 100;
}

document.addEventListener('keydown', event => {
    switch(event.keyCode) {
        case 37: moveLeft(); break;
        case 39: moveRight(); break;
        case 40: moveDown(); break;
        case 38: rotate(); break;
    }
    draw();
});

currentPiece = newPiece();
setInterval(() => {
    moveDown();
    draw();
}, 500);

draw();