import '../../styles/studio.css';

// Studio styles load only on /admin routes, keeping them out of the public bundle.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
