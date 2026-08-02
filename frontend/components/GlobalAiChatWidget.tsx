import React, { useState, useRef, useEffect } from 'react';
import { OpsPilotLogo } from './OpsPilotLogo';
import {
  MessageSquare,
  X,
  Send,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  Minimize2,
  Bot,
  User,
  TrendingUp,
  Receipt,
  Wallet,
  FileText,
  Bell,
  Terminal,
  History,
  ShieldCheck,
  PlusCircle,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Invoice, Expense, CashForecast, LedgerTransaction, formatRupee } from '../types';

interface GlobalAiChatWidgetProps {
  invoices: Invoice[];
  expenses: Expense[];
  cashForecast: CashForecast;
  transactions: LedgerTransaction[];
  activeTabTitle?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

// Section-specific starter questions & context (without emojis)
const getSectionConfig = (tabTitle: string) => {
  const normalized = tabTitle.toLowerCase();

  if (normalized.includes('invoice')) {
    return {
      badge: 'Client Invoices',
      icon: FileText,
      placeholder: 'Ask about client invoices, overdue amounts, or email drafts...',
      starters: [
        { label: 'Overdue Receivables', query: 'List all overdue client invoices with days late and total amount.' },
        { label: 'Draft Reminder Email', query: 'Draft a polite payment reminder email for our highest unpaid invoice.' },
        { label: 'Advance Deposits', query: 'How much revenue is currently tied up in advance deposit invoices?' },
        { label: 'Top Client Account', query: 'Which client represents our largest outstanding receivable balance?' },
      ],
    };
  }

  if (normalized.includes('expense')) {
    return {
      badge: 'Expense Audit',
      icon: Receipt,
      placeholder: 'Ask about vendor spend, flagged expenses, or savings...',
      starters: [
        { label: 'Flagged Charges', query: 'Are there any flagged, disputed, or anomalous vendor expenses?' },
        { label: 'Top Spend Categories', query: 'Break down our top 3 highest expense categories this month.' },
        { label: 'Cost Optimization', query: 'Suggest 3 actionable ways we can optimize monthly operating costs.' },
        { label: 'Software Subscriptions', query: 'What is our total monthly spend on recurring software and tools?' },
      ],
    };
  }

  if (normalized.includes('forecast') || normalized.includes('runway')) {
    return {
      badge: 'Cash Forecast',
      icon: TrendingUp,
      placeholder: 'Ask about cash runway, burn rate, or future scenarios...',
      starters: [
        { label: 'Runway Health', query: 'How many months of runway do we have at our current burn rate?' },
        { label: 'Downside Scenario', query: 'What happens to our runway if client collections drop by 25%?' },
        { label: 'Monthly Net Burn', query: 'What is our net monthly burn rate after factoring in incoming AR?' },
        { label: 'Minimum Cash Reserve', query: 'Is our current bank balance above our safe operating threshold?' },
      ],
    };
  }

  if (normalized.includes('reminder') || normalized.includes('template')) {
    return {
      badge: 'Payment Reminders',
      icon: Bell,
      placeholder: 'Ask about reminder schedules, WhatsApp nudges, or escalation...',
      starters: [
        { label: 'WhatsApp Nudge', query: 'Draft a concise 2-sentence WhatsApp nudge for overdue clients.' },
        { label: 'Pre-Due Nudges', query: 'Which clients have invoices coming due in the next 3 days?' },
        { label: 'Escalation Policy', query: 'Recommend a 3-step reminder sequence for 15+ days overdue invoices.' },
        { label: 'Reminder Response', query: 'How many payment nudges have we dispatched this week?' },
      ],
    };
  }

  if (normalized.includes('ledger') || normalized.includes('transaction')) {
    return {
      badge: 'Ledger & Cashflow',
      icon: Wallet,
      placeholder: 'Ask about bank transactions, income streams, or reconciliation...',
      starters: [
        { label: 'Monthly Inflows', query: 'Summarize all income entries received in the bank ledger this month.' },
        { label: 'Inflow vs Outflow', query: 'Compare total income versus total expenses recorded this month.' },
        { label: 'Unmatched Receipts', query: 'Are all bank transaction entries reconciled against client invoices?' },
        { label: 'Revenue Channels', query: 'What are our primary sources of income recorded in the ledger?' },
      ],
    };
  }

  if (normalized.includes('playground') || normalized.includes('opspilot ai')) {
    return {
      badge: 'OpsPilot AI',
      icon: Terminal,
      placeholder: 'Ask OpsPilot AI about financial health, cash projections, or edge cases...',
      starters: [
        { label: 'Test Ledger Logic', query: 'Analyze how the AI copilot handles zero-balance edge cases.' },
        { label: 'Executive Style', query: 'Summarize our financial status into 3 concise bullet points.' },
        { label: 'Extract Invoice Details', query: 'Show an example structured summary for overdue clients.' },
        { label: 'Safety Thresholds', query: 'How does the model calculate minimum cash runway warnings?' },
      ],
    };
  }

  if (normalized.includes('audit') || normalized.includes('activity')) {
    return {
      badge: 'Activity Audit Log',
      icon: History,
      placeholder: 'Ask about system activity logs, changes, or audit trails...',
      starters: [
        { label: 'Recent Actions', query: 'Summarize the last 5 system log entries created in OpsPilot.' },
        { label: 'Security Audit', query: 'Were there any recent company profile or bank detail updates?' },
        { label: 'Invoice Dispatch Logs', query: 'When was the last invoice email dispatched according to system logs?' },
      ],
    };
  }

  // Default Overview
  return {
    badge: 'Company Overview',
    icon: ShieldCheck,
    placeholder: 'Ask OpsPilot about cashflow, unpaid bills, or company health...',
    starters: [
      { label: 'Cash Balance', query: 'What is our current bank balance and net financial position?' },
      { label: 'Outstanding AR', query: 'Summarize unpaid client invoices and overdue balances.' },
      { label: 'Expense Summary', query: 'What are our biggest expense items this month?' },
      { label: 'Executive Briefing', query: 'Give me a 3-bullet executive briefing of our business finances.' },
    ],
  };
};

export const GlobalAiChatWidget: React.FC<GlobalAiChatWidgetProps> = ({
  invoices,
  expenses,
  cashForecast,
  transactions,
  activeTabTitle = 'Financials',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const sectionConfig = getSectionConfig(activeTabTitle);
  const SectionIcon = sectionConfig.icon;

  const totalAr = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalOutflow = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getInitialMessage = (secTitle: string, config: ReturnType<typeof getSectionConfig>): ChatMessage => ({
    id: `msg-init-${Date.now()}`,
    sender: 'assistant',
    text: `**Welcome to OpsPilot Copilot AI.**\n\nI am connected to your live financial ledger for **${config.badge}** (${secTitle}).\n\n* **Bank Balance:** ${formatRupee(
      cashForecast.currentBalance
    )}\n* **Uncollected AR:** ${formatRupee(
      totalAr
    )} (${invoices.filter((i) => i.status === 'overdue').length} overdue)\n* **Monthly Outflow:** ${formatRupee(
      totalOutflow
    )}\n\nSelect a prompt below or ask any question regarding **${secTitle}**.`,
    timestamp: 'Just now',
  });

  // Saved Chat Sessions History
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => [
    {
      id: 'session-default',
      title: 'Initial Overview',
      date: 'Today, 10:00 AM',
      messages: [getInitialMessage(activeTabTitle, sectionConfig)],
    },
  ]);

  const [activeSessionId, setActiveSessionId] = useState<string>('session-default');

  const currentSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];
  const messages = currentSession ? currentSession.messages : [];

  // Track tab changes to inject a section context notice
  const prevTabRef = useRef(activeTabTitle);
  useEffect(() => {
    if (prevTabRef.current !== activeTabTitle) {
      prevTabRef.current = activeTabTitle;
      const contextSwitchMsg: ChatMessage = {
        id: `switch-${Date.now()}`,
        sender: 'assistant',
        text: `**Section Context: ${activeTabTitle}**\n\nPrompts and answers are now tailored for **${sectionConfig.badge}**. Ask me any question about this section.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, contextSwitchMsg] }
            : s
        )
      );
    }
  }, [activeTabTitle, activeSessionId, sectionConfig.badge]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !showHistoryView) {
      scrollToBottom();
    }
  }, [messages, isOpen, isAskingAi, showHistoryView]);

  const handleStartNewThread = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `${activeTabTitle} Discussion`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [getInitialMessage(activeTabTitle, sectionConfig)],
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setShowHistoryView(false);
  };

  const handleClearActiveThread = () => {
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [getInitialMessage(activeTabTitle, sectionConfig)] }
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

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isAskingAi) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: s.messages.length <= 1 ? textToSend.slice(0, 30) : s.title,
              messages: [...s.messages, userMsg],
            }
          : s
      )
    );

    if (!customText) setInputMessage('');
    setIsAskingAi(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          activeSection: activeTabTitle,
          financialContext: {
            cashForecast,
            invoices,
            expenses,
            transactions,
          },
        }),
      });

      const data = await response.json();
      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text:
          data.reply ||
          'OpsPilot reviewed your ledger numbers for ' +
            activeTabTitle +
            '. Let me know if you would like me to draft a report or dispatch an email.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, aiReply] }
            : s
        )
      );
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `**OpsPilot assistant unavailable right now.**\n\nCurrent bank balance: ${formatRupee(cashForecast.currentBalance)}\n\nOverdue invoices: ${invoices.filter((i) => i.status === 'overdue').length} totaling ${formatRupee(totalAr)}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        )
      );
    } finally {
      setIsAskingAi(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center justify-center w-14 h-14 bg-slate-950 hover:bg-slate-900 text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 border border-slate-800 transition-all duration-200 cursor-pointer hover:scale-[1.05] active:scale-[0.97]"
          title="Ask OpsPilot AI"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white shadow-xs p-1.5 shrink-0 border border-slate-200">
            <OpsPilotLogo size={24} />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-950"></span>
            </span>
          </div>
        </button>
      </div>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div
          className={`fixed z-50 print:hidden transition-all duration-300 ${
            isExpanded
              ? 'inset-4 sm:inset-8 bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col'
              : 'bottom-20 right-4 sm:right-6 w-[95vw] sm:w-[450px] h-[620px] max-h-[82vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden'
          }`}
        >
          {/* Header Bar */}
          <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-1 font-bold shadow-xs border border-slate-200 shrink-0">
                <OpsPilotLogo size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white tracking-tight whitespace-nowrap">OpsPilot AI</h3>
                <p className="text-[10px] text-slate-350 font-normal whitespace-nowrap mt-0.5">
                  Context: {activeTabTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-slate-400">
              <button
                onClick={() => setShowHistoryView(!showHistoryView)}
                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                  showHistoryView ? 'bg-indigo-600 text-white' : 'hover:text-white hover:bg-slate-800'
                }`}
                title="View Chat History & Saved Threads"
              >
                <History className="w-4 h-4" />
                <span className="text-[10px] font-bold hidden sm:inline">History</span>
              </button>
              <button
                onClick={handleClearActiveThread}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Reset current conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title={isExpanded ? 'Minimize' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* History View vs Active Chat View */}
          {showHistoryView ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-extrabold text-xs text-slate-900">Saved Chat History Threads</h4>
                </div>
                <button
                  onClick={handleStartNewThread}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Conversation</span>
                </button>
              </div>

              <div className="space-y-2">
                {chatSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setShowHistoryView(false);
                      }}
                    >
                      <div className="space-y-1 flex-1 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs text-slate-900 line-clamp-1">
                            {session.title}
                          </span>
                          {isActive && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {session.date} • {session.messages.length} messages
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {chatSessions.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete thread"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Contextual Starter Prompts */}
              <div className="bg-slate-50 border-b border-slate-200/80 p-2.5 px-3 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 scrollbar-none">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] shrink-0 mr-1">
                  Prompts:
                </span>
                {sectionConfig.starters.map((qs, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(qs.query)}
                    disabled={isAskingAi}
                    className="bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl px-2.5 py-1 font-semibold whitespace-nowrap transition cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
                  >
                    {qs.label}
                  </button>
                ))}
              </div>

              {/* Chat Messages Body */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 shadow-2xs mt-0.5">
                        <OpsPilotLogo size={20} />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed relative group ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs font-normal'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[10px] opacity-70">
                        <span className="font-extrabold tracking-wider uppercase">
                          {msg.sender === 'user' ? 'You' : 'OpsPilot AI'}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {msg.sender === 'assistant' ? (
                        <div className="markdown-body space-y-2 text-slate-800">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}

                      {msg.sender === 'assistant' && (
                        <button
                          onClick={() => copyToClipboard(msg.text, idx)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition rounded hover:bg-slate-100"
                          title="Copy response"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isAskingAi && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-xs p-3 text-xs font-semibold flex items-center space-x-2 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      <span>Analyzing {sectionConfig.badge.toLowerCase()} data...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    placeholder={sectionConfig.placeholder}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={isAskingAi}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isAskingAi}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl font-bold transition shadow-2xs cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
