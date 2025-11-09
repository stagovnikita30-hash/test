const submitBtn = document.getElementById("submitBtn"); 
const clearBtn = document.getElementById("clearBtn");
const resultDiv = document.getElementById("result");
const questions = document.querySelectorAll(".question");

// Музыка
const bgMusic = document.getElementById("bgMusic");
const volumeControl = document.getElementById("volumeControl");

// Устанавливаем громкость по умолчанию 30%
bgMusic.volume = 0.3;

// Изменение громкости через ползунок
volumeControl.addEventListener("input", () => {
  bgMusic.volume = volumeControl.value;
});

// Загрузка сохранённых ответов
questions.forEach(q => {
  const id = q.dataset.id;
  const saved = localStorage.getItem(`answer_${id}`);
  if (saved) q.querySelector("textarea").value = saved;
});

// Сохраняем все ответы в localStorage
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

// Очистка localStorage и полей
clearBtn.addEventListener("click", () => {
  questions.forEach(q => q.querySelector("textarea").value = "");
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("answer_")) localStorage.removeItem(key);
  });
  resultDiv.innerText = "";
});

submitBtn.addEventListener("click", async () => {
  submitBtn.disabled = true;
  submitBtn.innerText = "Анализируем...";

  saveAnswers();

  // Формируем единый текст для GPT
  let combinedText = "";
  questions.forEach((q, i) => {
    const label = q.querySelector("label").innerText;
    const answer = q.querySelector("textarea").value || "не отвечено";
    combinedText += `${label}\nОтвет: ${answer}\n\n`;
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
    console.error(err);
    resultDiv.innerText = "Ошибка при анализе.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Анализировать";
  }
});
