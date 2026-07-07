/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  FileText,
  Sparkles,
  Check,
  Edit3,
  Trash2,
  Compass,
  DollarSign,
  Users,
  RefreshCw,
  Send,
  Plus,
  X,
  Save,
  History,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  MapPin,
  ClipboardCheck,
  Info,
  Linkedin,
} from "lucide-react";
import { DEMO_TEMPLATES } from "./data";
import { generateBusinessPlanPDF } from "./pdfGenerator";
import { BusinessPlan } from "./types";

export default function App() {
  // App state
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPhase, setLoadingPhase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Inputs
  const [businessName, setBusinessName] = useState<string>("");
  const [niche, setNiche] = useState<string>("");
  const [targetAudience, setTargetAudience] = useState<string>("");
  const [objectives, setObjectives] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [stage, setStage] = useState<string>("Idea stage");
  const [timeline, setTimeline] = useState<string>("Next 6 months");

  // Generated Plan State
  const [currentPlan, setCurrentPlan] = useState<BusinessPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<BusinessPlan[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState<boolean>(true);
  const [showIntroModal, setShowIntroModal] = useState<boolean>(true);
  const [showFloatingBadge, setShowFloatingBadge] = useState<boolean>(true);

  // Workspace View Settings
  const [activeSection, setActiveSection] = useState<string>("executiveSummary");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // AI Consultant Sidebar State
  const [chatInput, setChatInput] = useState<string>("");
  const [chatTarget, setChatTarget] = useState<string>("executiveSummary.mission");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; actionValue?: string }>>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // References
  const workspaceTopRef = useRef<HTMLDivElement>(null);

  // Reset Saved Plans on mount (Session-only, no persistent storage)
  useEffect(() => {
    setSavedPlans([]);
  }, []);

  // Save Plans helper (Session-only, no persistent storage)
  const savePlanToStorage = (updatedList: BusinessPlan[]) => {
    setSavedPlans(updatedList);
  };

  // Prefill helper
  const handleApplyTemplate = (tpl: typeof DEMO_TEMPLATES[0]) => {
    setBusinessName(tpl.businessName);
    setNiche(tpl.niche);
    setTargetAudience(tpl.targetAudience);
    setObjectives(tpl.objectives);
    setLocation(tpl.location);
    setStage(tpl.stage);
    setTimeline(tpl.timeline);
    setStep(1); // Keep on page 1 but populated
    setError(null);
    setFormError(null);
  };

  // AI Loading Step Sequencer
  const runLoadingSequence = () => {
    const phases = [
      "Analyzing target audience demographics and market viability...",
      "Synthesizing strategic business objectives...",
      "Drafting clear Mission & Vision statements...",
      "Conducting automated competitive landscape intelligence...",
      "Constructing full SWOT Matrix (Strengths, Weaknesses, Opportunities, Threats)...",
      "Designing pricing models and direct marketing channels...",
      "Detailing daily operations, tech stack, and milestone plans...",
      "Finalizing financial structures and break-even projections...",
    ];

    let currentIdx = 0;
    setLoadingPhase(phases[0]);

    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < phases.length) {
        setLoadingPhase(phases[currentIdx]);
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  // Handle Plan Generation
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormError(null);

    // Hard client-side check to prevent invalid payloads
    if (!businessName.trim() || !niche.trim() || !targetAudience.trim()) {
      setFormError("Please ensure Business Name, Niche/Description, and Target Audience are filled out before generating.");
      return;
    }

    setLoading(true);

    const cleanupSeq = runLoadingSequence();

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          niche,
          targetAudience,
          objectives,
          location,
          stage,
          timeline,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Generation request failed");
      }

      const rawPlan = await response.json();

      const newPlan: BusinessPlan = {
        ...rawPlan,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        businessName,
        niche,
        targetAudience,
        objectives,
        location,
        stage,
        timeline,
      };

      setCurrentPlan(newPlan);
      setActiveSection("executiveSummary");
      setIsEditing(false);

      // Save to local saves history list
      const updated = [newPlan, ...savedPlans];
      savePlanToStorage(updated);

      // Reset form variables optionally, but keep them for reference if they want to edit/regenerate
      // Transition to display workspace
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while communicating with the AI server.");
    } finally {
      cleanupSeq();
      setLoading(false);
    }
  };

  // Load a plan from history
  const handleLoadPlan = (plan: BusinessPlan) => {
    setCurrentPlan(plan);
    setBusinessName(plan.businessName);
    setNiche(plan.niche);
    setTargetAudience(plan.targetAudience);
    setObjectives(plan.objectives);
    setLocation(plan.location);
    setStage(plan.stage);
    setTimeline(plan.timeline);
    setActiveSection("executiveSummary");
    setIsEditing(false);
    setShowHistory(false);
    setChatMessages([]);
  };

  // Delete a saved plan
  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this business plan from your browser's history?")) {
      const filtered = savedPlans.filter((p) => p.id !== id);
      savePlanToStorage(filtered);
      if (currentPlan?.id === id) {
        setCurrentPlan(null);
      }
    }
  };

  // Handle manual saving of edited plan details
  const handleSaveEdits = () => {
    if (!currentPlan) return;
    const updated = savedPlans.map((p) => (p.id === currentPlan.id ? currentPlan : p));
    savePlanToStorage(updated);
    setIsEditing(false);
  };

  // Update specific plan text field directly
  const handleUpdateField = (section: string, key: string, value: any) => {
    if (!currentPlan) return;
    setCurrentPlan({
      ...currentPlan,
      [section]: {
        ...(currentPlan[section as keyof BusinessPlan] as any),
        [key]: value,
      },
    });
  };

  // Update list element in fields
  const handleUpdateListField = (section: string, key: string, index: number, value: string) => {
    if (!currentPlan) return;
    const targetSection = currentPlan[section as keyof BusinessPlan] as any;
    const targetList = [...targetSection[key]];
    targetList[index] = value;

    setCurrentPlan({
      ...currentPlan,
      [section]: {
        ...targetSection,
        [key]: targetList,
      },
    });
  };

  // Add list element
  const handleAddListElement = (section: string, key: string) => {
    if (!currentPlan) return;
    const targetSection = currentPlan[section as keyof BusinessPlan] as any;
    const targetList = [...targetSection[key], "New item - Click edit to change"];

    setCurrentPlan({
      ...currentPlan,
      [section]: {
        ...targetSection,
        [key]: targetList,
      },
    });
  };

  // Remove list element
  const handleRemoveListElement = (section: string, key: string, index: number) => {
    if (!currentPlan) return;
    const targetSection = currentPlan[section as keyof BusinessPlan] as any;
    const targetList = targetSection[key].filter((_: any, i: number) => i !== index);

    setCurrentPlan({
      ...currentPlan,
      [section]: {
        ...targetSection,
        [key]: targetList,
      },
    });
  };

  // Update SWOT specific array list
  const handleUpdateSwotField = (key: keyof BusinessPlan["marketAnalysis"]["swotAnalysis"], index: number, value: string) => {
    if (!currentPlan) return;
    const currentSwot = currentPlan.marketAnalysis.swotAnalysis;
    const updatedSwotList = [...currentSwot[key]];
    updatedSwotList[index] = value;

    setCurrentPlan({
      ...currentPlan,
      marketAnalysis: {
        ...currentPlan.marketAnalysis,
        swotAnalysis: {
          ...currentSwot,
          [key]: updatedSwotList,
        },
      },
    });
  };

  const handleAddSwotElement = (key: keyof BusinessPlan["marketAnalysis"]["swotAnalysis"]) => {
    if (!currentPlan) return;
    const currentSwot = currentPlan.marketAnalysis.swotAnalysis;
    setCurrentPlan({
      ...currentPlan,
      marketAnalysis: {
        ...currentPlan.marketAnalysis,
        swotAnalysis: {
          ...currentSwot,
          [key]: [...currentSwot[key], "New item - Click edit to change"],
        },
      },
    });
  };

  const handleRemoveSwotElement = (key: keyof BusinessPlan["marketAnalysis"]["swotAnalysis"], index: number) => {
    if (!currentPlan) return;
    const currentSwot = currentPlan.marketAnalysis.swotAnalysis;
    setCurrentPlan({
      ...currentPlan,
      marketAnalysis: {
        ...currentPlan.marketAnalysis,
        swotAnalysis: {
          ...currentSwot,
          [key]: currentSwot[key].filter((_, i) => i !== index),
        },
      },
    });
  };

  // Submit refinement instructions to AI
  const handleRefineWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentPlan) return;

    const currentMessage = chatInput;
    setChatInput("");

    // Append user message
    setChatMessages((prev) => [...prev, { sender: "user", text: currentMessage }]);
    setChatLoading(true);

    try {
      // Find current value of the field for context
      const pathParts = chatTarget.split(".");
      let targetValue: any = currentPlan;
      for (const part of pathParts) {
        if (targetValue) {
          targetValue = targetValue[part];
        }
      }

      const response = await fetch("/api/refine-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: currentPlan.businessName,
          niche: currentPlan.niche,
          targetAudience: currentPlan.targetAudience,
          sectionPath: chatTarget,
          currentValue: targetValue,
          feedback: currentMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Refinement request failed");
      }

      const data = await response.json();
      const refinedText = data.refinedText;

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `I've prepared a refined version for you based on your feedback. Review it below and apply it to update your plan instantly!`,
          actionValue: refinedText,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I had trouble editing this section. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Apply refinement to local state
  const handleApplyRefinedText = (text: string) => {
    if (!currentPlan) return;
    const pathParts = chatTarget.split(".");

    if (pathParts.length === 2) {
      const [section, field] = pathParts;
      const targetSection = currentPlan[section as keyof BusinessPlan] as any;

      if (Array.isArray(targetSection[field])) {
        // If it was an array, try to split lines to rebuild list
        const newList = text
          .split("\n")
          .map((line) => line.replace(/^[•\s\-\d\.]+\s*/, "").trim())
          .filter(Boolean);
        handleUpdateField(section, field, newList);
      } else {
        handleUpdateField(section, field, text);
      }
    } else if (pathParts.length === 3) {
      // e.g. marketAnalysis.swotAnalysis.strengths
      const [section, subSection, field] = pathParts;
      const currentSwot = currentPlan.marketAnalysis.swotAnalysis;
      const newList = text
        .split("\n")
        .map((line) => line.replace(/^[•\s\-\d\.]+\s*/, "").trim())
        .filter(Boolean);

      setCurrentPlan({
        ...currentPlan,
        marketAnalysis: {
          ...currentPlan.marketAnalysis,
          swotAnalysis: {
            ...currentSwot,
            [field]: newList,
          },
        },
      });
    }

    // Inform user of success
    setChatMessages((prev) => [...prev, { sender: "ai", text: "✅ Applied changes to your plan!" }]);
    setIsEditing(true); // show the active save panel
  };

  // Copy entire plan as markdown helper
  const handleCopyMarkdown = () => {
    if (!currentPlan) return;

    const md = `
# Business Plan: ${currentPlan.businessName}
## Generated Concept Overview
- **Industry & Niche:** ${currentPlan.niche}
- **Target Audience:** ${currentPlan.targetAudience}
- **Stage:** ${currentPlan.stage}
- **Launch Timeline:** ${currentPlan.timeline}
- **Location Scope:** ${currentPlan.location}

---

## 1. Executive Summary
### Mission Statement
${currentPlan.executiveSummary.mission}

### Vision Statement
${currentPlan.executiveSummary.vision}

### Problem Solved
${currentPlan.executiveSummary.problemSolved}

### Solution & Core Value Proposition
${currentPlan.executiveSummary.solution}

### Key Success Factors
${currentPlan.executiveSummary.keySuccessFactors.map((f) => `- ${f}`).join("\n")}

---

## 2. Market & Target Audience Analysis
### Audience Profile
${currentPlan.marketAnalysis.audienceProfile}

### Competitor Analysis
${currentPlan.marketAnalysis.competitorAnalysis}

### Market Trends
${currentPlan.marketAnalysis.marketTrends}

### SWOT Analysis
#### Strengths
${currentPlan.marketAnalysis.swotAnalysis.strengths.map((s) => `- ${s}`).join("\n")}
#### Weaknesses
${currentPlan.marketAnalysis.swotAnalysis.weaknesses.map((w) => `- ${w}`).join("\n")}
#### Opportunities
${currentPlan.marketAnalysis.swotAnalysis.opportunities.map((o) => `- ${o}`).join("\n")}
#### Threats
${currentPlan.marketAnalysis.swotAnalysis.threats.map((t) => `- ${t}`).join("\n")}

---

## 3. Marketing & Sales Strategy
### Brand Positioning
${currentPlan.marketingStrategy.positioning}

### Pricing Model
${currentPlan.marketingStrategy.pricingModel}

### Marketing Channels
${currentPlan.marketingStrategy.marketingChannels.map((c) => `- ${c}`).join("\n")}

### Sales Tactics
${currentPlan.marketingStrategy.salesTactic}

---

## 4. Operational Plan
### Daily Operations
${currentPlan.operationsPlan.keyOperations}

### Technology Requirements
${currentPlan.operationsPlan.technologyRequirements.map((t) => `- ${t}`).join("\n")}

### Personnel Needs
${currentPlan.operationsPlan.personnelNeeds}

---

## 5. Financial Outlook
### Revenue Streams
${currentPlan.financialOutlook.revenueStreams.map((r) => `- ${r}`).join("\n")}

### Cost Structure
${currentPlan.financialOutlook.costStructure.map((c) => `- ${c}`).join("\n")}

### Break-Even Analysis
${currentPlan.financialOutlook.breakEvenAnalysis}

### Funding Goal & Capital Needs
${currentPlan.financialOutlook.fundingGoal}
    `.trim();

    navigator.clipboard.writeText(md);
    alert("Copied entire business plan in markdown formatting to your clipboard!");
  };

  // Scroll to top of workspace when switching sections
  useEffect(() => {
    if (workspaceTopRef.current) {
      workspaceTopRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* INTRODUCTORY LINKEDIN WELCOME MODAL */}
      <AnimatePresence>
        {showIntroModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden"
              id="intro_welcome_modal"
            >
              {/* Dynamic top decoration */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-sky-500 to-blue-600"></div>

              {/* Icon / Creator Badge */}
              <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 mb-5 shadow-inner">
                <Sparkles className="w-8 h-8 animate-pulse text-sky-500" />
              </div>

              {/* Title / Heading */}
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-3 font-display">
                Welcome to AI Business Planner!
              </h2>

              {/* Body Text */}
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6">
                This web app is made by <strong className="text-slate-900 font-bold">Yuhann Glen K Linchangco</strong>. If you want to support him, please connect with him thru LinkedIn!
              </p>

              {/* Actions Grid */}
              <div className="w-full space-y-3">
                <a
                  href="https://www.linkedin.com/public-profile/settings/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3Bg%2FXbiH1RQ5STu31esNYdUw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#0077b5] hover:bg-[#006297] text-white font-bold text-sm md:text-base shadow-lg shadow-sky-100 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Linkedin className="w-5 h-5 shrink-0" />
                  <span>Connect on LinkedIn</span>
                </a>

                <button
                  onClick={() => setShowIntroModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
                >
                  Continue to Application
                </button>
              </div>

              {/* Small close trigger in corner */}
              <button
                onClick={() => setShowIntroModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <header id="header_bar" className="sticky top-0 z-40 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center text-white shadow-inner">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AI Business Planner</h1>
            <p className="text-xs text-sky-400 font-medium">Enterprise Strategy Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="history_btn"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
          >
            <History className="w-4 h-4" />
            <span>Saves ({savedPlans.length})</span>
          </button>

          {currentPlan && (
            <button
              id="reset_btn"
              onClick={() => {
                if (confirm("Start a new business plan? This will clear the active workspace (your current plan remains saved in your saves list).")) {
                  setCurrentPlan(null);
                  setStep(1);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </button>
          )}
        </div>
      </header>

      {/* CORE WORKSPACE / WRAPPER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col relative">
        {/* SAFETY WARNING BANNER */}
        <AnimatePresence>
          {showSafetyWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3.5 shadow-sm text-amber-850 text-xs md:text-sm relative overflow-hidden"
              id="safety_warning_banner"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1 pr-6 leading-relaxed">
                <span className="font-bold block text-amber-900 mb-0.5">🔒 Data Safety & Privacy Notice</span>
                To protect your business strategy and ensure complete privacy, no business plan data is saved on our servers or stored in persistent browser cookies. <strong className="text-amber-950 font-semibold">Once you refresh or close this page, your active plan and drafts will be permanently cleared.</strong> Please make sure to download your workspace as a <strong className="text-amber-950 font-semibold">PDF</strong> or <strong className="text-amber-950 font-semibold">Copy Markdown</strong> to save your progress permanently.
              </div>
              <button
                onClick={() => setShowSafetyWarning(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-amber-100/80 text-amber-600 hover:text-amber-800 transition-colors"
                title="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* HISTORY SIDE-DRAWER */}
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-[73px] bottom-0 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <History className="text-sky-600 w-5 h-5" />
                  <h3 className="font-bold text-slate-800">Saved Business Plans</h3>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {savedPlans.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No plans saved yet</p>
                    <p className="text-xs mt-1">Generate a plan to save it here automatically.</p>
                  </div>
                ) : (
                  savedPlans.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadPlan(item)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all group ${
                        currentPlan?.id === item.id
                          ? "bg-sky-50/70 border-sky-300 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase tracking-wider">
                          {item.stage.replace(" stage", "")}
                        </span>
                        <button
                          onClick={(e) => handleDeletePlan(item.id, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-800 mt-2 truncate">{item.businessName}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1">{item.niche}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200/50">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span className="text-sky-600 font-semibold flex items-center gap-0.5">
                          Load Plan <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ACTIVE STEPPER FORM (IF NO PLAN ACTIVE) */}
          {!currentPlan && !loading && (
            <motion.div
              key="planner_form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4"
            >
              {/* Left Column: Quick templates pre-fill */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Quickstart Templates</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Want to try it fast?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Select a curated scenario below to automatically populate the creation form with high-quality criteria, then click generate.
                  </p>

                  <div className="space-y-3">
                    {DEMO_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => handleApplyTemplate(tpl)}
                        className="w-full text-left p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 hover:border-sky-500/50 transition-all group flex flex-col gap-1"
                      >
                        <span className="text-xs font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
                          {tpl.label}
                        </span>
                        <span className="text-sm font-bold truncate">{tpl.businessName}</span>
                        <span className="text-xs text-slate-400 line-clamp-1">{tpl.niche}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Professional PDF Layout</h4>
                      <p className="text-xs text-slate-500 mt-1">Our typesetting engine automatically frames a beautiful executive-grade cover sheet and structured multi-page index.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Interactive AI Editing</h4>
                      <p className="text-xs text-slate-500 mt-1">Once generated, you can directly tweak, edit, add bullets, and consult an inline AI co-pilot on specific sections.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Step Creator Form */}
              <form onSubmit={handleGeneratePlan} className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Stepper Header */}
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg">Strategy Blueprint Engine</h2>
                    <p className="text-xs text-slate-500">Provide company context to formulate your standard 5-part plan.</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-full">
                    <span className={step === 1 ? "text-sky-600 font-bold" : ""}>Step 1</span>
                    <span>•</span>
                    <span className={step === 2 ? "text-sky-600 font-bold" : ""}>Step 2</span>
                    <span>•</span>
                    <span className={step === 3 ? "text-sky-600 font-bold" : ""}>Step 3</span>
                  </div>
                </div>

                {/* API or Form Error Banner */}
                {(error || formError) && (
                  <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex gap-3 text-red-800 text-sm" id="form-error-banner">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-700 shrink-0 mt-0.5">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold block text-red-900">
                        {error ? "Generation Failed" : "Validation Notice"}
                      </span>
                      <p className="text-xs text-red-700 mt-0.5">{error || formError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setFormError(null);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
                      title="Clear error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Stepper Content */}
                <div className="p-6 md:p-8 flex-1 space-y-6">
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Briefcase className="text-sky-600 w-4 h-4" />
                        <span>1. Core Business Profile</span>
                      </h3>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Business Name</label>
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. ZenCup Coffee, TaskFlow AI, CorePulse Gym"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm placeholder:text-slate-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-bold text-slate-700">Niche / Industry & Description</label>
                          <span className="text-xs text-slate-400">Be descriptive</span>
                        </div>
                        <textarea
                          required
                          rows={3}
                          value={niche}
                          onChange={(e) => setNiche(e.target.value)}
                          placeholder="What is your business? What products/services do you sell? (e.g. Eco-friendly neighborhood cafe offering organic single-origin coffee and reusable cup loyalty plans)"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm placeholder:text-slate-400 resize-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-slate-700">Business Stage</label>
                          <select
                            value={stage}
                            onChange={(e) => setStage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm bg-white"
                          >
                            <option>Idea stage</option>
                            <option>Planning & blueprinting stage</option>
                            <option>MVP built / Prototype ready</option>
                            <option>Active / Early operation stage</option>
                            <option>Scaling / Growth stage</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-slate-700">Geographical Scope</label>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Chicago, IL (Downtown) or Online (Global)"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Users className="text-sky-600 w-4 h-4" />
                        <span>2. Audience & Context Criteria</span>
                      </h3>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-bold text-slate-700">Detailed Target Audience</label>
                          <span className="text-xs text-slate-400">Demographic profile</span>
                        </div>
                        <textarea
                          required
                          rows={4}
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="Who are your ideal customers? Describe their age, occupation, income, lifestyles, or main problems. (e.g. Busy parents and health-conscious professionals ages 25-50 looking for quick, high-intensity workouts and expert coaching)"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm placeholder:text-slate-400 resize-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Projected Launch Timeline</label>
                        <select
                          value={timeline}
                          onChange={(e) => setTimeline(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm bg-white"
                        >
                          <option>Immediate Launch</option>
                          <option>Next 1 to 3 months</option>
                          <option>Next 3 to 6 months</option>
                          <option>Next 6 to 12 months</option>
                          <option>Evaluating market viability first</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Compass className="text-sky-600 w-4 h-4" />
                        <span>3. Objectives & Capital Goals</span>
                      </h3>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-bold text-slate-700">Key Business Objectives & Goals</label>
                          <span className="text-xs text-slate-400">Optional</span>
                        </div>
                        <textarea
                          rows={4}
                          value={objectives}
                          onChange={(e) => setObjectives(e.target.value)}
                          placeholder="What are your key metrics or goals for the next 12-24 months? (e.g. Secure $50k in angel funding, open physical location, enroll 200 members, reach operational profitability in year one)"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm placeholder:text-slate-400 resize-none leading-relaxed"
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 flex gap-3 text-sky-800">
                        <Info className="w-5 h-5 shrink-0 mt-0.5 text-sky-600" />
                        <div className="text-xs leading-relaxed">
                          <span className="font-bold block mb-1">Ready to blueprint!</span>
                          Click the button below. Our AI Business Advisor will process your niche and audience profile to compose your multi-section plan in approximately 10 to 15 seconds.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Stepper Footer Controls */}
                <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setFormError(null);
                        setStep(step - 1);
                      }}
                      className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setFormError(null);
                        // Validation per step
                        if (step === 1) {
                          if (!businessName.trim() || !niche.trim()) {
                            setFormError("Please fill in Business Name and Business Niche/Description to continue.");
                            return;
                          }
                        } else if (step === 2) {
                          if (!targetAudience.trim()) {
                            setFormError("Please fill in your Target Audience profile to continue.");
                            return;
                          }
                        }
                        setStep(step + 1);
                      }}
                      className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Business Plan</span>
                    </button>
                  )}
                </div>
              </form>
              {/* Creator Support Card */}
              <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mt-4" id="creator-support-card">
                <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                  <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center text-[#0077b5] shrink-0 shadow-inner">
                    <Linkedin className="w-7 h-7 fill-[#0077b5] text-[#0077b5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Support the Creator</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                      This application was handcrafted with love and powered by state-of-the-art AI by <strong className="text-slate-800 font-semibold">Yuhann Glen K Linchangco</strong>. 
                      If you found this tool helpful, please connect with him on LinkedIn to support his work!
                    </p>
                  </div>
                </div>
                <a
                  href="https://lnkd.in/gGpTmhRb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#0077b5] hover:bg-[#006297] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <Linkedin className="w-4 h-4 shrink-0 fill-white text-white" />
                  <span>Connect on LinkedIn</span>
                </a>
              </div>
            </motion.div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <motion.div
              key="loading_screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative w-24 h-24 mb-6">
                {/* Visual pulse circles */}
                <span className="absolute inset-0 rounded-full bg-sky-100 animate-ping opacity-75"></span>
                <span className="absolute inset-3 rounded-full bg-sky-200 animate-pulse"></span>
                <div className="absolute inset-5 bg-sky-600 rounded-full flex items-center justify-center text-white shadow">
                  <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: "3s" }} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-800">Synthesizing Your Custom Business Plan</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                Gemini AI is crafting industry-tailored marketing, financial, operational, and positioning strategies...
              </p>

              {/* Progress bar and dynamic phase explanation */}
              <div className="mt-8 max-w-lg w-full bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 text-left line-clamp-1">{loadingPhase}</span>
                </div>
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-sky-600 h-1.5 rounded-full animate-pulse w-4/5"></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ACTIVE WORKSPACE DASHBOARD */}
          {currentPlan && !loading && (
            <motion.div
              key="workspace_dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2 flex-1"
            >
              {/* Sidebar Section Navigator */}
              <div className="lg:col-span-3 space-y-4">
                {/* Meta details card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Concept Active</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{currentPlan.businessName}</h3>
                  
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Stage:</span>
                      <span className="font-bold text-slate-800">{currentPlan.stage.replace(" stage", "")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Timeline:</span>
                      <span className="font-bold text-slate-800">{currentPlan.timeline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Scope:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[120px]">{currentPlan.location || "Global"}</span>
                    </div>
                  </div>
                </div>

                {/* Section Navigation Buttons */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 lg:gap-1.5">
                  <button
                    onClick={() => setActiveSection("executiveSummary")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all shrink-0 lg:shrink-1 ${
                      activeSection === "executiveSummary"
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>1. Executive Summary</span>
                  </button>
                  <button
                    onClick={() => setActiveSection("marketAnalysis")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all shrink-0 lg:shrink-1 ${
                      activeSection === "marketAnalysis"
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>2. Market Analysis</span>
                  </button>
                  <button
                    onClick={() => setActiveSection("marketingStrategy")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all shrink-0 lg:shrink-1 ${
                      activeSection === "marketingStrategy"
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>3. Marketing & Sales</span>
                  </button>
                  <button
                    onClick={() => setActiveSection("operationsPlan")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all shrink-0 lg:shrink-1 ${
                      activeSection === "operationsPlan"
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>4. Operations Plan</span>
                  </button>
                  <button
                    onClick={() => setActiveSection("financialOutlook")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all shrink-0 lg:shrink-1 ${
                      activeSection === "financialOutlook"
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <DollarSign className="w-4 h-4 shrink-0" />
                    <span>5. Financial Outlook</span>
                  </button>
                </div>

                {/* Actions Panel */}
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Export Actions</h4>
                  
                  <button
                    id="download_pdf_btn"
                    onClick={() => generateBusinessPlanPDF(currentPlan)}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={handleCopyMarkdown}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold border border-slate-200 transition-colors"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Copy Markdown</span>
                  </button>
                </div>
              </div>

              {/* Main Content Workspace */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
                {/* Scroll Anchor */}
                <div ref={workspaceTopRef} />

                {/* Content Header Banner */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {activeSection === "executiveSummary" && "Section 1: Executive Summary"}
                      {activeSection === "marketAnalysis" && "Section 2: Market Analysis"}
                      {activeSection === "marketingStrategy" && "Section 3: Marketing & Sales"}
                      {activeSection === "operationsPlan" && "Section 4: Operations Plan"}
                      {activeSection === "financialOutlook" && "Section 5: Financial Outlook"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Edit content directly below or consult the AI Assistant to refine.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <button
                        onClick={handleSaveEdits}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 hover:bg-slate-100 text-slate-600 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Manual Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Actual Form Sections */}
                <div className="p-6 md:p-8 flex-1 space-y-6">
                  {/* EXECUTIVE SUMMARY */}
                  {activeSection === "executiveSummary" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Company Mission Statement</label>
                        {isEditing ? (
                          <textarea
                            rows={3}
                            value={currentPlan.executiveSummary.mission}
                            onChange={(e) => handleUpdateField("executiveSummary", "mission", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic">
                            "{currentPlan.executiveSummary.mission}"
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Long-term Vision Statement</label>
                        {isEditing ? (
                          <textarea
                            rows={3}
                            value={currentPlan.executiveSummary.vision}
                            onChange={(e) => handleUpdateField("executiveSummary", "vision", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.executiveSummary.vision}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Problem Addressed (Market Pain Points)</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.executiveSummary.problemSolved}
                            onChange={(e) => handleUpdateField("executiveSummary", "problemSolved", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.executiveSummary.problemSolved}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Our Solution & Value Proposition</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.executiveSummary.solution}
                            onChange={(e) => handleUpdateField("executiveSummary", "solution", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.executiveSummary.solution}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Critical Success Factors</label>
                        <div className="space-y-2">
                          {currentPlan.executiveSummary.keySuccessFactors.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </span>
                              {isEditing ? (
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleUpdateListField("executiveSummary", "keySuccessFactors", idx, e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                                  />
                                  <button
                                    onClick={() => handleRemoveListElement("executiveSummary", "keySuccessFactors", idx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-700 text-sm">{item}</span>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              onClick={() => handleAddListElement("executiveSummary", "keySuccessFactors")}
                              className="text-xs text-sky-600 font-bold flex items-center gap-1 mt-1.5 pl-7 hover:text-sky-500"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Success Factor</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MARKET ANALYSIS */}
                  {activeSection === "marketAnalysis" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target Audience Profile</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.marketAnalysis.audienceProfile}
                            onChange={(e) => handleUpdateField("marketAnalysis", "audienceProfile", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.marketAnalysis.audienceProfile}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Competitor Landscape</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.marketAnalysis.competitorAnalysis}
                            onChange={(e) => handleUpdateField("marketAnalysis", "competitorAnalysis", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.marketAnalysis.competitorAnalysis}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Niche Industry Trends</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.marketAnalysis.marketTrends}
                            onChange={(e) => handleUpdateField("marketAnalysis", "marketTrends", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.marketAnalysis.marketTrends}
                          </p>
                        )}
                      </div>

                      {/* SWOT GRID */}
                      <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">SWOT Analysis Matrix</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Strengths */}
                          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Strengths (+)</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            </h4>
                            <div className="space-y-1.5">
                              {currentPlan.marketAnalysis.swotAnalysis.strengths.map((item, idx) => (
                                <div key={idx} className="flex gap-1.5 items-start">
                                  <span className="text-emerald-700 shrink-0 mt-0.5 text-xs">•</span>
                                  {isEditing ? (
                                    <div className="flex-1 flex gap-1">
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleUpdateSwotField("strengths", idx, e.target.value)}
                                        className="flex-1 px-2 py-0.5 rounded border border-emerald-200 bg-white text-xs"
                                      />
                                      <button onClick={() => handleRemoveSwotElement("strengths", idx)}>
                                        <X className="w-3.5 h-3.5 text-emerald-600 hover:text-red-500" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-emerald-950 text-xs leading-relaxed">{item}</span>
                                  )}
                                </div>
                              ))}
                              {isEditing && (
                                <button
                                  onClick={() => handleAddSwotElement("strengths")}
                                  className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-1 hover:text-emerald-600"
                                >
                                  <Plus className="w-3 h-3" /> Add Item
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Weaknesses */}
                          <div className="p-4 rounded-xl bg-red-50/70 border border-red-100">
                            <h4 className="font-bold text-red-800 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Weaknesses (-)</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            </h4>
                            <div className="space-y-1.5">
                              {currentPlan.marketAnalysis.swotAnalysis.weaknesses.map((item, idx) => (
                                <div key={idx} className="flex gap-1.5 items-start">
                                  <span className="text-red-700 shrink-0 mt-0.5 text-xs">•</span>
                                  {isEditing ? (
                                    <div className="flex-1 flex gap-1">
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleUpdateSwotField("weaknesses", idx, e.target.value)}
                                        className="flex-1 px-2 py-0.5 rounded border border-red-200 bg-white text-xs"
                                      />
                                      <button onClick={() => handleRemoveSwotElement("weaknesses", idx)}>
                                        <X className="w-3.5 h-3.5 text-red-600 hover:text-red-500" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-red-950 text-xs leading-relaxed">{item}</span>
                                  )}
                                </div>
                              ))}
                              {isEditing && (
                                <button
                                  onClick={() => handleAddSwotElement("weaknesses")}
                                  className="text-[10px] text-red-700 font-bold flex items-center gap-0.5 mt-1 hover:text-red-600"
                                >
                                  <Plus className="w-3 h-3" /> Add Item
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Opportunities */}
                          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Opportunities (▲)</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            </h4>
                            <div className="space-y-1.5">
                              {currentPlan.marketAnalysis.swotAnalysis.opportunities.map((item, idx) => (
                                <div key={idx} className="flex gap-1.5 items-start">
                                  <span className="text-blue-700 shrink-0 mt-0.5 text-xs">•</span>
                                  {isEditing ? (
                                    <div className="flex-1 flex gap-1">
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleUpdateSwotField("opportunities", idx, e.target.value)}
                                        className="flex-1 px-2 py-0.5 rounded border border-blue-200 bg-white text-xs"
                                      />
                                      <button onClick={() => handleRemoveSwotElement("opportunities", idx)}>
                                        <X className="w-3.5 h-3.5 text-blue-600 hover:text-red-500" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-blue-950 text-xs leading-relaxed">{item}</span>
                                  )}
                                </div>
                              ))}
                              {isEditing && (
                                <button
                                  onClick={() => handleAddSwotElement("opportunities")}
                                  className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5 mt-1 hover:text-blue-600"
                                >
                                  <Plus className="w-3 h-3" /> Add Item
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Threats */}
                          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100">
                            <h4 className="font-bold text-amber-800 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Threats (▼)</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            </h4>
                            <div className="space-y-1.5">
                              {currentPlan.marketAnalysis.swotAnalysis.threats.map((item, idx) => (
                                <div key={idx} className="flex gap-1.5 items-start">
                                  <span className="text-amber-700 shrink-0 mt-0.5 text-xs">•</span>
                                  {isEditing ? (
                                    <div className="flex-1 flex gap-1">
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleUpdateSwotField("threats", idx, e.target.value)}
                                        className="flex-1 px-2 py-0.5 rounded border border-amber-200 bg-white text-xs"
                                      />
                                      <button onClick={() => handleRemoveSwotElement("threats", idx)}>
                                        <X className="w-3.5 h-3.5 text-amber-600 hover:text-red-500" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-amber-950 text-xs leading-relaxed">{item}</span>
                                  )}
                                </div>
                              ))}
                              {isEditing && (
                                <button
                                  onClick={() => handleAddSwotElement("threats")}
                                  className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 mt-1 hover:text-amber-600"
                                >
                                  <Plus className="w-3 h-3" /> Add Item
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MARKETING STRATEGY */}
                  {activeSection === "marketingStrategy" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Brand Positioning</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.marketingStrategy.positioning}
                            onChange={(e) => handleUpdateField("marketingStrategy", "positioning", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.marketingStrategy.positioning}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pricing Model & Strategy</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.marketingStrategy.pricingModel}
                            onChange={(e) => handleUpdateField("marketingStrategy", "pricingModel", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.marketingStrategy.pricingModel}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Acquisition & Marketing Channels</label>
                        <div className="space-y-2">
                          {currentPlan.marketingStrategy.marketingChannels.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0"></span>
                              {isEditing ? (
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleUpdateListField("marketingStrategy", "marketingChannels", idx, e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                                  />
                                  <button
                                    onClick={() => handleRemoveListElement("marketingStrategy", "marketingChannels", idx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-700 text-sm">{item}</span>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              onClick={() => handleAddListElement("marketingStrategy", "marketingChannels")}
                              className="text-xs text-sky-600 font-bold flex items-center gap-1 mt-1.5 pl-3 hover:text-sky-500"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Channel</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sales Conversion Funnel Tactic</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.marketingStrategy.salesTactic}
                            onChange={(e) => handleUpdateField("marketingStrategy", "salesTactic", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.marketingStrategy.salesTactic}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* OPERATIONS PLAN */}
                  {activeSection === "operationsPlan" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Core Day-to-Day Operations</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.operationsPlan.keyOperations}
                            onChange={(e) => handleUpdateField("operationsPlan", "keyOperations", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.operationsPlan.keyOperations}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Required Technology & Tool Stack</label>
                        <div className="space-y-2">
                          {currentPlan.operationsPlan.technologyRequirements.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0"></span>
                              {isEditing ? (
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleUpdateListField("operationsPlan", "technologyRequirements", idx, e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                                  />
                                  <button
                                    onClick={() => handleRemoveListElement("operationsPlan", "technologyRequirements", idx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-700 text-sm">{item}</span>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              onClick={() => handleAddListElement("operationsPlan", "technologyRequirements")}
                              className="text-xs text-sky-600 font-bold flex items-center gap-1 mt-1.5 pl-3 hover:text-sky-500"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Technology / Tool</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Personnel & Hiring Needs</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.operationsPlan.personnelNeeds}
                            onChange={(e) => handleUpdateField("operationsPlan", "personnelNeeds", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.operationsPlan.personnelNeeds}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FINANCIAL OUTLOOK */}
                  {activeSection === "financialOutlook" && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Revenue Streams</label>
                        <div className="space-y-2">
                          {currentPlan.financialOutlook.revenueStreams.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                              {isEditing ? (
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleUpdateListField("financialOutlook", "revenueStreams", idx, e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                                  />
                                  <button
                                    onClick={() => handleRemoveListElement("financialOutlook", "revenueStreams", idx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-700 text-sm">{item}</span>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              onClick={() => handleAddListElement("financialOutlook", "revenueStreams")}
                              className="text-xs text-sky-600 font-bold flex items-center gap-1 mt-1.5 pl-3 hover:text-sky-500"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Revenue Stream</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Primary Cost Structures</label>
                        <div className="space-y-2">
                          {currentPlan.financialOutlook.costStructure.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                              {isEditing ? (
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleUpdateListField("financialOutlook", "costStructure", idx, e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                                  />
                                  <button
                                    onClick={() => handleRemoveListElement("financialOutlook", "costStructure", idx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-700 text-sm">{item}</span>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              onClick={() => handleAddListElement("financialOutlook", "costStructure")}
                              className="text-xs text-sky-600 font-bold flex items-center gap-1 mt-1.5 pl-3 hover:text-sky-500"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Cost Category</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Break-Even Estimation & Profitability Timeline</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.financialOutlook.breakEvenAnalysis}
                            onChange={(e) => handleUpdateField("financialOutlook", "breakEvenAnalysis", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.financialOutlook.breakEvenAnalysis}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Initial Funding Target & Allocation</label>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={currentPlan.financialOutlook.fundingGoal}
                            onChange={(e) => handleUpdateField("financialOutlook", "fundingGoal", e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            {currentPlan.financialOutlook.fundingGoal}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Edit Save Banner at Bottom */}
                {isEditing && (
                  <div className="px-6 py-4 border-t border-slate-100 bg-emerald-50/50 flex justify-end items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdits}
                      className="flex items-center gap-1 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: AI Consulting Co-pilot Column */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-5 overflow-hidden max-h-[600px] lg:max-h-none">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 shrink-0">
                  <div className="w-7 h-7 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">AI Consulting Co-pilot</h4>
                    <p className="text-[10px] text-slate-400">Iterative Section Refinement</p>
                  </div>
                </div>

                {/* Configuration target selector */}
                <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Section to Edit</label>
                  <select
                    value={chatTarget}
                    onChange={(e) => setChatTarget(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-semibold focus:outline-none"
                  >
                    <optgroup label="1. Executive Summary">
                      <option value="executiveSummary.mission">Mission Statement</option>
                      <option value="executiveSummary.vision">Vision Statement</option>
                      <option value="executiveSummary.problemSolved">Problem Solved</option>
                      <option value="executiveSummary.solution">Value Prop / Solution</option>
                    </optgroup>
                    <optgroup label="2. Market Analysis">
                      <option value="marketAnalysis.audienceProfile">Audience Profile</option>
                      <option value="marketAnalysis.competitorAnalysis">Competitor Profile</option>
                      <option value="marketAnalysis.marketTrends">Industry Trends</option>
                    </optgroup>
                    <optgroup label="3. Marketing Strategy">
                      <option value="marketingStrategy.positioning">Brand Positioning</option>
                      <option value="marketingStrategy.pricingModel">Pricing Model</option>
                      <option value="marketingStrategy.salesTactic">Sales Funnel</option>
                    </optgroup>
                    <optgroup label="4. Operations Plan">
                      <option value="operationsPlan.keyOperations">Daily Operations</option>
                      <option value="operationsPlan.personnelNeeds">Personnel Needs</option>
                    </optgroup>
                    <optgroup label="5. Financial Outlook">
                      <option value="financialOutlook.breakEvenAnalysis">Break-Even Analysis</option>
                      <option value="financialOutlook.fundingGoal">Funding / Capital Alloc</option>
                    </optgroup>
                  </select>
                </div>

                {/* Message display container */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 min-h-[120px] text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-2">
                      <Sparkles className="w-8 h-8 mx-auto opacity-30 text-sky-600 animate-pulse" />
                      <p className="font-semibold text-slate-500">Ask for improvements!</p>
                      <p className="text-[10px] px-2 leading-relaxed">
                        Select a target section above and type feedback like:
                        <br />
                        <span className="italic">"Make the tone more aggressive"</span> or <span className="italic">"Add social media channels"</span>.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl text-left border ${
                          msg.sender === "user"
                            ? "bg-slate-100 border-slate-200 ml-6 text-slate-700"
                            : "bg-sky-50/50 border-sky-100 mr-6 text-sky-950"
                        }`}
                      >
                        <p className="font-semibold text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider">
                          {msg.sender === "user" ? "You" : "Advisor Assistant"}
                        </p>
                        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                        
                        {msg.actionValue && (
                          <div className="mt-3 pt-2.5 border-t border-sky-100/60">
                            <div className="p-2 bg-white rounded-lg border border-sky-200 text-[11px] leading-relaxed max-h-32 overflow-y-auto mb-2 text-slate-600">
                              {msg.actionValue}
                            </div>
                            <button
                              onClick={() => handleApplyRefinedText(msg.actionValue!)}
                              className="w-full py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Apply refinement</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {chatLoading && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 text-slate-500 mr-6">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                      <span className="text-[10px] font-medium">Drafting refinements...</span>
                    </div>
                  )}
                </div>

                {/* Form Chat Input */}
                <form onSubmit={handleRefineWithAI} className="relative mt-auto shrink-0">
                  <input
                    type="text"
                    required
                    disabled={chatLoading}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="e.g. Add 3 bullet points detailing digital SEO..."
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-400 disabled:opacity-60 bg-slate-50/50"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="absolute right-1.5 top-1.5 p-1.5 bg-sky-600 disabled:bg-slate-200 hover:bg-sky-500 text-white disabled:text-slate-400 rounded-lg transition-colors"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-center py-6 border-t border-slate-800 text-xs mt-auto">
        <div className="max-w-7xl w-full mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Business Plan Generator. Formulate industry-validated objectives with Gemini AI.</p>
          <div className="flex gap-4">
            <span className="text-[11px] font-semibold text-sky-500">A4 PDF Exports Powered by jsPDF</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
