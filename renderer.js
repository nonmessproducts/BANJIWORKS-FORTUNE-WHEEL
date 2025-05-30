const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const controlBtn = document.getElementById('controlBtn');

let spinning = false;
let stopping = false;
let currentAngle = 0;
let angularVelocity = 0;
let targetAngle = 0;
let chosenPrizeIndex = 0;
let lastTickIndex = -1;

function getPrizes() {
  const rows = document.querySelectorAll('#prizeTable tr');
  return Array.from(rows).slice(1).map((row, i) => {
    const prizeInput = row.querySelector('input');
    const probCell = row.querySelector('.prob');
    return {
      label: prizeInput ? prizeInput.value : `Prize ${i + 1}`,
      probability: parseFloat(probCell ? probCell.textContent : "0") / 100,
    };
  });
}

function calculateProbabilities() {
  const prizes = getPrizes();
  const count = prizes.length;
  const probCells = document.querySelectorAll('.prob');

  const fixedProb = 0.001;
  const remaining = 1.0 - fixedProb;

  const steps = count - 1;
  const weights = [];
  let totalWeight = 0;

  for (let i = 1; i <= steps; i++) {
    const w = Math.pow(2, i);
    weights.push(w);
    totalWeight += w;
  }

  if (probCells[0]) probCells[0].textContent = (fixedProb * 100).toFixed(1);

  for (let i = 1; i < count; i++) {
    const adjusted = (weights[steps - i] / totalWeight) * remaining;
    if (probCells[i]) probCells[i].textContent = (adjusted * 100).toFixed(1);
  }
}

function getCumulativeProbabilities() {
  const prizes = getPrizes();
  const thresholds = [];
  let sum = 0;
  for (let prize of prizes) {
    sum += prize.probability;
    thresholds.push(sum);
  }
  return thresholds;
}

function drawWheel() {
  const prizes = getPrizes();
  const segmentAngle = (2 * Math.PI) / prizes.length;
  const radius = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(currentAngle);

  const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A2', '#A233FF', '#33FFF3', '#FFD700', '#00CED1'];

  prizes.forEach((prize, i) => {
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
  const prizes = getPrizes();
  const segmentAngle = (2 * Math.PI) / prizes.length;

  if (spinning) {
    if (stopping) {
      const remaining = targetAngle - currentAngle;
      if (remaining <= 0.01) {
        currentAngle = targetAngle;
        spinning = false;
        stopping = false;
        drawWheel();

        const resultText = prizes[chosenPrizeIndex].label;
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
  }

  drawWheel();
  requestAnimationFrame(animate);
}

controlBtn.addEventListener('click', () => {
  if (!spinning) {
    spinning = true;
    stopping = false;
    angularVelocity = 0.35;
    controlBtn.textContent = "Stop";
  } else if (!stopping) {
    const thresholds = getCumulativeProbabilities();
    const r = Math.random();
    chosenPrizeIndex = thresholds.findIndex(p => r < p);

    const prizes = getPrizes();
    const segmentAngle = (2 * Math.PI) / prizes.length;
    const prizeCenter = chosenPrizeIndex * segmentAngle + segmentAngle / 2;
    const currentMod = currentAngle % (2 * Math.PI);
    const delta = (-Math.PI / 2 - prizeCenter + 2 * Math.PI) % (2 * Math.PI);
    const extraRotations = 4;

    targetAngle = currentAngle - currentMod + delta + extraRotations * 2 * Math.PI;
    stopping = true;
  }
});

document.getElementById("addRowBtn").addEventListener("click", () => {
  const table = document.getElementById("prizeTable");
  const rowCount = table.rows.length;
  if (rowCount >= 9) return;

  const newRow = table.insertRow();
  newRow.innerHTML = `<td>${rowCount}등</td><td><input type="text" value="${rowCount}등 보상"></td><td class="prob">0</td>`;
});

document.getElementById("adjustProbBtn").addEventListener("click", () => {
  calculateProbabilities();
});

document.addEventListener("DOMContentLoaded", () => {
  drawWheel();
  animate();
});
