import React, { useState } from 'react';
import { JointDefinition, MovementDefinition } from '../../types/biomechanics';

interface AITutorTabProps {
  joint: JointDefinition;
  movement: MovementDefinition;
  angleDeg: number;
  loadKg: number;
  selectedMuscleId: string | null;
}

export const AITutorTab: React.FC<AITutorTabProps> = ({
  joint,
  movement,
  angleDeg,
  loadKg,
  selectedMuscleId,
}) => {
  const [language, setLanguage] = useState<'English' | 'Gujarati' | 'Hindi'>('English');
  const [mode, setMode] = useState<'qna' | 'viva'>('qna');
  const [promptInput, setPromptInput] = useState<string>('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; mode?: string }[]
  >([
    {
      role: 'assistant',
      text: 'Namaste and welcome to the VR AI Physiotherapy Tutor! I am your clinical biomechanics professor. Ask me any conceptual question about muscle mechanics, torque levers, or ask for a BPT viva exam question. I answer in English, Gujarati (ગુજરાતી), or Hindi (हिन्दी) under 130 words.',
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedMuscleObj = selectedMuscleId
    ? movement.muscles.find((m) => m.id === selectedMuscleId)
    : null;

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || promptInput.trim();
    if (!textToSend && mode !== 'viva') return;

    const userMessage = textToSend || 'Please ask me a BPT viva exam question on this joint.';
    setMessages((prev) => [...prev, { role: 'user', text: userMessage, mode }]);
    setPromptInput('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          joint: joint.name,
          movement: movement.name,
          angle: angleDeg,
          loadKg,
          selectedMuscle: selectedMuscleObj?.name || 'None selected',
          language,
          mode,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply || 'No response received.', mode },
      ]);
    } catch (err: any) {
      console.error('AI Tutor request failed:', err);
      setErrorMsg(
        err?.message || 'Could not communicate with AI Tutor server. Please check GEMINI_API_KEY setting.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskVivaQuestion = () => {
    setMode('viva');
    handleSendMessage('Please ask me a challenging Bachelor of Physiotherapy (BPT) viva voce question based on this current joint and angle.');
  };

  return (
    <div className="space-y-4 text-slate-100 text-sm">
      {/* Strict Medical Safety Banner */}
      <div className="bg-amber-950/40 border border-amber-600/70 p-2.5 rounded text-xs text-amber-200">
        <strong>Strict Safety Policy:</strong> This tutor is strictly an academic learning tool. It does not diagnose or advise on real clinical patients. All real clinical queries must be addressed to a licensed clinical supervisor.
      </div>

      {/* Language & Examination Mode Selectors */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide">
            Response Language
          </span>
          <div className="flex gap-1">
            {(['English', 'Gujarati', 'Hindi'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`text-xs px-2.5 py-1 rounded font-bold border transition-colors cursor-pointer ${
                  language === lang
                    ? 'bg-[#20b2aa] text-[#0b132b] border-[#fbbf24]'
                    : 'bg-[#132247] text-slate-300 border-slate-700 hover:bg-[#1a2d5e]'
                }`}
              >
                {lang === 'Gujarati' ? 'ગુજરાતી' : lang === 'Hindi' ? 'हिन्दी' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Current Context Card */}
        <div className="text-[11px] bg-[#070e22] p-2 rounded text-slate-300 border border-slate-800 flex flex-wrap gap-x-3 gap-y-1">
          <span><strong>Joint:</strong> {joint.name}</span>
          <span><strong>Movement:</strong> {movement.name}</span>
          <span><strong>Angle:</strong> {angleDeg}°</span>
          <span><strong>Load:</strong> {loadKg} kg</span>
          {selectedMuscleObj && <span><strong>Target Muscle:</strong> {selectedMuscleObj.name}</span>}
        </div>

        {/* Mode Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setMode('qna')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer ${
              mode === 'qna'
                ? 'bg-[#d4af37] text-[#0b132b] border-amber-300 shadow font-bold'
                : 'bg-[#132247] text-slate-300 border-slate-700'
            }`}
          >
            Academic Q&A Mode
          </button>
          <button
            onClick={handleAskVivaQuestion}
            className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer ${
              mode === 'viva'
                ? 'bg-[#d4af37] text-[#0b132b] border-amber-300 shadow font-bold'
                : 'bg-[#132247] text-slate-300 border-slate-700'
            }`}
          >
            Start BPT Viva Voce
          </button>
        </div>
      </div>

      {/* Conversation History Display */}
      <div className="bg-[#070e22] p-3 rounded-md border border-slate-800 h-64 overflow-y-auto space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] text-slate-400 mb-0.5 font-bold uppercase tracking-wide">
              {msg.role === 'user' ? 'Student' : 'AI Clinical Biomechanics Tutor (Gemini)'}
            </div>
            <div
              className={`max-w-[88%] p-2.5 rounded text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1e3a8a] text-white border border-blue-600 rounded-br-none'
                  : 'bg-[#0f1d40] text-slate-100 border border-teal-600/50 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-teal-300 bg-[#0f1d40] p-2 rounded border border-teal-700/50 w-fit">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
            <span>Consulting clinical literature & preparing answer (&lt;130 words)...</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-950/80 border border-red-500 p-2.5 rounded text-xs text-red-200">
            <strong>Error:</strong> {errorMsg}
          </div>
        )}
      </div>

      {/* Input Box and Send Controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder={
            mode === 'viva'
              ? 'Type your answer to the viva question...'
              : `Ask in ${language} (e.g. "Explain moment arm vs angle of pull")...`
          }
          className="flex-1 bg-[#0b1633] border border-slate-700 rounded px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#20b2aa]"
        />
        <button
          type="submit"
          disabled={isLoading || (!promptInput.trim() && mode !== 'viva')}
          className="px-4 py-2 bg-[#20b2aa] hover:bg-[#14b8a6] disabled:opacity-40 text-[#0b132b] font-bold text-xs rounded border border-[#fbbf24] transition-colors cursor-pointer"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
