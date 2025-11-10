const submitBtn = document.getElementById("submitBtn"); 
const clearBtn = document.getElementById("clearBtn");
const resultDiv = document.getElementById("result");
const questions = document.querySelectorAll(".question");

// Музыка
const bgMusic = document.getElementById("bgMusic");
const volumeControl = document.getElementById("volumeControl");

// Список музыки
const musicList = [
  'stalker-music1.mp3',
  'stalker-music2.mp3',
  'stalker-music3.mp3',
  'stalker-music4.mp3',
  'stalker-music5.mp3',
  'stalker-music6.mp3',
  'stalker-music7.mp3',
  'stalker-music8.mp3',
  'stalker-music9.mp3',
  'stalker-music10.mp3'
];
let musicIndex = 0;

// Первый трек
bgMusic.src = musicList[musicIndex];
bgMusic.volume = 0.005;

// Включаем музыку после первого клика
document.addEventListener("click", () => {
  if (bgMusic.paused) bgMusic.play();
}, { once: true });

// Смена треков по окончании
bgMusic.addEventListener('ended', () => {
  musicIndex = (musicIndex + 1) % musicList.length;
  bgMusic.src = musicList[musicIndex];
  bgMusic.play();
});

// Управление громкостью (0-1%)
volumeControl.addEventListener("input", () => {
  bgMusic.volume = parseFloat(volumeControl.value);
  if (bgMusic.paused) bgMusic.play();
});

// Восстановление сохранённых ответов
questions.forEach(q => {
  const id = q.dataset.id;
  const saved = localStorage.getItem(`answer_${id}`);
  if (saved) q.querySelector("textarea").value = saved;
});

// Сохранение ответов
function saveAnswers() {
  questions.forEach(q => {
    const id = q.dataset.id;
    const answer = q.querySelector("textarea").value;
    if (answer.trim()) {
      localStorage.setItem(`answer_${id}`, answer);
    } else {
      localStorage.removeItem(`answer_${id}`);
    }
  });
}

// Очистка
clearBtn.addEventListener("click", () => {
  questions.forEach(q => q.querySelector("textarea").value = "");
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("answer_")) localStorage.removeItem(key);
  });
  resultDiv.innerText = "";
});

// Анализ
submitBtn.addEventListener("click", async () => {
  submitBtn.disabled = true;
  submitBtn.innerText = "Анализируем...";

  saveAnswers();

  let combinedText = "";
  questions.forEach(q => {
    combinedText += `${q.querySelector("label").innerText}\nОтвет: ${q.querySelector("textarea").value || "не отвечено"}\n\n`;
  });

  try {
    const res = await fetch("/api/analyze.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: combinedText })
    });

    const data = await res.json();
    resultDiv.innerText = data.analysis;
  } catch (err) {
    resultDiv.innerText = "Ошибка при анализе.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Анализировать";
  }
});

// Плавное слайдшоу фонов
const backgrounds = [
  'stalker-bg1.jpg',
  'stalker-bg2.jpg',
  'stalker-bg3.jpg',
  'stalker-bg4.jpg',
  'stalker-bg5.jpg',
  'stalker-bg6.jpg',
  'stalker-bg7.jpg',
  'stalker-bg8.jpg',
  'stalker-bg9.jpg',
  'stalker-bg10.jpg'
];

let currentBg = 0;

// Создаём два слоя для плавного перехода
const bgLayer1 = document.createElement('div');
const bgLayer2 = document.createElement('div');

[bgLayer1, bgLayer2].forEach(layer => {
  layer.style.position = 'fixed';
  layer.style.top = 0;
  layer.style.left = 0;
  layer.style.width = '100%';
  layer.style.height = '100%';
  layer.style.backgroundSize = 'cover';
  layer.style.backgroundPosition = 'center';
  layer.style.transition = 'opacity 2s ease-in-out';
  layer.style.zIndex = -1;
  document.body.appendChild(layer);
});

bgLayer1.style.backgroundImage = `url('${backgrounds[currentBg]}')`;
bgLayer1.style.opacity = 1;
bgLayer2.style.opacity = 0;

let showingLayer1 = true;

function changeBackground() {
  currentBg = (currentBg + 1) % backgrounds.length;
  const nextLayer = showingLayer1 ? bgLayer2 : bgLayer1;
  nextLayer.style.backgroundImage = `url('${backgrounds[currentBg]}')`;
  nextLayer.style.opacity = 1;

  const prevLayer = showingLayer1 ? bgLayer1 : bgLayer2;
  prevLayer.style.opacity = 0;

  showingLayer1 = !showingLayer1;
}

// Смена каждые 60 секунд
setInterval(changeBackground, 60000);
