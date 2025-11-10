// script.js — полный файл с поддержкой docx-генерации научного отчёта

// --- DOM элементы
const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtnElement = document.getElementById("downloadBtn"); // кнопка в markup (если есть)
const resultDiv = document.getElementById("result");
const questions = document.querySelectorAll(".question");

// --- МУЗЫКА
const bgMusic = document.getElementById("bgMusic");
const volumeControl = document.getElementById("volumeControl");

const musicList = [
  'stalker-music1.mp3','stalker-music2.mp3','stalker-music3.mp3',
  'stalker-music4.mp3','stalker-music5.mp3','stalker-music6.mp3',
  'stalker-music7.mp3','stalker-music8.mp3','stalker-music9.mp3','stalker-music10.mp3'
];
let musicIndex = 0;

bgMusic.loop = false;
bgMusic.src = musicList[musicIndex];
bgMusic.volume = 0.005; // 0.5%

document.addEventListener("click", () => {
  if (bgMusic.paused) bgMusic.play();
}, { once: true });

bgMusic.addEventListener('ended', () => {
  musicIndex = (musicIndex + 1) % musicList.length;
  bgMusic.src = musicList[musicIndex];
  bgMusic.load();
  bgMusic.play();
});

volumeControl.addEventListener("input", () => {
  // ожидается значение 0..0.01 (пример), просто используем напрямую
  bgMusic.volume = parseFloat(volumeControl.value) || 0;
  if (bgMusic.paused) bgMusic.play();
});

// --- ВОССТАНОВЛЕНИЕ И СОХРАНЕНИЕ ОТВЕТОВ
questions.forEach(q => {
  const id = q.dataset.id;
  const saved = localStorage.getItem(`answer_${id}`);
  if (saved) q.querySelector("textarea").value = saved;
});

function saveAnswers() {
  questions.forEach(q => {
    const id = q.dataset.id;
    const answer = q.querySelector("textarea").value;
    if (answer.trim()) localStorage.setItem(`answer_${id}`, answer);
    else localStorage.removeItem(`answer_${id}`);
  });
}

// Очистка
clearBtn.addEventListener("click", () => {
  questions.forEach(q => q.querySelector("textarea").value = "");
  Object.keys(localStorage).forEach(key => { if (key.startsWith("answer_")) localStorage.removeItem(key); });
  resultDiv.innerText = "";
});

// --- АНАЛИЗ (POST /api/analyze.js)
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
    // API теперь возвращает уже "чистый" текст (без markdown), поэтому просто ставим в контейнер
    resultDiv.innerText = data.analysis || "Пустой ответ от сервера.";
  } catch (err) {
    console.error(err);
    resultDiv.innerText = "Ошибка при анализе.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Анализировать";
  }
});

// --- СЛАЙДШОУ ФОНА (плавно)
const backgrounds = [
  'stalker-bg1.jpg','stalker-bg2.jpg','stalker-bg3.jpg','stalker-bg4.jpg','stalker-bg5.jpg',
  'stalker-bg6.jpg','stalker-bg7.jpg','stalker-bg8.jpg','stalker-bg9.jpg','stalker-bg10.jpg'
];
let currentBg = 0;
backgrounds.forEach(src => { const img = new Image(); img.src = src; });

const bgLayer1 = document.createElement('div');
const bgLayer2 = document.createElement('div');
[bgLayer1, bgLayer2].forEach(layer => {
  Object.assign(layer.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'opacity 2s ease-in-out',
    zIndex: '-2',
    opacity: '0',
    pointerEvents: 'none'
  });
  document.body.appendChild(layer);
});
bgLayer1.style.backgroundImage = `url('${backgrounds[0]}')`;
bgLayer1.style.opacity = '1';

function changeBackground() {
  const nextBg = (currentBg + 1) % backgrounds.length;
  const topLayer = bgLayer1.style.opacity === '1' ? bgLayer2 : bgLayer1;
  const bottomLayer = topLayer === bgLayer1 ? bgLayer2 : bgLayer1;
  topLayer.style.backgroundImage = `url('${backgrounds[nextBg]}')`;
  topLayer.style.opacity = '1';
  bottomLayer.style.opacity = '0';
  currentBg = nextBg;
}
setInterval(changeBackground, 60000); // 60s

// ------------------ DOCX: Научный отчёт (ПСИХОПРОФИЛЬ) ------------------
// Параметры титула и контактов — использованы те, что ты дал
const REPORT_TITLE = "ПСИХОПРОФИЛЬ";
const PROJECT_NAME = "ПСИХОПРОФИЛЬ";
const CONTACTS_LINE = "Контакты для связи: p.s.i.h.o_t.e.s.t@bk.ru";
const COPYRIGHT_LINE = "© P.S.I.H.O.T.E.S.T, 2025";

// Для использования docx: добавь в index.html
// <script src="https://cdn.jsdelivr.net/npm/docx@7.3.0/build/index.js"></script>
// библиотека будет доступна как window.docx

function parseSectionsFromAnalysis(text) {
  // ожидаем, что API вернул текст с заголовками, например:
  // "Личностный профиль\n... \nЭмоциональная стабильность\n..."
  // Разбиваем по заголовкам — ищем известные названия разделов
  const headings = [
    "Личностный профиль",
    "Эмоциональная стабильность",
    "Особенности общения",
    "Мотивация",
    "Сильные стороны",
    "Зоны возможных трудностей",
    "Рекомендации для развития",
    "Уточняющие гипотезы и вопросы",
    "Заключение",
    "Данные отсутствуют"
  ];

  // Инициализация
  const sections = {};
  headings.forEach(h => sections[h] = "");

  // Простейший парсер: найдем индекс каждого заголовка в тексте
  // Если нет заголовков — положим весь текст в "Личностный профиль"
  const txt = text || "";
  let foundAny = false;

  // Build positions
  const positions = [];
  headings.forEach(h => {
    const re = new RegExp("^\\s*" + h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "im"); // whole line search
    const lines = txt.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        positions.push({ heading: h, index: i });
        foundAny = true;
        break;
      }
    }
  });

  if (!foundAny) {
    // нет явных заголовков — ставим весь текст в Личностный профиль
    sections["Личностный профиль"] = txt.trim();
    return sections;
  }

  // если есть — разделим по линиям и assign
  const lines = txt.split(/\r?\n/);
  // find all heading occurrences with positions (may be not in order)
  const occ = [];
  headings.forEach(h => {
    const re = new RegExp("^\\s*" + h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "im");
    lines.forEach((ln, idx) => { if (re.test(ln)) occ.push({ heading: h, idx }); });
  });
  // sort by index
  occ.sort((a,b) => a.idx - b.idx);
  // append an artificial end
  occ.push({ heading: null, idx: lines.length });

  for (let k = 0; k < occ.length-1; k++) {
    const head = occ[k].heading;
    const start = occ[k].idx + 1;
    const end = occ[k+1].idx;
    const slice = lines.slice(start, end).join("\n").trim();
    if (head && headings.includes(head)) sections[head] = slice;
  }

  return sections;
}

// Функция создания docx и скачивания
async function createAndDownloadReportDOCX(analysisText) {
  if (!window.docx) {
    alert("Библиотека docx не найдена. Добавь <script src=\"https://cdn.jsdelivr.net/npm/docx@7.3.0/build/index.js\"></script> в head.");
    return;
  }

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = window.docx;

  const doc = new Document({
    styles: {
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true } },
        { id: "NormalText", name: "Normal Text", basedOn: "Normal", run: { size: 24 } }
      ]
    }
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString("ru-RU");

  // Титульный лист
  doc.addSection({
    properties: {},
    headers: {},
    children: [
      new Paragraph({ children: [ new TextRun({ text: PROJECT_NAME, bold: true, size: 48 }) ], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "", spacing: { after: 200 } }),
      new Paragraph({ children: [ new TextRun({ text: REPORT_TITLE, bold: true, size: 40 }) ], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "", spacing: { after: 400 } }),
      new Paragraph({ children: [ new TextRun({ text: `Дата: ${dateStr}`, size: 20 }) ], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "", spacing: { after: 200 } }),
      new Paragraph({ children: [ new TextRun({ text: CONTACTS_LINE, italics: true, size: 18 }) ], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "", spacing: { after: 400 } }),
      new Paragraph({ children: [ new TextRun({ text: COPYRIGHT_LINE, size: 14 }) ], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "", spacing: { after: 400 } }),
      // page break
      new Paragraph({ children: [] })
    ]
  });

  // Parse sections from analysis text
  const sections = parseSectionsFromAnalysis(analysisText);

  // Summary table: краткое содержание (первый 180 символов)
  const tableRows = [];
  tableRows.push(new TableRow({
    children: [
      new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: "Раздел", bold: true }) ] }) ], width: { size: 30, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: "Краткое содержание", bold: true }) ] }) ], width: { size: 70, type: WidthType.PERCENTAGE } })
    ]
  }));

  const order = [
    "Личностный профиль",
    "Эмоциональная стабильность",
    "Особенности общения",
    "Мотивация",
    "Сильные стороны",
    "Зоны возможных трудностей",
    "Рекомендации для развития",
    "Уточняющие гипотезы и вопросы",
    "Заключение"
  ];

  order.forEach(key => {
    const txt = (sections[key] || "").replace(/\s+/g, " ").trim();
    const short = txt ? (txt.length > 180 ? txt.slice(0,180).trim() + "…" : txt) : "—";
    tableRows.push(new TableRow({
      children: [
        new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: key }) ] }) ] }),
        new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: short }) ] }) ] })
      ]
    }));
  });

  // Добавим секцию с таблицей и отдельными разделами
  const sectionChildren = [];

  sectionChildren.push(new Paragraph({ text: "Краткое содержание по разделам", heading: HeadingLevel.HEADING_2 }));
  const summaryTable = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
  sectionChildren.push(summaryTable);
  sectionChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Добавляем детальные разделы: заголовок + параграфы
  order.forEach(key => {
    const body = (sections[key] || "").trim();
    if (!body) return;
    sectionChildren.push(new Paragraph({ text: key, heading: HeadingLevel.HEADING_2 }));
    // split into paragraphs by double newlines
    const paras = body.split(/\n{1,}/).map(p => p.trim()).filter(p => p.length > 0);
    paras.forEach(p => {
      // иногда в тексте встречаются списки "1." — оставляем
      sectionChildren.push(new Paragraph({ children: [ new TextRun({ text: p, size: 24 }) ] }));
    });
    sectionChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  });

  // Footer with contacts on all following pages
  doc.addSection({
    properties: {},
    footers: {
      default: new window.docx.Footer({
        children: [
          new Paragraph({ children: [ new TextRun({ text: CONTACTS_LINE, size: 18 }) ], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [ new TextRun({ text: COPYRIGHT_LINE, size: 18 }) ], alignment: AlignmentType.CENTER })
        ]
      })
    },
    children: sectionChildren
  });

  // Pack and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fnDate = new Date().toISOString().slice(0,10);
  a.download = `Psychoprofile_${fnDate}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Добавим кнопку "Скачать научный отчёт" в интерфейс
const officialDownloadBtn = document.createElement("button");
officialDownloadBtn.innerText = "Скачать официальный отчёт (.docx)";
officialDownloadBtn.style.background = "#2b3b4d";
officialDownloadBtn.style.color = "#fff";
officialDownloadBtn.style.borderRadius = "10px";
officialDownloadBtn.style.padding = "0.6rem 1rem";
officialDownloadBtn.style.cursor = "pointer";
officialDownloadBtn.style.fontWeight = "600";
officialDownloadBtn.style.marginLeft = "6px";
officialDownloadBtn.addEventListener("mouseover", () => officialDownloadBtn.style.transform = "scale(1.03)");
officialDownloadBtn.addEventListener("mouseout", () => officialDownloadBtn.style.transform = "scale(1)");
document.querySelector(".buttons").appendChild(officialDownloadBtn);

// По клику генерируем docx на основе текста в resultDiv
officialDownloadBtn.addEventListener("click", async () => {
  const text = resultDiv.innerText || "";
  if (!text || text.trim().length < 5) {
    alert("Сначала получите результат анализа (нажмите «Анализировать»).");
    return;
  }
  // Создаём и скачиваем
  try {
    await createAndDownloadReportDOCX(text);
  } catch (err) {
    console.error("Ошибка генерации DOCX:", err);
    alert("Ошибка при создании документа. Посмотри в консоли.");
  }
});
