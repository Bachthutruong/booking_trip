// This layout is intentionally minimal to resolve a structural conflict
// and prevent the admin sidebar from appearing on the login page.
// The main admin layout with the sidebar is at /src/app/admin/(main)/layout.tsx.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理員區域 - 河內探險家',
};

export default function AdminBaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
