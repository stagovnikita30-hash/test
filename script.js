// -------------------- DOM элементы --------------------
const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");
const resultDiv = document.getElementById("result");
const questions = document.querySelectorAll(".question");

// -------------------- МУЗЫКА --------------------
const bgMusic = document.getElementById("bgMusic");
const volumeControl = document.getElementById("volumeControl");
const musicList = [
  'stalker-music1.mp3','stalker-music2.mp3','stalker-music3.mp3',
  'stalker-music4.mp3','stalker-music5.mp3','stalker-music6.mp3',
  'stalker-music7.mp3','stalker-music8.mp3','stalker-music9.mp3','stalker-music10.mp3'
];
let musicIndex = 0;
bgMusic.src = musicList[musicIndex];
bgMusic.volume = 0.005;

document.addEventListener("click", () => { if (bgMusic.paused) bgMusic.play(); }, { once: true });

bgMusic.addEventListener('ended', () => {
  musicIndex = (musicIndex + 1) % musicList.length;
  bgMusic.src = musicList[musicIndex];
  bgMusic.load();
  bgMusic.play();
});

volumeControl.addEventListener("input", () => { bgMusic.volume = parseFloat(volumeControl.value) || 0; if (bgMusic.paused) bgMusic.play(); });

// -------------------- СОХРАНЕНИЕ И ВОССТАНОВЛЕНИЕ --------------------
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

clearBtn.addEventListener("click", () => {
  questions.forEach(q => q.querySelector("textarea").value = "");
  Object.keys(localStorage).forEach(key => { if (key.startsWith("answer_")) localStorage.removeItem(key); });
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
    resultDiv.innerText = data.analysis || "Пустой ответ от сервера.";
  } catch (err) {
    console.error(err);
    resultDiv.innerText = "Ошибка при анализе.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Анализировать";
  }
});

// -------------------- DOCX: НАУЧНЫЙ ОТЧЁТ --------------------
const REPORT_TITLE = "ПСИХОПРОФИЛЬ";
const PROJECT_NAME = "ПСИХОПРОФИЛЬ";
const CONTACTS_LINE = "Контакты для связи: p.s.i.h.o_t.e.s.t@bk.ru";
const COPYRIGHT_LINE = "© P.S.I.H.O.T.E.S.T, 2025";

function parseSectionsFromAnalysis(text) {
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
  const sections = {};
  headings.forEach(h => sections[h] = "");
  const lines = text.split(/\r?\n/);
  let currentHeading = "Личностный профиль";
  lines.forEach(line => {
    const trim = line.trim();
    if (headings.includes(trim)) currentHeading = trim;
    else if (trim.length) sections[currentHeading] += trim + "\n";
  });
  return sections;
}

async function createAndDownloadReportDOCX(analysisText) {
  if (!window.docx) { alert("Добавь библиотеку docx в head."); return; }
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, Footer } = window.docx;

  const doc = new Document({ styles: { paragraphStyles: [{ id: "NormalText", name:"Normal Text", basedOn:"Normal", run:{size:24} }] } });
  const dateStr = new Date().toLocaleDateString("ru-RU");

  // Титульный лист
  doc.addSection({ properties:{}, children:[
    new Paragraph({ children:[new TextRun({ text: PROJECT_NAME, bold:true, size:48 })], alignment:AlignmentType.CENTER }),
    new Paragraph({ children:[new TextRun({ text: REPORT_TITLE, bold:true, size:40 })], alignment:AlignmentType.CENTER }),
    new Paragraph({ children:[new TextRun({ text:`Дата: ${dateStr}`, size:20 })], alignment:AlignmentType.CENTER }),
    new Paragraph({ children:[new TextRun({ text: CONTACTS_LINE, italics:true, size:18 })], alignment:AlignmentType.CENTER }),
    new Paragraph({ children:[new TextRun({ text: COPYRIGHT_LINE, size:14 })], alignment:AlignmentType.CENTER })
  ]});

  const sections = parseSectionsFromAnalysis(analysisText);

  const tableRows = [new TableRow({ children:[
    new TableCell({ children:[new Paragraph({ children:[new TextRun({ text:"Раздел", bold:true })] })] }),
    new TableCell({ children:[new Paragraph({ children:[new TextRun({ text:"Краткое содержание", bold:true })] })] })
  ]})];

  const order = [
    "Личностный профиль","Эмоциональная стабильность","Особенности общения",
    "Мотивация","Сильные стороны","Зоны возможных трудностей",
    "Рекомендации для развития","Уточняющие гипотезы и вопросы","Заключение"
  ];

  order.forEach(key => {
    const txt = (sections[key] || "").replace(/\s+/g," ").trim();
    const short = txt ? (txt.length>180? txt.slice(0,180)+"…": txt) : "—";
    tableRows.push(new TableRow({ children:[
      new TableCell({ children:[new Paragraph({ children:[new TextRun({ text:key })] })] }),
      new TableCell({ children:[new Paragraph({ children:[new TextRun({ text:short })] })] })
    ]}));
  });

  const sectionChildren = [];
  sectionChildren.push(new Paragraph({ text:"Краткое содержание по разделам", heading:HeadingLevel.HEADING_2 }));
  sectionChildren.push(new Table({ rows:tableRows, width:{ size:100, type:WidthType.PERCENTAGE } }));

  order.forEach(key => {
    const body = (sections[key] || "").trim();
    if (!body) return;
    sectionChildren.push(new Paragraph({ text:key, heading:HeadingLevel.HEADING_2 }));
    const paras = body.split(/\n{1,}/).map(p=>p.trim()).filter(p=>p.length>0);
    paras.forEach(p => sectionChildren.push(new Paragraph({ children:[new TextRun({ text:p, size:24 })] })));
  });

  doc.addSection({
    properties:{},
    footers:{
      default: new Footer({ children:[
        new Paragraph({ children:[new TextRun({ text: CONTACTS_LINE, size:18 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children:[new TextRun({ text: COPYRIGHT_LINE, size:18 })], alignment: AlignmentType.CENTER })
      ]})
    },
    children: sectionChildren
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Psychoprofile_${new Date().toISOString().slice(0,10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------------------- Кнопка скачать --------------------
const officialDownloadBtn = document.createElement("button");
officialDownloadBtn.innerText = "Скачать официальный отчёт (.docx)";
officialDownloadBtn.style.cssText = "background:#2b3b4d;color:#fff;border-radius:10px;padding:0.6rem 1rem;cursor:pointer;font-weight:600;margin-left:6px";
officialDownloadBtn.addEventListener("mouseover",()=>officialDownloadBtn.style.transform="scale(1.03)");
officialDownloadBtn.addEventListener("mouseout",()=>officialDownloadBtn.style.transform="scale(1)");
document.querySelector(".buttons").appendChild(officialDownloadBtn);

officialDownloadBtn.addEventListener("click", async () => {
  const text = resultDiv.innerText || "";
  if (!text || text.trim().length<5) { alert("Сначала получите результат анализа (нажмите «Анализировать»)."); return; }
  try { await createAndDownloadReportDOCX(text); }
  catch(err){ console.error("Ошибка генерации DOCX:",err); alert("Ошибка при создании документа. Посмотри в консоли."); }
});
