import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI with appropriate headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json());

// API: Generate full business plan
app.post("/api/generate-plan", async (req, res) => {
  try {
    const {
      businessName,
      niche,
      targetAudience,
      objectives,
      location,
      stage,
      timeline,
    } = req.body;

    if (!businessName || !niche || !targetAudience) {
      return res.status(400).json({
        error: "Missing required fields: businessName, niche, targetAudience are mandatory.",
      });
    }

    const prompt = `
      You are an expert business consultant, venture capitalist, and professional business plan writer.
      Generate a comprehensive, high-quality, realistic, and highly tailored business plan for a company with the following profile:
      
      Business Name: "${businessName}"
      Niche/Industry: "${niche}"
      Target Audience: "${targetAudience}"
      Objectives & Goals: "${objectives || "Launch successfully and scale operations"}"
      Location/Geographical Scope: "${location || "Global / Online"}"
      Business Stage: "${stage || "Early-stage startup"}"
      Launch Timeline: "${timeline || "Next 6 months"}"

      Provide detailed, fully-fleshed out explanations for each section. Avoid generic placeholder text. Include highly actionable details specific to the niche and target audience. Make sure the financial structure and marketing channels align perfectly with the target demographic.
    `;

    const planSchema = {
      type: Type.OBJECT,
      properties: {
        executiveSummary: {
          type: Type.OBJECT,
          properties: {
            mission: { type: Type.STRING, description: "Highly inspiring mission statement of the business, aligning with their industry" },
            vision: { type: Type.STRING, description: "Forward-looking vision statement outlining what they want to achieve in 5-10 years" },
            problemSolved: { type: Type.STRING, description: "The specific pain points or problems this target audience experiences and why current alternatives fail" },
            solution: { type: Type.STRING, description: "The core product, service, or solution offering and its unique value proposition" },
            keySuccessFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3 to 5 critical factors that will ensure this business's success (concrete and actionable)"
            }
          },
          required: ["mission", "vision", "problemSolved", "solution", "keySuccessFactors"]
        },
        marketAnalysis: {
          type: Type.OBJECT,
          properties: {
            audienceProfile: { type: Type.STRING, description: "Detailed profile of the target audience segments, demographics, psychographics, behaviors, and buying motives" },
            competitorAnalysis: { type: Type.STRING, description: "In-depth analysis of major competitor categories and the specific competitive advantage / USP of this business" },
            marketTrends: { type: Type.STRING, description: "Key trends, innovations, and shifts currently shaping this industry or niche" },
            swotAnalysis: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Internal strengths of the business (3-4 items)" },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Internal weaknesses or early-stage risks to mitigate (3-4 items)" },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "External opportunities in the current market environment (3-4 items)" },
                threats: { type: Type.ARRAY, items: { type: Type.STRING }, description: "External threats, challenges, or competitors to prepare for (3-4 items)" }
              },
              required: ["strengths", "weaknesses", "opportunities", "threats"]
            }
          },
          required: ["audienceProfile", "competitorAnalysis", "marketTrends", "swotAnalysis"]
        },
        marketingStrategy: {
          type: Type.OBJECT,
          properties: {
            positioning: { type: Type.STRING, description: "Brand positioning statement and core market entry strategy" },
            pricingModel: { type: Type.STRING, description: "Pricing strategy, logic (e.g. freemium, value-based), and alignment with audience purchasing power" },
            marketingChannels: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-5 primary channels for reaching the audience with brief execution ideas"
            },
            salesTactic: { type: Type.STRING, description: "The direct conversion tactics, sales funnel steps, or customer onboarding process" }
          },
          required: ["positioning", "pricingModel", "marketingChannels", "salesTactic"]
        },
        operationsPlan: {
          type: Type.OBJECT,
          properties: {
            keyOperations: { type: Type.STRING, description: "Core day-to-day operational activities, supply chain (if physical), or service delivery flow (if digital)" },
            technologyRequirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Required tech stack components, software tools, hardware, or third-party platforms (3-5 items)"
            },
            personnelNeeds: { type: Type.STRING, description: "Key hiring roles, management structure, or outsourced service requirements needed initially" }
          },
          required: ["keyOperations", "technologyRequirements", "personnelNeeds"]
        },
        financialOutlook: {
          type: Type.OBJECT,
          properties: {
            revenueStreams: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of multiple monetization streams or product tiers (2-4 streams)"
            },
            costStructure: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Major fixed and variable operational expenses (3-5 items)"
            },
            breakEvenAnalysis: { type: Type.STRING, description: "An estimation of units sold, MRR, or duration to reach break-even based on cost structures" },
            fundingGoal: { type: Type.STRING, description: "Estimated seed funding needed and clear percentage allocation for major categories" }
          },
          required: ["revenueStreams", "costStructure", "breakEvenAnalysis", "fundingGoal"]
        }
      },
      required: ["executiveSummary", "marketAnalysis", "marketingStrategy", "operationsPlan", "financialOutlook"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional, highly detail-oriented business strategist. Your business plans are thorough, fully fleshed out, practical, realistic, and highly specific to the user's input niche and audience. Never return brief, generic placeholder text.",
        responseMimeType: "application/json",
        responseSchema: planSchema,
      },
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini API");
    }

    const planData = JSON.parse(response.text.trim());
    res.json(planData);
  } catch (error: any) {
    console.error("Error generating business plan:", error);
    res.status(500).json({ error: error.message || "Failed to generate business plan" });
  }
});

// API: Refine a specific section based on user feedback
app.post("/api/refine-section", async (req, res) => {
  try {
    const {
      businessName,
      niche,
      targetAudience,
      sectionPath, // e.g., "executiveSummary.mission", "marketingStrategy.pricingModel"
      currentValue,
      feedback,
    } = req.body;

    if (!sectionPath || !feedback) {
      return res.status(400).json({ error: "Missing required fields: sectionPath and feedback are required." });
    }

    const prompt = `
      You are a business consulting partner helping to refine a section of a business plan.
      
      Business Context:
      Business Name: "${businessName}"
      Niche: "${niche}"
      Target Audience: "${targetAudience}"
      
      Section being refined: "${sectionPath}"
      Current Text/Content:
      "${Array.isArray(currentValue) ? currentValue.join(", ") : currentValue}"
      
      User Feedback / Refinement Request:
      "${feedback}"
      
      Generate a refined and improved version of this section that perfectly implements the user's feedback, maintains a professional consulting tone, and remains fully aligned with the broader business concept.
      
      If the current value was a single paragraph or block of text, return a refined single paragraph or text block.
      If the current value was a list of items (or the feedback asks for lists), you can return a clean list of refined items separated by newlines, or a solid paragraph. If you want to return a list, make each item on a new line starting with an optional bullet point.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert business plan editor. Your suggestions are realistic, professional, highly aligned with the user's prompt, and elegant. Return ONLY the refined content itself without any conversational greeting or concluding text.",
      },
    });

    const refinedText = response.text?.trim() || "";
    res.json({ refinedText });
  } catch (error: any) {
    console.error("Error refining business plan section:", error);
    res.status(500).json({ error: error.message || "Failed to refine business plan section" });
  }
});

// Setup dev server or static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only start the listening loop if we are not running as a Vercel serverless function
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
