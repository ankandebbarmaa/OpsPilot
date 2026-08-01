import React, { useState } from 'react';
import { ReminderTemplate } from '../types';
import { ShieldCheck, Mail, Check, RefreshCw, Layers } from 'lucide-react';

interface EmailTemplatesModalProps {
  templates: ReminderTemplate[];
  onUpdateTemplate: (template: ReminderTemplate) => void;
}

export const EmailTemplatesModal: React.FC<EmailTemplatesModalProps> = ({ templates, onUpdateTemplate }) => {
  const [selectedStage, setSelectedStage] = useState<string>(templates[0]?.stage || 'pre_due');
  const [editingSubject, setEditingSubject] = useState('');
  const [editingBody, setEditingBody] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const currentTemplate = templates.find((t) => t.stage === selectedStage) || templates[0];

  React.useEffect(() => {
    if (currentTemplate) {
      setEditingSubject(currentTemplate.subject);
      setEditingBody(currentTemplate.body);
    }
  }, [selectedStage, currentTemplate]);

  const handleSave = () => {
    if (!currentTemplate) return;
    const updated: ReminderTemplate = {
      ...currentTemplate,
      subject: editingSubject,
      body: editingBody,
    };
    onUpdateTemplate(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
          <ShieldCheck className="w-6 h-6 text-indigo-600 mr-2.5" />
          Escalating Reminder Cadence Engine
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Research-backed multi-stage collection cadence (Garfield Framework) with automated personalization variables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Selector Sidebar */}
        <div className="space-y-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">Cadence Stages</h2>
          {templates.map((tmpl, idx) => (
            <button
              key={tmpl.stage}
              onClick={() => setSelectedStage(tmpl.stage)}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedStage === tmpl.stage
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600">Stage {idx + 1}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {tmpl.tone}
                </span>
              </div>
              <p className="font-bold text-sm text-slate-900 mt-1">{tmpl.stageName}</p>
              <p className="text-[11px] text-slate-500 mt-1">{tmpl.triggerDescription}</p>
            </button>
          ))}
        </div>

        {/* Template Editor Box */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">{currentTemplate.stageName}</h3>
                <p className="text-xs text-slate-500">Tone: {currentTemplate.tone}</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSaved ? 'Saved!' : 'Save Template'}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Subject Line Pattern:</label>
              <input
                type="text"
                value={editingSubject}
                onChange={(e) => setEditingSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Body Content:</label>
              <textarea
                rows={10}
                value={editingBody}
                onChange={(e) => setEditingBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono leading-relaxed"
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-800">Supported Personalization Variables:</p>
              <div className="flex flex-wrap gap-2 text-indigo-700 font-semibold">
                <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">[ClientName]</span>
                <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">[InvoiceNumber]</span>
                <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">[Amount]</span>
                <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">[DueDate]</span>
                <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">[PaymentLink]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
