import { useState } from "react";
import { buscarProductos, registrarVenta } from "../api";

export default function PuntoVenta() {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [pagoCon, setPagoCon] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const buscar = async () => {
    if (!termino.trim()) return;
    const { data } = await buscarProductos(termino);
    setResultados(data);
    setSeleccionado(null);
    setResultado(null);
  };

  const seleccionar = (p) => {
    setSeleccionado(p);
    setResultados([]);
    setTermino(p.nombre);
    setCantidad(1);
    setPagoCon("");
    setResultado(null);
    setError("");
  };

  const total = seleccionado ? seleccionado.precio * cantidad : 0;
  const vuelto = pagoCon ? parseFloat(pagoCon) - total : null;

  const registrar = async () => {
    if (!seleccionado) return setError("Seleccioná un producto");
    if (!pagoCon || parseFloat(pagoCon) < total)
      return setError("El monto de pago es insuficiente");
    setCargando(true);
    setError("");
    try {
      const { data } = await registrarVenta({
        producto_id: seleccionado.id,
        cantidad,
        pago_con: parseFloat(pagoCon),
      });
      setResultado(data);
      setSeleccionado(null);
      setTermino("");
      setCantidad(1);
      setPagoCon("");
    } catch (e) {
      setError(e.response?.data?.detail ?? "Error al registrar la venta");
    } finally {
      setCargando(false);
    }
  };

  const $ = (n) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Punto de Venta</h2>

      {resultado && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="font-semibold text-emerald-700">✓ Venta registrada</p>
          <p className="text-sm text-emerald-600 mt-1">
            {resultado.producto} — {$(resultado.total)} — Vuelto: {$(resultado.vuelto)}
          </p>
          <button
            onClick={() => setResultado(null)}
            className="mt-2 text-xs text-emerald-600 underline"
          >
            Nueva venta
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Buscar producto
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
              placeholder="Nombre del producto..."
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <button
              onClick={buscar}
              className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-800"
            >
              Buscar
            </button>
          </div>
          {resultados.length > 0 && (
            <ul className="border border-slate-200 rounded mt-1 divide-y divide-slate-100 shadow-sm">
              {resultados.map((p) => (
                <li
                  key={p.id}
                  onClick={() => seleccionar(p)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 flex justify-between"
                >
                  <span>{p.nombre}</span>
                  <span className="text-slate-500">{$(p.precio)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {seleccionado && (
          <>
            <div className="bg-slate-50 rounded p-3 text-sm">
              <p className="font-medium">{seleccionado.nombre}</p>
              <p className="text-slate-500">
                Precio: {$(seleccionado.precio)} — Stock: {seleccionado.stock}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
              <input
                type="number"
                min={1}
                max={seleccionado.stock}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pago con</label>
              <input
                type="number"
                value={pagoCon}
                onChange={(e) => setPagoCon(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-slate-50 rounded p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total</span>
                <span className="font-bold text-slate-800">{$(total)}</span>
              </div>
              {vuelto !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Vuelto</span>
                  <span className={`font-bold ${vuelto >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {$(vuelto)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={registrar}
          disabled={!seleccionado || cargando}
          className="w-full bg-emerald-600 text-white py-2 rounded font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {cargando ? "Registrando..." : "Registrar Venta"}
        </button>
      </div>
    </div>
  );
}
