const ROWS = 20,
    COLS = 10;
const game = document.getElementById("game");
const nextDiv = document.getElementById("next");
const holdDiv = document.getElementById("hold");
const scoreDiv = document.getElementById("score");
let grid = [],
    board = [],
    currentPiece,
    nextPiece,
    holdPiece = null,
    canHold = true;
let gameInterval;
let score = 0;
let linesClearedTotal = 0;
let level = 1;
let speed = 1000;
let highScore = 0;
let isGameOver = false;

const SHAPES = {
    I: [[1, 1, 1, 1]],
    J: [
        [1, 0, 0],
        [1, 1, 1],
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
    ],
    O: [
        [1, 1],
        [1, 1],
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
    ],
};

const COLORS = {
    I: "#222222",
    J: "#222222",
    L: "#222222",
    O: "#222222",
    S: "#222222",
    T: "#222222",
    Z: "#222222",
};

/*const COLORS = {
    I: "#00f5ff",
    J: "#0090ff",
    L: "#ff9f00",
    O: "#ffe600",
    S: "#00ff90",
    T: "#d700ff",
    Z: "#ff2d2d",
};*/
function createGrid() {
    game.innerHTML = "";

    grid = Array.from(
        {
            length: ROWS,
        },

        () =>
            Array.from(
                {
                    length: COLS,
                },

                () => {
                    const cell = document.createElement("div");
                    cell.classList.add("cell");
                    game.appendChild(cell);
                    return cell;
                }
            )
    );
}

function newPiece() {
    const types = Object.keys(SHAPES);
    const type = types[Math.floor(Math.random() * types.length)];

    return {
        type,
        shape: SHAPES[type].map((row) => row.slice()),
        color: COLORS[type],
        row: 0,
        col: Math.floor((COLS - SHAPES[type][0].length) / 2),
    };
}

function updateScore() {
    scoreDiv.textContent = score;
    document.getElementById("lines").textContent = linesClearedTotal;
    document.getElementById("level").textContent = level;

    if (score > highScore) {
        saveHighScore();
    }
}

function loadHighScore() {
    const saved = localStorage.getItem("tetrisHighScore");
    highScore = saved ? JSON.parse(saved) : 0;
    document.getElementById("topScore").textContent = highScore;
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("tetrisHighScore", JSON.stringify(highScore));
        document.getElementById("topScore").textContent = highScore;
    }
}

function drawNext() {
    nextDiv.innerHTML = "";
    const shape = nextPiece.shape;

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const cell = document.createElement("div");
            cell.style.background = "";
            if (shape[r] && shape[r][c])
                cell.style.background = nextPiece.color;
            nextDiv.appendChild(cell);
        }
    }
}

function drawHold() {
    holdDiv.innerHTML = "";
    if (!holdPiece) return;
    const shape = holdPiece.shape;

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const cell = document.createElement("div");
            cell.style.background = "";
            if (shape[r] && shape[r][c])
                cell.style.background = holdPiece.color;
            holdDiv.appendChild(cell);
        }
    }
}

function collision(piece, offsetRow, offsetCol, shape = piece.shape) {
    return shape.some((row, r) =>
        row.some((val, c) => {
            if (!val) return false;
            const nr = piece.row + offsetRow + r;
            const nc = piece.col + offsetCol + c;
            return (
                nr >= ROWS || nc < 0 || nc >= COLS || (nr >= 0 && board[nr][nc])
            );
        })
    );
}

function merge() {
    currentPiece.shape.forEach((row, r) =>
        row.forEach((val, c) => {
            if (val)
                board[currentPiece.row + r][currentPiece.col + c] =
                    currentPiece.color;
        })
    );
}
function clearLines() {
    let linesThisClear = 0;

    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((cell) => cell)) {
            board.splice(r, 1);
            board.unshift(new Array(COLS).fill(null));
            linesThisClear++;
            r++;
        }
    }

    if (linesThisClear > 0) {
        linesClearedTotal += linesThisClear;
        score += linesThisClear * 100;

        // Limit level to max 20
        level = Math.min(20, Math.floor(linesClearedTotal / 10) + 1);

        // Cap speed increase accordingly
        speed = Math.max(100, 1000 - (level - 1) * 50);

        clearInterval(gameInterval);
        gameInterval = setInterval(drop, speed);
        updateScore();
    }
}

/*function clearLines() {
    let linesThisClear=0;

    for (let r=ROWS - 1; r >=0; r--) {
        if (board[r].every((cell)=> cell)) {
            board.splice(r, 1);
            board.unshift(new Array(COLS).fill(null));
            linesThisClear++;
            r++;
        }
    }

    if (linesThisClear > 0) {
        linesClearedTotal+=linesThisClear;
        score+=linesThisClear * 100;
        level=Math.floor(linesClearedTotal / 10)+1;
        speed=Math.max(100, 1000 - (level - 1) * 50); // speed cap
        clearInterval(gameInterval);
        gameInterval=setInterval(drop, speed);
        updateScore();
    }
}*/

function rotate() {
    const rotated = currentPiece.shape[0].map((_, c) =>
        currentPiece.shape.map((row) => row[c]).reverse()
    );
    if (!collision(currentPiece, 0, 0, rotated)) currentPiece.shape = rotated;
}

function drop() {
    if (!collision(currentPiece, 1, 0)) {
        currentPiece.row++;
    } else {
        merge();
        score += 5; // +5 ONLY when the block is locked
        clearLines();
        spawnNext();
    }

    updateScore();
    draw();
}

function hardDrop() {
    while (!collision(currentPiece, 1, 0)) {
        currentPiece.row++;
    }

    drop(); // handles merge, +5 score, and updates
}

function spawnNext() {
    canHold = true;

    currentPiece = {
        ...nextPiece,
        row: 0,
        col: Math.floor((COLS - nextPiece.shape[0].length) / 2),
    };
    nextPiece = newPiece();
    drawNext();

    if (collision(currentPiece, 0, 0)) {
        clearInterval(gameInterval);
        showGameOverScreen();
    }
}

function hold() {
    if (!canHold) return;
    canHold = false;

    if (!holdPiece) {
        holdPiece = {
            type: currentPiece.type,
            shape: currentPiece.shape.map((row) => row.slice()),
            color: currentPiece.color,
        };
        spawnNext();
    } else {
        const temp = holdPiece;

        holdPiece = {
            type: currentPiece.type,
            shape: currentPiece.shape.map((row) => row.slice()),
            color: currentPiece.color,
        };

        currentPiece = {
            type: temp.type,
            shape: temp.shape.map((row) => row.slice()),
            color: temp.color,
            row: 0,
            col: Math.floor((COLS - temp.shape[0].length) / 2),
        };

        if (collision(currentPiece, 0, 0)) {
            clearInterval(gameInterval);
            showGameOverScreen();
        }
    }

    drawHold();
    draw();
}

function draw() {
    // Clear all cells
    grid.flat().forEach((cell) => {
        cell.style.background = "";
        cell.classList.remove("ghost");
    });

    // Draw locked cells
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) grid[r][c].style.background = board[r][c];
        }
    }

    if (!currentPiece) return;
    // Draw ghost piece
    const ghostRow = getGhostPosition();

    currentPiece.shape.forEach((rowArr, r) => {
        rowArr.forEach((val, c) => {
            if (val) {
                const gr = ghostRow + r;
                const gc = currentPiece.col + c;

                if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS) {
                    grid[gr][gc].classList.add("ghost");
                }
            }
        });
    });

    // Draw current falling piece
    currentPiece.shape.forEach((rowArr, r) => {
        rowArr.forEach((val, c) => {
            if (val) {
                const gr = currentPiece.row + r;
                const gc = currentPiece.col + c;

                if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS) {
                    grid[gr][gc].style.background = currentPiece.color;
                }
            }
        });
    });
}

function getGhostPosition() {
    let ghostRow = currentPiece.row;

    while (!collision(currentPiece, ghostRow - currentPiece.row + 1, 0)) {
        ghostRow++;
    }

    return ghostRow;
}

// Disable and enable controls
function disableControls() {
    document
        .querySelectorAll(".dpad button, .ab-buttons button")
        .forEach((btn) => (btn.disabled = true));
}

function enableControls() {
    document
        .querySelectorAll(".dpad button, .ab-buttons button")
        .forEach((btn) => (btn.disabled = false));
}

function startGame() {
    document.getElementById("gameStart").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("game").style.visibility = "visible";
    document.getElementById("info").style.visibility = "visible";

    board = Array.from(
        {
            length: ROWS,
        },

        () => new Array(COLS).fill(null)
    );
    score = 0;
    linesClearedTotal = 0;
    level = 1;
    speed = 1000;
    holdPiece = null;
    canHold = true;
    isGameOver = false;
    updateScore();
    createGrid();
    nextPiece = newPiece();
    drawNext();
    drawHold();
    spawnNext();
    clearInterval(gameInterval);
    gameInterval = setInterval(drop, speed);
    draw();
    enableControls();
    loadHighScore();
}

document.addEventListener("keydown", (e) => {
    if (isGameOver || !currentPiece) return;

    if (e.key === "ArrowLeft" && !collision(currentPiece, 0, -1)) {
        currentPiece.col--;
    } else if (e.key === "ArrowRight" && !collision(currentPiece, 0, 1)) {
        currentPiece.col++;
    } else if (e.key === "ArrowDown") {
        drop();
    } else if (e.key === "ArrowUp") {
        rotate();
    } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        hardDrop();
    } else if (e.key === "a" || e.key === "A" || e.key === "Shift") {
        hold();
    }

    draw();
});

// HELD DPAD REPEAT SUPPORT
/*const holdIntervals= {}

;

function addHoldButton(selector, onPress) {
    const btn=document.querySelector(selector);
    if ( !btn) return;
    let holdTimeout;
    let holdInterval;

    const start=()=> {
        if (isGameOver || !currentPiece) return;
        // Immediate single action on press
        onPress();

        // Start delayed repeat
        holdTimeout=setTimeout(()=> {
                holdInterval=setInterval(()=> {
                        if (isGameOver || !currentPiece) {
                            clearInterval(holdInterval);
                            return;
                        }

                        onPress();
                    }

                    , 50); // fast repeat rate
            }

            , 300); // initial delay before repeating
    }

    ;

    const stop=()=> {
        clearTimeout(holdTimeout);
        clearInterval(holdInterval);
    }

    ;
    btn.addEventListener("mousedown", start);

    btn.addEventListener("touchstart", (e)=> {
            e.preventDefault();
            start();
        }

    );
    document.addEventListener("mouseup", stop);
    document.addEventListener("touchend", stop);
}

// Add repeat behavior to D-pad buttons
addHoldButton(".dpad-left", ()=> {
        if ( !collision(currentPiece, 0, -1)) {
            currentPiece.col--;
            draw();
        }
    }

);

addHoldButton(".dpad-right", ()=> {
        if ( !collision(currentPiece, 0, 1)) {
            currentPiece.col++;
            draw();
        }
    }

);

addHoldButton(".dpad-down", ()=> {
        drop();
    }

);*/

document.querySelector(".dpad-left").addEventListener("click", () => {
    if (!currentPiece) return;
    if (!collision(currentPiece, 0, -1)) currentPiece.col--;
    draw();
});
document.querySelector(".dpad-right").addEventListener("click", () => {
    if (!currentPiece) return;
    if (!collision(currentPiece, 0, 1)) currentPiece.col++;
    draw();
});
document.querySelector(".dpad-down").addEventListener("click", () => {
    if (!currentPiece) return;
    drop();
});
document.querySelector(".dpad-up").addEventListener("click", () => {
    if (!currentPiece) return;
    hold();
});

document.querySelector(".button-a").addEventListener("click", () => {
    if (!currentPiece) return;
    rotate();
    draw();
});

document.querySelector(".button-b").addEventListener("click", () => {
    if (!currentPiece) return;
    hardDrop();
});

document.querySelector(".start-button").addEventListener("click", () => {
    startGame();
});

function showGameOverScreen() {
    document.getElementById("gameOverScreen").style.display = "flex";
    document.getElementById("finalScore").textContent = score;
    saveHighScore();
    disableControls();
    isGameOver = true;
}

loadHighScore();
