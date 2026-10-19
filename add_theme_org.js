const fs = require('fs');

const appFile = 'c:/chamados/org/laghetto-org-chart/src/App.jsx';
let appCode = fs.readFileSync(appFile, 'utf-8');

// 1. Add Sun, Moon icons import
appCode = appCode.replace(
  "import { Settings } from 'lucide-react';",
  "import { Settings, Sun, Moon } from 'lucide-react';"
);

// 2. Add theme state and effect
const themeStateHook = `
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('laghetto_theme');
    if (saved) return saved === 'dark';
    return true; // default dark in org chart
  });

  useEffect(() => {
    localStorage.setItem('laghetto_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
`;

appCode = appCode.replace('const [isAddingColab, setIsAddingColab] = useState(false);', 'const [isAddingColab, setIsAddingColab] = useState(false);\n' + themeStateHook);

// 3. Update top container classes for dark / light
appCode = appCode.replace(
  'className="min-h-screen bg-laghetto-wine text-white flex flex-col items-center py-10 relative overflow-auto"',
  "className={`min-h-screen ${isDark ? 'bg-laghetto-wine text-white' : 'bg-[#f0ebe0] text-[#3b2008]'} flex flex-col items-center py-10 relative overflow-auto transition-colors duration-300`}"
);

// 4. Update titles and search input colors based on theme
appCode = appCode.replace(
  '<h2 className="text-xl text-gray-300">Organograma de Talentos</h2>',
  "<h2 className={`text-xl ${isDark ? 'text-gray-300' : 'text-[#7c4c1a]'}`}>Organograma de Talentos</h2>"
);

appCode = appCode.replace(
  'className="absolute left-10 top-0 flex items-center bg-black/40 border border-laghetto-gold/30 rounded-full px-4 py-2"',
  "className={`absolute left-10 top-0 flex items-center ${isDark ? 'bg-black/40 border-laghetto-gold/30 text-laghetto-gold' : 'bg-white border-[#B6741A]/30 text-[#3b2008] shadow-sm'} border rounded-full px-4 py-2 transition-colors`}"
);

appCode = appCode.replace(
  'className="bg-transparent border-none outline-none text-laghetto-gold ml-2 w-64 placeholder-laghetto-gold/50"',
  "className={`bg-transparent border-none outline-none ml-2 w-64 ${isDark ? 'text-laghetto-gold placeholder-laghetto-gold/50' : 'text-[#3b2008] placeholder-[#925616]/60'}`}"
);

// 5. Add Theme Toggle Button next to Admin Settings Button
const toggleThemeBtn = `
        <button 
          onClick={() => setIsDark(!isDark)}
          className={\`absolute right-24 top-0 p-2 rounded-full transition-all \${isDark ? 'text-laghetto-gold hover:bg-white/10' : 'text-[#925616] hover:bg-black/5 bg-white/80 shadow-sm'}\`}
          title={isDark ? "Alternar para Tema Claro" : "Alternar para Tema Escuro"}
        >
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
`;

appCode = appCode.replace(
  '<button \n          onClick={() => setIsAdmin(!isAdmin)}',
  toggleThemeBtn + '\n        <button \n          onClick={() => setIsAdmin(!isAdmin)}'
);

// Adjust admin buttons position if admin is true
appCode = appCode.replace(
  'className="absolute right-24 top-0 flex gap-2"',
  'className="absolute right-36 top-0 flex gap-2"'
);

fs.writeFileSync(appFile, appCode, 'utf-8');
console.log('Added dark/light theme to Organograma App.jsx!');
