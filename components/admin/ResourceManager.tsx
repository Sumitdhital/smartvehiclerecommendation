"use client";

import React, { useEffect, useRef, useState } from "react";

export type FieldType = "text" | "number" | "textarea" | "checkbox" | "select" | "tags" | "photos";

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[]; // for select
  step?: string; // for number
  colSpan?: 1 | 2;
  section?: string; // groups the field under a header in the edit modal
  uploadEndpoint?: string; // for "photos": POST target that returns { urls: string[] }
}

export interface ColumnDef<Row> {
  key: string;
  label: string;
  render?: (row: Row) => React.ReactNode;
  // When set, the cell can be edited inline in the table (one-field PATCH).
  inlineEdit?: "text" | "number" | "toggle";
}

interface Props<Row extends { id: string }> {
  title: string;
  subtitle?: string;
  endpoint: string; // e.g. "/api/admin/vehicles"
  columns: ColumnDef<Row>[];
  fields: FieldDef[];
  addLabel?: string;
  itemNoun?: string; // e.g. "vehicle"
  onRowOpen?: (row: Row) => void; // fired when a row's edit modal opens
}

type Values = Record<string, unknown>;

function emptyValues(fields: FieldDef[]): Values {
  const v: Values = {};
  for (const f of fields) {
    if (f.type === "checkbox") v[f.name] = false;
    else if (f.type === "photos") v[f.name] = [];
    else v[f.name] = "";
  }
  return v;
}

// Row value → form input value
function toInput(field: FieldDef, raw: unknown): unknown {
  if (field.type === "checkbox") return Boolean(raw);
  if (field.type === "photos") return Array.isArray(raw) ? raw : [];
  if (field.type === "tags") return Array.isArray(raw) ? raw.join(", ") : raw ?? "";
  if (raw === null || raw === undefined) return "";
  return raw;
}

// Form input value → API payload value
function toPayload(field: FieldDef, raw: unknown): unknown {
  const t = field.type ?? "text";
  if (t === "checkbox") return Boolean(raw);
  if (t === "photos") return Array.isArray(raw) ? raw.filter((x) => typeof x === "string" && x) : [];
  if (t === "number") {
    if (raw === "" || raw === null || raw === undefined) return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  }
  if (t === "tags") {
    const s = String(raw ?? "").trim();
    return s === "" ? [] : s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  const s = String(raw ?? "").trim();
  if (s === "") return field.required ? "" : null;
  return s;
}

// Preserve first-appearance order while grouping fields by their section.
function groupFields(fields: FieldDef[]): { section: string | null; fields: FieldDef[] }[] {
  const groups: { section: string | null; fields: FieldDef[] }[] = [];
  const index = new Map<string, number>();
  for (const f of fields) {
    const key = f.section ?? "";
    if (!index.has(key)) {
      index.set(key, groups.length);
      groups.push({ section: f.section ?? null, fields: [] });
    }
    groups[index.get(key)!].fields.push(f);
  }
  return groups;
}

export default function ResourceManager<Row extends { id: string }>({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  addLabel = "Add new",
  itemNoun = "item",
  onRowOpen,
}: Props<Row>) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Values>(emptyValues(fields));
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Photo-upload state (keyed by field name).
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");

  // Inline table-edit state.
  const [editCell, setEditCell] = useState<{ id: string; key: string } | null>(null);
  const [cellDraft, setCellDraft] = useState("");
  const [cellSaving, setCellSaving] = useState(false);
  // Guards against Enter + blur both committing the same inline edit.
  const committingRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load.");
      setRows(json.data || []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const openCreate = () => {
    setEditingId(null);
    setValues(emptyValues(fields));
    setFormError("");
    setPhotoError("");
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    onRowOpen?.(row);
    setEditingId(row.id);
    const v: Values = {};
    for (const f of fields) v[f.name] = toInput(f, (row as Record<string, unknown>)[f.name]);
    setValues(v);
    setFormError("");
    setPhotoError("");
    setModalOpen(true);
  };

  const uploadPhotos = async (field: FieldDef, files: File[]) => {
    if (!field.uploadEndpoint || files.length === 0) return;
    setUploadingField(field.name);
    setPhotoError("");
    try {
      const fd = new FormData();
      for (const file of files) fd.append("files", file);
      const res = await fetch(field.uploadEndpoint, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      const urls: string[] = Array.isArray(json.urls) ? json.urls : [];
      setValues((s) => {
        const cur = Array.isArray(s[field.name]) ? (s[field.name] as string[]) : [];
        return { ...s, [field.name]: [...cur, ...urls] };
      });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadingField(null);
    }
  };

  const removePhoto = (fieldName: string, idx: number) => {
    setValues((s) => {
      const cur = Array.isArray(s[fieldName]) ? (s[fieldName] as string[]) : [];
      return { ...s, [fieldName]: cur.filter((_, i) => i !== idx) };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const payload: Values = {};
    for (const f of fields) payload[f.name] = toPayload(f, values[f.name]);

    // Client-side required check
    const missing = fields
      .filter((f) => f.required)
      .filter((f) => {
        const val = payload[f.name];
        return val === "" || val === null || val === undefined;
      })
      .map((f) => f.label);
    if (missing.length) {
      setFormError(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed.");
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!window.confirm(`Delete this ${itemNoun}? This can't be undone.`)) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`${endpoint}/${row.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  // One-field PATCH used by inline table editing.
  const patchCell = async (id: string, key: string, value: unknown) => {
    setCellSaving(true);
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed.");
      const updated = json.data as Row | undefined;
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...(updated ?? { [key]: value }) } : r)));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Save failed.");
      await load();
    } finally {
      setCellSaving(false);
      setEditCell(null);
    }
  };

  const startCellEdit = (row: Row, col: ColumnDef<Row>) => {
    const raw = (row as Record<string, unknown>)[col.key];
    setCellDraft(raw === null || raw === undefined ? "" : String(raw));
    setEditCell({ id: row.id, key: col.key });
  };

  const commitCellEdit = (col: ColumnDef<Row>, id: string) => {
    if (committingRef.current) return;
    const value = col.inlineEdit === "number" ? (cellDraft === "" ? null : Number(cellDraft)) : cellDraft.trim();
    if (col.inlineEdit === "number" && value !== null && Number.isNaN(value)) {
      setEditCell(null);
      return;
    }
    committingRef.current = true;
    patchCell(id, col.key, value).finally(() => {
      committingRef.current = false;
    });
  };

  const displayValue = (col: ColumnDef<Row>, row: Row): React.ReactNode => {
    if (col.render) return col.render(row);
    const raw = (row as Record<string, unknown>)[col.key];
    if (Array.isArray(raw)) return raw.join(", ");
    if (typeof raw === "boolean") return raw ? "Yes" : "No";
    if (raw === null || raw === undefined) return "—";
    return String(raw);
  };

  const renderCell = (col: ColumnDef<Row>, row: Row): React.ReactNode => {
    if (!col.inlineEdit) return displayValue(col, row);

    const isEditing = editCell?.id === row.id && editCell?.key === col.key;

    if (col.inlineEdit === "toggle") {
      const raw = Boolean((row as Record<string, unknown>)[col.key]);
      return (
        <button
          type="button"
          disabled={cellSaving}
          onClick={() => patchCell(row.id, col.key, !raw)}
          className="cursor-pointer disabled:opacity-50"
          title="Click to toggle"
        >
          {displayValue(col, row)}
        </button>
      );
    }

    if (isEditing) {
      return (
        <input
          autoFocus
          type={col.inlineEdit === "number" ? "number" : "text"}
          value={cellDraft}
          disabled={cellSaving}
          onChange={(e) => setCellDraft(e.target.value)}
          onBlur={() => commitCellEdit(col, row.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitCellEdit(col, row.id);
            } else if (e.key === "Escape") {
              setEditCell(null);
            }
          }}
          className="w-28 rounded-lg border border-blue-300 bg-white px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      );
    }

    return (
      <button
        type="button"
        onClick={() => startCellEdit(row, col)}
        className="cursor-pointer rounded px-1 -mx-1 text-left hover:bg-blue-50 hover:text-blue-700"
        title="Click to edit"
      >
        {displayValue(col, row)}
      </button>
    );
  };

  const renderField = (f: FieldDef): React.ReactNode => {
    const id = `field-${f.name}`;
    const val = values[f.name];
    const wrapClass =
      f.colSpan === 2 || f.type === "textarea" || f.type === "photos" ? "sm:col-span-2" : "";

    if (f.type === "checkbox") {
      return (
        <label
          key={f.name}
          className={`flex items-center gap-2.5 ${wrapClass} bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 cursor-pointer`}
        >
          <input
            type="checkbox"
            checked={Boolean(val)}
            onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.checked }))}
            className="w-4 h-4 rounded accent-blue-600"
          />
          <span className="text-sm font-bold text-slate-700">{f.label}</span>
        </label>
      );
    }

    if (f.type === "photos") {
      const arr = Array.isArray(val) ? (val as string[]) : [];
      const uploading = uploadingField === f.name;
      return (
        <div key={f.name} className={`flex flex-col gap-2 ${wrapClass}`}>
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{f.label}</label>
          <div className="flex flex-wrap gap-2.5">
            {arr.map((url, i) => (
              <div key={`${url}-${i}`} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="h-20 w-28 rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(f.name, i)}
                  aria-label="Remove photo"
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-red-50 hover:text-red-600"
                >
                  &times;
                </button>
              </div>
            ))}
            <label
              className={`flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 ${
                uploading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {uploading ? "Uploading…" : "+ Upload"}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  uploadPhotos(f, files);
                }}
              />
            </label>
          </div>
          {photoError && uploadingField === null && (
            <span className="text-[11px] font-bold text-red-500">{photoError}</span>
          )}
          {f.help && <span className="text-[11px] text-slate-400 font-medium">{f.help}</span>}
        </div>
      );
    }

    return (
      <div key={f.name} className={`flex flex-col gap-1.5 ${wrapClass}`}>
        <label htmlFor={id} className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
          {f.label}
          {f.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {f.type === "textarea" ? (
          <textarea
            id={id}
            value={String(val ?? "")}
            onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
            placeholder={f.placeholder}
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-y"
          />
        ) : f.type === "select" ? (
          <select
            id={id}
            value={String(val ?? "")}
            onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          >
            <option value="">Select…</option>
            {f.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type={f.type === "number" ? "number" : "text"}
            step={f.step}
            value={String(val ?? "")}
            onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
            placeholder={f.placeholder}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        )}
        {f.help && <span className="text-[11px] text-slate-400 font-medium">{f.help}</span>}
      </div>
    );
  };

  const groups = groupFields(fields);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 font-medium mt-1">{subtitle}</p>}
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
        >
          + {addLabel}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-400">Loading…</div>
        ) : listError ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-red-600">{listError}</p>
            <button onClick={load} className="mt-3 text-xs font-bold text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-slate-700">No {itemNoun}s yet</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Add your first {itemNoun} to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold text-xs uppercase tracking-wider">
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 whitespace-nowrap max-w-[240px] truncate">
                        {renderCell(c, row)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(row)}
                          className="text-xs font-bold text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(row)}
                          disabled={busyId === row.id}
                          className="text-xs font-bold text-red-500 hover:text-red-600 border border-red-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                          {busyId === row.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !listError && rows.length > 0 && (
        <p className="text-xs font-semibold text-slate-400">
          {rows.length} {itemNoun}
          {rows.length === 1 ? "" : "s"}
        </p>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4"
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {editingId ? `Edit ${itemNoun}` : `New ${itemNoun}`}
              </h2>
              <button
                onClick={() => !saving && setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center transition-all text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col overflow-hidden">
              <div className="overflow-y-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map((g) => (
                  <React.Fragment key={g.section ?? "_default"}>
                    {g.section && (
                      <div className="sm:col-span-2 mt-1 border-b border-slate-100 pb-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
                        {g.section}
                      </div>
                    )}
                    {g.fields.map((f) => renderField(f))}
                  </React.Fragment>
                ))}
              </div>

              {formError && (
                <div className="mx-6 mb-2 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-60"
                >
                  {saving ? "Saving…" : editingId ? "Save changes" : `Create ${itemNoun}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
