import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, RefreshCw, HelpCircle, HardDrive } from 'lucide-react';
import { FileNode } from '../types';

interface FileExplorerProps {
  tree: FileNode[];
  currentCwd: string;
  onRefresh: () => void;
}

export default function FileExplorer({ tree, currentCwd, onRefresh }: FileExplorerProps) {
  const [collapsedDirs, setCollapsedDirs] = useState<Record<string, boolean>>({});

  const toggleCollapse = (path: string) => {
    setCollapsedDirs((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.sh')) return <span className="text-emerald-400 font-mono text-xs font-semibold mr-1.5">&#62;_</span>;
    if (name.endsWith('.csv')) return <span className="text-amber-400 font-mono text-xs font-semibold mr-1.5">📊</span>;
    if (name.endsWith('.md')) return <span className="text-sky-450 font-mono text-xs font-semibold mr-1.5">📖</span>;
    if (name.startsWith('.')) return <span className="text-slate-500 font-mono text-xs font-semibold mr-1.5">🕵️</span>;
    return <FileText className="w-4 h-4 text-slate-400 mr-1.5" />;
  };

  const renderNode = (node: FileNode, depth = 0) => {
    const isDir = node.type === 'directory';
    const isCollapsed = collapsedDirs[node.path] || false;
    const isCwdActive = currentCwd === node.path;

    return (
      <div key={node.path} className="select-none text-sm">
        <div
          onClick={() => isDir && toggleCollapse(node.path)}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group flex items-center py-1.5 pr-2 rounded-md cursor-pointer transition-colors duration-150 ${
            isCwdActive
              ? 'bg-slate-700/50 text-emerald-400 border-l-2 border-emerald-500'
              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
          }`}
        >
          {isDir ? (
            isCollapsed ? (
              <Folder className="w-4 h-4 text-amber-500/85 mr-1.5 shrink-0" />
            ) : (
              <FolderOpen className="w-4 h-4 text-amber-400 mr-1.5 shrink-0" />
            )
          ) : (
            getFileIcon(node.name)
          )}
          
          <span className={`truncate font-mono text-[13px] ${node.name.startsWith('.') ? 'text-slate-400/80 italic font-mono' : ''}`}>
            {node.name}
          </span>

          {isCwdActive && (
            <span className="ml-auto text-[10px] bg-slate-800/80 text-emerald-400 border border-emerald-500/30 px-1 rounded-sm uppercase tracking-wider font-mono scale-90">
              cwd
            </span>
          )}
        </div>

        {isDir && !isCollapsed && node.children && (
          <div className="mt-0.5">
            {node.children.length === 0 ? (
              <div
                style={{ paddingLeft: `${(depth + 1) * 14 + 10}px` }}
                className="py-1 text-slate-500 text-xs italic font-mono"
              >
                (пустая папка)
              </div>
            ) : (
              node.children.map((child) => renderNode(child, depth + 1))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="file-explorer-root" className="flex flex-col h-full bg-slate-900 border-r border-slate-800/80 flex-shrink-0">
      {/* Explorer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/40 border-b border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">
            Проводник папок
          </h2>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150 active:scale-95"
          title="Обновить дерево файлов"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Explorer Body */}
      <div className="flex-1 overflow-y-auto p-3 terminal-scrollbar space-y-1">
        {/* Virtual root element representation */}
        <div
          className={`flex items-center py-1.5 px-2 rounded-md cursor-pointer text-slate-300 font-mono text-[13px] hover:bg-slate-800/40 ${
            currentCwd === '' ? 'bg-slate-800/30 text-emerald-400 font-semibold' : ''
          }`}
        >
          <span className="text-xl mr-2">🏠</span>
          <span>~/sandbox</span>
          {currentCwd === '' && (
            <span className="ml-auto text-[10px] bg-slate-800/80 text-emerald-400 border border-emerald-500/30 px-1 rounded-sm uppercase tracking-wider font-mono scale-90">
              cwd
            </span>
          )}
        </div>

        {/* Tree Render */}
        <div className="mt-2 border-l border-slate-800/60 ml-3.5 pl-1 space-y-0.5">
          {tree.length === 0 ? (
            <div className="text-slate-500 p-2 text-xs italic font-mono">
              Песочница пуста. Используйте `touch` или `mkdir` для создания файлов!
            </div>
          ) : (
            tree.map((node) => renderNode(node, 0))
          )}
        </div>
      </div>

      {/* Quick guide tips footer */}
      <div className="p-3 bg-slate-950/30 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1 text-slate-300 font-medium">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Быстрый совет</span>
        </div>
        <p className="leading-relaxed font-mono text-[12px]">
          Всё происходит в режиме реального времени. Попробуйте ввести <code className="text-amber-300">mkdir folder</code> в консоли, и вы увидите как папка появится тут!
        </p>
      </div>
    </div>
  );
}
