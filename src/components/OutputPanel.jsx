import { useState } from 'react';
import { Copy, Download, Check, Loader2, FileText } from 'lucide-react';
import { formatTokenEstimate } from '../utils/formatter';

export default function OutputPanel({ output, loading, progress }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-secondary)]">Output</span>
          {output && (
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
              {formatTokenEstimate(output)}
            </span>
          )}
        </div>
        {output && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-md transition-colors cursor-pointer border-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-md transition-colors cursor-pointer border-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        )}
      </div>

      {loading && progress && (
        <div className="px-4 py-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              Fetching files... {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        {output ? (
          <textarea
            readOnly
            value={output}
            className="w-full h-full min-h-[400px] bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-mono p-4 resize-none border-0 focus:outline-none"
          />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] text-[var(--text-secondary)]">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select files and generate output</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
