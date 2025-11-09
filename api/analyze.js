import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  const { answer } = req.body;

  try {
    const response = await client.responses.create({
      model: "openai/gpt-oss-20b",
      input: `Ты выступаешь в роли профессионального психолога. Проанализируй предоставленные ответы на психологический тест. 
      Определи ключевые личностные черты, предрасположенности, стиль общения, эмоциональную сферу, мотивацию и сильные/слабые стороны. 
      Вывод должен быть структурированным и читабельным, с подзаголовками для каждой области личности и пояснениями. 
      Не используй упрощённые формулировки — это серьёзный глубокий анализ. 
      Вот ответы:\n${answer}`
    });

    res.status(200).json({ analysis: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при анализе" });
  }
}
