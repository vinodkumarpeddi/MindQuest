import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function DarkModeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl transition-all duration-300 bg-gray-100/80 hover:bg-gray-200 dark:bg-gray-700/80 dark:hover:bg-gray-600 border border-gray-200/50 dark:border-gray-700/50"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="transition-transform duration-300" style={{ transform: dark ? 'rotate(180deg)' : 'rotate(0deg)' }}>
        {dark ? (
          <Sun className="w-4 h-4 text-yellow-400" />
        ) : (
          <Moon className="w-4 h-4 text-gray-600" />
        )}
      </div>
    </button>
  );
}
