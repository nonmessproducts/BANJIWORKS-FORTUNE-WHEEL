const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const controlBtn = document.getElementById('controlBtn');

const tickSound = document.getElementById("tick");
const clickSound = document.getElementById("click");
const winSound = document.getElementById("win");
const firstWinSound = document.getElementById("firstWin");

let spinning = false;
let stopping = false;
let currentAngle = 0;
let angularVelocity = 0;
let targetAngle = 0;
let chosenPrizeIndex = 0;
let lastTickIndex = -1;

const prizeData = [
  { label: "1캐럿 다이아💎 증정", probability: 0.001 },
  { label: "다이아💎 세팅 변경", probability: 0.01 },
  { label: "5천원 할인", probability: 0.08 },
  { label: "재방문 1만원 할인권", probability: 0.15 },
  { label: "3천원 할인", probability: 0.30 },
  { label: "1천원 할인", probability: 0.459 }
];

function getCumulativeProbabilities() {
  const thresholds = [];
  let sum = 0;
  for (let prize of prizeData) {
    sum += prize.probability;
    thresholds.push(sum);
  }
  return thresholds;
}

function drawWheel() {
  const segmentAngle = (2 * Math.PI) / prizeData.length;
  const radius = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(currentAngle);

  const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A2', '#A233FF', '#33FFF3'];

  prizeData.forEach((prize, i) => {
    const startAngle = i * segmentAngle;
    const endAngle = startAngle + segmentAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    ctx.save();
    ctx.rotate(startAngle + segmentAngle / 2);
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.font = "16px Arial";
    ctx.fillText(prize.label, radius * 0.65, 0);
    ctx.restore();
  });

  ctx.restore();
}

function resetState() {
  spinning = false;
  stopping = false;
  angularVelocity = 0;
  controlBtn.textContent = "Start";
  lastTickIndex = -1;
}

function animate() {
  const segmentAngle = (2 * Math.PI) / prizeData.length;

  if (spinning) {
    if (stopping) {
      const remaining = targetAngle - currentAngle;
      if (remaining <= 0.01) {
        currentAngle = targetAngle;
        spinning = false;
        stopping = false;
        drawWheel();

        const resultText = prizeData[chosenPrizeIndex].label;
        const sound = chosenPrizeIndex === 0 ? firstWinSound : winSound;
        sound.play();
        setTimeout(() => {
          alert(`당첨: ${resultText}`);
          resetState();
        }, 100);
      } else {
        angularVelocity = Math.max(remaining * 0.06, 0.002);
        currentAngle += angularVelocity;
      }
    } else {
      currentAngle += angularVelocity;
    }

    const modAngle = (2 * Math.PI + (currentAngle % (2 * Math.PI))) % (2 * Math.PI);
    const currentIndex = Math.floor(((2 * Math.PI - modAngle + Math.PI / 2) % (2 * Math.PI)) / segmentAngle);

    if (currentIndex !== lastTickIndex) {
      tickSound.currentTime = 0;
      tickSound.play();
      lastTickIndex = currentIndex;
    }
  }

  drawWheel();
  requestAnimationFrame(animate);
}

controlBtn.addEventListener('click', () => {
  clickSound.play();

  if (!spinning) {
    spinning = true;
    stopping = false;
    angularVelocity = 0.35;
    controlBtn.textContent = "Stop";
  } else if (!stopping) {
    const thresholds = getCumulativeProbabilities();
    const r = Math.random();
    chosenPrizeIndex = thresholds.findIndex(p => r < p);

    const segmentAngle = (2 * Math.PI) / prizeData.length;
    const prizeCenter = chosenPrizeIndex * segmentAngle + segmentAngle / 2;
    const currentMod = currentAngle % (2 * Math.PI);
    const delta = (-Math.PI / 2 - prizeCenter + 2 * Math.PI) % (2 * Math.PI);
    const extraRotations = 4;

    targetAngle = currentAngle - currentMod + delta + extraRotations * 2 * Math.PI;
    stopping = true;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  drawWheel();
  animate();
});
