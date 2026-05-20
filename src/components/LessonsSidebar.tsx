import React from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, CheckCircle, Circle, ChevronRight, HelpCircle, Award, Terminal } from 'lucide-react';
import { Lesson } from '../types';

interface LessonsSidebarProps {
  lessons: Lesson[];
  activeLessonId: string;
  onSelectLesson: (id: string) => void;
  onCopyCommand: (command: string) => void;
}

export default function LessonsSidebar({
  lessons,
  activeLessonId,
  onSelectLesson,
  onCopyCommand,
}: ReactLessonsProps) {
  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const allCompleted = activeLesson.objectives.every((obj) => obj.isCompleted);

  // Simple script command extractor helper to render them clickable
  // Let's replace any markdown code block with clickable commands where relevant
  const handleCopyCode = (code: string) => {
    // If code has comments or multiline, clean it up or copy first line
    const cleanCode = code.replace(/^#.*$/m, '').trim().split('\n')[0];
    onCopyCommand(cleanCode);
  };

  return (
    <div id="lessons-sidebar" className="flex flex-col h-full bg-slate-900 border-l border-slate-800/80 flex-shrink-0">
      {/* Chapter Selection Tab Header */}
      <div className="p-4 bg-slate-950/40 border-b border-slate-800/60">
        <div className="flex items-center gap-1.5 mb-3">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Курс молодого бойца Linux
          </h2>
        </div>
        
        {/* Dropdown or visual list for selecting lessons */}
        <div className="relative">
          <select
            value={activeLessonId}
            onChange={(e) => onSelectLesson(e.target.value)}
            className="w-full bg-slate-800 text-slate-100 py-2.5 px-3 pr-8 rounded border border-slate-700 font-sans text-sm outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none cursor-pointer"
          >
            {lessons.map((lesson, idx) => {
              const completedCount = lesson.objectives.filter((o) => o.isCompleted).length;
              const totalCount = lesson.objectives.length;
              const isDone = completedCount === totalCount;
              return (
                <option key={lesson.id} value={lesson.id} className="bg-slate-800">
                  {idx + 1}. {lesson.title} {isDone ? '✔️' : `(${completedCount}/${totalCount})`}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <ChevronRight className="w-4 h-4 transform rotate-90" />
          </div>
        </div>
      </div>

      {/* Main Body with Instructions */}
      <div className="flex-1 overflow-y-auto p-4 terminal-scrollbar space-y-4">
        {/* Category Badge & Title */}
        <div>
          <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/35 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 text-center">
            {activeLesson.category}
          </span>
          <h1 className="text-lg font-bold text-slate-105 font-sans leading-tight">
            {activeLesson.title}
          </h1>
        </div>

        {/* Objectives Progress Block */}
        <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
            Критерии прохождения:
          </h3>
          <div className="space-y-2.5">
            {activeLesson.objectives.map((obj) => (
              <div key={obj.id} className="flex items-start gap-2.5 text-sm select-none">
                {obj.isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <span
                    className={`font-sans ${
                      obj.isCompleted ? 'text-slate-400 line-through decoration-emerald-500/40' : 'text-slate-200'
                    }`}
                  >
                    {obj.text}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Fully Completed Banner Notification */}
          {allCompleted && (
            <div className="mt-3 flex items-center justify-center gap-2 p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-lg animate-pulse">
              <Award className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>Урок пройден! Отличная работа! 🎉</span>
            </div>
          )}
        </div>

        {/* Rich Lesson Guide from React Markdown */}
        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-sans border-t border-slate-800/60 pt-4 space-y-3
          prose-headings:text-slate-100 prose-headings:font-semibold prose-h3:text-sm prose-h4:text-xs prose-h4:uppercase prose-h4:tracking-widest prose-h4:text-slate-400
          prose-code:text-amber-400 prose-code:bg-slate-950/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs prose-code:border prose-code:border-slate-800/40
          prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4">
          <ReactMarkdown
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeContent = String(children).replace(/\n$/, '');
                
                // If it is an inline code, or we treat standard code as shortcut copy
                return (
                  <code
                    id="copy-code-node"
                    onClick={() => handleCopyCode(codeContent)}
                    className="cursor-pointer hover:bg-emerald-950/45 hover:text-emerald-300 hover:border-emerald-500/30 transition shadow-sm inline-block max-w-full overflow-x-auto select-none"
                    title="Кликните, чтобы вставить команду в терминал"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
            }}
          >
            {activeLesson.instructions}
          </ReactMarkdown>
        </div>
      </div>

      {/* Lesson Footer Hint Helper box */}
      <div className="p-4 bg-slate-950/40 border-t border-slate-800/60 text-xs text-slate-400 space-y-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-amber-500 font-semibold font-mono">
          <HelpCircle className="w-4 h-4" />
          <span>Подсказка</span>
        </div>
        <p className="leading-relaxed font-sans">{activeLesson.hint}</p>
        <p className="text-[10px] text-slate-500 leading-relaxed italic border-t border-slate-800/40 pt-1">
          💡 Лайфхак: Нажимайте на команды, выделенные `оранжевым кодом`, чтобы мгновенно скопировать их в буфер ввода терминала!
        </p>
      </div>
    </div>
  );
}

// Custom interface fix for TS
interface ReactLessonsProps {
  lessons: Lesson[];
  activeLessonId: string;
  onSelectLesson: (id: string) => void;
  onCopyCommand: (command: string) => void;
}
