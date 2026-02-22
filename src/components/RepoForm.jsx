import { useState } from 'react';
import { Search, Key, GitBranch, Folder, Loader2, ChevronDown, ArrowRight } from 'lucide-react';

export default function RepoForm({ onSubmit, loading }) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [ref, setRef] = useState('');
  const [path, setPath] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit({ url: url.trim(), token: token.trim(), ref: ref.trim(), path: path.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Main URL Input */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          <Search className="w-4 h-4 text-[var(--accent-light)]" />
          Repository URL
        </label>
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo  or  owner/repo"
            className="input-field w-full pl-4 pr-12 py-3.5 text-[15px]"
            autoFocus
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] bg-white/[0.04] border border-[var(--border-color)] rounded">
              Enter
            </kbd>
          </div>
        </div>
      </div>

      {/* Token field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-2">
          <Key className="w-3.5 h-3.5" />
          GitHub Token
          <span className="text-xs text-[var(--text-muted)] font-normal">optional</span>
          <span className="ml-auto">
            <a
              href="https://github.com/settings/tokens/new?description=repo-to-text&scopes=repo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors no-underline"
            >
              Create token &rarr;
            </a>
          </span>
        </label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          className="input-field w-full px-4 py-2.5 text-sm font-mono"
        />
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent-light)] transition-colors cursor-pointer bg-transparent border-0 p-0"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-0' : '-rotate-90'}`} />
        Advanced options
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
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
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="btn-primary w-full py-3.5 flex items-center justify-center gap-2.5"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Fetching Repository...
          </>
        ) : (
          <>
            Fetch Repository
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
