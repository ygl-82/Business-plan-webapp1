import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("GEMINI_API_KEY present:", !!apiKey);
if (apiKey) {
  console.log("GEMINI_API_KEY prefix/length:", apiKey.substring(0, 5) + "...", apiKey.length);
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Respond with 'Success'",
    });
    console.log("Gemini Response:", response.text);
  } catch (err: any) {
    console.error("Gemini Error:", err);
  }
}

test();
