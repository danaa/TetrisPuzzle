// קונפיגורציה
const CONFIG = {
    ROWS: 16,
    COLS: 10,
    MAX_LEVEL: 10,
    BLOCK_SIZE: 30,
    SHAPES: [
        [[1, 1, 1, 1]],           // I
        [[1, 1], [1, 1]],         // O
        [[1, 1, 1], [0, 1, 0]],   // T
        [[1, 1, 0], [0, 1, 1]],   // Z
        [[0, 1, 1], [1, 1, 0]],   // S
        [[1, 1, 1], [1, 0, 0]],   // L
        [[1, 1, 1], [0, 0, 1]],   // J
        [[1, 1, 1], [0, 1, 0], [0, 1, 0]], // T גדול
        [[1, 1, 0], [0, 1, 0], [0, 1, 1]], // מדרגות
        [[1, 0, 0], [1, 1, 1], [1, 0, 0]]  // +
    ],
    COLORS: [
        '#FFB3BA', // פסטל ורוד
        '#BAFFC9', // פסטל ירוק
        '#BAE1FF', // פסטל כחול
        '#FFFFBA', // פסטל צהוב
        '#FFDFBA', // פסטל כתום
        '#E0BBE4', // פסטל סגול
        '#D4F0F0', // פסטל טורקיז
        '#FFC6FF', // פסטל ורוד-סגול
        '#DAEAF6', // פסטל תכלת
        '#FCE4EC'  // פסטל ורוד בהיר
    ],
    LEVEL_UP_THRESHOLD: 0.8,
    POINTS_PER_PIECE: 10,
    INITIAL_SHAPES: 4,
};

// מצב המשחק
const gameState = {
    board: [],
    currentPiece: null,
    level: 1,
    score: 0,
    activeShapes: [],
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
};

// אלמנטים של ה-DOM
const domElements = {
    canvas: document.getElementById('gameCanvas'),
    resetButton: document.getElementById('resetButton'),
    scoreElement: document.getElementById('score'),
    boardFilledElement: document.getElementById('boardFilled'),
    currentLevelElement: document.getElementById('currentLevel'),
    levelUpNotification: document.getElementById('levelUpNotification')
};

const ctx = domElements.canvas.getContext('2d');

// פונקציות עזר
const randomElement = array => array[Math.floor(Math.random() * array.length)];

// פונקציות המשחק
const gameLogic = {
    initializeBoard() {
        gameState.board = Array(CONFIG.ROWS).fill().map(() => Array(CONFIG.COLS).fill(0));
        domElements.canvas.width = CONFIG.COLS * CONFIG.BLOCK_SIZE;
        domElements.canvas.height = CONFIG.ROWS * CONFIG.BLOCK_SIZE;
        this.updateScoreBoard();
    },

    newPiece() {
        const shapeIndex = randomElement(gameState.activeShapes);
        gameState.currentPiece = {
            shape: CONFIG.SHAPES[shapeIndex],
            color: CONFIG.COLORS[shapeIndex],
            x: Math.floor(CONFIG.COLS / 2) - Math.floor(CONFIG.SHAPES[shapeIndex][0].length / 2),
            y: 0
        };
    },

    isValidMove(piece, x, y) {
        return piece.shape.every((row, dy) =>
            row.every((value, dx) =>
                value === 0 || (
                    x + dx >= 0 &&
                    x + dx < CONFIG.COLS &&
                    y + dy < CONFIG.ROWS &&
                    !(y + dy >= 0 && gameState.board[y + dy][x + dx])
                )
            )
        );
    },

    isPieceSettled(piece, x, y) {
        return !this.isValidMove(piece, x, y + 1);
    },

    rotatePiece() {
        const newShape = gameState.currentPiece.shape[0].map((_, index) =>
            gameState.currentPiece.shape.map(row => row[index]).reverse()
        );
        if (this.isValidMove({ ...gameState.currentPiece, shape: newShape }, gameState.currentPiece.x, gameState.currentPiece.y)) {
            gameState.currentPiece.shape = newShape;
        }
    },

    mergePiece() {
        gameState.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    gameState.board[gameState.currentPiece.y + y][gameState.currentPiece.x + x] = gameState.currentPiece.color;
                }
            });
        });
        gameState.score += CONFIG.POINTS_PER_PIECE;
        this.updateScoreBoard();
    },

    updateScoreBoard() {
        const totalCells = CONFIG.ROWS * CONFIG.COLS;
        const filledCells = gameState.board.flat().filter(Boolean).length;
        const percentFilled = Math.round((filledCells / totalCells) * 100);
        
        domElements.scoreElement.textContent = gameState.score;
        domElements.boardFilledElement.textContent = percentFilled + '%';
        domElements.currentLevelElement.textContent = gameState.level;
    },

    showLevelUpNotification() {
        domElements.levelUpNotification.style.display = 'block';
        setTimeout(() => {
            domElements.levelUpNotification.style.display = 'none';
        }, 2000);
    },

    resetGame() {
        gameState.level = 1;
        gameState.score = 0;
        gameState.activeShapes = Array.from({ length: CONFIG.INITIAL_SHAPES }, (_, i) => i);
        this.initializeBoard();
        this.newPiece();
    },

    addNewShape() {
        if (gameState.activeShapes.length < CONFIG.SHAPES.length) {
            gameState.activeShapes.push(gameState.activeShapes.length);
        }
    },

    checkLevelUp() {
        const filledCells = gameState.board.flat().filter(Boolean).length;
        if (filledCells >= CONFIG.ROWS * CONFIG.COLS * CONFIG.LEVEL_UP_THRESHOLD) {
            if (gameState.level < CONFIG.MAX_LEVEL) {
                gameState.level++;
                this.showLevelUpNotification();
                this.addNewShape();
            }
            this.initializeBoard();
        }
    }
};

// פונקציות ציור
const drawingFunctions = {
    drawBoard() {
        for (let y = 0; y < CONFIG.ROWS; y++) {
            for (let x = 0; x < CONFIG.COLS; x++) {
                if (gameState.board[y][x]) {
                    ctx.fillStyle = gameState.board[y][x];
                    ctx.fillRect(x * CONFIG.BLOCK_SIZE, y * CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    ctx.strokeRect(x * CONFIG.BLOCK_SIZE, y * CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
                }
            }
        }
    },

    drawPiece() {
        if (!gameState.currentPiece) return;
        gameState.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillStyle = gameState.currentPiece.color;
                    ctx.fillRect(
                        (gameState.currentPiece.x + x) * CONFIG.BLOCK_SIZE,
                        (gameState.currentPiece.y + y) * CONFIG.BLOCK_SIZE,
                        CONFIG.BLOCK_SIZE,
                        CONFIG.BLOCK_SIZE
                    );
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    ctx.strokeRect(
                        (gameState.currentPiece.x + x) * CONFIG.BLOCK_SIZE,
                        (gameState.currentPiece.y + y) * CONFIG.BLOCK_SIZE,
                        CONFIG.BLOCK_SIZE,
                        CONFIG.BLOCK_SIZE
                    );
                }
            });
        });
    },

    draw() {
        ctx.clearRect(0, 0, domElements.canvas.width, domElements.canvas.height);
        this.drawBoard();
        this.drawPiece();
        requestAnimationFrame(() => this.draw());
    }
};

// מאזיני אירועים
const eventListeners = {
    setupEventListeners() {
        domElements.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            gameLogic.rotatePiece();
        });

        domElements.canvas.addEventListener('mousedown', this.handleMouseDown);
        domElements.canvas.addEventListener('mousemove', this.handleMouseMove);
        domElements.canvas.addEventListener('mouseup', this.handleMouseUp);
        domElements.resetButton.addEventListener('click', () => gameLogic.resetGame());
    },

    handleMouseDown(e) {
        if (e.button === 0) { // לחצן שמאלי
            const rect = domElements.canvas.getBoundingClientRect();
            const mouseX = Math.floor((e.clientX - rect.left) / CONFIG.BLOCK_SIZE);
            const mouseY = Math.floor((e.clientY - rect.top) / CONFIG.BLOCK_SIZE);

            if (gameState.currentPiece) {
                if (mouseX >= gameState.currentPiece.x && mouseX < gameState.currentPiece.x + gameState.currentPiece.shape[0].length &&
                    mouseY >= gameState.currentPiece.y && mouseY < gameState.currentPiece.y + gameState.currentPiece.shape.length) {
                    // התחלת גרירה
                    gameState.isDragging = true;
                    gameState.dragOffsetX = mouseX - gameState.currentPiece.x;
                    gameState.dragOffsetY = mouseY - gameState.currentPiece.y;
                } else if (gameLogic.isPieceSettled(gameState.currentPiece, gameState.currentPiece.x, gameState.currentPiece.y)) {
                    // הנחת הצורה
                    gameLogic.mergePiece();
                    gameLogic.newPiece();
                    if (!gameLogic.isValidMove(gameState.currentPiece, gameState.currentPiece.x, gameState.currentPiece.y)) {
                        alert('המשחק נגמר! ניקוד: ' + gameState.score);
                        gameLogic.resetGame();
                    } else {
                        gameLogic.checkLevelUp();
                    }
                }
            }
        }
    },

    handleMouseMove(e) {
        if (gameState.isDragging && gameState.currentPiece) {
            const rect = domElements.canvas.getBoundingClientRect();
            const mouseX = Math.floor((e.clientX - rect.left) / CONFIG.BLOCK_SIZE);
            const mouseY = Math.floor((e.clientY - rect.top) / CONFIG.BLOCK_SIZE);

            const newX = mouseX - gameState.dragOffsetX;
            const newY = mouseY - gameState.dragOffsetY;

            if (gameLogic.isValidMove(gameState.currentPiece, newX, newY)) {
                gameState.currentPiece.x = newX;
                gameState.currentPiece.y = newY;
            }
        }
    },

    handleMouseUp() {
        gameState.isDragging = false;
    }
};

// אתחול המשחק
function initGame() {
    gameLogic.resetGame();
    eventListeners.setupEventListeners();
    drawingFunctions.draw();
}

// הפעלת המשחק
initGame();
