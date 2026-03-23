import { useEffect, useState } from "react";
import { getDeudores, crearDeudor, agregarCargo, registrarPago, getHistorialDeudor } from "../api";

export default function Fiados() {
  const [deudores, setDeudores] = useState([]);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoForm, setNuevoForm] = useState({ nombre: "", telefono: "" });
  const [seleccionado, setSeleccionado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [movForm, setMovForm] = useState({ monto: "", descripcion: "" });
  const [tipoMov, setTipoMov] = useState("cargo");
  const [error, setError] = useState("");

  const cargar = () => getDeudores().then((r) => setDeudores(r.data));
  useEffect(() => { cargar(); }, []);

  const abrirDeudor = async (d) => {
    setSeleccionado(d);
    setMovForm({ monto: "", descripcion: "" });
    setError("");
    const { data } = await getHistorialDeudor(d.id);
    setHistorial(data);
  };

  const crearNuevo = async () => {
    if (!nuevoForm.nombre) return;
    await crearDeudor({ nombre: nuevoForm.nombre, telefono: nuevoForm.telefono || null });
    setModalNuevo(false);
    setNuevoForm({ nombre: "", telefono: "" });
    cargar();
  };

  const registrarMov = async () => {
    if (!movForm.monto) return setError("Ingresá un monto");
    setError("");
    try {
      const fn = tipoMov === "cargo" ? agregarCargo : registrarPago;
      await fn(seleccionado.id, { monto: parseFloat(movForm.monto), descripcion: movForm.descripcion || null });
      setMovForm({ monto: "", descripcion: "" });
      const [hist, lista] = await Promise.all([
        getHistorialDeudor(seleccionado.id),
        getDeudores(),
      ]);
      setHistorial(hist.data);
      setDeudores(lista.data);
      setSeleccionado(lista.data.find((d) => d.id === seleccionado.id));
    } catch (e) {
      setError(e.response?.data?.detail ?? "Error al registrar");
    }
  };

  const $ = (n) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex gap-6">
      {/* Lista de deudores */}
      <div className="w-72 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Fiados</h2>
          <button onClick={() => setModalNuevo(true)} className="bg-slate-700 text-white px-3 py-1.5 rounded text-xs hover:bg-slate-800">
            + Nuevo
          </button>
        </div>
        <div className="space-y-2">
          {deudores.length === 0 && <p className="text-sm text-slate-400">Sin deudores</p>}
          {deudores.map((d) => (
            <button
              key={d.id}
              onClick={() => abrirDeudor(d)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                seleccionado?.id === d.id
                  ? "border-slate-400 bg-slate-100"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p className="font-medium text-sm text-slate-800">{d.nombre}</p>
              <p className={`text-xs mt-0.5 font-semibold ${d.total_adeudado > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {d.total_adeudado > 0 ? `Debe ${$(d.total_adeudado)}` : "Sin deuda"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Panel del deudor */}
      {seleccionado && (
        <div className="flex-1">
          <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
            <h3 className="font-bold text-slate-800 text-lg">{seleccionado.nombre}</h3>
            {seleccionado.telefono && <p className="text-sm text-slate-500">📞 {seleccionado.telefono}</p>}
            <p className={`text-sm font-semibold mt-1 ${seleccionado.total_adeudado > 0 ? "text-red-500" : "text-emerald-500"}`}>
              Saldo: {$(seleccionado.total_adeudado)}
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <button onClick={() => setTipoMov("cargo")} className={`px-3 py-1.5 rounded text-xs font-medium ${tipoMov === "cargo" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>Agregar cargo</button>
                <button onClick={() => setTipoMov("pago")} className={`px-3 py-1.5 rounded text-xs font-medium ${tipoMov === "pago" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>Registrar pago</button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Monto"
                  value={movForm.monto}
                  onChange={(e) => setMovForm({ ...movForm, monto: e.target.value })}
                  className="border border-slate-300 rounded px-3 py-2 text-sm w-32"
                />
                <input
                  placeholder="Descripción (opcional)"
                  value={movForm.descripcion}
                  onChange={(e) => setMovForm({ ...movForm, descripcion: e.target.value })}
                  className="border border-slate-300 rounded px-3 py-2 text-sm flex-1"
                />
                <button onClick={registrarMov} className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-800">
                  Guardar
                </button>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-100">
              <h4 className="font-semibold text-slate-700 text-sm">Historial</h4>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-2 text-left">Fecha</th>
                  <th className="px-5 py-2 text-left">Tipo</th>
                  <th className="px-5 py-2 text-left">Descripción</th>
                  <th className="px-5 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">Sin movimientos</td></tr>
                )}
                {historial.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-5 py-2 text-slate-500">
                      {new Date(m.fecha).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-5 py-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.tipo === "cargo" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-slate-500">{m.descripcion ?? "—"}</td>
                    <td className={`px-5 py-2 text-right font-medium ${m.tipo === "cargo" ? "text-red-500" : "text-emerald-600"}`}>
                      {m.tipo === "cargo" ? "+" : "-"}{$(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!seleccionado && (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Seleccioná un deudor para ver el detalle
        </div>
      )}

      {modalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">Nuevo deudor</h3>
            <div className="space-y-3">
              <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm" placeholder="Nombre *" value={nuevoForm.nombre} onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value })} />
              <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm" placeholder="Teléfono (opcional)" value={nuevoForm.telefono} onChange={(e) => setNuevoForm({ ...nuevoForm, telefono: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setModalNuevo(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
              <button onClick={crearNuevo} className="px-4 py-2 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
