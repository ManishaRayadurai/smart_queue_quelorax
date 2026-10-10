import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Download, FileText, ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { documentsApi } from "../../api/documents.js";

// The backend's fileUrl column is capped at 2000 characters, which a
// base64-encoded file blows past almost immediately (a few KB of real file
// easily becomes 5-10x that in base64). There's no real file-storage service
// (S3/disk) wired up on the backend yet — so we only persist the document
// *record* (name, type, status) for real. The actual bytes are kept in
// memory for this browser tab only, so preview/download work during the
// session but won't survive a refresh or follow you to another device.
const FILE_URL_SAFE_LIMIT = 1800;

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  // dataUrl kept client-side only, keyed by document id — not persisted server-side.
  const [blobs, setBlobs] = useState({});
  // "list" shows what's already uploaded; "upload" is the dedicated upload form.
  const [view, setView] = useState("list");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const refresh = async () => {
    try {
      const data = await documentsApi.getByUser(user.id);
      setDocs(data);
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const dataUrl = await fileToDataUrl(f);
        const fitsInDb = dataUrl.length <= FILE_URL_SAFE_LIMIT;
        const doc = await documentsApi.create({
          userId: user.id,
          name: f.name,
          type: f.type,
          status: "pending",
          fileUrl: fitsInDb ? dataUrl : null,
        });
        // Always keep it in memory for this tab so preview/download work
        // immediately, regardless of whether it was small enough to persist.
        setBlobs((prev) => ({ ...prev, [doc.id]: dataUrl }));
      }
      await refresh();
      setView("list");
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    try {
      await documentsApi.remove(id);
      setBlobs((prev) => { const next = { ...prev }; delete next[id]; return next; });
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  const toggleStatus = async (doc) => {
    const next = doc.status === "approved" ? "pending" : "approved";
    try {
      await documentsApi.update(doc.id, { status: next });
      setPreview(null);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  const dataUrlFor = (d) => d.fileUrl || blobs[d.id];

  if (view === "upload") {
    return (
      <div className="space-y-6 max-w-2xl">
        <button
          type="button"
          onClick={() => setView("list")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
        >
          <ArrowLeft size={16} /> Back to my documents
        </button>
        <div>
          <h1 className="text-2xl font-bold">Upload a new document</h1>
          <p className="text-sm text-slate-500">Drag and drop a file, or browse to select one from your device.</p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
          className={`rounded-3xl border-2 border-dashed p-10 text-center transition ${
            dragOver ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20" : "border-slate-300 dark:border-slate-700"
          }`}
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white grid place-items-center">
            <Upload size={22} />
          </div>
          <p className="mt-4 font-semibold">{uploading ? "Uploading…" : "Drag & drop files here"}</p>
          <p className="text-sm text-slate-500">or</p>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold disabled:opacity-60"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={(e) => upload(e.target.files)}
            className="hidden"
          />
          {err && <p className="mt-4 text-sm text-rose-500">{err}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading documents…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My documents</h1>
          <p className="text-sm text-slate-500">Everything you've uploaded so far.</p>
        </div>
        <button
          onClick={() => setView("upload")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow hover:shadow-lg transition"
        >
          <Plus size={16} /> Upload new document
        </button>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      {docs.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 grid place-items-center text-slate-400">
            <FileText size={22} />
          </div>
          <p className="mt-4 font-semibold">No documents yet</p>
          <p className="text-sm text-slate-500">Upload identity proofs or supporting documents for verification.</p>
          <button
            onClick={() => setView("upload")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold"
          >
            <Plus size={16} /> Upload your first document
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => {
            const available = !!dataUrlFor(d);
            return (
              <div key={d.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800"><FileText size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{d.name}</p>
                    <p className="text-xs text-slate-500">{new Date(d.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    d.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : d.status === "rejected"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>{d.status}</span>
                </div>
                {!available && (
                  <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                    <AlertCircle size={11} /> File not available for preview — uploaded in a previous session.
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setPreview(d)}
                    disabled={!available}
                    className="flex-1 px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Preview
                  </button>
                  <a
                    href={available ? dataUrlFor(d) : undefined}
                    download={d.name}
                    aria-disabled={!available}
                    className={`p-2 rounded-lg border ${!available ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    <Download size={14} />
                  </a>
                  <button onClick={() => remove(d.id)} className="p-2 rounded-lg border text-rose-600"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50 p-4" onClick={() => setPreview(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold mb-3">{preview.name}</p>
            {preview.type?.startsWith("image/") ? (
              <img src={dataUrlFor(preview)} alt={preview.name} className="max-h-[70vh] mx-auto rounded" />
            ) : (
              <iframe title="preview" src={dataUrlFor(preview)} className="w-full h-[70vh] rounded" />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => toggleStatus(preview)}
                className="px-3 py-1.5 rounded-lg border"
              >
                Mark as {preview.status === "approved" ? "pending" : "approved"}
              </button>
              <button onClick={() => setPreview(null)} className="px-3 py-1.5 rounded-lg bg-sky-600 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
