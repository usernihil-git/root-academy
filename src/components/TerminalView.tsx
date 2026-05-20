import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, RotateCcw, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { TerminalOutputLine, CommandHistoryItem, FileNode } from '../types';

interface TerminalViewProps {
  outputs: TerminalOutputLine[];
  currentCwd: string;
  isExecuting: boolean;
  tree: FileNode[];
  onCommandRun: (command: string) => void;
  onResetSandbox: () => void;
  onClearTerminal: () => void;
}

export default function TerminalView({
  outputs,
  currentCwd,
  isExecuting,
  tree,
  onCommandRun,
  onResetSandbox,
  onClearTerminal,
}: TerminalViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  
  const consoleBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when output arrives
  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs, isExecuting]);

  // Keep focus on input on clicks inside the terminal viewport
  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    focusInput();
  }, [isExecuting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = inputValue.trim();
    if (!command) return;

    // Send up
    onCommandRun(command);
    
    // Save history
    setCommandHistory((prev) => [...prev, command]);
    setInputValue('');
    setHistoryIdx(-1);
  };

  // Autocomplete and history controls
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const words = inputValue.split(' ');
      const lastWord = words[words.length - 1];
      if (!lastWord) return;

      // Find children in the current path in client memory
      const getItemsInCwd = (nodes: FileNode[], targetPath: string): string[] => {
        if (!targetPath) {
          return nodes.map(n => n.name);
        }
        
        const pathParts = targetPath.split('/');
        let currentNodes = nodes;
        
        for (const part of pathParts) {
          const matchDir = currentNodes.find(n => n.name === part && n.type === 'directory');
          if (matchDir && matchDir.children) {
            currentNodes = matchDir.children;
          } else {
            break;
          }
        }
        return currentNodes.map(n => n.name);
      };

      const itemsInCwd = getItemsInCwd(tree, currentCwd);
      const matched = itemsInCwd.find(item => item.startsWith(lastWord));
      
      if (matched) {
        words[words.length - 1] = matched;
        setInputValue(words.join(' '));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      
      const nextIdx = historyIdx === -1 ? commandHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputValue(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      
      const nextIdx = historyIdx + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIdx(-1);
        setInputValue('');
      } else {
        setHistoryIdx(nextIdx);
        setInputValue(commandHistory[nextIdx]);
      }
    }
  };

  return (
    <div id="terminal-root" className="flex flex-col h-full bg-slate-950 text-slate-100 font-mono shadow-inner select-text">
      {/* Terminal Bar Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Терминал Bash
          </span>
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-slate-400 capitalize">интерактивный</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearTerminal}
            className="flex items-center gap-1 text-[11px] px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition duration-150 active:scale-95"
            title="Очистить лог терминала"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Очистить лог</span>
          </button>
          
          <button
            onClick={onResetSandbox}
            className="flex items-center gap-1 text-[11px] px-2 py-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/30 border border-rose-500/10 hover:border-rose-500/30 transition duration-150 active:scale-95"
            title="Сбросить все созданные файлы"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить файлы</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Viewer screen */}
      <div
        onClick={focusInput}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 terminal-scrollbar text-sm"
      >
        {/* Welcome system instructions */}
        <div className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-lg text-slate-300 leading-relaxed font-sans max-w-3xl space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Супер! Окружение Bash запущено.</span>
          </div>
          <p className="text-xs md:text-sm">
            Все команды выполняются внутри вашей личной учебной папки <code className="text-emerald-300 font-mono">~/sandbox</code>.
            Вы можете вводить команды прямо в строке ниже. Нажмите <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">Tab</code> для автодополнения.
          </p>
          <div className="pt-1.5 flex flex-wrap gap-2 text-xs font-mono text-slate-400">
            <span>Популярные:</span>
            <button onClick={() => onCommandRun('pwd')} className="text-emerald-400 hover:underline">pwd</button>
            <span>•</span>
            <button onClick={() => onCommandRun('ls -la')} className="text-emerald-400 hover:underline">ls -la</button>
            <span>•</span>
            <button onClick={() => onCommandRun('cat README.md')} className="text-emerald-400 hover:underline">cat README.md</button>
          </div>
        </div>

        {/* Lines loop */}
        {outputs.map((line, index) => {
          if (line.type === 'input') {
            return (
              <div key={index} className="flex items-start gap-1 font-mono text-[13.5px]">
                <span className="text-blue-400 shrink-0 select-none">root@linux-academy</span>
                <span className="text-slate-500 select-none">:</span>
                <span className="text-emerald-400 font-semibold shrink-0 select-none">
                  ~{line.cwd ? `/${line.cwd}` : ''}$
                </span>
                <span className="text-slate-100 break-all pl-1">{line.text}</span>
              </div>
            );
          } else if (line.type === 'error') {
            return (
              <div key={index} className="flex gap-2 pl-4 text-rose-400 border-l-2 border-rose-500 py-0.5 max-w-4xl text-[13px]">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="whitespace-pre-wrap font-mono break-all">{line.text}</span>
              </div>
            );
          } else if (line.type === 'system') {
            return (
              <div key={index} className="flex items-center gap-2 pl-4 text-sky-400 border-l-2 border-sky-500 py-0.5 text-xs italic">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>{line.text}</span>
              </div>
            );
          } else {
            // Standard Command output line
            return (
              <div key={index} className="pl-4 text-slate-350 pr-2 overflow-x-auto whitespace-pre font-mono text-[13.5px] leading-relaxed select-text">
                {line.text}
              </div>
            );
          }
        })}

        {/* Executing visual spinner */}
        {isExecuting && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-4 font-mono">
            <span className="w-3 h-3 border-2 border-slate-550 border-t-emerald-400 rounded-full animate-spin"></span>
            <span>Выполнение команды...</span>
          </div>
        )}

        <div ref={consoleBottomRef} />
      </div>

      {/* Input row footer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 p-3 bg-slate-900/80 border-t border-slate-800/80"
      >
        <div className="flex items-center shrink-0 pr-1 select-none font-mono text-xs md:text-[13px]">
          <span className="text-blue-400">root@linux-academy</span>
          <span className="text-slate-400">:</span>
          <span className="text-emerald-400 font-semibold ml-0.5">
            ~{currentCwd ? `/${currentCwd}` : ''}$
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isExecuting}
          placeholder="Введите команду (например, pwd или ls)..."
          className="flex-1 bg-transparent text-slate-100 font-mono text-sm focus:outline-none placeholder-slate-600 border-0 p-0 focus:ring-0"
        />

        <button
          type="submit"
          disabled={isExecuting || !inputValue.trim()}
          className={`p-1.5 rounded transition ${
            inputValue.trim()
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
