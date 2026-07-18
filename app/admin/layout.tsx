import React from "react";
import { getAdminSession } from "@/lib/admin-auth";
import AdminChrome from "@/components/admin/AdminChrome";

export const metadata = {
  title: "Admin • SaaS Nepal",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // The login page renders without the admin chrome. Middleware guarantees
  // every other /admin route already has a valid session here.
  if (!session) {
    return <>{children}</>;
  }

  return <AdminChrome adminName={session.name}>{children}</AdminChrome>;
}
