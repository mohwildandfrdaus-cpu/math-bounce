const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ================= PERFORMANCE =================
const isMobile = window.innerWidth < 600;
const SCALE = isMobile ? 0.6 : 1;

canvas.width = 840 * SCALE;
canvas.height = 440 * SCALE;
ctx.scale(SCALE, SCALE);

// ================= GAME OBJECT =================
let ball = {
  x: 420,
  y: 380,
  r: 8,
  dx: 4,
  dy: -4
};

let paddle = {
  w: 110,
  h: 16,
  x: 365,
  speed: 7
};

let moveLeft = false;
let moveRight = false;

// ================= TOUCH =================
btnLeft = document.getElementById("btn-left");
btnRight = document.getElementById("btn-right");

btnLeft.addEventListener("touchstart", () => moveLeft = true);
btnLeft.addEventListener("touchend", () => moveLeft = false);
btnRight.addEventListener("touchstart", () => moveRight = true);
btnRight.addEventListener("touchend", () => moveRight = false);

// ================= SCORE =================
let score = 0;
let level = 1;

// ================= QUESTIONS =================
const questions = [
  { q: "5 + 3 = ?", a: "8" },
  { q: "7 - 2 = ?", a: "5" },
  { q: "4 + 6 = ?", a: "10" },
  { q: "9 - 4 = ?", a: "5" },
  { q: "3 + 3 = ?", a: "6" }
];

// ================= BRICKS =================
const rows = 2;
const cols = 5;
const bw = 140;
const bh = 35;
const pad = 15;
const topOffset = 40;

let bricks = [];
let pending = null;
let choices = [];
let timer;

// ================= INIT =================
function initBricks() {
  bricks = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    bricks[r] = [];
    for (let c = 0; c < cols; c++) {
      bricks[r][c] = {
        x: 0, y: 0,
        active: true,
        q: questions[i].q,
        a: questions[i].a
      };
      i++;
    }
  }
}

// ================= DRAW =================
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
}

function drawPaddle() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(paddle.x, canvas.height / SCALE - 30, paddle.w, paddle.h);
}

function drawBricks() {
  const totalW = cols * bw + (cols - 1) * pad;
  const startX = (canvas.width / SCALE - totalW) / 2;

  bricks.forEach((row, r) => {
    row.forEach((b, c) => {
      if (b.active) {
        b.x = startX + c * (bw + pad);
        b.y = topOffset + r * (bh + pad);
        ctx.fillStyle = "#10b981";
        ctx.fillRect(b.x, b.y, bw, bh);
      }
    });
  });
}

// ================= QUESTION =================
function showQuestion(brick) {
  pending = brick;
  document.getElementById("question").innerText = brick.q;

  let real = brick.a;
  let fake1 = (+real + 1).toString();
  let fake2 = (+real - 1).toString();

  choices = [real, fake1, fake2].sort(() => Math.random() - 0.5);

  const wrap = document.getElementById("choices");
  wrap.innerHTML = "";

  choices.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "choice";
    d.innerText = c;
    d.onclick = () => answer(i);
    wrap.appendChild(d);
  });

  let time = 8;
  const cd = document.getElementById("countdown");
  cd.classList.remove("hidden");
  cd.innerText = time;

  timer = setInterval(() => {
    time--;
    cd.innerText = time;
    if (time <= 0) {
      clearInterval(timer);
      gameOver();
    }
  }, 1000);
}

function answer(i) {
  clearInterval(timer);
  document.getElementById("countdown").classList.add("hidden");
  if (choices[i] === pending.a) {
    pending.active = false;
    score += 10;
    document.getElementById("score").innerText = "Score: " + score;
  }
  pending = null;
  document.getElementById("question").innerText = "";
  document.getElementById("choices").innerHTML = "";
}

// ================= GAME LOOP =================
let last = 0;
const FPS = isMobile ? 40 : 60;

function update(t) {
  if (t - last < 1000 / FPS) {
    requestAnimationFrame(update);
    return;
  }
  last = t;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBall();
  drawPaddle();
  drawBricks();

  if (!pending) {
    ball.x += ball.dx;
    ball.y += ball.dy;
  }

  if (moveLeft && paddle.x > 0) paddle.x -= paddle.speed;
  if (moveRight && paddle.x + paddle.w < canvas.width / SCALE) paddle.x += paddle.speed;

  // Wall
  if (ball.x < ball.r || ball.x > canvas.width / SCALE - ball.r) ball.dx *= -1;
  if (ball.y < ball.r) ball.dy *= -1;

  // Paddle
  if (
    ball.y + ball.r >= canvas.height / SCALE - 30 &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.w
  ) {
    ball.dy *= -1;
  }

  // Brick collision
  if (!pending) {
    bricks.flat().forEach(b => {
      if (
        b.active &&
        ball.x > b.x &&
        ball.x < b.x + bw &&
        ball.y > b.y &&
        ball.y < b.y + bh
      ) {
        ball.dy *= -1;
        showQuestion(b);
      }
    });
  }

  if (ball.y > canvas.height / SCALE) gameOver();

  requestAnimationFrame(update);
}

// ================= GAME OVER =================
function gameOver() {
  alert("Game Over! Skor: " + score);
  score = 0;
  document.getElementById("score").innerText = "Score: 0";
  initBricks();
  ball.x = 420;
  ball.y = 380;
}

// ================= START =================
initBricks();
requestAnimationFrame(update);
