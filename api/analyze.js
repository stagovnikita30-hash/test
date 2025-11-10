import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

export default async function handler(req, res) {
  if (req.method!=='POST') return res.status(405).json({ error: "Метод не поддерживается" });

  const { answer } = req.body;
  try {
    const response = await client.responses.create({
      model:"openai/gpt-oss-20b",
      input:`Ты — профессиональный психолог и аналитик личности. Проведи подробный анализ на основе ответов на 160 вопросов. 
Используй структурированный текст, подзаголовки и пункты. Не додумывай факты, не выставляй диагнозы, только гипотезы. 
Вот ответы:\n${answer}`
    });
    res.status(200).json({ analysis: response.output_text });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при анализе" });
  }
}
