const submitBtn = document.getElementById("submitBtn"); 
const clearBtn = document.getElementById("clearBtn");
const resultDiv = document.getElementById("result");
const questions = document.querySelectorAll(".question");

// Музыка
const bgMusic = document.getElementById("bgMusic");
const volumeControl = document.getElementById("volumeControl");

// Очень тихая музыка по умолчанию
bgMusic.volume = 0.01;

document.addEventListener("click", () => {
  if (bgMusic.paused) bgMusic.play();
}, { once: true });

// Ползунок с низкой чувствительностью
volumeControl.addEventListener("input", () => {
  bgMusic.volume = volumeControl.value / 10;
  if (bgMusic.paused) bgMusic.play();
});

// Восстановление сохранённых ответов
questions.forEach(q => {
  const id = q.dataset.id;
  const saved = localStorage.getItem(`answer_${id}`);
  if(saved) q.querySelector("textarea").value = saved;
});

// Сохранение ответов
function saveAnswers(){
  questions.forEach(q=>{
    const id = q.dataset.id;
    const answer = q.querySelector("textarea").value;
    if(answer.trim()){
      localStorage.setItem(`answer_${id}`, answer);
    }else{
      localStorage.removeItem(`answer_${id}`);
    }
  });
}

// Очистка
clearBtn.addEventListener("click", () => {
  questions.forEach(q => q.querySelector("textarea").value = "");
  Object.keys(localStorage).forEach(key => {
    if(key.startsWith("answer_")) localStorage.removeItem(key);
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
  } catch(err) {
    resultDiv.innerText = "Ошибка при анализе.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Анализировать";
  }
});
