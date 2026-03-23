import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard",       icon: "📊" },
  { to: "/venta",     label: "Punto de Venta",  icon: "🛍️" },
  { to: "/productos", label: "Productos",        icon: "📦" },
  { to: "/fiados",    label: "Fiados",           icon: "📋" },
  { to: "/arqueo",    label: "Arqueo de Caja",   icon: "💰" },
];

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 bg-slate-800 text-white flex flex-col fixed h-full">
        <div className="px-6 py-5 border-b border-slate-700">
          <h1 className="text-lg font-bold tracking-tight">SmartStore</h1>
          <p className="text-xs text-slate-400 mt-0.5">Panel de gestión</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-slate-600 text-white font-medium"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="ml-56 flex-1 p-8">{children}</main>
    </div>
  );
}
