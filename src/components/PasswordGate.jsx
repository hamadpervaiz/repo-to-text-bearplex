import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

const HASH = '396c5323cba706a94f6bcb6ac71d0dc2d309ae92604f1949780c41be5e318c5e';

async function sha256(text) {
  const encoded = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setChecking(true);
    setError(false);

    const hash = await sha256(password);
    if (hash === HASH) {
      sessionStorage.setItem('r2t-auth', hash);
      onUnlock();
    } else {
      setError(true);
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] noise flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--accent-glow)] border border-[var(--border-color)] flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Lock className="w-7 h-7 text-[var(--accent-light)]" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Repo to Text</h1>
          <p className="text-sm text-[var(--text-muted)]">Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-card rounded-2xl p-6 glow-accent space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="Password"
                className="input-field w-full px-4 py-3 text-center text-[15px] tracking-widest"
                autoFocus
              />
              {error && (
                <motion.p
                  className="text-xs text-[var(--error)] text-center mt-2"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Incorrect password
                </motion.p>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={checking || !password.trim()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              whileHover={password.trim() ? { scale: 1.02 } : {}}
              whileTap={password.trim() ? { scale: 0.98 } : {}}
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Unlock
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </form>

        <p className="text-center mt-6">
          <img src="/bearplex-logo.svg" alt="BearPlex" className="h-5 mx-auto brightness-0 invert opacity-20" />
        </p>
      </motion.div>
    </div>
  );
}
