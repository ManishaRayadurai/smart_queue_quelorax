import { useEffect, useState } from "react";
import { usersApi } from "../../api/users.js";
import { departmentsApi } from "../../api/departments.js";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function StaffManagement() {
  const [items, setItems] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "staff", departmentId: null });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const [users, departments] = await Promise.all([usersApi.getAll(), departmentsApi.getAll()]);
      // backend returns role as an uppercase enum (STAFF, ADMIN, ...);
      // this page's UI (and the <select> options below) use lowercase.
      setItems(users.map((u) => ({ ...u, role: u.role?.toLowerCase() })));
      setDepts(departments);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const openNew = () => {
    setEditing({});
    setErr("");
    setForm({ name: "", email: "", phone: "", password: "", role: "staff", departmentId: depts[0]?.id || null });
  };
  const openEdit = (u) => {
    setEditing(u);
    setErr("");
    setForm({ name: u.name, email: u.email, phone: u.phone, password: "", role: u.role, departmentId: u.departmentId });
  };

  const save = async () => {
    if (!form.phone.trim()) {
      setErr("Phone number is required for all users.");
      return;
    }
    if (!editing?.id && !form.password.trim()) {
      setErr("Password is required for new users.");
      return;
    }
    setErr("");
    setSaving(true);
    try {
      const patch = { ...form };
      if (form.role !== "staff") patch.departmentId = null;
      // Don't send an empty password on edit - it would overwrite with blank.
      if (editing?.id && !patch.password) delete patch.password;

      if (editing?.id) await usersApi.update(editing.id, patch);
      else await usersApi.create(patch);

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
      await usersApi.remove(id);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Users & staff</h1>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold">
          <Plus size={16} /> New user
        </button>
      </div>

      {err && !editing && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading users…</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left">
              <tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th><th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Last login</th><th className="px-4 py-3">Logins</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const d = depts.find((x) => x.id === u.departmentId);
                return (
                  <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-semibold">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">{d?.name || "—"}</td>
                    <td className="px-4 py-3">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}</td>
                    <td className="px-4 py-3">{u.loginCount || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={14} /></button>
                      <button onClick={() => remove(u.id)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td className="px-4 py-3 text-slate-400" colSpan={7}>No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50 p-4" onClick={() => !saving && setEditing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg">{editing.id ? "Edit user" : "New user"}</h2>
            {["name", "email", "phone", "password"].map((k) => (
              <div key={k}>
                <label className="text-xs font-semibold text-slate-500 capitalize">
                  {k}
                  {k === "phone" && <span className="text-rose-500"> *</span>}
                  {k === "password" && !editing.id && <span className="text-rose-500"> *</span>}
                  {k === "password" && editing.id && <span className="text-slate-400"> (leave blank to keep unchanged)</span>}
                </label>
                <input value={form[k]} type="text" disabled={k === "email" && !!editing.id}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border disabled:opacity-60" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-slate-500">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                <option value="visitor">Visitor</option>
                <option value="staff">Staff</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {form.role === "staff" && (
              <div>
                <label className="text-xs font-semibold text-slate-500">Department</label>
                <select value={form.departmentId || ""} onChange={(e) => setForm({ ...form, departmentId: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            {err && <p className="text-sm text-rose-500">{err}</p>}
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
