import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  User,
  Trash2,
  Zap,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  FileText,
  TrendingUp,
  History,
  PlusCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { OpsPilotLogo } from './OpsPilotLogo';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  latencyMs?: number;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

const DEFAULT_SYSTEM_PROMPT = `You are OpsPilot, the primary AI operations and financial assistant for a small business.
Analyze the latest accounting ledger, cash balances, invoices, and expenses to produce concise, actionable executive guidance. Always use Rupee symbol (₹) for money. Format outputs in clean markdown with bold bullet points.`;

const DEFAULT_FINANCIAL_CONTEXT = {
  bankBalance: 185000,
  safetyBuffer: 200000,
  daysUntilShortfall: 11,
  invoices: [
    { client: 'Acme Digital', invoiceNum: 'INV-2024-001', amount: 150000, daysLate: 12, status: 'overdue' },
    { client: 'Starlight Retail', invoiceNum: 'INV-2024-003', amount: 75000, daysLate: 2, status: 'overdue' },
    { client: 'Nexus Tech', invoiceNum: 'INV-2024-002', amount: 95000, daysLate: 0, status: 'pending' },
  ],
  expenses: [
    { merchant: 'Software SaaS Co', amount: 48000, normalAverage: 12000, category: 'Software' },
    { merchant: 'AWS Hosting Services', amount: 14500, normalAverage: 14000, category: 'Hosting' },
  ],
};

export const DeveloperPlayground: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);

  const initialGreeting: ChatMessage = {
    id: 'msg-init',
    role: 'assistant',
    content: `### Welcome to OpsPilot AI
I am your direct business copilot connected to your company's live financial ledger.

* **Current Bank Balance:** ₹1,85,000
* **Overdue Invoices:** 2 invoices totaling ₹2,25,000
* **Flagged Expense Spikes:** 1 Software charge at 4× baseline (₹48,000)
* **Cash Runway:** 11 days until buffer threshold

Select a quick prompt below or ask me any question about your business operations, cash projections, or client collections!`,
    timestamp: 'Just now',
  };

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: 'session-1',
      title: 'Morning Financial Briefing',
      date: 'Today, 10:00 AM',
      messages: [initialGreeting],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');

  const currentSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];
  const chatHistory = currentSession.messages;

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!showHistoryPanel) {
      scrollToBottom();
    }
  }, [chatHistory, isRunning, showHistoryPanel]);

  const handleSendPrompt = async (customText?: string) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim() || isRunning) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: s.messages.length <= 1 ? textToSend.slice(0, 30) : s.title,
              messages: [...s.messages, userMessage],
            }
          : s
      )
    );

    if (!customText) setInputQuery('');
    setIsRunning(true);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/ai/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          financialData: DEFAULT_FINANCIAL_CONTEXT,
          scenario: 'Live Business Ledger',
          messages: [...chatHistory, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          message: textToSend,
        }),
      });

      const data = await response.json();
      const latency = Date.now() - startTime;

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.output || 'No response returned from model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latencyMs: latency,
      };

      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Error communicating with OpsPilot AI**: ${err?.message || 'Server connection error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        )
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleStartNewThread = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Financial Query',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          ...initialGreeting,
          id: `init-${Date.now()}`,
        },
      ],
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setShowHistoryPanel(false);
  };

  const handleClearCurrentThread = () => {
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [
                {
                  ...initialGreeting,
                  id: `init-${Date.now()}`,
                },
              ],
            }
          : s
      )
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    if (chatSessions.length <= 1) return;
    const filtered = chatSessions.filter((s) => s.id !== sessionId);
    setChatSessions(filtered);
    if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-2xs shrink-0">
            <OpsPilotLogo size={32} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>OpsPilot AI</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                COPILOT ACTIVE
              </span>
            </h1>
            <p className="text-slate-500 text-xs">
              Interactive AI financial operations assistant & conversational intelligence engine
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
              showHistoryPanel
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Chat History ({chatSessions.length})</span>
          </button>
          <button
            onClick={handleClearCurrentThread}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            title="Reset Active Thread"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Full-Width Chat Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs flex flex-col h-[650px] relative">
        {/* Quick Starter Prompts */}
        <div className="pb-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1">
            Quick Prompts:
          </span>
          <button
            onClick={() => handleSendPrompt('Generate the complete morning operations briefing for today.')}
            disabled={isRunning}
            className="bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold whitespace-nowrap transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Daily Briefing</span>
          </button>
          <button
            onClick={() => handleSendPrompt('List all overdue invoices with days late and recommended actions.')}
            disabled={isRunning}
            className="bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold whitespace-nowrap transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Overdue Invoices</span>
          </button>
          <button
            onClick={() => handleSendPrompt('Are there any expense anomalies or vendor spend spikes in our ledger?')}
            disabled={isRunning}
            className="bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold whitespace-nowrap transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center space-x-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Expense Audit</span>
          </button>
          <button
            onClick={() => handleSendPrompt('How many days of cash runway do we have before reaching the bank buffer threshold?')}
            disabled={isRunning}
            className="bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold whitespace-nowrap transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center space-x-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
            <span>Cash Runway</span>
          </button>
          <button
            onClick={() => handleSendPrompt('Draft a polite payment reminder email for our most overdue client.')}
            disabled={isRunning}
            className="bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold whitespace-nowrap transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Draft Reminder</span>
          </button>
        </div>

        {/* History Panel vs Active Messages */}
        {showHistoryPanel ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/80 rounded-2xl my-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Saved Chat Threads</h3>
              </div>
              <button
                onClick={handleStartNewThread}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start New Conversation</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {chatSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setShowHistoryPanel(false);
                    }}
                  >
                    <div className="space-y-1 flex-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900 line-clamp-1">
                          {session.title}
                        </span>
                        {isActive && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        {session.date} • {session.messages.length} messages exchanged
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {chatSessions.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete thread"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chat History Messages */
          <div className="flex-1 overflow-y-auto p-3 space-y-4 my-2">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 font-bold text-xs shrink-0 shadow-2xs mt-0.5">
                    <OpsPilotLogo size={22} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed relative group ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs font-normal'
                      : 'bg-slate-50/90 border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px] opacity-70">
                    <div className="flex items-center space-x-1.5 font-extrabold uppercase tracking-wider">
                      <span>{msg.role === 'user' ? 'You' : 'OpsPilot AI'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {msg.latencyMs && (
                        <span className="font-mono text-[9px] text-emerald-600 font-bold flex items-center space-x-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          <span>{msg.latencyMs}ms</span>
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {msg.role === 'assistant' ? (
                    <div className="markdown-body space-y-2 text-slate-800">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                  )}

                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopyMessage(msg.content, msg.id)}
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition rounded hover:bg-slate-200/80 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            ))}

            {isRunning && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 font-bold text-xs shrink-0 shadow-2xs">
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                </div>
                <div className="bg-white border border-indigo-100 text-indigo-900 rounded-2xl rounded-tl-xs p-3.5 text-xs font-semibold flex items-center space-x-2 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span>OpsPilot AI is analyzing live business ledger...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input Form */}
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask OpsPilot AI anything about your invoices, expenses, cash runway, or client reminders..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isRunning || showHistoryPanel}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isRunning || showHistoryPanel}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-40 flex items-center space-x-1.5 shrink-0"
            >
              <span>Ask AI</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
