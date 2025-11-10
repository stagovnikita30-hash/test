const submitBtn = document.getElementById("submitBtn"); 
const clearBtn = document.getElementById("clearBtn");
const resultDiv = document.getElementById("result");
const questions = document.querySelectorAll(".question");

// -------------------- МУЗЫКА --------------------
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

// Настройки аудио
bgMusic.loop = false; // отключаем повтор текущего трека
bgMusic.src = musicList[musicIndex];
bgMusic.volume = 0.005; // 0.5%

// Включаем музыку после первого клика
document.addEventListener("click", () => {
  if (bgMusic.paused) bgMusic.play();
}, { once: true });

// Смена треков по окончании
bgMusic.addEventListener('ended', () => {
  musicIndex = (musicIndex + 1) % musicList.length;
  bgMusic.src = musicList[musicIndex];
  bgMusic.load(); 
  bgMusic.play();
});

// Управление громкостью
volumeControl.addEventListener("input", () => {
  bgMusic.volume = parseFloat(volumeControl.value);
  if (bgMusic.paused) bgMusic.play();
});

// -------------------- ВОССТАНОВЛЕНИЕ И СОХРАНЕНИЕ ОТВЕТОВ --------------------
questions.forEach(q => {
  const id = q.dataset.id;
  const saved = localStorage.getItem(`answer_${id}`);
  if (saved) q.querySelector("textarea").value = saved;
});

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

// -------------------- АНАЛИЗ --------------------
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

// -------------------- СЛАЙДШОУ ФОНА --------------------
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

// Предзагрузка изображений
backgrounds.forEach(src => {
  const img = new Image();
  img.src = src;
});

// Создаем два слоя для плавного перехода
const bgLayer1 = document.createElement('div');
const bgLayer2 = document.createElement('div');

[bgLayer1, bgLayer2].forEach(layer => {
  layer.style.position = 'fixed';
  layer.style.top = '0';
  layer.style.left = '0';
  layer.style.width = '100%';
  layer.style.height = '100%';
  layer.style.backgroundSize = 'cover';
  layer.style.backgroundPosition = 'center';
  layer.style.transition = 'opacity 2s ease-in-out';
  layer.style.zIndex = '-2';
  layer.style.opacity = '0';
  layer.style.pointerEvents = 'none';
  document.body.appendChild(layer);
});

// Первый фон сразу
bgLayer1.style.backgroundImage = `url('${backgrounds[0]}')`;
bgLayer1.style.opacity = '1';

function changeBackground() {
  const nextBg = (currentBg + 1) % backgrounds.length;
  const topLayer = bgLayer1.style.opacity == '1' ? bgLayer2 : bgLayer1;
  const bottomLayer = topLayer === bgLayer1 ? bgLayer2 : bgLayer1;

  topLayer.style.backgroundImage = `url('${backgrounds[nextBg]}')`;
  topLayer.style.opacity = '1';
  bottomLayer.style.opacity = '0';

  currentBg = nextBg;
}

// Смена каждые 60 секунд
setInterval(changeBackground, 60000);
