import { useState } from 'react';
import { Copy, Download, Check, Loader2, FileText, Terminal } from 'lucide-react';
import { formatTokenEstimate } from '../utils/formatter';

export default function OutputPanel({ output, loading, progress }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repo-contents.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = output ? output.split('\n').length : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="section-header justify-between">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-[var(--accent-light)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Output</span>
          {output && (
            <>
              <span className="badge badge-accent">
                {formatTokenEstimate(output)}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {lineCount.toLocaleString()} lines
              </span>
            </>
          )}
        </div>
        {output && (
          <div className="flex items-center gap-1.5">
            <button onClick={handleCopy} className="btn-ghost px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
              {copied
                ? <><Check className="w-3.5 h-3.5 text-[var(--success)]" />Copied</>
                : <><Copy className="w-3.5 h-3.5" />Copy</>
              }
            </button>
            <button onClick={handleDownload} className="btn-ghost px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              .txt
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {loading && progress && (
        <div className="px-5 py-3 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-light)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                Fetching file contents...
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${(progress.current / progress.total) * 100}%`,
                background: 'linear-gradient(90deg, var(--accent) 0%, #8b5cf6 100%)',
                boxShadow: '0 0 10px var(--accent-glow-strong)',
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative">
        {output ? (
          <textarea
            readOnly
            value={output}
            className="w-full h-full min-h-[520px] bg-transparent text-[var(--text-secondary)] text-[12px] font-mono leading-relaxed p-5 resize-none border-0 focus:outline-none"
          />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[520px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-[var(--border-color)] flex items-center justify-center">
                <FileText className="w-7 h-7 text-[var(--text-muted)] opacity-50" />
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-1">No output yet</p>
              <p className="text-xs text-[var(--text-muted)] opacity-60">
                Select files and hit Generate
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
