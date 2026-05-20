export interface FileNode {
  name: string;
  path: string; // relative to sandbox root
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface Objective {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  description: string;
  instructions: string; // Markdown supported
  hint: string;
  objectives: Objective[];
}

export interface TerminalOutputLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  cwd?: string;
  timestamp: string;
}

export interface CommandHistoryItem {
  command: string;
  cwd: string;
}

export interface CheatSheetItem {
  command: string;
  description: string;
  category: 'navigation' | 'files' | 'text' | 'permissions' | 'shortcuts';
  example: string;
}
