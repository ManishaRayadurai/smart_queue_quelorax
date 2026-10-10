import { useEffect, useState } from "react";
import { departmentsApi } from "../../api/departments.js";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Departments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", avgServiceTime: 6, counter: 1, active: true });
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await departmentsApi.getAll();
      setItems(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const openNew = () => { setEditing({}); setForm({ name: "", code: "", avgServiceTime: 6, counter: 1, active: true }); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, code: d.code, avgServiceTime: d.avgServiceTime, counter: d.counter || 1, active: d.active }); };

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      if (editing?.id) await departmentsApi.update(editing.id, form);
      else await departmentsApi.create(form);
      setEditing(null);
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setErr("");
    try {
      await departmentsApi.remove(id);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Departments</h1>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold">
          <Plus size={16} /> New
        </button>
      </div>

      {err && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading departments…</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left">
              <tr><Th>Name</Th><Th>Code</Th><Th>Avg (min)</Th><Th>Counter</Th><Th>Active</Th><Th></Th></tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-t border-slate-100 dark:border-slate-800">
                  <Td>{d.name}</Td><Td>{d.code}</Td><Td>{d.avgServiceTime}</Td><Td>{d.counter || 1}</Td>
                  <Td>{d.active ? "Yes" : "No"}</Td>
                  <Td className="text-right">
                    <button onClick={() => openEdit(d)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={14} /></button>
                    <button onClick={() => remove(d.id)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600"><Trash2 size={14} /></button>
                  </Td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><Td className="text-slate-400" colSpan={6}>No departments yet.</Td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50 p-4" onClick={() => !saving && setEditing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg">{editing.id ? "Edit" : "New"} department</h2>
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} />
            <Input label="Avg service time (min)" type="number" value={form.avgServiceTime} onChange={(v) => setForm({ ...form, avgServiceTime: Number(v) })} />
            <Input label="Counter number" type="number" value={form.counter} onChange={(v) => setForm({ ...form, counter: Number(v) || 1 })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)} disabled={saving} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Th = ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>;
const Td = ({ children, className = "", colSpan }) => <td colSpan={colSpan} className={`px-4 py-3 ${className}`}>{children}</td>;
const Input = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="text-xs font-semibold text-slate-500">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border" />
  </div>
);
