import { useRef, useState } from "react";
import {
  BrainCircuit, FileText, Upload, Send, Sparkles, Trash2,
  BookOpen, ShieldCheck, LoaderCircle, ExternalLink, MessageSquareText
} from "lucide-react";

const API_BASE = "/api";

function ErrorMessage({ children }) {
  if (!children) return null;
  return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{children}</div>;
}

export default function App() {
  const fileInput = useRef(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function uploadFile(file) {
    setError("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const response = await fetch(`${API_BASE}/documents`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed.");
      setDocumentInfo(data);
      setMessages([{
        role: "assistant",
        content: `I've processed **${data.filename}**. Ask me a question about its contents. I'll show the passages I use as sources.`,
        sources: []
      }]);
    } catch (err) {
      setError(err.message || "Could not upload the PDF. Is the backend running?");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function askQuestion(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || !documentInfo || asking) return;

    setError("");
    setQuestion("");
    setMessages((old) => [...old, { role: "user", content: text }]);
    setAsking(true);
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentInfo.document_id, question: text })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "The question could not be answered.");
      setMessages((old) => [...old, {
        role: "assistant",
        content: data.answer,
        sources: data.sources || []
      }]);
    } catch (err) {
      setError(err.message || "Could not contact the backend.");
    } finally {
      setAsking(false);
    }
  }

  async function removeDocument() {
    if (!documentInfo) return;
    try {
      await fetch(`${API_BASE}/documents/${documentInfo.document_id}`, { method: "DELETE" });
    } catch {
      // Clearing the UI still works if the backend has already restarted.
    }
    setDocumentInfo(null);
    setMessages([]);
    setError("");
  }

  const suggestions = [
    "Summarize the main points.",
    "What are the key findings?",
    "What limitations are mentioned?"
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-slate-800">
      <header className="border-b border-slate-200/80 bg-[#f7f6f2]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700 ring-1 ring-violet-200">
              <BrainCircuit size={23} />
            </div>
            <div>
              <p className="font-semibold tracking-tight">DocuMind <span className="text-violet-700">AI</span></p>
              <p className="text-xs text-slate-500">Research & Document Assistant</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 sm:flex">
            <ShieldCheck size={14} /> Document-grounded answers
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight">Your research space</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Upload a paper or report. Ask questions and inspect the evidence behind each answer.</p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); uploadFile(e.dataTransfer.files?.[0]); }}
            className={`rounded-2xl border border-dashed p-5 transition ${dragging ? "border-violet-400 bg-violet-50" : "border-slate-300 bg-white/70"}`}
          >
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-violet-100 text-violet-700">
              {uploading ? <LoaderCircle className="animate-spin" /> : <Upload size={22} />}
            </div>
            <h2 className="font-medium">{uploading ? "Processing document…" : "Upload a PDF"}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">Drag and drop a PDF here, or choose a file. Maximum 10 MB and 100 pages.</p>
            <input ref={fileInput} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => uploadFile(e.target.files?.[0])} />
            <button disabled={uploading} onClick={() => fileInput.current?.click()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Upload size={16} /> Choose PDF
            </button>
          </div>

          {documentInfo && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700"><FileText size={19} /></div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium">{documentInfo.filename}</p>
                  <p className="mt-1 text-xs text-slate-500">{documentInfo.pages_with_text} pages · {documentInfo.chunks} text chunks</p>
                </div>
                <button title="Remove document" onClick={removeDocument} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
              <p className="mt-3 text-xs leading-5 text-emerald-700">Processed in memory. Restarting the backend removes this document.</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium"><BookOpen size={16} className="text-violet-700" /> Try asking</div>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <button key={suggestion} disabled={!documentInfo || asking} onClick={() => setQuestion(suggestion)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40">{suggestion}</button>
              ))}
            </div>
          </div>
          <p className="px-1 text-xs leading-5 text-slate-500">Privacy note: this demo sends your question and retrieved text passages to the configured AI provider. Do not upload confidential documents.</p>
        </aside>

        <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold">Document conversation</h2>
              <p className="mt-1 text-xs text-slate-500">{documentInfo ? "Ask a question grounded in your uploaded PDF" : "Upload a PDF to start a conversation"}</p>
            </div>
            <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700"><MessageSquareText size={20} /></div>
          </div>

          <ErrorMessage>{error}</ErrorMessage>

          <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
            {!messages.length && (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-200"><Sparkles size={28} /></div>
                <h3 className="text-xl font-semibold">Make your documents useful</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Find key insights, summarize research papers, and ask follow-up questions with page-level source references.</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${message.role === "user" ? "bg-slate-200 text-slate-700" : "bg-violet-100 text-violet-700"}`}>
                  {message.role === "user" ? <span className="text-xs font-bold">YOU</span> : <BrainCircuit size={18} />}
                </div>
                <div className={`max-w-[90%] min-w-0 rounded-2xl px-4 py-3 ${message.role === "user" ? "bg-violet-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                  <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                  {message.sources?.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-700">Retrieved sources</p>
                      <div className="space-y-2">
                        {message.sources.map((source) => (
                          <div key={`${source.source}-${source.page}`} className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold text-violet-700">Source {source.source}</span>
                              <span className="text-slate-500">Page {source.page}</span>
                              <span className="text-slate-500">Similarity {source.similarity}</span>
                            </div>
                            <p className="text-xs leading-5 text-slate-600">{source.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {asking && (
              <div className="flex gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><BrainCircuit size={18} /></div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" /> Searching the document and preparing an answer…</div>
              </div>
            )}
          </div>

          <form onSubmit={askQuestion} className="border-t border-slate-200 bg-[#fbfaf7] p-4 sm:p-5">
            <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-2 focus-within:border-violet-400">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(e); } }}
                disabled={!documentInfo || asking}
                rows={2}
                maxLength={1500}
                placeholder={documentInfo ? "Ask something about your document…" : "Upload a PDF to begin…"}
                className="max-h-36 min-h-[48px] flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
              />
              <button type="submit" disabled={!documentInfo || !question.trim() || asking} aria-label="Send question" className="mb-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40">
                {asking ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={17} />}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">AI can make mistakes. Verify important information against the original document.</p>
          </form>
        </section>
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-center text-xs text-slate-600 lg:px-8">DocuMind AI · Learning project for retrieval-augmented generation</footer>
    </div>
  );
}
