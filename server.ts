import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const sandboxRoot = path.resolve(process.cwd(), 'sandbox');

// Ensure sandbox is initialized
function initSandbox() {
  if (!fs.existsSync(sandboxRoot)) {
    fs.mkdirSync(sandboxRoot, { recursive: true });
  }

  const readmePath = path.join(sandboxRoot, 'README.md');
  const todoPath = path.join(sandboxRoot, 'todo.txt');
  const secretPath = path.join(sandboxRoot, '.invisible');
  const projectsDir = path.join(sandboxRoot, 'projects');
  const scriptPath = path.join(projectsDir, 'script.sh');
  const csvPath = path.join(projectsDir, 'data.csv');

  // Only write if files do not exist (or write files cleanly)
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, `# 🐧 ДОБРО ПОЖАЛОВАТЬ В ПЕСОЧНИЦУ LINUX BASH!

Это настоящая учебная среда. Всё, что вы здесь вводите через консоль,
выполняется на сервере в изолированной папке ~/sandbox.

В вашем распоряжении:
- Интерактивные уроки в правой панели
- Визуальный проводник файлов слева (обновляется на лету!)
- ИИ-Наставник, который готов ответить на ваши вопросы и разобрать ошибки!

Введите \`ls\` или изучите уроки, чтобы начать! 🚀
`);
  }

  if (!fs.existsSync(todoPath)) {
    fs.writeFileSync(todoPath, `План обучения:
1. Выучить основные команды навигации: pwd, ls
2. Научиться создавать папки и файлы: mkdir, touch
3. Освоить редактирование файлов: echo, cat, >, >>
4. Изучить конвейер команд: grep, pipes (|)
5. Научиться стирать за собой мусор: cp, mv, rm
`);
  }

  if (!fs.existsSync(secretPath)) {
    fs.writeFileSync(secretPath, 'Секретный агент: 007. Вы успешно нашли скрытый файл! Поздравляем! 🕵️‍♂️✨\n');
  }

  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
  }

  if (!fs.existsSync(scriptPath)) {
    fs.writeFileSync(scriptPath, `#!/bin/bash
echo "=== Старт выполнения скрипта ==="
echo "Время запуска: $(date)"
echo "Статус системы: Отличный!"
echo "=== Скрипт успешно отработал ==="
`);
    try {
      fs.chmodSync(scriptPath, '755');
    } catch (e) {}
  }

  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, `id,name,role,department
1,Алексей,Admin,IT
2,Иван,User,Design
3,Мария,Manager,Sales
4,Екатерина,User,IT
5,Дмитрий,Admin,Security
`);
  }
}

// Reset sandbox operation
function resetSandbox() {
  if (fs.existsSync(sandboxRoot)) {
    try {
      fs.rmSync(sandboxRoot, { recursive: true, force: true });
    } catch (err) {
      console.error('Error removing sandbox root:', err);
    }
  }
  initSandbox();
}

// Tree builder
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

function getFileTree(dirPath: string, rootPath: string): FileNode[] {
  if (!fs.existsSync(dirPath)) return [];
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const result: FileNode[] = [];

    for (const item of items) {
      const absolutePath = path.join(dirPath, item.name);
      const relativePath = path.relative(rootPath, absolutePath);

      // Protect node_modules, git, and build outputs
      if (item.name === '.git' || item.name === 'node_modules' || item.name === 'dist') continue;

      const node: FileNode = {
        name: item.name,
        path: relativePath,
        type: item.isDirectory() ? 'directory' : 'file'
      };

      if (item.isDirectory()) {
        node.children = getFileTree(absolutePath, rootPath);
      }

      result.push(node);
    }

    return result.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error reading file tree:', error);
    return [];
  }
}

// Initialize on server starup
initSandbox();

// Lazy initialize Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getAi() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Command validations
function isValidCommand(command: string): { valid: boolean; reason?: string } {
  const trimmed = command.trim();
  if (!trimmed) {
    return { valid: false, reason: "" };
  }

  const destructivePatterns = [
    /rm\s+-[rRfF]*\s+\//, // rm -rf /
    /rm\s+-[rRfF]*\s+[^a-zA-Z0-9_\.]*\.\./, // rm -rf ..
    /chown\s+/,
    /chmod\s+.*\/etc/,
    /dd\s+if=/,
    /:\(\)\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, // Fork bomb
    /shutdown\s+/,
    /reboot/,
    /kill\s+-9\s+1/,
    /killall\s+/
  ];

  for (const pattern of destructivePatterns) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        reason: 'Предупреждение безопасности: эта команда содержит небезопасные или разрушительные инструкции для системных каталогов. Давайте оставаться внутри ~/sandbox! 🐧💡'
      };
    }
  }

  return { valid: true };
}

// Verify objectives
function verifyObjective(
  lessonId: string,
  objectiveId: string,
  command: string,
  stdout: string,
  stderr: string,
  currentAbsoluteCwd: string
): boolean {
  const normCmd = command.trim().toLowerCase();
  const relCwd = path.relative(sandboxRoot, currentAbsoluteCwd);

  switch (lessonId) {
    case 'lesson-1':
      if (objectiveId === 'run-pwd') {
        return normCmd === 'pwd' || normCmd.startsWith('pwd ');
      }
      if (objectiveId === 'run-ls') {
        return normCmd === 'ls' || normCmd === 'ls -l' || normCmd.startsWith('ls ');
      }
      if (objectiveId === 'run-ls-la') {
        return normCmd.includes('ls') && (normCmd.includes('-la') || normCmd.includes('-al') || normCmd.includes('-a ') || normCmd.includes('-l -a'));
      }
      break;

    case 'lesson-2':
      if (objectiveId === 'cd-projects') {
        return relCwd === 'projects';
      }
      if (objectiveId === 'ls-inside') {
        return relCwd === 'projects' && (normCmd === 'ls' || normCmd.startsWith('ls '));
      }
      if (objectiveId === 'cd-back') {
        return relCwd === '' && (normCmd === 'cd ..' || normCmd.startsWith('cd '));
      }
      break;

    case 'lesson-3':
      if (objectiveId === 'mkdir-studies') {
        const studiesDir = path.join(sandboxRoot, 'my_studies');
        return fs.existsSync(studiesDir) && fs.statSync(studiesDir).isDirectory();
      }
      if (objectiveId === 'cd-studies') {
        return relCwd === 'my_studies';
      }
      if (objectiveId === 'touch-notes') {
        const notesFile = path.join(sandboxRoot, 'my_studies', 'notes.txt');
        return fs.existsSync(notesFile) && fs.statSync(notesFile).isFile();
      }
      break;

    case 'lesson-4':
      const notesPath = path.join(sandboxRoot, 'my_studies', 'notes.txt');
      if (!fs.existsSync(notesPath)) return false;
      try {
        const content = fs.readFileSync(notesPath, 'utf8');
        if (objectiveId === 'write-over') {
          return content.toLowerCase().includes('linux is awesome');
        }
        if (objectiveId === 'write-append') {
          return content.toLowerCase().includes('linux is awesome') && content.toLowerCase().includes('bash is powerful');
        }
        if (objectiveId === 'cat-file') {
          return normCmd.includes('cat') && (normCmd.includes('notes.txt') || normCmd.includes('my_studies/notes.txt')) && !stderr;
        }
      } catch (e) {
        return false;
      }
      break;

    case 'lesson-5':
      if (objectiveId === 'grep-csv') {
        return normCmd.includes('grep') && normCmd.includes('admin') && normCmd.includes('csv') && !stderr;
      }
      if (objectiveId === 'pipe-ls-grep') {
        return normCmd.includes('|') && normCmd.includes('ls') && normCmd.includes('grep') && normCmd.includes('script');
      }
      break;

    case 'lesson-6':
      const targetCopy = path.join(sandboxRoot, 'my_studies', 'script_copy.sh');
      const targetDiary = path.join(sandboxRoot, 'my_studies', 'diary.txt');
      const origNotes = path.join(sandboxRoot, 'my_studies', 'notes.txt');

      if (objectiveId === 'cp-file') {
        return fs.existsSync(targetCopy) && fs.statSync(targetCopy).isFile();
      }
      if (objectiveId === 'mv-file') {
        return fs.existsSync(targetDiary) && !fs.existsSync(origNotes);
      }
      if (objectiveId === 'rm-file') {
        return !fs.existsSync(targetCopy);
      }
      break;
  }
  return false;
}

// TERMINAL EXEC API
app.post('/api/terminal/exec', (req, res) => {
  const { command, activeLessonId, completedObjectives } = req.body;
  let clientCwd = req.body.cwd || ''; // E.g., "", "projects"

  // Ensure sandbox root folder is active
  initSandbox();

  // Validate command
  const validation = isValidCommand(command);
  if (!validation.valid) {
    return res.json({
      stdout: '',
      stderr: validation.reason,
      exitCode: 1,
      cwd: clientCwd,
      tree: getFileTree(sandboxRoot, sandboxRoot),
      objectivesStatus: []
    });
  }

  // Calculate corresponding server cwd
  let currentAbsoluteCwd = clientCwd ? path.resolve(sandboxRoot, clientCwd) : sandboxRoot;

  // Sandbox jail check
  if (!currentAbsoluteCwd.startsWith(sandboxRoot)) {
    currentAbsoluteCwd = sandboxRoot;
    clientCwd = '';
  }

  // Cwd non-existent check (maybe deleted)
  if (!fs.existsSync(currentAbsoluteCwd)) {
    currentAbsoluteCwd = sandboxRoot;
    clientCwd = '';
  }

  // Format special shell payload to run command and output the final cwd securely
  const compositeCommand = `${command} ; echo '' && echo '_CWD_BEGIN_' && pwd && echo '_CWD_END_'`;

  const execOptions = {
    cwd: currentAbsoluteCwd,
    timeout: 5000, // 5s safeguard limits
    maxBuffer: 1024 * 512, // 512KB limit
    env: {
      ...process.env,
      PATH: process.env.PATH + ':/usr/games:/usr/local/bin',
      LANG: 'ru_RU.UTF-8'
    }
  };

  exec(compositeCommand, execOptions, (error, stdout, stderr) => {
    let cleanStdout = stdout;
    let cleanStderr = stderr;
    let finalAbsoluteCwd = currentAbsoluteCwd;
    let exitCode = error ? (error.code || 1) : 0;

    // Isolate CWD token out of stdout
    const cwdMatch = stdout.match(/_CWD_BEGIN_\r?\n([\s\S]*?)\r?\n_CWD_END_/);
    if (cwdMatch) {
      finalAbsoluteCwd = cwdMatch[1].trim();
      cleanStdout = stdout.replace(/_CWD_BEGIN_\r?\n[\s\S]*?\r?\n_CWD_END_/, '');
    }

    // Clean outputs
    cleanStdout = cleanStdout.trim();
    cleanStderr = cleanStderr.trim();

    // Jail boundary validation on completed state
    if (!finalAbsoluteCwd.startsWith(sandboxRoot)) {
      finalAbsoluteCwd = sandboxRoot;
    }

    // Relative cwd calculate
    const relativeCwd = path.relative(sandboxRoot, finalAbsoluteCwd);

    // Scan updated file explorer tree
    const tree = getFileTree(sandboxRoot, sandboxRoot);

    // Evaluate objectives
    const updatedObjectives: { id: string; isCompleted: boolean }[] = [];
    if (activeLessonId && completedObjectives) {
      // Loop goals
      // Check which objectives are not completed yet, or evaluate all of them
      // We pass the completedObjectives structure from frontend, evaluate any matches
      for (const objId of completedObjectives) {
        const isAlreadyComplete = objId.isCompleted;
        if (isAlreadyComplete) {
          updatedObjectives.push({ id: objId.id, isCompleted: true });
        } else {
          const solvedNow = verifyObjective(activeLessonId, objId.id, command, cleanStdout, cleanStderr, finalAbsoluteCwd);
          updatedObjectives.push({ id: objId.id, isCompleted: solvedNow });
        }
      }
    }

    res.json({
      stdout: cleanStdout,
      stderr: cleanStderr,
      exitCode,
      cwd: relativeCwd,
      tree,
      objectivesStatus: updatedObjectives
    });
  });
});

// RESET API
app.post('/api/terminal/reset', (req, res) => {
  resetSandbox();
  res.json({
    tree: getFileTree(sandboxRoot, sandboxRoot),
    cwd: '',
    message: 'Песочница успешно сброшена к исходному состоянию 🔄'
  });
});

// GET TREE API
app.get('/api/terminal/tree', (req, res) => {
  initSandbox();
  res.json({
    tree: getFileTree(sandboxRoot, sandboxRoot)
  });
});

// GEMINI AI EXPLAINER
app.post('/api/gemini/explain', async (req, res) => {
  const { command, exitCode, stdout, stderr, userQuestion, activeLessonTitle, activeLessonInstructions } = req.body;
  const ai = getAi();

  if (!ai) {
    return res.json({
      explanation: 'ИИ-Наставник временно недоступен: Ключ API не настроен в secrets (настройки секретов).'
    });
  }

  try {
    const systemPrompt = `Ты — профессиональный ИИ-наставник по операционной системе Linux и командной строке Bash. 
Ты общаешься дружелюбно, поддерживающе, понятно и на простом русском языке! 
Твоя цель — помочь ученику разобраться с командами, найти ошибки в их исполнении и дать ясный совет, не делая всю работу за него (если это касается урока).

Дай понятный краткий ответ в формате Markdown с примерами использования. Должно быть информативно и лаконично.`;

    let prompt = '';
    if (userQuestion) {
      // General question
      prompt = `Ученик задал вопрос о Linux:\n"${userQuestion}"\n`;
      if (activeLessonTitle) {
        prompt += `Он сейчас изучает урок: "${activeLessonTitle}".\n`;
      }
    } else {
      // Explaining an error/command outcome
      prompt = `Ученик только что выполнил команду: \`${command}\`\n`;
      prompt += `Код завершения: ${exitCode}\n`;
      if (stdout) prompt += `Вывод команды (stdout):\n\`\`\`\n${stdout}\n\`\`\`\n`;
      if (stderr) prompt += `Текст ошибки (stderr):\n\`\`\`\n${stderr}\n\`\`\`\n`;
      if (activeLessonTitle) {
        prompt += `Текущий изучаемый урок: "${activeLessonTitle}".\n`;
      }
      prompt += `Объясни ученику, что произошло. Если команда завершилась с ошибкой, расскажи простыми словами, почему возникла ошибка (например, опечатка, не создана папка, неверный синтаксис) и как её исправить.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    res.json({
      explanation: response.text || 'Наставник задумался и не выдал ответа.'
    });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.json({
      explanation: `Произошла ошибка при обращении к ИИ-наставнику: ${error.message || error}`
    });
  }
});

// Mount Vite middleware for dev / express static for production
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
