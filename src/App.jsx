import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Zap, ArrowRight, Code2, FileText, Sparkles, ExternalLink } from 'lucide-react';
import RepoForm from './components/RepoForm';
import DirectoryTree from './components/DirectoryTree';
import OutputPanel from './components/OutputPanel';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './context/ThemeContext';
import { parseRepoUrl, fetchDefaultBranch, fetchRepoTree, fetchFilesContent } from './utils/github';
import { buildTree, generateDirectoryString, formatOutput, isBinaryFile } from './utils/formatter';

export default function App() {
  const { theme } = useTheme();
  const [tree, setTree] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const isDark = theme === 'dark';
  const logoSrc = isDark ? '/bearplex-logo.svg' : '/bearplex-logo-dark.svg';

  const handleFetch = useCallback(async ({ url, token: tk, ref, path }) => {
    setError('');
    setTree(null);
    setOutput('');
    setSelected(new Set());
    setLoading(true);
    setToken(tk);

    try {
      const parsed = parseRepoUrl(url);
      if (!parsed) throw new Error('Invalid GitHub URL. Use format: https://github.com/owner/repo');

      if (ref) parsed.ref = ref;
      if (path) parsed.path = path;

      if (!parsed.ref) {
        parsed.ref = await fetchDefaultBranch(parsed.owner, parsed.repo, tk);
      }

      const flatTree = await fetchRepoTree(parsed.owner, parsed.repo, parsed.ref, tk);
      const items = flatTree.filter(item => item.type === 'blob' || item.type === 'tree');

      let filteredItems = items;
      if (parsed.path) {
        filteredItems = items.filter(
          item => item.path === parsed.path || item.path.startsWith(parsed.path + '/')
        );
      }

      const builtTree = buildTree(filteredItems, parsed.path);
      setTree(builtTree);
      setRepoInfo(parsed);

      const allFiles = filteredItems
        .filter(item => item.type === 'blob' && !isBinaryFile(item.path))
        .map(item => item.path);
      setSelected(new Set(allFiles));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!repoInfo || selected.size === 0) return;
    setGenerating(true);
    setProgress({ current: 0, total: selected.size });
    setOutput('');

    try {
      const paths = Array.from(selected).sort();
      const nonBinaryPaths = paths.filter(p => !isBinaryFile(p));

      const fileContents = await fetchFilesContent(
        repoInfo.owner, repoInfo.repo, nonBinaryPaths, repoInfo.ref, token,
        (current, total) => setProgress({ current, total })
      );

      const selectedItems = paths.map(p => ({ path: p, type: 'blob' }));
      const selectedTree = buildTree(selectedItems, repoInfo.path);
      const dirString = generateDirectoryString(selectedTree);

      const result = formatOutput(repoInfo, paths, fileContents, dirString);
      setOutput(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  }, [repoInfo, selected, token]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] noise">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-20 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-xl sticky top-0 transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline">
            <motion.img
              key={logoSrc}
              src={logoSrc}
              alt="BearPlex"
              className={`h-9 ${isDark ? 'brightness-0 invert opacity-95' : 'opacity-90'}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: isDark ? 0.95 : 0.9, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          </a>
          <div className="flex items-center gap-3">
            <motion.a
              href="https://github.com/hamadpervaiz/repo-to-text-bearplex"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Source</span>
            </motion.a>
            <motion.a
              href="https://bearplex.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-3 py-1.5 flex items-center gap-1.5 text-xs no-underline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              bearplex.com
              <ExternalLink className="w-3 h-3" />
            </motion.a>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      {/* Hero + Form */}
      <div className="relative hero-gradient bg-grid overflow-hidden transition-colors duration-300">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-1 absolute -top-32 left-1/4 w-96 h-96 rounded-full blur-[100px]" style={{ background: `rgba(47, 129, 247, var(--orb-opacity))` }} />
          <div className="orb-2 absolute -top-20 right-1/4 w-72 h-72 rounded-full blur-[80px]" style={{ background: `rgba(56, 139, 253, calc(var(--orb-opacity) * 0.8))` }} />
          <div className="orb-3 absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-64 rounded-full blur-[120px]" style={{ background: `rgba(31, 111, 214, calc(var(--orb-opacity) * 0.7))` }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 relative z-10">
          {/* Hero text */}
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 badge badge-accent mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="w-3 h-3" />
              Open Source Tool
            </motion.div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--text-primary)] mb-5 leading-[1.1]">
              Repo to{' '}
              <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-light)] to-[var(--accent-bright)] bg-clip-text text-transparent">
                Plain Text
              </span>
            </h1>
            <motion.p
              className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Convert any GitHub repository into a single text file.
              <br />
              <span className="text-[var(--text-muted)]">Perfect for feeding code context into LLMs.</span>
            </motion.p>
          </motion.div>

          {/* Form card */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass-card rounded-2xl p-7 glow-accent">
              <RepoForm onSubmit={handleFetch} loading={loading} />
            </div>
          </motion.div>

          {/* Feature pills */}
          <AnimatePresence>
            {!tree && (
              <motion.div
                className="flex flex-wrap items-center justify-center gap-3 mt-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {[
                  { icon: Github, label: 'Public & Private Repos' },
                  { icon: Code2, label: 'Smart File Selection' },
                  { icon: FileText, label: 'LLM-Ready Output' },
                ].map(({ icon: Icon, label }, i) => (
                  <motion.div
                    key={label}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--border-color)] text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)]/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                    whileHover={{ scale: 1.05, borderColor: 'var(--border-hover)' }}
                  >
                    <Icon className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                    {label}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="max-w-6xl mx-auto px-6 -mt-6 mb-6 relative z-10"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[var(--error-glow)] border border-red-500/20 text-[var(--error)] rounded-xl px-5 py-4 text-sm flex items-start gap-3">
              <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold">!</span>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree + Output */}
      <AnimatePresence>
        {tree && (
          <motion.div
            className="max-w-6xl mx-auto px-6 -mt-10 pb-16 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Repo info bar */}
            <motion.div
              className="flex items-center justify-between mb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] border border-[var(--border-color)] flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Github className="w-5 h-5 text-[var(--accent-light)]" />
                </motion.div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    {repoInfo.owner}<span className="text-[var(--text-muted)]">/</span>{repoInfo.repo}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {repoInfo.ref}{repoInfo.path ? ` / ${repoInfo.path}` : ''}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleGenerate}
                disabled={generating || selected.size === 0}
                className="btn-primary px-6 py-3 flex items-center gap-2.5"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Zap className="w-4 h-4" />
                Generate
                <span className="text-[11px] py-0 px-2 rounded-full bg-white/20 text-white font-semibold">
                  {selected.size}
                </span>
              </motion.button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <motion.div
                className="glass-card rounded-2xl overflow-hidden flex flex-col"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <DirectoryTree
                  tree={tree}
                  selected={selected}
                  onSelectionChange={setSelected}
                />
              </motion.div>

              <motion.div
                className="glass-card rounded-2xl overflow-hidden flex flex-col"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <OutputPanel
                  output={output}
                  loading={generating}
                  progress={progress}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        className="border-t border-[var(--border-color)] py-8 relative z-10 transition-colors duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img
              src={logoSrc}
              alt="BearPlex"
              className={`h-5 opacity-30 hover:opacity-50 transition-opacity ${isDark ? 'brightness-0 invert' : ''}`}
            />
          </a>
          <p className="text-xs text-[var(--text-muted)]">
            Built by BearPlex &middot; All processing happens in your browser
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
