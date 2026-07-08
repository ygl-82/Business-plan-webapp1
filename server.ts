import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
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

// Section-specific JSON schemas for fast, lightweight generation
const sectionSchemas: Record<string, any> = {
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
};

// API: Generate business plan section-by-section (super fast & prevents timeouts)
app.post("/api/generate-section", async (req, res) => {
  try {
    const {
      section, // e.g. "executiveSummary", "marketAnalysis", etc.
      businessName,
      niche,
      targetAudience,
      objectives,
      location,
      stage,
      timeline,
    } = req.body;

    if (!section || !businessName || !niche || !targetAudience) {
      return res.status(400).json({
        error: "Missing required fields: section, businessName, niche, targetAudience are mandatory.",
      });
    }

    const schema = sectionSchemas[section];
    if (!schema) {
      return res.status(400).json({
        error: `Invalid section name: "${section}". Supported sections: ${Object.keys(sectionSchemas).join(", ")}`,
      });
    }

    let prompt = "";
    if (section === "executiveSummary") {
      prompt = `
        You are an expert business consultant. Generate the "Executive Summary" section of a comprehensive, highly professional business plan for a company with this profile:
        Business Name: "${businessName}"
        Niche: "${niche}"
        Target Audience: "${targetAudience}"
        Objectives: "${objectives || "Launch successfully and scale operations"}"
        Location: "${location || "Global / Online"}"
        Stage: "${stage || "Early-stage startup"}"
        Timeline: "${timeline || "Next 6 months"}"

        Generate an inspiring and customized mission statement, a forward-looking vision statement, a detailed explanation of the problems solved, the unique solution, and 3-5 key success factors.
      `;
    } else if (section === "marketAnalysis") {
      prompt = `
        You are an expert business consultant. Generate the "Market Analysis" section of a comprehensive, highly professional business plan for a company with this profile:
        Business Name: "${businessName}"
        Niche: "${niche}"
        Target Audience: "${targetAudience}"
        Objectives: "${objectives || "Launch successfully and scale operations"}"
        Location: "${location || "Global / Online"}"
        Stage: "${stage || "Early-stage startup"}"
        Timeline: "${timeline || "Next 6 months"}"

        Provide a highly detailed profile of the target audience, an in-depth competitive analysis showing the business's USP/competitive advantage, key industry/market trends, and a complete SWOT analysis with 3-4 strengths, weaknesses, opportunities, and threats.
      `;
    } else if (section === "marketingStrategy") {
      prompt = `
        You are an expert business consultant. Generate the "Marketing Strategy" section of a comprehensive, highly professional business plan for a company with this profile:
        Business Name: "${businessName}"
        Niche: "${niche}"
        Target Audience: "${targetAudience}"
        Objectives: "${objectives || "Launch successfully and scale operations"}"
        Location: "${location || "Global / Online"}"
        Stage: "${stage || "Early-stage startup"}"
        Timeline: "${timeline || "Next 6 months"}"

        Define a clear brand positioning statement, pricing model strategy aligned with demographic purchasing power, a list of 3-5 primary marketing channels with brief execution ideas, and direct sales tactics / customer onboarding funnels.
      `;
    } else if (section === "operationsPlan") {
      prompt = `
        You are an expert business consultant. Generate the "Operations Plan" section of a comprehensive, highly professional business plan for a company with this profile:
        Business Name: "${businessName}"
        Niche: "${niche}"
        Target Audience: "${targetAudience}"
        Objectives: "${objectives || "Launch successfully and scale operations"}"
        Location: "${location || "Global / Online"}"
        Stage: "${stage || "Early-stage startup"}"
        Timeline: "${timeline || "Next 6 months"}"

        Detail day-to-day operations and supply chain or service delivery, specify 3-5 core technology requirements / software tools / hardware, and describe initial key hiring and personnel needs.
      `;
    } else if (section === "financialOutlook") {
      prompt = `
        You are an expert business consultant. Generate the "Financial Outlook" section of a comprehensive, highly professional business plan for a company with this profile:
        Business Name: "${businessName}"
        Niche: "${niche}"
        Target Audience: "${targetAudience}"
        Objectives: "${objectives || "Launch successfully and scale operations"}"
        Location: "${location || "Global / Online"}"
        Stage: "${stage || "Early-stage startup"}"
        Timeline: "${timeline || "Next 6 months"}"

        Detail 2-4 monetization streams / product tiers, outline 3-5 major operational expenses / cost structures, estimate the path and unit volume to break-even, and outline the estimated funding goal with percentages.
      `;
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const resultStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional, highly detail-oriented business strategist. Your suggestions are realistic, thorough, practical, and highly specific to the user's input. Never return generic placeholders.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    for await (const chunk of resultStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (error: any) {
    console.error("Error generating business plan section:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Failed to generate business plan section" });
    } else {
      res.end();
    }
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

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const resultStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert business plan editor. Your suggestions are realistic, professional, highly aligned with the user's prompt, and elegant. Return ONLY the refined content itself without any conversational greeting or concluding text.",
      },
    });

    for await (const chunk of resultStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (error: any) {
    console.error("Error refining business plan section:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Failed to refine business plan section" });
    } else {
      res.end();
    }
  }
});

// Setup dev server or static serve for production
async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
