import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ArrowRight, HelpCircle, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';

interface AiMentorProps {
  activeLessonTitle: string;
  activeLessonInstructions: string;
  lastCommand: { command: string; stdout: string; stderr: string; exitCode: number } | null;
  onRunCommand: (command: string) => void;
}

export default function AiMentor({
  activeLessonTitle,
  activeLessonInstructions,
  lastCommand,
  onRunCommand
}: AiMentorProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  // Trigger AI request
  const fetchAiGuide = async (customQuestion?: string, errorAction = false) => {
    setIsLoading(true);
    setResponse(null);

    const payload: Record<string, any> = {
      activeLessonTitle,
      activeLessonInstructions,
    };

    if (errorAction && lastCommand) {
      payload.command = lastCommand.command;
      payload.stdout = lastCommand.stdout;
      payload.stderr = lastCommand.stderr;
      payload.exitCode = lastCommand.exitCode;
    } else if (customQuestion) {
      payload.userQuestion = customQuestion;
    } else {
      payload.userQuestion = `Дай мне пошаговую тактику и подробные подсказки для выполнения текущего урока: "${activeLessonTitle}". Расскажи, как правильно писать эти команды.`;
    }

    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setResponse(data.explanation || 'Наставник дал пустой ответ.');
    } catch (e: any) {
      setResponse(`Ошибка связи с ИИ-наставником: ${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    fetchAiGuide(question.trim());
    setQuestion('');
  };

  return (
    <div id="ai-mentor-root" className="flex flex-col h-full bg-slate-900 border-l border-slate-800/80 flex-shrink-0">
      {/* Header */}
      <div className="p-4 bg-slate-950/40 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            ИИ-Наставник Академии
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Задайте вопрос о Linux или попросите объяснить ошибки и уроки.
        </p>
      </div>

      {/* Main interaction canvas */}
      <div className="flex-1 overflow-y-auto p-4 terminal-scrollbar space-y-4">
        {/* Short preset triggers */}
        <div className="grid grid-cols-1 gap-2 shrink-0">
          <button
            onClick={() => fetchAiGuide()}
            disabled={isLoading}
            className="flex items-center justify-between text-left text-xs bg-slate-850 hover:bg-slate-800 text-slate-250 py-2.5 px-3 rounded border border-slate-800 hover:border-slate-700 transition duration-150 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-purple-400">💡</span>
              <span className="font-semibold">Как пройти этот урок?</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => fetchAiGuide(`Объясни мне, в чем концептуальная суть Linux и почему работа в терминале Bash ценится гораздо больше, чем в графическом интерфейсе? Расскажи кратко.`)}
            disabled={isLoading}
            className="flex items-center justify-between text-left text-xs bg-slate-850 hover:bg-slate-800 text-slate-250 py-2.5 px-3 rounded border border-slate-800 hover:border-slate-700 transition duration-150 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">🐧</span>
              <span className="font-semibold">Зачем нужен терминал Bash?</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {lastCommand && lastCommand.exitCode !== 0 && (
            <button
              onClick={() => fetchAiGuide(undefined, true)}
              disabled={isLoading}
              className="flex items-center justify-between text-left text-xs bg-rose-950/20 hover:bg-rose-950/30 text-rose-300 py-2.5 px-3 rounded border border-rose-900/40 hover:border-rose-800/60 transition duration-150 animate-pulse"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="font-semibold font-sans">Объяснить ошибку: "{lastCommand.command}"</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
            </button>
          )}
        </div>

        {/* AI response panel */}
        <div className="bg-slate-950/45 border border-slate-800/60 rounded-xl min-h-[160px] p-4 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 font-sans space-y-3">
              <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
              <p className="text-xs italic text-center">Наставник изучает командную среду и файлы песочницы...</p>
            </div>
          ) : response ? (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800/40 pb-2 text-xs font-mono text-slate-400 uppercase tracking-widest shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Рекомендация наставника:</span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-sans
                prose-headings:text-slate-100 prose-headings:font-bold prose-h3:text-sm prose-h4:text-xs
                prose-code:text-emerald-400 prose-code:bg-slate-950/70 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs">
                <ReactMarkdown>{response}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2.5 font-sans">
              <MessageSquare className="w-7 h-7 text-slate-700" />
              <p className="text-xs max-w-xs">
                Выберите один из быстрых вопросов выше или настройте свой вопрос в поле ниже, чтобы получить мудрый совет от ИИ-наставника!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input box */}
      <form
        onSubmit={handleCustomSubmit}
        className="p-3 bg-slate-950/40 border-t border-slate-800/60 shrink-0"
      >
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            placeholder="Спросите меня, например: Что делает chmod 755?"
            className="w-full bg-slate-850 text-slate-150 py-2.5 pl-3 pr-10 rounded border border-slate-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 font-sans text-xs outline-none transition"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="absolute right-1.5 top-1.5 p-1 rounded hover:bg-slate-700/50 text-purple-400 disabled:text-slate-600 transition duration-150"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
