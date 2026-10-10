import { Link } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout.jsx";

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="min-h-[60vh] grid place-items-center text-center px-4">
        <div>
          <p className="text-7xl font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">404</p>
          <h1 className="mt-3 text-2xl font-bold">Page not found</h1>
          <p className="mt-2 text-slate-500">The page you're looking for doesn't exist.</p>
          <Link to="/" className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-sky-600 text-white font-semibold">Back home</Link>
        </div>
      </div>
    </PublicLayout>
  );
}