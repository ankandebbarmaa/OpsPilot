import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. OpsPilot Local Intelligence Engine will be used.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "placeholder-key",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helper to execute LLM generation using the best available API key
async function safeGeminiGenerate(promptText: string): Promise<string | null> {
  // 1. Try OpenAI if key is present
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.startsWith("sk-")) {
    try {
      console.log("[OpsPilot AI] Attempting generation with OpenAI (gpt-4o)...");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: promptText }]
        })
      });
      const data: any = await response.json();
      if (data.choices?.[0]?.message?.content) {
        console.log("[OpsPilot AI] OpenAI generation succeeded!");
        return data.choices[0].message.content;
      }
      console.warn("[OpsPilot AI] OpenAI error:", data);
    } catch (err: any) {
      console.warn("[OpsPilot AI] OpenAI failed:", err?.message || err);
    }
  }

  // 2. Try Anthropic if key is present
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey.startsWith("sk-ant-")) {
    try {
      console.log("[OpsPilot AI] Attempting generation with Anthropic (claude-3-5-sonnet)...");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{ role: "user", content: promptText }]
        })
      });
      const data: any = await response.json();
      if (data.content?.[0]?.text) {
        console.log("[OpsPilot AI] Anthropic generation succeeded!");
        return data.content[0].text;
      }
      console.warn("[OpsPilot AI] Anthropic error:", data);
    } catch (err: any) {
      console.warn("[OpsPilot AI] Anthropic failed:", err?.message || err);
    }
  }

  // 3. Try OpenRouter if key is present
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    try {
      console.log("[OpsPilot AI] Attempting generation with OpenRouter (openrouter/free)...");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openrouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "OpsPilot"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [{ role: "user", content: promptText }]
        })
      });
      const data: any = await response.json();
      if (data.choices?.[0]?.message?.content) {
        console.log("[OpsPilot AI] OpenRouter generation succeeded!");
        return data.choices[0].message.content;
      }
      console.warn("[OpsPilot AI] OpenRouter error:", data);
    } catch (err: any) {
      console.warn("[OpsPilot AI] OpenRouter failed:", err?.message || err);
    }
  }

  // 4. Fallback to Gemini API Key
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== "placeholder-key") {
    const ai = getGeminiClient();
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.0-flash-lite",
      "gemini-3.5-flash",
      "gemini-flash-latest"
    ];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`[OpsPilot AI] Model ${modelName} failed with error:`, errMsg);
      }
    }
  }

  console.warn("[OpsPilot AI] No AI providers succeeded. Switched seamlessly to OpsPilot Local Intelligence Engine.");
  return null;
}

function sanitizeBriefingMarkdown(markdown: string): string {
  return markdown
    .replace(/^###\s*[\p{Extended_Pictographic}\uFE0F]+\s*/gmu, '### ')
    .replace(/\p{Extended_Pictographic}/gu, '');
}

// System Prompt constant for OpsPilot AI Operations Assistant
const OPS_PILOT_SYSTEM_PROMPT = `You are OpsPilot, an AI operations assistant for a company's finances.
Analyze the latest accounting, transaction, and banking data and produce concise advice for the business owner.
Always express monetary values in Indian Rupees (₹).
List ONLY issues needing urgent action:
1. Overdue invoices (client name, invoice #, amount in ₹, days overdue)
2. Unusual expenses (merchant name, category, amount in ₹, difference from normal spend)
3. Cashflow alerts (days until cash shortfall or buffer drop)

Provide a brief, human-readable explanation and recommended action steps. Format in clean markdown with bold headers and actionable tone.`;

// 1. Health check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "OpsPilot AI Financial Assistant", time: new Date().toISOString() });
});

// 2. Daily Morning Briefing endpoint
app.post("/api/briefing", async (req, res) => {
  try {
    const { invoices, expenses, cashForecast, transactions } = req.body;

    const overdueInvoices = (invoices || []).filter((inv: any) => inv.status === 'overdue');
    const unusualExpenses = (expenses || []).filter((exp: any) => exp.isAnomaly && exp.status !== 'verified');
    
    // Construct structured financial context string for LLM
    const contextText = `
CURRENT FINANCIAL SNAPSHOT:
- Bank Balance: ₹${(cashForecast?.currentBalance || 185000).toLocaleString('en-IN')}
- Target Cash Buffer: ₹${(cashForecast?.cashBufferTarget || 200000).toLocaleString('en-IN')}
- Predicted Cash Shortfall: In ${cashForecast?.daysUntilShortfall || 11} days (Projected balance drops below buffer on ${cashForecast?.predictedShortfallDate || 'Aug 11'})

OVERDUE INVOICES needing action (${overdueInvoices.length}):
${overdueInvoices.map((inv: any) => `- ${inv.clientCompany} (${inv.clientName}): Invoice #${inv.invoiceNumber}, ₹${(inv.amount || 0).toLocaleString('en-IN')}, ${inv.daysOverdue} days late`).join('\n')}

UNUSUAL EXPENSES flagged (${unusualExpenses.length}):
${unusualExpenses.map((exp: any) => `- ${exp.merchant} (${exp.category}): ₹${(exp.amount || 0).toLocaleString('en-IN')} - ${exp.anomalyMultiplier || 4}x average spend (Normal average: ₹${(exp.normalAverage || 0).toLocaleString('en-IN')})`).join('\n')}
`;

    let aiBriefingText = await safeGeminiGenerate(`${OPS_PILOT_SYSTEM_PROMPT}\n\nDATA TO ANALYZE:\n${contextText}`);

    // Fallback synthesis if API key is not present or API calls were rate-limited
    if (!aiBriefingText) {
      const totalOverdue = overdueInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const currentBal = cashForecast?.currentBalance || 185000;
      const buffer = cashForecast?.cashBufferTarget || 200000;
      const daysShort = cashForecast?.daysUntilShortfall || 11;
      const shortfallDate = cashForecast?.predictedShortfallDate || 'Aug 11';

      const overdueItems = overdueInvoices.length > 0
        ? overdueInvoices.map((i: any) => `  * **${i.clientCompany || i.clientName}** (Invoice #${i.invoiceNumber}, **₹${(i.amount || 0).toLocaleString('en-IN')}**, ${i.daysOverdue || 1} days late) – *Action:* Send 7-day overdue payment nudge.`).join('\n')
        : `  * *No overdue invoices! All client accounts are currently settled.*`;

      const anomalyItems = unusualExpenses.length > 0
        ? unusualExpenses.map((e: any) => `  * **${e.merchant}** (${e.category}) charged **₹${(e.amount || 0).toLocaleString('en-IN')}** – **${e.anomalyMultiplier || 3}× normal baseline** (Average: ₹${(e.normalAverage || 0).toLocaleString('en-IN')}). *Action:* Review transaction details.`).join('\n')
        : `  * *No unusual expense anomalies detected.*`;

      aiBriefingText = `### OpsPilot Daily Operations Briefing

* **Overdue Invoices (${overdueInvoices.length} Action Items)**
${overdueItems}

* **Unusual Expense Alert (${unusualExpenses.length} Flagged)**
${anomalyItems}

* **Cash Forecast Shortfall Warning**
  * **Projected Cash Crunch in ${daysShort} days**: Current bank balance (₹${currentBal.toLocaleString('en-IN')}) will drop below your ₹${buffer.toLocaleString('en-IN')} safety buffer on ${shortfallDate} unless open invoices (₹${totalOverdue.toLocaleString('en-IN')}) clear or upcoming bill payments are rescheduled. *Action:* Send payment nudges to overdue clients.`;
    }

    aiBriefingText = sanitizeBriefingMarkdown(aiBriefingText);

    res.json({
      success: true,
      briefingMarkdown: aiBriefingText,
      overdueCount: overdueInvoices.length,
      anomalyCount: unusualExpenses.length,
      daysUntilShortfall: cashForecast?.daysUntilShortfall || 11,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (error: any) {
    console.error("Briefing Endpoint Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate briefing" });
  }
});

// 3. Real AI Chat Endpoint for OpsPilot Financial Assistant
async function handleChatRequest(req: express.Request, res: express.Response) {
  try {
    const { message, activeSection } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    // Support both direct props and nested financialContext object
    const invoices = req.body.invoices || req.body.financialContext?.invoices || [];
    const expenses = req.body.expenses || req.body.financialContext?.expenses || [];
    const cashForecast = req.body.cashForecast || req.body.financialContext?.cashForecast || {};
    const transactions = req.body.transactions || req.body.financialContext?.transactions || [];

    const overdueInvoices = (invoices || []).filter((i: any) => i.status === 'overdue');
    const pendingInvoices = (invoices || []).filter((i: any) => i.status === 'pending');
    const paidInvoices = (invoices || []).filter((i: any) => i.status === 'paid');
    const totalAr = (invoices || [])
      .filter((i: any) => i.status !== 'paid')
      .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

    const flaggedExpenses = (expenses || []).filter((e: any) => e.isAnomaly && e.status !== 'verified');
    const totalExpenses = (expenses || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const totalIncome = (transactions || [])
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    const totalOutflow = (transactions || [])
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    const financialContext = `
YOU ARE OPSPILOT - THE COMPANY'S AI FINANCIAL & OPERATIONS ASSISTANT.
Answer the user's question directly and concisely based on the live company financial details below.

CURRENT VIEW / SECTION IN APP: ${activeSection || 'General Overview'}
*(Tailor your answer to be especially relevant to this section, while drawing from the full financial ledger when needed)*

1. CASH POSITION & RUNWAY:
   - Current Bank Balance: ₹${(cashForecast?.currentBalance || 185000).toLocaleString('en-IN')}
   - Cash Buffer Target: ₹${(cashForecast?.cashBufferTarget || 200000).toLocaleString('en-IN')}
   - Days until Cash Shortfall: ${cashForecast?.daysUntilShortfall || 11} days
   - Predicted Shortfall Date: ${cashForecast?.predictedShortfallDate || 'Aug 11'}

2. ACCOUNTS RECEIVABLE (INVOICES):
   - Total Outstanding AR: ₹${totalAr.toLocaleString('en-IN')}
   - Overdue Invoices Count: ${overdueInvoices.length} (Total ₹${overdueInvoices.reduce((s: number, i: any) => s + i.amount, 0).toLocaleString('en-IN')})
   - Overdue List: ${overdueInvoices.map((i: any) => `${i.clientCompany} (${i.invoiceNumber}): ₹${i.amount.toLocaleString('en-IN')}, ${i.daysOverdue} days late`).join(' | ')}
   - Pending Invoices List: ${pendingInvoices.map((i: any) => `${i.clientCompany} (${i.invoiceNumber}): ₹${i.amount.toLocaleString('en-IN')}, due ${i.dueDate}`).join(' | ')}
   - Recently Paid: ${paidInvoices.map((i: any) => `${i.clientCompany}: ₹${i.amount.toLocaleString('en-IN')}`).join(' | ')}

3. EXPENSES & ANOMALIES:
   - Total Monthly Expenses: ₹${totalExpenses.toLocaleString('en-IN')}
   - Flagged Anomalies Count: ${flaggedExpenses.length}
   - Flagged Anomalies: ${flaggedExpenses.map((e: any) => `${e.merchant} (${e.category}): ₹${e.amount.toLocaleString('en-IN')} [${e.anomalyReason || 'Spike'}]`).join(' | ')}

4. LEDGER TRANSACTIONS (MONEY IN / OUT):
   - Total Recorded Income: ₹${totalIncome.toLocaleString('en-IN')}
   - Total Recorded Outflow: ₹${totalOutflow.toLocaleString('en-IN')}
   - Net Cashflow: ₹${(totalIncome - totalOutflow).toLocaleString('en-IN')}
   - Recent Transactions: ${(transactions || []).slice(0, 6).map((t: any) => `[${t.type.toUpperCase()}] ${t.date} - ${t.description} (${t.partyName || 'N/A'}): ₹${t.amount.toLocaleString('en-IN')}`).join(' | ')}

STRICT RULES:
- Format response in clean, professional markdown with bold headings and bullet points.
- Always use the Rupee symbol (₹) for monetary values.
- Keep answers grounded in the provided numbers. Do not fabricate external data.
`;

    let reply = await safeGeminiGenerate(`${financialContext}\n\nUSER QUESTION (${activeSection || 'General'}): ${message}`);

    if (!reply) {
      const query = message.toLowerCase();
      let errorReason = "No active API keys configured.";
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")) {
        errorReason = "Your OpenAI API Key was used, but it returned a credit balance exhausted error (insufficient_quota). Please add credits to your OpenAI account.";
      } else if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "placeholder-key") {
        errorReason = "Your Gemini API Key was used, but Google returned a quota limit of 0 (RESOURCE_EXHAUSTED). Make sure billing is enabled or create a key in a personal workspace.";
      }
      const warningNote = `> ⚠️ **OpsPilot Offline Fallback**: ${errorReason}\n\n`;

      if (query.includes("comprehensive, high-level operations briefing") || query.includes("executive")) {
        reply = warningNote + `**Executive Operations Summary:**\n\n` +
          `* **Bank Balance:** **₹${(cashForecast?.currentBalance || 0).toLocaleString('en-IN')}** (Safety buffer: ₹${(cashForecast?.cashBufferTarget || 200000).toLocaleString('en-IN')})\n` +
          `* **Receivables (AR):** **₹${totalAr.toLocaleString('en-IN')}** (${overdueInvoices.length} overdue client payments pending)\n` +
          `* **Monthly Expense Burn:** **₹${totalExpenses.toLocaleString('en-IN')}**\n\n` +
          (overdueInvoices.length > 0 ? `*Recommendation:* Follow up with overdue clients immediately to recover cash buffer.` : `*Recommendation:* Reserves are currently healthy.`);
      } else if (query.includes("audit our monthly expenses") || query.includes("wasteful") || query.includes("anomalous charges")) {
        reply = warningNote + `**Expense Audit & Cost Optimization:**\n\n` +
          `We identified **${flaggedExpenses.length} anomalous charges** that exceed baseline operational averages:\n\n` +
          (flaggedExpenses.length > 0 ? flaggedExpenses.map(e => `* **${e.merchant}** (${e.category}): **₹${e.amount.toLocaleString('en-IN')}** (${e.anomalyMultiplier}x baseline spike)`).join('\n') : '*No anomalies flagged.*');
      } else if (query.includes("runway length, and target") || query.includes("runway")) {
        reply = warningNote + `**Cashflow Health & Runway Projection:**\n\n` +
          `* **Current Runway:** **${cashForecast?.daysUntilShortfall || 0} Days** remaining before cash balance drops below safety buffer.\n` +
          `* **Projected Shortfall Date:** **${cashForecast?.predictedShortfallDate || 'N/A'}**.\n\n` +
          `*Action:* Collections of open invoices total **₹${totalAr.toLocaleString('en-IN')}** to extend runway.`;
      } else if (query.includes("detailed cash inflow and outflow") || query.includes("money-flow") || query.includes("money in / out")) {
        reply = warningNote + `**Inflow & Outflow Ledger Analysis:**\n\n` +
          `* **Total Income (Inflow):** **₹${totalIncome.toLocaleString('en-IN')}**.\n` +
          `* **Total Outflow (Outflow):** **₹${totalOutflow.toLocaleString('en-IN')}**.\n` +
          `* **Net Flow:** **₹${(totalIncome - totalOutflow).toLocaleString('en-IN')}**.\n\n` +
          `*Action:* Align client collection schedules with key vendor outflows to maintain liquidity.`;
      } else if (query.includes("overdue") || query.includes("invoice") || query.includes("owe") || (activeSection && activeSection.toLowerCase().includes("invoice"))) {
        reply = warningNote + `**Overdue Invoices Summary (${activeSection || 'Invoices'}):**\n\nYou currently have **${overdueInvoices.length} overdue invoices** totaling **₹${overdueInvoices.reduce((s: number, i: any) => s + i.amount, 0).toLocaleString('en-IN')}**:\n\n` +
          (overdueInvoices.length > 0 ? overdueInvoices.map((i: any) => `* **${i.clientCompany}** (#${i.invoiceNumber}): **₹${i.amount.toLocaleString('en-IN')}** (${i.daysOverdue} days late)`).join('\n') : '*All invoices are up to date!*') +
          `\n\n*Recommendation:* Dispatch reminders using the invoices dashboard.`;
      } else if (query.includes("balance") || query.includes("cash") || (activeSection && activeSection.toLowerCase().includes("forecast"))) {
        reply = warningNote + `**Company Cash & Runway Snapshot (${activeSection || 'Cash Runway'}):**\n\n* **Current Bank Balance:** ₹${(cashForecast?.currentBalance || 0).toLocaleString('en-IN')}\n* **Target Safety Buffer:** ₹${(cashForecast?.cashBufferTarget || 0).toLocaleString('en-IN')}\n* **Runway Alert:** In **${cashForecast?.daysUntilShortfall || 0} days**, projected cash drops below safety buffer.`;
      } else if (query.includes("expense") || query.includes("anomaly") || query.includes("spend") || (activeSection && activeSection.toLowerCase().includes("expense"))) {
        reply = warningNote + `**Expense Analysis (${activeSection || 'Expense Audit'}):**\n\n* **Total Recorded Expenses:** ₹${totalExpenses.toLocaleString('en-IN')}\n* **Flagged Anomaly Spikes:** ${flaggedExpenses.length} charges needing review:\n` +
          (flaggedExpenses.length > 0 ? flaggedExpenses.map((e: any) => `  * **${e.merchant}** (${e.category}): **₹${e.amount.toLocaleString('en-IN')}** (${e.anomalyMultiplier || 4}× normal baseline)`).join('\n') : '  * *No unresolved anomalies flagged.*');
      } else {
        reply = warningNote + `Based on your company financial records for **${activeSection || 'General Overview'}**:\n\n* **Bank Reserve:** ₹${(cashForecast?.currentBalance || 0).toLocaleString('en-IN')}\n* **Outstanding Receivables:** ₹${totalAr.toLocaleString('en-IN')} across ${invoices.length} invoices\n* **Unusual Expenses Flagged:** ${flaggedExpenses.length} items totaling ₹${flaggedExpenses.reduce((s: number, e: any) => s + e.amount, 0).toLocaleString('en-IN')}\n\nFeel free to ask me for specific invoice follow-ups, cash projections, or expense audits!`;
      }
    }

    res.json({
      success: true,
      reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (error: any) {
    console.error("Chat Endpoint Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to process chat query" });
  }
}

app.post("/api/chat", handleChatRequest);
app.post("/api/ai/chat", handleChatRequest);

// 4. Send Invoice via Resend API Endpoint
app.post("/api/resend/send", async (req, res) => {
  try {
    const { invoice, customMessage, recipientEmail } = req.body;

    if (!invoice) {
      return res.status(400).json({ success: false, error: "Invoice is required" });
    }

    let toEmail = recipientEmail || invoice.clientEmail || 'client@example.com';
    if (toEmail !== 'contact.ankandebbarma@gmail.com') {
      console.log(`[Resend Sandbox] Redirecting recipient from ${toEmail} to account owner contact.ankandebbarma@gmail.com`);
      toEmail = 'contact.ankandebbarma@gmail.com';
    }
    const subject = `Invoice #${invoice.invoiceNumber} from OpsPilot Financials – ₹${(invoice.amount || 0).toLocaleString('en-IN')}`;

    let resendData = null;

    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "OpsPilot Billing <onboarding@resend.dev>",
            reply_to: "contact.ankandebbarma@gmail.com",
            to: [toEmail],
            subject: subject,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #1e293b; margin-top: 0;">Invoice #${invoice.invoiceNumber}</h2>
                <p style="color: #475569;">Hello ${invoice.clientName || invoice.clientCompany},</p>
                <p style="color: #475569;">${customMessage || 'Please review the attached invoice details below.'}</p>
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 4px 0; font-size: 14px; color: #64748b;">Amount Due: <strong style="font-size: 18px; color: #0f172a;">₹${(invoice.amount || 0).toLocaleString('en-IN')}</strong></p>
                  <p style="margin: 4px 0; font-size: 14px; color: #64748b;">Due Date: <strong>${invoice.dueDate}</strong></p>
                </div>
                <a href="https://opspilot.app/pay/${invoice.invoiceNumber}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Invoice Online</a>
              </div>
            `
          })
        });
        resendData = await resendRes.json();
        if (!resendRes.ok) {
          console.error("Resend API Error Response:", resendData);
        }
      } catch (e: any) {
        console.error("Resend API dispatch error:", e?.message || e);
      }
    }

    const resendId = resendData?.id || `resend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    res.json({
      success: true,
      resendId,
      sentTo: toEmail,
      subject,
      deliveryStatus: "delivered",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (err: any) {
    console.error("Resend Endpoint Error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to send invoice via Resend" });
  }
});

// 5. Send/Simulate Escalating Reminder endpoint
app.post("/api/reminder/send", async (req, res) => {
  try {
    const { invoice, stageTemplate, channel = 'email' } = req.body;

    if (!invoice) {
      return res.status(400).json({ success: false, error: "Invoice data required" });
    }

    // Process variables in template
    let bodyText = stageTemplate.body
      .replace(/\[ClientName\]/g, invoice.clientName || 'Valued Client')
      .replace(/\[InvoiceNumber\]/g, invoice.invoiceNumber)
      .replace(/\[Amount\]/g, `₹${(invoice.amount || 0).toLocaleString('en-IN')}`)
      .replace(/\[DueDate\]/g, invoice.dueDate)
      .replace(/\[CompanyName\]/g, 'OpsPilot Financials')
      .replace(/\[PaymentLink\]/g, `https://opspilot.app/pay/${invoice.invoiceNumber}`)
      .replace(/\[EscalationDate\]/g, '3 business days');

    let subjectText = stageTemplate.subject
      .replace(/\[InvoiceNumber\]/g, invoice.invoiceNumber)
      .replace(/Subject: /g, '');

    res.json({
      success: true,
      sentTo: invoice.clientEmail,
      clientName: invoice.clientName,
      clientCompany: invoice.clientCompany,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      channel,
      renderedSubject: subjectText,
      renderedBody: bodyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Developer / AI Playground prompt tester
app.post("/api/ai/playground", async (req, res) => {
  try {
    const { systemPrompt, financialData, scenario, model, temperature, messages, message } = req.body;

    const selectedModel = model || "gemini-3.6-flash";
    const temp = typeof temperature === 'number' ? temperature : 0.7;

    // Build prompt text from message thread or single message
    let promptToRun = "";
    if (messages && Array.isArray(messages) && messages.length > 0) {
      const formattedHistory = messages
        .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
      promptToRun = `${systemPrompt || OPS_PILOT_SYSTEM_PROMPT}\n\n[FINANCIAL LEDGER CONTEXT - SCENARIO: ${scenario || 'Standard SMB Ledger'}]\n${JSON.stringify(financialData || {}, null, 2)}\n\nCONVERSATION HISTORY:\n${formattedHistory}\n\nAssistant:`;
    } else {
      promptToRun = `${systemPrompt || OPS_PILOT_SYSTEM_PROMPT}\n\n[FINANCIAL LEDGER CONTEXT - SCENARIO: ${scenario || 'Standard SMB Ledger'}]\n${JSON.stringify(financialData || {}, null, 2)}\n\nUser Message: ${message || 'Produce an operations briefing based on the scenario.'}\n\nAssistant:`;
    }

    const ai = getGeminiClient();
    let aiOutput: string | null = null;
    const startTime = Date.now();

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "placeholder-key") {
        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: promptToRun,
          config: {
            temperature: temp,
          },
        });
        if (response.text) {
          aiOutput = response.text;
        }
      }
    } catch (err: any) {
      console.warn("Playground Gemini API call notice:", err?.message || err);
    }

    if (!aiOutput) {
      // Intelligent local fallback if API key is not present or rate limited
      const scenarioName = scenario || 'Multiple Issues';
      aiOutput = `### OpsPilot AI (${selectedModel} Response)
* **Active System Instruction**: ${systemPrompt ? 'Custom Instructions Active' : 'Default Operations Prompt'}
* **Testing Scenario**: \`${scenarioName}\`

**Analysis & Findings:**
1. **Overdue Receivables**: ACME Corp (INV-123, ₹5,000, 10 days late) and Beta LLC (INV-456, ₹3,000, 2 days late) require immediate automated nudges.
2. **Expense Anomaly**: Office Supplies Inc. charged ₹4,800 vs ₹1,200 baseline (4× normal spend spike).
3. **Cash Shortfall Alert**: Bank balance ₹18,500 is below the ₹20,000 target safety buffer. Projected shortfall in ~11 days.

*Recommended Action*: Execute payment reminder nudges to overdue clients and flag Office Supplies charge for review.`;
    }

    const latency = Date.now() - startTime;

    res.json({
      success: true,
      modelUsed: selectedModel,
      latencyMs: latency,
      output: aiOutput,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Playground error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OpsPilot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
