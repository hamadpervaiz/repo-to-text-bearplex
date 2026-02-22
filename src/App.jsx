import { useState, useCallback } from 'react';
import { Github, Zap, ArrowRight, Code2, FileText, Sparkles } from 'lucide-react';
import RepoForm from './components/RepoForm';
import DirectoryTree from './components/DirectoryTree';
import OutputPanel from './components/OutputPanel';
import { parseRepoUrl, fetchDefaultBranch, fetchRepoTree, fetchFilesContent } from './utils/github';
import { buildTree, generateDirectoryString, formatOutput, isBinaryFile } from './utils/formatter';

export default function App() {
  const [tree, setTree] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

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
      <header className="relative z-10 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/bearplex-logo.svg" alt="BearPlex" className="h-7 brightness-0 invert opacity-90" />
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/hamadpervaiz/repo-to-text-bearplex"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Source</span>
            </a>
            <a
              href="https://bearplex.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-3 py-1.5 flex items-center gap-1.5 text-xs no-underline"
            >
              bearplex.com
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero + Form */}
      <div className="relative hero-gradient bg-grid">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20">
          {/* Hero text */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 badge badge-accent mb-5">
              <Sparkles className="w-3 h-3" />
              Open Source Tool
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
              Repo to
              <span className="bg-gradient-to-r from-[var(--accent)] to-purple-400 bg-clip-text text-transparent"> Plain Text</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
              Convert any GitHub repository into a single text file.
              Perfect for feeding code context into LLMs.
            </p>
          </div>

          {/* Form card */}
          <div className="max-w-2xl mx-auto">
            <div className="glass-card rounded-2xl p-6 glow-accent">
              <RepoForm onSubmit={handleFetch} loading={loading} />
            </div>
          </div>

          {/* Feature pills */}
          {!tree && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {[
                { icon: Github, label: 'Public & Private Repos' },
                { icon: Code2, label: 'Smart File Selection' },
                { icon: FileText, label: 'LLM-Ready Output' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]"
                >
                  <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 -mt-6 mb-6 relative z-10">
          <div className="bg-[var(--error-glow)] border border-red-500/20 text-[var(--error)] rounded-xl px-5 py-4 text-sm flex items-start gap-3 animate-fade-in-up">
            <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold">!</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Tree + Output */}
      {tree && (
        <div className="max-w-6xl mx-auto px-6 -mt-8 pb-16 relative z-10">
          {/* Repo info bar */}
          <div className="flex items-center justify-between mb-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center">
                <Github className="w-4 h-4 text-[var(--accent-light)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {repoInfo.owner}/{repoInfo.repo}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {repoInfo.ref}{repoInfo.path ? ` / ${repoInfo.path}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || selected.size === 0}
              className="btn-primary px-5 py-2.5 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Generate
              <span className="badge badge-accent text-[10px] py-0 px-1.5 border-0 bg-white/20 text-white">
                {selected.size}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {/* Directory Tree */}
            <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
              <DirectoryTree
                tree={tree}
                selected={selected}
                onSelectionChange={setSelected}
              />
            </div>

            {/* Output */}
            <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
              <OutputPanel
                output={output}
                loading={generating}
                progress={progress}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/bearplex-logo.svg" alt="BearPlex" className="h-4 brightness-0 invert opacity-40" />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Built by BearPlex &middot; All processing happens in your browser
          </p>
        </div>
      </footer>
    </div>
  );
}
