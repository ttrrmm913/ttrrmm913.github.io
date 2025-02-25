// キャンバス要素と2Dコンテキストの取得
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ゲームの行数、列数、ブロックサイズ
const ROWS = 20, COLS = 10, SIZE = 30;

// 盤面を20行×10列の配列で初期化（すべて null）
const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// 新規テトリスミノ用の画像を読み込み（画像URLは適宜変更）
const blockImage = new Image();
blockImage.src = "images/your-image-path2.png";

// テトロミノの定義
const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: "cyan" },
  O: { shape: [[1, 1], [1, 1]], color: "yellow" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "purple" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "orange" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "blue" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "green" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "red" },
  X: { shape: [[1]], image: blockImage }
};

// 各テトリミノの出現確率（合計100）
const TETROMINO_PROBABILITY = {
  I: 15, O: 15, T: 15, L: 15, J: 15, S: 12, Z: 10, X: 3
};

let tetromino, pos, design;
let dropInterval = 300;
let lastDrop = 0;
let score = 0;
let gameOver = false;

// 確率に基づいてランダムなテトロミノを取得
function getRandomTetromino() {
  const keys = Object.keys(TETROMINO_PROBABILITY);
  const weightedArray = keys.flatMap(key => Array(TETROMINO_PROBABILITY[key]).fill(key));
  return weightedArray[Math.floor(Math.random() * weightedArray.length)];
}

// 新しいテトロミノを生成
function newTetromino() {
  const key = getRandomTetromino();
  tetromino = TETROMINOS[key].shape;
  design = TETROMINOS[key].image || TETROMINOS[key].color;
  pos = { x: Math.floor(COLS / 2) - Math.floor(tetromino[0].length / 2), y: 0 };

  if (collision(0, 0)) gameOver = true;
}

// 描画処理
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) => row.forEach((cell, x) => {
    if (cell) drawCell(x, y, cell);
  }));
  if (!gameOver) {
    tetromino.forEach((row, y) => row.forEach((cell, x) => {
      if (cell) drawCell(pos.x + x, pos.y + y, design);
    }));
  }
  drawScore();
  if (gameOver) drawgameOver();
};

// 1マスのブロック描画
function drawCell(x, y, design) {
  if (typeof design === "string") {
    ctx.fillStyle = design;
    ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
  } else if (design instanceof Image) {
    ctx.drawImage(design, x * SIZE, y * SIZE, SIZE, SIZE);
  }
  ctx.strokeStyle = "black";
  ctx.strokeRect(x * SIZE, y * SIZE, SIZE, SIZE);
}

// 衝突判定
function collision(dx, dy, newShape = tetromino) {
  return newShape.some((row, y) => row.some((cell, x) => {
    let newX = pos.x + x + dx;
    let newY = pos.y + y + dy;
    return cell && (newX < 0 || newX >= COLS || newY >= ROWS || board[newY]?.[newX]);
  }));
}

// 移動処理
function move(dx, dy) {
  if (!gameOver && !collision(dx, dy)) {
    pos.x += dx;
    pos.y += dy;
    draw();
  } else if (dy > 0) {
    merge();
    clearLines();
    newTetromino();
  }
}

// 回転処理
function rotate() {
  if (!gameOver) {
    const newTetrominoShape = tetromino[0].map((_, i) => tetromino.map(row => row[i])).reverse();
    if (!collision(0, 0, newTetrominoShape)) {
      tetromino = newTetrominoShape;
      draw();
    }
  }
}

// 盤面にテトロミノを固定
function merge() {
  tetromino.forEach((row, y) => row.forEach((cell, x) => {
    if (cell) board[pos.y + y][pos.x + x] = design;
  }));
}

// 揃った行を削除
function clearLines() {
  board.forEach((row, y) => {
    if (row.every(cell => cell)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      score += 100;
    }
  });
}

// キーボード操作
document.addEventListener("keydown", (e) => {
  if (!gameOver) {
    if (e.key === "ArrowLeft") move(-1, 0);
    if (e.key === "ArrowRight") move(1, 0);
    if (e.key === "ArrowDown") move(0, 1);
    if (e.key === "ArrowUp") rotate();
  }
});

// フレームごとの更新処理
function update(time = 0) {
  requestAnimationFrame(update);
  if (!gameOver && time - lastDrop > dropInterval) {
    move(0, 1);
    lastDrop = time;
  }
  draw();
}

// スコア描画
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px 'DotGothic16', sans-serif";
  ctx.fillText("Score " + score, canvas.width - 100, 30);
}

// ゲーム開始
newTetromino();
update();
