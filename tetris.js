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
    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((cell) => cell)) {
            board.splice(r, 1);
            board.unshift(new Array(COLS).fill(null));
            linesCleared++;
            r++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
        updateScore();
    }
}

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
        clearLines();
        spawnNext();
    }
    draw();
}

function hardDrop() {
    while (!collision(currentPiece, 1, 0)) currentPiece.row++;
    drop();
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

function startGame() {
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById('game').style.visibility = 'visible';
    document.getElementById('info').style.visibility = 'visible';
    board = Array.from(
        {
            length: ROWS,
        },
        () => new Array(COLS).fill(null)
    );
    score = 0;
    holdPiece = null;
    canHold = true;
    updateScore();
    createGrid();
    nextPiece = newPiece();
    drawNext();
    drawHold();
    spawnNext();
    clearInterval(gameInterval);
    gameInterval = setInterval(drop, 500);
    draw();
}
document.addEventListener("keydown", (e) => {
    if (!currentPiece) return;
    if (e.key === "ArrowLeft" && !collision(currentPiece, 0, -1))
        currentPiece.col--;
    else if (e.key === "ArrowRight" && !collision(currentPiece, 0, 1))
        currentPiece.col++;
    else if (e.key === "ArrowDown") drop();
    else if (e.key === "ArrowUp") rotate();
    else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        hardDrop();
    } else if (e.key === "a" || e.key === "A" || e.key === "Shift") {
        hold();
    }
    draw();
});
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
/*function addRepeatListener(selector, action) {
    let intervalId;

    const start = () => {
        if (!currentPiece) return;
        action();
        intervalId = setInterval(() => {
            if (!currentPiece) return;
            action();
        }, 100); // adjust repeat speed here
    };

    const stop = () => clearInterval(intervalId);

    const button = document.querySelector(selector);
    button.addEventListener("mousedown", start);
    button.addEventListener("touchstart", (e) => {
        e.preventDefault();
        start();
    }, { passive: false });

    button.addEventListener("mouseup", stop);
    button.addEventListener("mouseleave", stop);
    button.addEventListener("touchend", stop);
    button.addEventListener("touchcancel", stop);
}

// Add repeat to left/right/down buttons
addRepeatListener(".dpad-left", () => {
    if (!collision(currentPiece, 0, -1)) currentPiece.col--;
    draw();
});

addRepeatListener(".dpad-right", () => {
    if (!collision(currentPiece, 0, 1)) currentPiece.col++;
    draw();
});

addRepeatListener(".dpad-down", () => {
    drop();
});*/

function showGameOverScreen() {
    document.getElementById("gameOverScreen").style.display = "flex";
    document.getElementById("finalScore").textContent = score;
}
