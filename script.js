function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

// CANVAS
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// WARNA & SUARA
let paddleColor = "#ffffff";
let ballColor = "#10b981";

const bounceSound = document.getElementById("bounceSound");
const brickBreakSound = document.getElementById("brickBreakSound");

// =====================
// WARNA RANDOM
// =====================
function getRandomColorExcept(except) {
    const colors = ["#10b981", "#38bdf8", "#facc15", "#f43f5e", "#a855f7", "#fb923c"];
    let pick;
    do { pick = colors[Math.floor(Math.random() * colors.length)]; }
    while (pick === except);
    return pick;
}

function changeBallColor() { ballColor = getRandomColorExcept(ballColor); }
function changePaddleColor() { paddleColor = getRandomColorExcept(paddleColor); }

function highlightText(id) {
    const el = document.getElementById(id);
    el.style.color = getRandomColorExcept(el.style.color);
    el.style.textShadow = `0 0 12px ${el.style.color}`;
}

// =====================
// AUDIO FIX (Mobile)
// =====================
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    bounceSound.play().then(() => bounceSound.pause()).catch(()=>{});
    brickBreakSound.play().then(() => brickBreakSound.pause()).catch(()=>{});
    bounceSound.currentTime = 0;
    brickBreakSound.currentTime = 0;
    audioUnlocked = true;
}
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });

// =====================
// BALL & PADDLE
// =====================
let ball = { x: canvas.width/2, y: canvas.height-40, radius: 10, dx: 4, dy: -4 };
let paddle = { w: 120, h: 18, x: canvas.width/2 - 60, speed: 8, right: false, left: false };

let score = 0;
let level = 1;

// =====================
// BRICKS + QUESTIONS
// =====================
const brickRowCount = 2;
const brickColumnCount = 5;
const brickWidth = 140;
const brickHeight = 35;
const brickPadding = 15;
const brickOffsetTop = 50;

const questions = [
    { q: "5 + 3 = ?", a: "8" }, { q: "7 - 2 = ?", a: "5" },
    { q: "4 + 6 = ?", a: "10" }, { q: "9 - 4 = ?", a: "5" },
    { q: "3 + 3 = ?", a: "6" }, { q: "10 - 7 = ?", a: "3" },
    { q: "2 + 7 = ?", a: "9" }, { q: "8 - 5 = ?", a: "3" },
    { q: "1 + 8 = ?", a: "9" }, { q: "6 - 2 = ?", a: "4" }
];

let colorSet = ["#ff4757","#1e90ff","#ffa502","#2ed573","#eccc68","#ff6b81","#7bed9f","#70a1ff","#ff7f50","#3742fa"];
let bricks, pendingBrick = null, answerChoices = [], timer;

// =====================
// INIT BRICKS
// =====================
function initBricks() {
    bricks = [];
    questions.sort(() => Math.random() - 0.5);
    let idx = 0;

    for (let r = 0; r < brickRowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[r][c] = {
                x: 0, y: 0,
                status: 1,
                color: colorSet[idx],
                soal: questions[idx].q,
                jawaban: questions[idx].a
            };
            idx++;
        }
    }
}

// =====================
// DRAW OBJECTS
// =====================
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.shadowBlur = 25;
    ctx.shadowColor = ballColor;
    ctx.fillStyle = ballColor;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPaddle() {
    ctx.fillStyle = paddleColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = paddleColor;
    drawRoundedRect(ctx, paddle.x, canvas.height - paddle.h - 10, paddle.w, paddle.h, 12);
    ctx.shadowBlur = 0;
}

function drawBricks() {
    const totalWidth = brickColumnCount * brickWidth + (brickColumnCount - 1) * brickPadding;
    const startX = (canvas.width - totalWidth) / 2;

    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            let b = bricks[r][c];
            if (b.status === 1) {
                b.x = startX + c * (brickWidth + brickPadding);
                b.y = brickOffsetTop + r * (brickHeight + brickPadding);
                ctx.fillStyle = b.color;
                drawRoundedRect(ctx, b.x, b.y, brickWidth, brickHeight, 8);
            }
        }
    }
}

// =====================
// BRICK BREAK EFFECT
// =====================
function brickBreakEffect(brick) {
    const particles = [];
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: brick.x + brickWidth/2,
            y: brick.y + brickHeight/2,
            dx: (Math.random()-0.5)*6,
            dy: (Math.random()-0.5)*6,
            radius: Math.random()*4+2,
            color: brick.color
        });
    }

    const anim = setInterval(() => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        drawBall(); drawPaddle(); drawBricks();

        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.radius *= 0.95;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        if (particles.every(p => p.radius < 0.5)) clearInterval(anim);
    }, 16);
}

// =====================
// QUESTION SYSTEM
// =====================
function showQuestion(brick) {
    pendingBrick = brick;

    document.getElementById("question").innerText = brick.soal + " (Tekan A/B/C)";

    let real = brick.jawaban;
    let fake1 = String(Number(real) + 1);
    let fake2 = String(Number(real) - 1);

    answerChoices = [real, fake1, fake2].sort(() => Math.random() - 0.5);

    const wrap = document.getElementById("choices");
    wrap.innerHTML = "";

    ["A. ", "B. ", "C. "].forEach((label, i) => {
        const div = document.createElement("div");
        div.className = "choice";
        div.innerText = label + answerChoices[i];
        div.onclick = ()=>pressChoice(i);
        wrap.appendChild(div);
    });

    let t = 15;
    const cd = document.getElementById("countdown");
    cd.classList.remove("hidden");
    cd.innerText = t;

    timer = setInterval(() => {
        t--;
        cd.innerText = t;
        cd.style.color = getRandomColorExcept(cd.style.color);

        if (t <= 0) {
            clearInterval(timer);
            cd.classList.add("hidden");
            pendingBrick = null;
            document.getElementById("question").innerText = "";
            wrap.innerHTML = "";
            gameOver();
        }
    }, 1000);
}

function pressChoice(i) {
    if (!pendingBrick) return;

    clearInterval(timer);
    document.getElementById("countdown").classList.add("hidden");

    let brick = pendingBrick;

    if (answerChoices[i] === brick.jawaban) {
        brick.status = 0;

        score += 10;
        document.getElementById("score").innerText = "Score: " + score;
        highlightText("score");

    } else {
        gameOver();
        return;
    }

    if (audioUnlocked) brickBreakSound.play();
    brickBreakEffect(brick);
    changeBallColor();

    pendingBrick = null;
    document.getElementById("question").innerText = "";
    document.getElementById("choices").innerHTML = "";

    if (bricks.flat().every(b => b.status === 0)) {
        level++;
        ball.dx *= 1.05;
        ball.dy *= 1.05;
        ballColor = getRandomColorExcept(paddleColor);

        document.getElementById("level").innerText = "Level: " + level;
        highlightText("level");

        resetGame();
    }
}

// =====================
// RANDOM COLOR ON OTHER BRICK
// =====================
function changeOtherBrickRandomly(hitBrick) {
    const active = bricks.flat().filter(b => b.status === 1 && b !== hitBrick);
    if (active.length === 0) return;

    const rand = active[Math.floor(Math.random() * active.length)];
    rand.color = getRandomColorExcept(rand.color);
}

// =====================
// COLLISION DETECTION
// =====================
function collision() {
    if (pendingBrick) return;

    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            let b = bricks[r][c];

            if (b.status===1 &&
                ball.x > b.x && ball.x < b.x + brickWidth &&
                ball.y > b.y && ball.y < b.y + brickHeight){

                ball.dy = -ball.dy;
                changeBallColor();
                if (audioUnlocked) bounceSound.play();

                showQuestion(b);
                changeOtherBrickRandomly(b);
            }
        }
    }
}

// =====================
// GAME OVER
// =====================
function gameOver() {
    alert("Game Over! Skor akhir: " + score);

    score = 0;
    level = 1;

    document.getElementById("score").innerText = "Score: " + score;
    document.getElementById("level").innerText = "Level: " + level;

    ballColor = getRandomColorExcept(paddleColor);

    resetGame();
}

// =====================
// RESET GAME
// =====================
function resetGame() {
    ball.x = canvas.width/2;
    ball.y = canvas.height - 40;
    ball.dx = 4 + level * 0.5;
    ball.dy = -4 - level * 0.5;

    paddle.x = canvas.width/2 - paddle.w/2;

    initBricks();
}

// =====================
// KEYBOARD CONTROL
// =====================
document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") paddle.right = true;
    if (e.key === "ArrowLeft") paddle.left = true;

    if (pendingBrick) {
        if (e.key === "a" || e.key === "A") pressChoice(0);
        if (e.key === "b" || e.key === "B") pressChoice(1);
        if (e.key === "c" || e.key === "C") pressChoice(2);
    }
});

document.addEventListener("keyup", e => {
    if (e.key === "ArrowRight") paddle.right = false;
    if (e.key === "ArrowLeft") paddle.left = false;
});

// =====================
// MOBILE TOUCH CONTROL
// =====================
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");

btnLeft.addEventListener("touchstart", () => { paddle.left = true; });
btnLeft.addEventListener("touchend", () => { paddle.left = false; });

btnRight.addEventListener("touchstart", () => { paddle.right = true; });
btnRight.addEventListener("touchend", () => { paddle.right = false; });

// Disable screen dragging
btnLeft.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
btnRight.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

// =====================
// WALL COLOR CYCLING
// =====================
const wallColors = ["#10b981","#38bdf8","#facc15","#f43f5e","#a855f7","#fb923c"];
let wallIndex = 0;

function changeWallColor(){
    wallIndex = (wallIndex + 1) % wallColors.length;
    canvas.style.border = `4px solid ${wallColors[wallIndex]}`;
}

// =====================
// MAIN LOOP
// =====================
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBall();
    drawPaddle();
    drawBricks();

    collision();

    if (!pendingBrick) {
        ball.x += ball.dx;
        ball.y += ball.dy;
    }

    if (paddle.right) paddle.x += paddle.speed;
    if (paddle.left)  paddle.x -= paddle.speed;

    // Paddle boundary
    if (paddle.x < 0) {
        paddle.x = 0;
        changePaddleColor();
    }
    if (paddle.x + paddle.w > canvas.width) {
        paddle.x = canvas.width - paddle.w;
        changePaddleColor();
    }

    // Wall collision
    if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx = -ball.dx;
        changeBallColor();
        if (audioUnlocked) bounceSound.play();
        changeWallColor();
    }
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.dx = -ball.dx;
        changeBallColor();
        if (audioUnlocked) bounceSound.play();
        changeWallColor();
    }
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy = -ball.dy;
        changeBallColor();
        if (audioUnlocked) bounceSound.play();
        changeWallColor();
    }

    // BOTTOM — Game Over
    if (ball.y + ball.radius > canvas.height) {
        gameOver();
    }

    // Paddle hit
    const paddleTop = canvas.height - paddle.h - 10;
    if (ball.y + ball.radius > paddleTop &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.w &&
        ball.dy > 0)
    {
        ball.dy = -ball.dy;
        changeBallColor();
        if (audioUnlocked) bounceSound.play();
    }

    requestAnimationFrame(update);
}

// START GAME
initBricks();
update();
