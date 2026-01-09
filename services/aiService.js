const OpenAI = require("openai");
require('dotenv').config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "AI Resume Analyzer",
  }
});

async function analyzeResume(cvText, jobDescription) {
  try {
    const prompt = `
      Anda digaji untuk menjadi seorang ahli ATS (Applicant Tracking System) dan Analisis Resume.
      Tugas anda adalah membandingkan RESUME dan JOB DESCRIPTION di bawah ini.

      RESUME:
      ${cvText}

      JOB DESCRIPTION:
      ${jobDescription}

      Analisis kecocokannya dan kembalikan hasil dalam format STRICT JSON dengan struktur berikut (Gunakan Bahasa Indonesia untuk isi teksnya):
      {
        "match_score": "angka bulat antara 0-100",
        "matched_skills": ["array skill yang cocok"],
        "missing_skills": ["array skill yang hilang"],
        "summary": "Ringkasan kecocokan yang padat (maks 2 kalimat)",
        "recommendation": "Saran spesifik untuk memperbaiki resume agar sesuai job ini (maks 2 kalimat)"
      }

      PENTING: Hanya kembalikan string JSON yang valid. Jangan gunakan markdown block.
    `;

    const completion = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-nano-30b-a3b:free", // Switching to Nemotron (NVIDIA)
      messages: [
        { role: "system", content: "You behave as a JSON API that only returns strict JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
    });

    const text = completion.choices[0].message.content;
    console.log("Raw AI Response:", text); // Debugging log

    // Robust JSON extraction
    const jsonStartIndex = text.indexOf('{');
    const jsonEndIndex = text.lastIndexOf('}');

    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error("No JSON object found in response");
    }

    const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);

    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse extracted JSON:", jsonString);
      throw new Error("Invalid response format from AI");
    }

  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}

module.exports = { analyzeResume };
