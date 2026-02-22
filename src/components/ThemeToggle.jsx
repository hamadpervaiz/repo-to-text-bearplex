import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggle}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer border border-[var(--border-color)] bg-[var(--accent)]/[0.04] hover:bg-[var(--accent)]/[0.1] transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 0 : 180,
          scale: [1, 0.8, 1],
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-[var(--accent-light)]" />
        ) : (
          <Sun className="w-4 h-4 text-[var(--accent)]" />
        )}
      </motion.div>
    </motion.button>
  );
}
