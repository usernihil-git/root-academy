import { Lesson, CheatSheetItem } from './types';

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Урок 1: Кто я и где я? (pwd, ls)',
    category: 'Навигация',
    description: 'Узнаем свое текущее местоположение в системе Linux и изучим содержимое папки.',
    instructions: `### Добро пожаловать в Академию Терминала Linux! 🐧

Терминал — это мощнейший инструмент управления операционной системой. Вместо мышки мы общаемся с компьютером текстовыми командами.

Первое правило выживания в Linux — знать, где вы находитесь и что вас окружает.

#### 1. Узнаем путь (pwd)
Команда **'pwd'** (Print Working Directory) выводит полный (абсолютный) путь к текущей папке. В Linux пути начинаются с корня — символа **'/'** (например, '/home/user/sandbox').

#### 2. Осматриваемся вокруг (ls)
Команда **'ls'** (List) показывает список файлов и папок в текущей директории.
* По умолчанию скрытые файлы (имена которых начинаются с точки, например '.invisible') не видны.
* Чтобы увидеть **ВСЕ**, включая скрытые файлы, и подробную информацию о них (размер, владелец, права), используйте флаги **'-la'**: **'ls -la'**.

**Цели этого урока:**
1. Выполните команду 'pwd', чтобы узнать свой путь в песочнице.
2. Выполните обычную команду 'ls' для общего обзора.
3. Выполните детальную команду 'ls -la', чтобы обнаружить тайные скрытые файлы!`,
    hint: 'Наберите pwd, чтобы сдать первую цель. Затем ls для второй, и ls -la для третьей.',
    objectives: [
      { id: 'run-pwd', text: 'Запустить команду "pwd"', isCompleted: false },
      { id: 'run-ls', text: 'Запустить команду "ls"', isCompleted: false },
      { id: 'run-ls-la', text: 'Запустить детальный список "ls -la" или "ls -a"', isCompleted: false }
    ]
  },
  {
    id: 'lesson-2',
    title: 'Урок 2: Путешествие между папками (cd)',
    category: 'Навигация',
    description: 'Научимся свободно переходить из одной директории в другую с помощью cd.',
    instructions: `### Перемещение по файловой системе 🗺️

Теперь, когда мы умеем осматриваться, пора двигаться вперед. Для смены папки используется команда **'cd'** (Change Directory).

#### 1. Как зайти в подпапку?
Просто укажите ее имя: **'cd имя_папки'**.
Например, в вашей песочнице есть папка 'projects'. Чтобы зайти туда, выполните: **'cd projects'**.

#### 2. Как подняться на уровень выше?
Две точки **'..'** в Linux обозначают 'родительскую директорию' (на один уровень вверх).
Чтобы выйти из текущей папки обратно вверх, выполните: **'cd ..'**.

#### 3. Абсолютные пути
Вы можете указать точный путь от самого корня, например **'cd ~/sandbox'** (символ **'~'** — это сокращение для вашей домашней папки).

**Цели этого урока:**
1. Перейдите в каталог 'projects' с помощью команды 'cd projects'.
2. Выполните 'ls' внутри этой папки, чтобы посмотреть её содержимое.
3. Вернитесь в родительскую директорию с помощью 'cd ..'.`,
    hint: 'Используйте поочередно cd projects -> ls -> cd .. для успешного завершения.',
    objectives: [
      { id: 'cd-projects', text: 'Перейти в каталог projects ("cd projects")', isCompleted: false },
      { id: 'ls-inside', text: 'Посмотреть содержимое папки ("ls")', isCompleted: false },
      { id: 'cd-back', text: 'Вернуться обратно ("cd ..")', isCompleted: false }
    ]
  },
  {
    id: 'lesson-3',
    title: 'Урок 3: Строительство папок и файлов (mkdir, touch)',
    category: 'Работа с файлами',
    description: 'Научимся создавать новые папки и пустые файлы в один клик клавиатуры.',
    instructions: `### Создание новых объектов 🏗️

В Linux мы можем быстро создавать логические структуры для файлов и проектов.

#### 1. Создание папок (mkdir)
Команда **'mkdir'** (Make Directory) создает новую папку.
Синтаксис: **'mkdir имя_папки'**
Например: **'mkdir my_studies'**

#### 2. Создание пустых файлов (touch)
Команда **'touch'** создана для обновления времени изменения файла, но если файла нет, она мгновенно создает его пустым!
Синтаксис: **'touch имя_файла.txt'**
Например: **'touch notes.txt'**

**Цели этого урока:**
1. Создайте новую папку с именем 'my_studies' с помощью 'mkdir'.
2. Зайдите в созданную папку с помощью команды 'cd my_studies'.
3. Создайте внутри неё пустой файл с именем 'notes.txt'.`,
    hint: 'Последовательность команд: mkdir my_studies -> cd my_studies -> touch notes.txt.',
    objectives: [
      { id: 'mkdir-studies', text: 'Создать каталог "my_studies"', isCompleted: false },
      { id: 'cd-studies', text: 'Зайти в папку "cd my_studies"', isCompleted: false },
      { id: 'touch-notes', text: 'Создать файл "touch notes.txt"', isCompleted: false }
    ]
  },
  {
    id: 'lesson-4',
    title: 'Урок 4: Запись текста и чтение (echo, cat)',
    category: 'Работа со сведениями',
    description: 'Научимся писать текст прямо из командной строки и читать файлы без графического редактора.',
    instructions: `### Текстовые конвейеры на лету 📝

Мы можем манипулировать данными и записывать текст в файлы с помощью встроенных утилит и перенаправления вывода.

#### 1. Вывод текста (echo)
Команда **'echo'** просто выводит (печет) переданный ей текст обратно в консоль.
Пример: **'echo "Привет, Мир!"'**

#### 2. Перенаправление потоков (>) и (>>)
Мы можем направить то, что печатает 'echo', прямиком в файл!
* Символ **'>'** перезаписывает файл (или создает его, если его не было).
  Например: 'echo "Linux is awesome" > notes.txt'
* Символ **'>>'** дописывает текст в КОНЕЦ файла, не удаляя старый.
  Например: 'echo "Bash is powerful" >> notes.txt'

#### 3. Чтение файла (cat)
Команда **'cat'** (Concatenate) выводит всё содержимое текстового файла прямо в терминал.
Синтаксис: **'cat notes.txt'**

**Цели этого урока:**
1. Запишите фразу "Linux is awesome" в файл 'notes.txt' с помощью '>'.
2. Добавьте фразу "Bash is powerful" новой строкой в файл 'notes.txt' с помощью '>>'.
3. Прочитайте и покажите файл в терминале с помощью команды 'cat notes.txt'.`,
    hint: 'Вводите echo "Linux is awesome" > notes.txt, а затем echo "Bash is powerful" >> notes.txt и наконец cat notes.txt. Проверяйте путь в левой панели!',
    objectives: [
      { id: 'write-over', text: 'Записать "Linux is awesome" через ">"', isCompleted: false },
      { id: 'write-append', text: 'Дописать "Bash is powerful" через ">>"', isCompleted: false },
      { id: 'cat-file', text: 'Вывести файл на экран командой "cat notes.txt"', isCompleted: false }
    ]
  },
  {
    id: 'lesson-5',
    title: 'Урок 5: Поиск сокровищ (grep и конвейер |)',
    category: 'Анализ данных',
    description: 'Откроем магию фильтрации текста grep и научимся объединять несколько программ символом трубы (провайдера).',
    instructions: `### О силе утилиты grep и конвейеров ⚡

Утилита **'grep'** производит поиск слов или регулярных выражений в текстовых файлах и выводит только нужные строки.
Пример: **'grep "строка" файл.txt'**

#### Конвейер (Трубопровод / Pipe) - символ |
Символ перегородки **'|'** — это одна из величайших концепций Unix! Она позволяет перенаправить результаты работы первой команды на вход второй команде!
* Например, мы можем взять вывод 'ls projects' и отправить его утилите 'grep', чтобы найти только файлы, содержащие слово 'script':
  'ls projects | grep script'

**Цели этого урока:**
1. Найдите все записи со словом "Admin" в файле 'projects/data.csv'. (Подсказка: grep "Admin" projects/data.csv).
2. Используйте конвейер, чтобы вывести список файлов в 'projects', содержащих слово 'script': ls projects | grep script.`,
    hint: 'Выполните grep "Admin" projects/data.csv, а потом команду ls projects | grep script.',
    objectives: [
      { id: 'grep-csv', text: 'Найти слово "Admin" в data.csv', isCompleted: false },
      { id: 'pipe-ls-grep', text: 'Использовать конвейер: "ls projects | grep script"', isCompleted: false }
    ]
  },
  {
    id: 'lesson-6',
    title: 'Урок 6: Наведение идеального порядка (cp, mv, rm)',
    category: 'Работа с файлами',
    description: 'Отработаем копирование, переименование, перемещение и полное удаление файлов.',
    instructions: `### Копируем, двигаем, уничтожаем 🧹

Время научиться базовому менеджменту файлов:

#### 1. Копирование (cp)
Синтаксис: **'cp источник приемник'**
Пример: **'cp projects/script.sh my_studies/script_copy.sh'**

#### 2. Переименование / Перемещение (mv)
Команда 'mv' (Move) используется как для перемещения файлов, так и для их простого переименования!
Синтаксис: **'mv старое_имя новое_имя'**
Пример: **'mv my_studies/notes.txt my_studies/diary.txt'**

#### 3. Удаление файлов (rm)
*ВНИМАНИЕ: В терминале нет "Корзины"! Файлы удаляются навсегда.*
Синтаксис: **'rm путь_к_файлу'**
Пример: **'rm my_studies/script_copy.sh'**

**Цели этого урока:**
1. Скопируйте файл скрипта 'projects/script.sh' в папку 'my_studies' под именем 'script_copy.sh'.
2. Переименуйте файл 'my_studies/notes.txt' (или 'notes.txt' если вы внутри папки) в 'my_studies/diary.txt'.
3. Безвозвратно удалите созданный дубликат 'my_studies/script_copy.sh'.`,
    hint: 'Используйте cp, mv, и rm по цепочке. Следите за деревом файлов слева в реальном времени!',
    objectives: [
      { id: 'cp-file', text: 'Скопировать script.sh в my_studies/script_copy.sh', isCompleted: false },
      { id: 'mv-file', text: 'Переименовать notes.txt в diary.txt', isCompleted: false },
      { id: 'rm-file', text: 'Удалить script_copy.sh', isCompleted: false }
    ]
  }
];

export const CHEATSHEET: CheatSheetItem[] = [
  {
    command: 'pwd',
    description: 'Показать текущую рабочую директорию (абсолютный путь).',
    category: 'navigation',
    example: 'pwd'
  },
  {
    command: 'ls',
    description: 'Вывести список файлов и папок в текущей директории.',
    category: 'navigation',
    example: 'ls'
  },
  {
    command: 'ls -la',
    description: 'Вывести подробный список всех файлов, включая скрытые (начинаются с точки).',
    category: 'navigation',
    example: 'ls -la'
  },
  {
    command: 'cd <папка>',
    description: 'Перейти в указанную директорию.',
    category: 'navigation',
    example: 'cd projects'
  },
  {
    command: 'cd ..',
    description: 'Перейти на один уровень выше (в родительскую папку).',
    category: 'navigation',
    example: 'cd ..'
  },
  {
    command: 'cd ~',
    description: 'Перейти в домашний каталог пользователя (корень песочницы).',
    category: 'navigation',
    example: 'cd ~'
  },
  {
    command: 'mkdir <имя>',
    description: 'Создать новую директорию (папку).',
    category: 'files',
    example: 'mkdir my_studies'
  },
  {
    command: 'touch <файл>',
    description: 'Создать новый пустой файл или обновить время изменения существующего.',
    category: 'files',
    example: 'touch styles.css'
  },
  {
    command: 'cat <файл>',
    description: 'Вывести всё содержимое файла на экран.',
    category: 'files',
    example: 'cat README.md'
  },
  {
    command: 'head -n <число> <файл>',
    description: 'Вывести первые N строк файла.',
    category: 'files',
    example: 'head -n 5 data.csv'
  },
  {
    command: 'tail -n <число> <файл>',
    description: 'Вывести последние N строк файла.',
    category: 'files',
    example: 'tail -n 5 data.csv'
  },
  {
    command: 'cp <источник> <приемник>',
    description: 'Скопировать файл или папку.',
    category: 'files',
    example: 'cp log.txt log_backup.txt'
  },
  {
    command: 'mv <источник> <приемник>',
    description: 'Переместить или переименовать файл / папку.',
    category: 'files',
    example: 'mv notes.txt diary.txt'
  },
  {
    command: 'rm <файл>',
    description: 'Удалить файл навсегда (мимо корзины!).',
    category: 'files',
    example: 'rm old_notes.txt'
  },
  {
    command: 'echo "<текст>"',
    description: 'Вывести строку текста на экран.',
    category: 'text',
    example: 'echo "Hello Linux"'
  },
  {
    command: 'echo "<текст>" > <файл>',
    description: 'Записать текст в файл, полностью перезаписав его содержимое.',
    category: 'text',
    example: 'echo "test" > config.json'
  },
  {
    command: 'echo "<текст>" >> <файл>',
    description: 'Добавить текст в конец файла, сохранив старое содержимое.',
    category: 'text',
    example: 'echo "update value" >> config.json'
  },
  {
    command: 'grep "<шаблон>" <файл>',
    description: 'Поиск строк в файле, соответствующих тексту или шаблону.',
    category: 'text',
    example: 'grep "Admin" data.csv'
  },
  {
    command: '<команда1> | <команда2>',
    description: 'Перенаправить стандартный вывод первой команды на стандартный ввод второй (конвейер).',
    category: 'text',
    example: 'ls -la | grep "sh"'
  },
  {
    command: 'clear (или Ctrl+L)',
    description: 'Очистить экран терминала.',
    category: 'shortcuts',
    example: 'clear'
  },
  {
    command: 'Tab / Двойной Tab',
    description: 'Автодополнение имени файла или команды при вводе.',
    category: 'shortcuts',
    example: 'cd proj[Tab]'
  },
  {
    command: 'Стрелки клавиатуры ↑/↓',
    description: 'Прокрутка истории ранее введенных команд.',
    category: 'shortcuts',
    example: '(Нажмите стрелку вверх)'
  }
];
