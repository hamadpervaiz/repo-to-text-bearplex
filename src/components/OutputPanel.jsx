import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
          <AnimatePresence>
            {output && (
              <motion.span
                className="badge badge-accent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {formatTokenEstimate(output)}
              </motion.span>
            )}
          </AnimatePresence>
          {output && (
            <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
              {lineCount.toLocaleString()} lines
            </span>
          )}
        </div>
        <AnimatePresence>
          {output && (
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                onClick={handleCopy}
                className="btn-ghost px-2.5 py-1.5 flex items-center gap-1.5 text-xs"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                      Copied
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.button
                onClick={handleDownload}
                className="btn-ghost px-2.5 py-1.5 flex items-center gap-1.5 text-xs"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-3.5 h-3.5" />
                .txt
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <AnimatePresence>
        {loading && progress && (
          <motion.div
            className="px-5 py-3 border-b border-[var(--border-color)]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-flex"
                >
                  <Loader2 className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                </motion.span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Fetching file contents...
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)] tabular-nums">
                {progress.current}/{progress.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--accent)]/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, var(--accent-deep) 0%, var(--accent) 50%, var(--accent-light) 100%)',
                  boxShadow: '0 0 12px var(--accent-glow-strong)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {output ? (
            <motion.textarea
              key="output"
              readOnly
              value={output}
              className="w-full h-full min-h-[520px] bg-transparent text-[var(--text-secondary)] text-[12px] font-mono leading-relaxed p-5 resize-none border-0 focus:outline-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <motion.div
              key="empty"
              className="flex items-center justify-center h-full min-h-[520px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent)]/[0.04] border border-[var(--border-color)] flex items-center justify-center"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <FileText className="w-7 h-7 text-[var(--text-muted)] opacity-40" />
                </motion.div>
                <p className="text-sm text-[var(--text-muted)] mb-1">No output yet</p>
                <p className="text-xs text-[var(--text-muted)] opacity-50">
                  Select files and hit Generate
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
