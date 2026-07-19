"use client";

import React from "react";
import ResourceManager, { ColumnDef, FieldDef } from "@/components/admin/ResourceManager";

interface AdminRow {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
  [key: string]: unknown;
}

const columns: ColumnDef<AdminRow>[] = [
  { key: "name", label: "Name", render: (row) => <span className="text-slate-900 font-extrabold">{row.name}</span> },
  { key: "email", label: "Email" },
  {
    key: "password",
    label: "Password",
    render: (row) => <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{row.password}</code>,
  },
  {
    key: "created_at",
    label: "Created",
    render: (row) => new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  },
];

const fields: FieldDef[] = [
  { name: "name", label: "Name", required: true, placeholder: "Super Admin" },
  { name: "email", label: "Email", required: true, placeholder: "admin@example.com" },
  { name: "password", label: "Password", required: true, colSpan: 2, help: "Stored in plain text in the database." },
];

export default function AdminAdminsPage() {
  return (
    <ResourceManager<AdminRow>
      title="Admins"
      subtitle="Accounts that can sign in to this panel. Passwords are stored in plain text."
      endpoint="/api/admin/admins"
      columns={columns}
      fields={fields}
      addLabel="Add admin"
      itemNoun="admin"
    />
  );
}
