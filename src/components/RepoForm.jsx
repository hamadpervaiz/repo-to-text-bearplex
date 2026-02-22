import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, GitBranch, Folder, Loader2, ChevronDown, ArrowRight, Info } from 'lucide-react';

export default function RepoForm({ onSubmit, loading }) {
  const [url, setUrl] = useState('');
  const [ref, setRef] = useState('');
  const [path, setPath] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit({ url: url.trim(), ref: ref.trim(), path: path.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Main URL Input */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2.5">
          <Search className="w-4 h-4 text-[var(--accent-light)]" />
          Repository URL
        </label>
        <motion.div
          className="relative"
          animate={focused === 'url' ? { scale: 1.01 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused('url')}
            onBlur={() => setFocused(null)}
            placeholder="https://github.com/owner/repo  or  owner/repo"
            className="input-field w-full pl-4 pr-16 py-3.5 text-[15px]"
            autoFocus
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] text-[var(--text-muted)] bg-[var(--accent)]/[0.06] border border-[var(--border-color)] rounded-md font-mono">
              Enter
            </kbd>
          </div>
        </motion.div>
      </div>

      {/* Access note */}
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[var(--accent-glow)] border border-[var(--accent)]/10">
        <Info className="w-4 h-4 text-[var(--accent-light)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          For private repositories, ensure that <span className="font-medium text-[var(--text-primary)]">hamad@bearplex.com</span> has
          read access to the repo so it can be fetched.
        </p>
      </div>

      {/* Advanced toggle */}
      <motion.button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent-light)] transition-colors cursor-pointer bg-transparent border-0 p-0"
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.span
          animate={{ rotate: showAdvanced ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
        Advanced options
      </motion.button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div>
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-1.5">
                <GitBranch className="w-3 h-3" />
                Branch / Tag
              </label>
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="main"
                className="input-field w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-1.5">
                <Folder className="w-3 h-3" />
                Subdirectory
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="src/components"
                className="input-field w-full px-3 py-2 text-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading || !url.trim()}
        className="btn-primary w-full py-3.5 flex items-center justify-center gap-2.5"
        whileHover={!loading && url.trim() ? { scale: 1.02 } : {}}
        whileTap={!loading && url.trim() ? { scale: 0.98 } : {}}
      >
        {loading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-flex"
            >
              <Loader2 className="w-4 h-4" />
            </motion.span>
            Fetching Repository...
          </>
        ) : (
          <>
            Fetch Repository
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </>
        )}
      </motion.button>
    </form>
  );
}
