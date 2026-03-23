import { useEffect, useState } from "react";
import { getArqueoHoy, abrirCaja, cerrarCaja, getHistorialArqueo } from "../api";

export default function Arqueo() {
  const [arqueoHoy, setArqueoHoy] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [montoCierre, setMontoCierre] = useState("");
  const [montoApertura, setMontoApertura] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    getArqueoHoy().then((r) => setArqueoHoy(r.data)).catch(() => setArqueoHoy(null));
    getHistorialArqueo().then((r) => setHistorial(r.data)).catch(() => {});
  };

  useEffect(() => { cargar(); }, []);

  const abrir = async () => {
    if (!montoApertura) return setError("Ingresá el monto de apertura");
    setCargando(true); setError("");
    try {
      await abrirCaja({ monto_apertura: parseFloat(montoApertura) });
      setMontoApertura("");
      cargar();
    } catch (e) {
      setError(e.response?.data?.detail ?? "Error");
    } finally { setCargando(false); }
  };

  const cerrar = async () => {
    if (!montoCierre) return setError("Ingresá el monto contado");
    setCargando(true); setError("");
    try {
      await cerrarCaja({ monto_cierre: parseFloat(montoCierre) });
      setMontoCierre("");
      cargar();
    } catch (e) {
      setError(e.response?.data?.detail ?? "Error");
    } finally { setCargando(false); }
  };

  const $ = (n) => n != null ? `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "—";

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Arqueo de Caja</h2>

      {/* Estado de hoy */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-700 mb-4">
          Hoy — {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </h3>

        {!arqueoHoy && (
          <div>
            <p className="text-sm text-slate-500 mb-3">La caja no fue abierta todavía.</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Monto de apertura"
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 text-sm w-48"
              />
              <button onClick={abrir} disabled={cargando} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 disabled:opacity-40">
                Abrir caja
              </button>
            </div>
          </div>
        )}

        {arqueoHoy && arqueoHoy.estado === "abierto" && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="bg-slate-50 rounded p-3">
                <p className="text-slate-500 text-xs">Apertura</p>
                <p className="font-bold text-slate-800">{$(arqueoHoy.monto_apertura)}</p>
              </div>
              <div className="bg-slate-50 rounded p-3">
                <p className="text-slate-500 text-xs">Ventas del día</p>
                <p className="font-bold text-emerald-600">{$(arqueoHoy.total_ventas)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-3">Ingresá el efectivo contado para cerrar:</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Monto contado"
                value={montoCierre}
                onChange={(e) => setMontoCierre(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 text-sm w-48"
              />
              <button onClick={cerrar} disabled={cargando} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-40">
                Cerrar caja
              </button>
            </div>
          </div>
        )}

        {arqueoHoy && arqueoHoy.estado === "cerrado" && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Apertura", $(arqueoHoy.monto_apertura), ""],
              ["Ventas del día", $(arqueoHoy.total_ventas), "text-emerald-600"],
              ["Cierre contado", $(arqueoHoy.monto_cierre), ""],
              ["Diferencia", $(arqueoHoy.diferencia),
                arqueoHoy.diferencia > 0 ? "text-emerald-600" :
                arqueoHoy.diferencia < 0 ? "text-red-500" : ""],
            ].map(([label, val, cls]) => (
              <div key={label} className="bg-slate-50 rounded p-3">
                <p className="text-slate-500 text-xs">{label}</p>
                <p className={`font-bold text-slate-800 ${cls}`}>{val}</p>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      </div>

      {/* Historial */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700 text-sm">Historial de arqueos</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-2 text-left">Fecha</th>
              <th className="px-5 py-2 text-right">Apertura</th>
              <th className="px-5 py-2 text-right">Ventas</th>
              <th className="px-5 py-2 text-right">Diferencia</th>
              <th className="px-5 py-2 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {historial.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400">Sin historial</td></tr>
            )}
            {historial.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-5 py-2">{new Date(a.fecha).toLocaleDateString("es-AR")}</td>
                <td className="px-5 py-2 text-right">{$(a.monto_apertura)}</td>
                <td className="px-5 py-2 text-right text-emerald-600">{$(a.total_ventas)}</td>
                <td className={`px-5 py-2 text-right font-medium ${a.diferencia > 0 ? "text-emerald-600" : a.diferencia < 0 ? "text-red-500" : ""}`}>
                  {$(a.diferencia)}
                </td>
                <td className="px-5 py-2 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.estado === "abierto" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-600"}`}>
                    {a.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
