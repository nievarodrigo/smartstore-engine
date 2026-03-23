import { useEffect, useState } from "react";
import { getKpisHoy, getVentas, getTopProducto, getDeudores, getGrafico, getTopProductos } from "../api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

function KpiCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

const $ = (n) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [top, setTop] = useState(null);
  const [deudores, setDeudores] = useState([]);
  const [grafico, setGrafico] = useState([]);
  const [topProductos, setTopProductos] = useState([]);

  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0];
    const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    getKpisHoy().then((r) => setKpis(r.data)).catch(() => {});
    getVentas().then((r) => setVentas(r.data.slice(0, 6))).catch(() => {});
    getTopProducto(hoy, hoy).then((r) => setTop(r.data)).catch(() => {});
    getDeudores().then((r) => setDeudores(r.data.filter((d) => d.total_adeudado > 0))).catch(() => {});
    getGrafico(hace30, hoy).then((r) => setGrafico(
      r.data.map((d) => ({ ...d, fecha: d.fecha.slice(5) })) // solo MM-DD
    )).catch(() => {});
    getTopProductos(hace30, hoy, 8).then((r) => setTopProductos(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">Dashboard</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Recaudado hoy" value={kpis ? $(kpis.total_recaudado) : "—"} />
        <KpiCard label="Ventas hoy" value={kpis ? kpis.cantidad_ventas : "—"} sub="transacciones" />
        <KpiCard
          label="Top producto hoy"
          value={top?.producto_nombre !== "N/A" ? top?.producto_nombre ?? "—" : "Sin ventas"}
          sub={top?.cantidad_total > 0 ? `${top.cantidad_total} unidades` : ""}
        />
        <KpiCard label="Deudores activos" value={deudores.length} sub="con saldo pendiente" />
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Ventas por día */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Ventas últimos 30 días</h3>
          {grafico.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={grafico} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [$(v), "Total"]} labelFormatter={(l) => `Fecha: ${l}`} />
                <Bar dataKey="total" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Productos más vendidos (30 días)</h3>
          {topProductos.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProductos} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="producto_nombre" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(v) => [v, "Unidades"]} />
                <Bar dataKey="cantidad_total" fill="#10b981" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Últimas ventas */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Últimas ventas</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-5 py-3 text-left">#</th>
              <th className="px-5 py-3 text-left">Fecha</th>
              <th className="px-5 py-3 text-left">Método</th>
              <th className="px-5 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Sin ventas</td></tr>
            )}
            {ventas.map((v) => (
              <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-400">#{v.id}</td>
                <td className="px-5 py-3">
                  {new Date(v.fecha_hora).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-5 py-3 capitalize">{v.metodo_pago}</td>
                <td className="px-5 py-3 text-right font-medium">{$(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
