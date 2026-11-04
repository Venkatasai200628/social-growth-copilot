'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from './ui';
import {
  loadUserApiKeys,
  saveUserApiKeys,
  clearUserApiKey,
  maskApiKey,
  validateKeyFormat,
  UserApiKeys,
} from '@/lib/api-keys';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysChanged?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onKeysChanged }: ApiKeyModalProps) {
  const [keys, setKeys] = useState<UserApiKeys>({});
  const [replicateInput, setReplicateInput] = useState('');
  const [geminiInput, setGeminiInput] = useState('');
  const [metaInput, setMetaInput] = useState('');
  const [showTokens, setShowTokens] = useState<{ replicate?: boolean; gemini?: boolean; meta?: boolean }>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const current = loadUserApiKeys();
      setKeys(current);
      setReplicateInput(current.replicateToken || '');
      setGeminiInput(current.geminiKey || '');
      setMetaInput(current.metaKey || current.groqKey || '');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleShow = (provider: 'replicate' | 'gemini' | 'meta') => {
    setShowTokens((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validate replicate token if entered
    if (replicateInput.trim()) {
      const val = validateKeyFormat('replicateToken', replicateInput);
      if (!val.valid) {
        setErrorMsg(val.error || 'Invalid Replicate token');
        return;
      }
    }

    // Validate gemini key if entered
    if (geminiInput.trim()) {
      const val = validateKeyFormat('geminiKey', geminiInput);
      if (!val.valid) {
        setErrorMsg(val.error || 'Invalid Gemini key');
        return;
      }
    }

    // Validate meta key if entered
    if (metaInput.trim()) {
      const val = validateKeyFormat('metaKey', metaInput);
      if (!val.valid) {
        setErrorMsg(val.error || 'Invalid Meta API key');
        return;
      }
    }

    const updated: UserApiKeys = {
      replicateToken: replicateInput.trim() || undefined,
      geminiKey: geminiInput.trim() || undefined,
      metaKey: metaInput.trim() || undefined,
      groqKey: metaInput.trim() || undefined,
    };

    saveUserApiKeys(updated);
    setKeys(updated);
    setSuccessMsg('API keys saved securely to your browser storage!');
    setTimeout(() => {
      if (onKeysChanged) onKeysChanged();
      onClose();
    }, 1200);
  };

  const handleClear = (provider: keyof UserApiKeys) => {
    clearUserApiKey(provider);
    const current = loadUserApiKeys();
    setKeys(current);
    if (provider === 'replicateToken') setReplicateInput('');
    if (provider === 'geminiKey') setGeminiInput('');
    if (provider === 'metaKey' || provider === 'groqKey') setMetaInput('');

    setSuccessMsg(`Cleared ${provider} key. Using system default.`);
    if (onKeysChanged) onKeysChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--neon)]/15 border border-[var(--neon)]/30 flex items-center justify-center text-[var(--neon)]">
              <Key size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">Secure AI API Key Manager (BYOK)</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Connect your personal AI keys with zero server exposure</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security Assurance Banner */}
        <div className="p-3 rounded-xl bg-[color-mix(in_srgb,var(--success)_10%,transparent)] border border-[color-mix(in_srgb,var(--success)_25%,transparent)] text-xs text-[var(--text-soft)] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[var(--success)]">
            <ShieldCheck size={14} /> 100% Client-Side Privacy &amp; Security Guaranteed
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Your keys are stored <strong>strictly on your local device browser</strong> (<code className="text-white">localStorage</code>). They are NEVER saved to our shared database, NEVER accessible to other users, and NEVER logged on our servers.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-xs text-green-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* 1. Meta Model API Key (Muse Family) */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                <Zap size={13} className="text-[var(--neon)]" /> Meta Model API Key (Muse Spark &amp; Muse Wonder)
              </label>
              <a
                href="https://ai.meta.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[var(--neon)] hover:underline flex items-center gap-1"
              >
                Meta AI Docs <ExternalLink size={10} />
              </a>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Powers Meta Model API with Muse Spark (campaigns &amp; roadmaps), Muse Wonder (commercial copywriting &amp; video scripts), and Muse Code (agentic workflows). Supports Meta Model API and local inference keys.
            </p>
            <div className="relative">
              <input
                type={showTokens.meta ? 'text' : 'password'}
                value={metaInput}
                onChange={(e) => setMetaInput(e.target.value)}
                placeholder="meta_sec_xxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg pl-3 pr-16 py-2 text-xs font-mono text-[var(--text)] focus:border-[var(--neon)] outline-none"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleShow('meta')}
                  className="text-[var(--text-muted)] hover:text-white p-0.5"
                >
                  {showTokens.meta ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {(keys.metaKey || keys.groqKey) && (
                  <button
                    type="button"
                    onClick={() => handleClear('metaKey')}
                    title="Clear key"
                    className="text-red-400 hover:text-red-300 p-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            {(keys.metaKey || keys.groqKey) && (
              <span className="inline-block text-[10px] font-mono text-[var(--success)]">
                ● Active Key: {maskApiKey(keys.metaKey || keys.groqKey)}
              </span>
            )}
          </div>

          {/* 2. Replicate API Token */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--accent)]" /> Replicate API Token (For AI Generative Video)
              </label>
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[var(--accent-soft)] hover:underline flex items-center gap-1"
              >
                Get Token <ExternalLink size={10} />
              </a>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Powers Lightricks LTX-Video. If you sign up a new account on Replicate or have credit, paste your token here.
            </p>
            <div className="relative">
              <input
                type={showTokens.replicate ? 'text' : 'password'}
                value={replicateInput}
                onChange={(e) => setReplicateInput(e.target.value)}
                placeholder="r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg pl-3 pr-16 py-2 text-xs font-mono text-[var(--text)] focus:border-[var(--accent)] outline-none"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleShow('replicate')}
                  className="text-[var(--text-muted)] hover:text-white p-0.5"
                >
                  {showTokens.replicate ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {keys.replicateToken && (
                  <button
                    type="button"
                    onClick={() => handleClear('replicateToken')}
                    title="Clear token"
                    className="text-red-400 hover:text-red-300 p-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            {keys.replicateToken && (
              <span className="inline-block text-[10px] font-mono text-[var(--success)]">
                ● Active Token: {maskApiKey(keys.replicateToken)}
              </span>
            )}
          </div>

          {/* 3. Google Gemini API Key (Images only) */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--gold)]" /> Google Gemini API Key (For Scene Visuals)
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[var(--gold)] hover:underline flex items-center gap-1"
              >
                Get Free Gemini Key <ExternalLink size={10} />
              </a>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Unlocks Google Gemini image models for realistic scene visuals without any Pollinations cooldowns!
            </p>
            <div className="relative">
              <input
                type={showTokens.gemini ? 'text' : 'password'}
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
                placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg pl-3 pr-16 py-2 text-xs font-mono text-[var(--text)] focus:border-[var(--gold)] outline-none"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleShow('gemini')}
                  className="text-[var(--text-muted)] hover:text-white p-0.5"
                >
                  {showTokens.gemini ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {keys.geminiKey && (
                  <button
                    type="button"
                    onClick={() => handleClear('geminiKey')}
                    title="Clear key"
                    className="text-red-400 hover:text-red-300 p-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            {keys.geminiKey && (
              <span className="inline-block text-[10px] font-mono text-[var(--success)]">
                ● Active Key: {maskApiKey(keys.geminiKey)}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="flex items-center gap-1.5">
              <ShieldCheck size={14} /> Save Keys to My Browser
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApiKeyModal;

