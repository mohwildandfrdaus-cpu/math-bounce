const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =========================
// BALL
// =========================
let ball = { x: canvas.width/2, y: canvas.height-40, radius: 10, dx: 4, dy: -4 };

// =========================
// PADDLE
// =========================
let paddle = { w: 120, h: 18, x: canvas.width/2 - 60, speed: 8, right: false, left: false };

// =========================
// SCORE & LEVEL
// =========================
let score = 0;
let level = 1;

// =========================
// BRICKS + QUESTIONS
// =========================
const brickRowCount = 2;
const brickColumnCount = 5;
const brickWidth = 140;
const brickHeight = 35;
const brickPadding = 15;
const brickOffsetTop = 50;

const questions = [
    { q: "5 + 3 = ?", a: "8" },
    { q: "7 - 2 = ?", a: "5" },
    { q: "4 + 6 = ?", a: "10" },
    { q: "9 - 4 = ?", a: "5" },
    { q: "3 + 3 = ?", a: "6" },
    { q: "10 - 7 = ?", a: "3" },
    { q: "2 + 7 = ?", a: "9" },
    { q: "8 - 5 = ?", a: "3" },
    { q: "1 + 8 = ?", a: "9" },
    { q: "6 - 2 = ?", a: "4" }
];

let colorSet = ["#ff4757","#1e90ff","#ffa502","#2ed573","#eccc68",
                "#ff6b81","#7bed9f","#70a1ff","#ff7f50","#3742fa"];

let bricks;
let pendingBrick = null;
let answerChoices = [];
let timer;

// =========================
// INIT BRICKS RANDOM
// =========================
function initBricks() {
    bricks = [];
    questions.sort(() => Math.random() - 0.5);
    let index = 0;

    for (let r = 0; r < brickRowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[r][c] = {
                x: 0,
                y: 0,
                status: 1,
                color: colorSet[index],
                soal: questions[index].q,
                jawaban: questions[index].a
            };
            index++;
        }
    }
}

// =========================
// PRESS VISUAL
// =========================
function pressChoiceVisual(i) {
    const wrap = document.getElementById("choices");
    const el = wrap.children[i];
    if (!el) return;

    el.classList.add("active");
    setTimeout(() => el.classList.remove("active"), 150);
}

function pressChoice(i) {
    if (!pendingBrick) return;
    pressChoiceVisual(i);
    checkAnswer(i);
}

// =========================
// CONTROL
// =========================
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (key === "arrowright") paddle.right = true;
    if (key === "arrowleft") paddle.left = true;

    if (pendingBrick) {
        if (key === "a") pressChoice(0);
        if (key === "b") pressChoice(1);
        if (key === "c") pressChoice(2);
    }
});

document.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    if (key === "arrowright") paddle.right = false;
    if (key === "arrowleft") paddle.left = false;
});

// =========================
// DRAW BALL & PADDLE
// =========================
function drawBall(){
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
}

function drawPaddle(){
    ctx.fillStyle="#fff";
    ctx.fillRect(paddle.x, canvas.height - paddle.h - 10, paddle.w, paddle.h);
}

// =========================
// DRAW BRICKS (CENTER FIXED)
// =========================
function drawBricks() {
    const totalWidth =
        brickColumnCount * brickWidth +
        (brickColumnCount - 1) * brickPadding;

    const startX = (canvas.width - totalWidth) / 2;

    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            let b = bricks[r][c];

            if (b.status === 1) {
                b.x = startX + c * (brickWidth + brickPadding);
                b.y = brickOffsetTop + r * (brickHeight + brickPadding);

                ctx.fillStyle = b.color;
                ctx.fillRect(b.x, b.y, brickWidth, brickHeight);
            }
        }
    }
}

// =========================
// QUESTION POPUP + COLOR COUNTDOWN
// =========================
function showQuestion(brick){
    pendingBrick = brick;

    document.getElementById("question").innerText =
        brick.soal + " (Tekan A / B / C)";

    let real = brick.jawaban;
    let fake1 = String(Number(real) + 1);
    let fake2 = String(Number(real) - 1);

    answerChoices = [real, fake1, fake2].sort(() => Math.random() - 0.5);

    let wrap = document.getElementById("choices");
    wrap.innerHTML = "";

    const labels = ["A. ", "B. ", "C. "];

    answerChoices.forEach((o, i) => {
        let div = document.createElement("div");
        div.className = "choice";
        div.innerText = labels[i] + o;
        div.addEventListener("click", () => pressChoice(i));
        wrap.appendChild(div);
    });

    let timeLeft = 10;
    const countdown = document.getElementById("countdown");

    countdown.classList.remove("hidden");
    countdown.innerText = timeLeft;

    // ✅ WARNA BERGANTI SETIAP DETIK
    const countdownColors = ["#10b981", "#ff4757", "#1e90ff", "#f1c40f", "#e67e22", "#9b59b6"];
    let colorIndex = 0;

    timer = setInterval(() => {
        timeLeft--;
        countdown.innerText = timeLeft;

        countdown.style.color = countdownColors[colorIndex];
        colorIndex = (colorIndex + 1) % countdownColors.length;

        if(timeLeft <= 0){
            clearInterval(timer);
            countdown.classList.add("hidden");
            pendingBrick = null;

            document.getElementById("question").innerText = "";
            document.getElementById("choices").innerHTML = "";

            gameOver();
        }
    }, 1000);
}

// =========================
// CHECK ANSWER
// =========================
function checkAnswer(index){
    if (!pendingBrick) return;

    clearInterval(timer);
    document.getElementById("countdown").classList.add("hidden");

    let brick = pendingBrick;

    if(answerChoices[index] === brick.jawaban){
        brick.status = 0;
        score += 10;
    }

    pendingBrick = null;
    document.getElementById("question").innerText = "";
    document.getElementById("choices").innerHTML = "";

    document.getElementById("score").innerText = "Score: " + score;

    if (bricks.flat().every(b => b.status === 0)) {
        level++;
        ball.dx *= 1.2;
        ball.dy *= 1.2;
        document.getElementById("level").innerText = "Level: " + level;
        resetGame();
    }
}

// =========================
// COLLISION
// =========================
function collision(){
    if (pendingBrick) return;

    for(let r = 0; r < brickRowCount; r++){
        for(let c = 0; c < brickColumnCount; c++){
            let b = bricks[r][c];

            if(b.status === 1){
                if(
                    ball.x > b.x &&
                    ball.x < b.x + brickWidth &&
                    ball.y > b.y &&
                    ball.y < b.y + brickHeight
                ){
                    ball.dy = -ball.dy;
                    showQuestion(b);
                }
            }
        }
    }
}

// =========================
// GAME OVER
// =========================
function gameOver() {
    alert("Game Over! Skor akhir: " + score);

    score = 0;
    level = 1;

    document.getElementById("score").innerText = "Score: " + score;
    document.getElementById("level").innerText = "Level: " + level;

    resetGame();
}

// =========================
// RESET GAME
// =========================
function resetGame(){
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 40;
    ball.dx = 4 + level * 0.5;
    ball.dy = -4 - level * 0.5;

    paddle.x = canvas.width / 2 - paddle.w / 2;

    initBricks();
}

// =========================
// LOOP
// =========================
function update(){

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBall();
    drawPaddle();
    drawBricks();
    collision();

    if(!pendingBrick){
        ball.x += ball.dx;
        ball.y += ball.dy;
    }

    if(paddle.right) paddle.x += paddle.speed;
    if(paddle.left) paddle.x -= paddle.speed;

    if(paddle.x < 0) paddle.x = 0;
    if(paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;

    if(ball.x + ball.radius > canvas.width){
        ball.x = canvas.width - ball.radius;
        ball.dx = -ball.dx;
    }
    if(ball.x - ball.radius < 0){
        ball.x = ball.radius;
        ball.dx = -ball.dx;
    }

    if(ball.y - ball.radius < 0){
        ball.y = ball.radius;
        ball.dy = -ball.dy;
    }

    if(
        ball.y + ball.radius >= canvas.height - paddle.h - 10 &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.w
    ){
        ball.y = canvas.height - paddle.h - 10 - ball.radius;
        ball.dy = -ball.dy;
    }

    if (ball.y - ball.radius > canvas.height) {
        gameOver();
        return;
    }

    requestAnimationFrame(update);
}

// START GAME
initBricks();
update();