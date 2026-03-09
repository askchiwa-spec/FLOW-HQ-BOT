'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Doc {
  id: string;
  filename: string;
  file_type: string;
  url?: string;
  created_at: string;
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  txt: '📃',
  url: '🌐',
  text: '✏️',
  xlsx: '📊',
  xls: '📊',
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textLabel, setTextLabel] = useState('');
  const [textLoading, setTextLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/portal/documents');
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx|doc|txt|xlsx|xls)$/i)) {
      setError('Only PDF, DOCX, DOC, TXT, XLSX, and XLS files are allowed.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/portal/documents/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');
      showSuccess(`"${file.name}" uploaded and processed successfully.`);
      await fetchDocs();
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSave = async () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput);
    } catch {
      setError('Please enter a valid URL (include https://)');
      return;
    }

    setError(null);
    setUrlLoading(true);

    try {
      const res = await fetch('/api/portal/documents/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save URL');
      setUrlInput('');
      showSuccess('Website URL saved as a knowledge source.');
      await fetchDocs();
    } catch (err: any) {
      setError(err.message || 'Failed to save URL.');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleTextSave = async () => {
    if (!textContent.trim()) return;
    setError(null);
    setTextLoading(true);
    try {
      const res = await fetch('/api/portal/documents/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textContent.trim(), label: textLabel.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setTextContent('');
      setTextLabel('');
      showSuccess('Knowledge notes saved successfully.');
      await fetchDocs();
    } catch (err: any) {
      setError(err.message || 'Failed to save text.');
    } finally {
      setTextLoading(false);
    }
  };

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`Remove "${doc.filename}" from your knowledge base?`)) return;

    try {
      const res = await fetch('/api/portal/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      showSuccess('Document removed.');
    } catch {
      setError('Failed to remove document.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-3">
          Business <span className="text-primary-400">Knowledge Base</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Upload documents or add your website so the AI bot knows your business — services, prices, hours, policies.
        </p>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload File */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-base">📎</span>
            Upload Documents
          </h2>
          <a
            href="/products-template.csv"
            download="products-template.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Excel Template
          </a>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          PDF, Word, plain text, or <span className="text-emerald-400 font-medium">Excel (.xlsx/.xls)</span> — up to 20 MB.
          Use the template above to list your products/services with prices.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`
            flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all
            ${uploading
              ? 'border-primary-500/40 bg-primary-500/5 cursor-not-allowed'
              : 'border-white/10 hover:border-primary-500/40 hover:bg-primary-500/5'
            }
          `}
        >
          {uploading ? (
            <div className="flex items-center gap-3 text-primary-400">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium">Processing...</span>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-slate-400">Click to upload or drag and drop</span>
              <span className="text-xs text-slate-600 mt-1">PDF · DOCX · DOC · TXT · XLSX · XLS</span>
            </>
          )}
        </label>
      </motion.div>

      {/* Website URL */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-secondary-500/20 flex items-center justify-center text-base">🌐</span>
          Website URL
        </h2>
        <p className="text-sm text-slate-400 mb-4">Add your business website so the bot can reference it as a source.</p>
        <div className="flex gap-3">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://yourbusiness.com"
            className="flex-1 bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSave()}
          />
          <button
            onClick={handleUrlSave}
            disabled={urlLoading || !urlInput.trim()}
            className="px-5 py-3 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 rounded-xl text-sm font-medium hover:bg-secondary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {urlLoading ? 'Saving...' : 'Save URL'}
          </button>
        </div>
      </motion.div>

      {/* Type Knowledge Directly */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-base">✏️</span>
          Type Knowledge Directly
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Write your business information directly — great for Swahili content, local prices, or short FAQs.
          <span className="text-emerald-400"> If your bot language is Swahili, write this in Swahili.</span>
        </p>
        <input
          type="text"
          value={textLabel}
          onChange={(e) => setTextLabel(e.target.value)}
          placeholder="Label (optional, e.g. &quot;Orodha ya Huduma&quot;)"
          className="w-full bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm mb-3"
        />
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder={`Write your knowledge here...\n\nMfano (Swahili):\nHuduma zetu:\n- Nywele: TZS 5,000\n- Ndevu: TZS 3,000\nSaa za kazi: Jumatatu–Jumamosi, 8am–6pm`}
          rows={7}
          className="w-full bg-dark-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm resize-none mb-3"
        />
        <button
          onClick={handleTextSave}
          disabled={textLoading || !textContent.trim()}
          className="px-5 py-3 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl text-sm font-medium hover:bg-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {textLoading ? 'Saving...' : 'Save Notes'}
        </button>
      </motion.div>

      {/* Document List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">Uploaded Sources</h2>
          <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">
            {docs.length} {docs.length === 1 ? 'source' : 'sources'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : docs.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">No documents yet</p>
            <p className="text-slate-600 text-xs mt-1">Upload your price list, services menu, or any business info</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {docs.map((doc, i) => (
              <motion.li
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors"
              >
                <span className="text-2xl">{FILE_ICONS[doc.file_type] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {doc.file_type === 'url' ? doc.url : doc.filename}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {doc.file_type.toUpperCase()} · {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Info Banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 flex gap-3">
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-amber-400/80">
          Your documents are used by the AI to answer customer questions accurately. Include your full price list,
          services, opening hours, policies, and any FAQs. The more detail you provide, the better the bot performs.
          {' '}<strong>If your bot language is Swahili, write your knowledge base content in Swahili</strong> — this helps the AI use the right words and prices naturally.
        </p>
      </motion.div>
    </div>
  );
}
