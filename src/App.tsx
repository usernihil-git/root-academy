import React, { useState, useEffect } from 'react';
import { Terminal, BookOpen, Sparkles, HelpCircle, GraduationCap, ChevronRight, Info, Award, CircleHelp } from 'lucide-react';
import { FileNode, Lesson, TerminalOutputLine } from './types';
import { LESSONS, CHEATSHEET } from './data';
import FileExplorer from './components/FileExplorer';
import TerminalView from './components/TerminalView';
import LessonsSidebar from './components/LessonsSidebar';
import AiMentor from './components/AiMentor';

export default function App() {
  // Navigation tabs for the right learning panel
  const [activeTab, setActiveTab] = useState<'lessons' | 'cheatsheet' | 'ai'>('lessons');
  const [activeLessonId, setActiveLessonId] = useState<string>('lesson-1');
  
  // Lessons state, loaded from local storage if existing
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('linux_academy_lessons_v1');
    return saved ? JSON.parse(saved) : LESSONS;
  });

  // Terminal CWD, logs and inputs
  const [currentCwd, setCurrentCwd] = useState<string>(''); // relative to sandboxRoot
  const [tree, setTree] = useState<FileNode[]>([]);
  const [outputs, setOutputs] = useState<TerminalOutputLine[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [lastCommand, setLastCommand] = useState<{ command: string; stdout: string; stderr: string; exitCode: number } | null>(null);

  // Cheatsheet category filter
  const [sheetsFilter, setSheetsFilter] = useState<string>('all');

  // Save lessons progress dynamically to localStorage
  useEffect(() => {
    localStorage.setItem('linux_academy_lessons_v1', JSON.stringify(lessons));
  }, [lessons]);

  // Sync file explorer tree on startup
  useEffect(() => {
    fetchTree();
    // Welcome message
    setOutputs([
      {
        type: 'system',
        text: 'Инициализация окружения Bash Simulator... Готово. Системные папки примонтированы.',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, []);

  const fetchTree = async () => {
    try {
      const res = await fetch('/api/terminal/tree');
      const data = await res.json();
      if (data.tree) {
        setTree(data.tree);
      }
    } catch (e) {
      console.error('Error fetching file tree:', e);
    }
  };

  // Execution engine
  const runCommand = async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) return;

    // Client-side CLI intercepts
    if (trimmed === 'clear') {
      setOutputs([]);
      return;
    }

    if (trimmed === 'help') {
      setActiveTab('cheatsheet');
      setOutputs((prev) => [
        ...prev,
        {
          type: 'input',
          text: command,
          cwd: currentCwd,
          timestamp: new Date().toLocaleTimeString()
        },
        {
          type: 'system',
          text: 'Переключаем вашу правую панель во вкладку шпаргалки ("Справочник команд") 🔎 Получите подробные сведения!',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      return;
    }

    setIsExecuting(true);

    // Append input line instantly
    setOutputs((prev) => [
      ...prev,
      {
        type: 'input',
        text: command,
        cwd: currentCwd,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    const activeLesson = lessons.find((l) => l.id === activeLessonId);

    try {
      const response = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command,
          cwd: currentCwd,
          activeLessonId,
          completedObjectives: activeLesson ? activeLesson.objectives : []
        })
      });

      const data = await response.json();

      // Append outputs
      const timestamp = new Date().toLocaleTimeString();
      const nextLines: TerminalOutputLine[] = [];

      if (data.stdout) {
        nextLines.push({ type: 'output', text: data.stdout, timestamp });
      }
      if (data.stderr) {
        nextLines.push({ type: 'error', text: data.stderr, timestamp });
      }

      setOutputs((prev) => [...prev, ...nextLines]);
      
      // Update CWD & Tree
      if (typeof data.cwd === 'string') {
        setCurrentCwd(data.cwd);
      }
      if (data.tree) {
        setTree(data.tree);
      }

      // Record last command for AI contextual assistance
      setLastCommand({
        command,
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode
      });

      // Update objectives if applicable
      if (data.objectivesStatus && activeLesson) {
        const anyCompletedNow = data.objectivesStatus.some(
          (o: any, idx: number) => o.isCompleted && !activeLesson.objectives[idx].isCompleted
        );

        setLessons((prevLessons) =>
          prevLessons.map((l) => {
            if (l.id === activeLessonId) {
              return {
                ...l,
                objectives: l.objectives.map((obj, idx) => ({
                  ...obj,
                  isCompleted: data.objectivesStatus[idx]?.isCompleted ?? obj.isCompleted
                }))
              };
            }
            return l;
          })
        );

        if (anyCompletedNow) {
          setOutputs((prev) => [
            ...prev,
            {
              type: 'system',
              text: '✨ Отлично! Вы выполнили очередную цель в уроке!',
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }
      }

    } catch (err: any) {
      setOutputs((prev) => [
        ...prev,
        {
          type: 'error',
          text: `Внутренняя ошибка выполнения команды: ${err.message || err}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset all sandbox user creations
  const resetSandbox = async () => {
    if (!confirm('Вы действительно хотите полностью сбросить песочницу? Все созданные вручную файлы и папки будут удалены, а учебные файлы восстановлены.')) {
      return;
    }
    
    setIsExecuting(true);
    try {
      const res = await fetch('/api/terminal/reset', { method: 'POST' });
      const data = await res.json();
      
      if (data.tree) {
        setTree(data.tree);
      }
      setCurrentCwd('');
      setOutputs([
        {
          type: 'system',
          text: 'Песочница сброшена к изначальному пустому шаблону! Начните учебу с чистого листа 🔄',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);

      // Reset Active Lesson progress too!
      setLessons(LESSONS);
    } catch (e: any) {
      alert(`Ошибка сброса: ${e.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyCommandToInput = (cmd: string) => {
    // We send command immediately to execution or copy to prompt trigger,
    // let's copy and execute it directly for maximum ease of training!
    runCommand(cmd);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Top Application Header Branding Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/10 border border-emerald-500/30 p-1.5 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight font-sans">
              Академия Терминала Linux & Bash
            </h1>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">
              Интерактивный тренажер с реальными консольными процессами
            </p>
          </div>
        </div>

        {/* Global Progress Metric indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">Пройдено Уроков</span>
            <span className="text-slate-200 mt-1 leading-none font-semibold">
              {lessons.filter(l => l.objectives.every(o => o.isCompleted)).length} из {lessons.length}
            </span>
          </div>
          <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              style={{ width: `${(lessons.filter(l => l.objectives.every(o => o.isCompleted)).length / lessons.length) * 100}%` }}
              className="bg-emerald-500 h-full transition-all duration-300"
            />
          </div>
        </div>
      </header>

      {/* Main split work board layout container */}
      <main className="flex-1 flex overflow-hidden min-h-0 bg-slate-950">
        
        {/* Left Side standard physical folder Explorer tree panel */}
        <div className="w-72 hidden lg:block shrink-0 h-full">
          <FileExplorer 
            tree={tree} 
            currentCwd={currentCwd} 
            onRefresh={fetchTree} 
          />
        </div>

        {/* Center Fluid Column: Dynamic Terminal command processor */}
        <div className="flex-1 min-w-0 h-full border-r border-slate-850">
          <TerminalView
            outputs={outputs}
            currentCwd={currentCwd}
            isExecuting={isExecuting}
            tree={tree}
            onCommandRun={runCommand}
            onResetSandbox={resetSandbox}
            onClearTerminal={() => setOutputs([])}
          />
        </div>

        {/* Right Tabpanel: Instructions, cheatsheet, or AI bot help */}
        <div className="w-96 hidden md:flex flex-col h-full bg-slate-900 border-l border-slate-800 shrink-0">
          
          {/* Tabs Selector headers */}
          <div className="flex items-center justify-between border-b border-slate-800 shrink-0 bg-slate-950/20">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 hover:text-slate-100 font-sans text-xs uppercase tracking-wider font-semibold border-b-2 transition ${
                activeTab === 'lessons'
                  ? 'border-amber-500 text-amber-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:bg-slate-850/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Уроки</span>
            </button>

            <button
              onClick={() => setActiveTab('cheatsheet')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 hover:text-slate-100 font-sans text-xs uppercase tracking-wider font-semibold border-b-2 transition ${
                activeTab === 'cheatsheet'
                  ? 'border-emerald-500 text-emerald-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:bg-slate-850/40'
              }`}
            >
              <CircleHelp className="w-3.5 h-3.5" />
              <span>Шпаргалка</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 hover:text-slate-100 font-sans text-xs uppercase tracking-wider font-semibold border-b-2 transition ${
                activeTab === 'ai'
                  ? 'border-purple-500 text-purple-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:bg-slate-850/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ИИ Наставник</span>
            </button>
          </div>

          {/* Tab content viewer layout */}
          <div className="flex-1 min-h-0">
            {activeTab === 'lessons' && (
              <LessonsSidebar
                lessons={lessons}
                activeLessonId={activeLessonId}
                onSelectLesson={setActiveLessonId}
                onCopyCommand={handleCopyCommandToInput}
              />
            )}

            {activeTab === 'cheatsheet' && (
              <div className="flex flex-col h-full">
                {/* Cheatsheet Categories Tabbed filter row */}
                <div className="p-3 bg-slate-950/30 border-b border-slate-800/45 shrink-0 flex gap-1 overflow-x-auto select-none">
                  {['all', 'navigation', 'files', 'text', 'shortcuts'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSheetsFilter(cat)}
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded transition whitespace-nowrap ${
                        sheetsFilter === cat
                          ? 'bg-emerald-600 font-semibold text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat === 'all' && 'Все'}
                      {cat === 'navigation' && 'Навигация'}
                      {cat === 'files' && 'Файлы'}
                      {cat === 'text' && 'Реквизиты/Текст'}
                      {cat === 'shortcuts' && 'Горячие'}
                    </button>
                  ))}
                </div>

                {/* Grid Lists layout */}
                <div className="flex-1 overflow-y-auto p-4 terminal-scrollbar space-y-3 bg-slate-900">
                  {CHEATSHEET.filter((item) => sheetsFilter === 'all' || item.category === sheetsFilter).map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950/40 border border-slate-800 hover:border-emerald-500/25 rounded-lg space-y-1.5 group transition duration-150"
                      >
                        <div className="flex items-center justify-between">
                          <code 
                            onClick={() => handleCopyCommandToInput(item.command)}
                            className="text-xs bg-slate-950 px-1.5 py-0.5 rounded text-amber-400 border border-slate-800 font-mono font-bold cursor-pointer hover:bg-emerald-950/30 hover:text-emerald-300 hover:border-emerald-500/25 transition shrink-0"
                            title="Кликните для копирования в терминал"
                          >
                            {item.command}
                          </code>
                          <span className="text-[9px] bg-slate-800 text-slate-400 rounded-sm px-1.5 font-mono uppercase shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-350 leading-relaxed font-sans">{item.description}</p>
                        <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/40">
                          Пример: <span className="text-slate-400">{item.example}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <AiMentor
                activeLessonTitle={lessons.find((l) => l.id === activeLessonId)?.title || ''}
                activeLessonInstructions={lessons.find((l) => l.id === activeLessonId)?.instructions || ''}
                lastCommand={lastCommand}
                onRunCommand={runCommand}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
