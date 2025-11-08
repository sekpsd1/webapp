// /app/admin/layout.tsx

import '../globals.css'; // Import Tailwind CSS

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
