import { useState, useEffect, useRef } from "react";
import { buscarPorBarcode, registrarVenta, getDeudores, getVentas } from "../api";

const $ = (n) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

export default function PuntoVenta() {
  const [barcode, setBarcode] = useState("");
  const [carrito, setCarrito] = useState(() => {
    try { return JSON.parse(localStorage.getItem("carrito") ?? "[]"); } catch { return []; }
  });
  const [pagoCon, setPagoCon] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [deudores, setDeudores] = useState([]);
  const [deudorId, setDeudorId] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const barcodeRef = useRef(null);

  // Persiste carrito en localStorage
  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  // Auto-dismiss del popup de éxito
  useEffect(() => {
    if (!resultado) return;
    const t = setTimeout(() => {
      setResultado(null);
      barcodeRef.current?.focus();
    }, 2500);
    return () => clearTimeout(t);
  }, [resultado]);

  const cargarHistorial = () =>
    getVentas().then((r) => setHistorial(r.data.slice(0, 8))).catch(() => {});

  useEffect(() => {
    barcodeRef.current?.focus();
    getDeudores().then((r) => setDeudores(r.data)).catch(() => {});
    cargarHistorial();
  }, []);

  const escanear = async () => {
    const codigo = barcode.trim();
    if (!codigo) return;
    setBarcode("");
    setError("");
    try {
      const { data } = await buscarPorBarcode(codigo);
      setCarrito((prev) => {
        const existente = prev.find((i) => i.id === data.id);
        if (existente) return prev.map((i) => i.id === data.id ? { ...i, cantidad: i.cantidad + 1 } : i);
        return [...prev, { ...data, cantidad: 1 }];
      });
    } catch {
      setError(`Código "${codigo}" no encontrado`);
    } finally {
      barcodeRef.current?.focus();
    }
  };

  const cambiarCantidad = (id, delta) =>
    setCarrito((prev) => prev.map((i) => i.id === id ? { ...i, cantidad: i.cantidad + delta } : i).filter((i) => i.cantidad > 0));

  const quitarItem = (id) => setCarrito((prev) => prev.filter((i) => i.id !== id));

  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const vuelto = metodo !== "fiado" && pagoCon ? parseFloat(pagoCon) - total : null;

  const cobrar = async () => {
    if (carrito.length === 0) return setError("El carrito está vacío");
    if (metodo !== "fiado" && (!pagoCon || parseFloat(pagoCon) < total)) return setError("Monto insuficiente");
    if (metodo === "fiado" && !deudorId) return setError("Seleccioná un deudor");
    setCargando(true);
    setError("");
    try {
      const { data } = await registrarVenta({
        items: carrito.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
        pago_con: metodo !== "fiado" ? parseFloat(pagoCon) : 0,
        metodo_pago: metodo,
        deudor_id: metodo === "fiado" ? parseInt(deudorId) : null,
      });
      setResultado({ ...data, total });
      setCarrito([]);
      setPagoCon("");
      setDeudorId("");
      setMetodo("efectivo");
      cargarHistorial();
    } catch (e) {
      setError(e.response?.data?.detail ?? "Error al registrar");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Popup de éxito */}
      {resultado && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 text-xl font-bold animate-bounce">
          ✅ Venta #{resultado.venta_id} — {$(resultado.total)}
          {resultado.vuelto > 0 && <span className="font-normal text-lg"> · Vuelto: {$(resultado.vuelto)}</span>}
          {resultado.metodo_pago === "fiado" && <span className="font-normal text-lg"> · Fiado</span>}
        </div>
      )}

      <div className="flex gap-6">
        {/* Columna izquierda: scanner + carrito */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-3xl font-black text-slate-800">Punto de Venta</h2>

          <div className="bg-white rounded-xl border-2 border-slate-300 p-5">
            <label className="block text-lg font-bold text-slate-600 mb-2">📷 Código de barras</label>
            <div className="flex gap-3">
              <input
                ref={barcodeRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && escanear()}
                placeholder="Escaneá o escribí el código..."
                className="flex-1 border-2 border-slate-300 rounded-lg px-4 py-3 text-2xl font-mono focus:border-blue-500 focus:outline-none"
                autoComplete="off"
              />
              <button onClick={escanear} className="bg-slate-700 text-white px-6 py-3 rounded-lg text-xl font-bold hover:bg-slate-800">
                Buscar
              </button>
            </div>
            {error && <p className="text-red-500 text-lg font-semibold mt-2">{error}</p>}
          </div>

          <div className="bg-white rounded-xl border-2 border-slate-200 flex-1 overflow-auto">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-700">Carrito</h3>
            </div>
            {carrito.length === 0 ? (
              <p className="text-center text-slate-400 text-xl py-12">Sin productos</p>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Producto</th>
                    <th className="px-5 py-3 text-center">Cant.</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <p className="text-xl font-semibold text-slate-800">{item.nombre}</p>
                        <p className="text-base text-slate-500">{$(item.precio)} c/u</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => cambiarCantidad(item.id, -1)} className="w-9 h-9 rounded-full bg-slate-100 text-xl font-bold hover:bg-slate-200">−</button>
                          <span className="text-2xl font-bold w-8 text-center">{item.cantidad}</span>
                          <button onClick={() => cambiarCantidad(item.id, 1)} className="w-9 h-9 rounded-full bg-slate-100 text-xl font-bold hover:bg-slate-200">+</button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-2xl font-bold text-slate-800">{$(item.precio * item.cantidad)}</td>
                      <td className="px-3 py-4">
                        <button onClick={() => quitarItem(item.id)} className="text-red-400 hover:text-red-600 text-xl">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Columna derecha: pago */}
        <div className="w-80 flex flex-col gap-4">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-5 flex flex-col gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-lg text-slate-500 font-medium">TOTAL</p>
              <p className="text-5xl font-black text-slate-800">{$(total)}</p>
              <p className="text-base text-slate-400 mt-1">{carrito.length} producto{carrito.length !== 1 ? "s" : ""}</p>
            </div>

            <div>
              <p className="text-base font-bold text-slate-600 mb-2">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {["efectivo", "débito", "fiado"].map((m) => (
                  <button key={m} onClick={() => setMetodo(m)}
                    className={`py-3 rounded-lg text-base font-bold capitalize border-2 transition-colors ${
                      metodo === m
                        ? m === "fiado" ? "bg-orange-100 border-orange-400 text-orange-700" : "bg-blue-100 border-blue-400 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >{m}</button>
                ))}
              </div>
            </div>

            {metodo === "fiado" ? (
              <div>
                <p className="text-base font-bold text-slate-600 mb-2">Deudor</p>
                <select value={deudorId} onChange={(e) => setDeudorId(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-lg px-3 py-3 text-xl focus:outline-none focus:border-orange-400">
                  <option value="">Seleccioná...</option>
                  {deudores.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <p className="text-base font-bold text-slate-600 mb-2">Pago con</p>
                <input type="number" value={pagoCon} onChange={(e) => setPagoCon(e.target.value)}
                  placeholder="$0"
                  className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 text-3xl font-bold focus:outline-none focus:border-blue-400" />
                {vuelto !== null && vuelto >= 0 && (
                  <div className="mt-3 bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-base text-emerald-600">Vuelto</p>
                    <p className="text-3xl font-black text-emerald-700">{$(vuelto)}</p>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-500 text-base font-semibold text-center">{error}</p>}

            <button onClick={cobrar} disabled={carrito.length === 0 || cargando}
              className="w-full bg-emerald-600 text-white py-5 rounded-xl text-2xl font-black hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
              {cargando ? "..." : "COBRAR"}
            </button>
          </div>
        </div>
      </div>

      {/* Historial de últimas ventas */}
      <div className="bg-white rounded-xl border-2 border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-700">Últimas ventas</h3>
        </div>
        {historial.length === 0 ? (
          <p className="text-center text-slate-400 py-6">Sin ventas registradas</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Venta</th>
                <th className="px-5 py-3 text-left">Fecha</th>
                <th className="px-5 py-3 text-left">Método</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((v) => (
                <>
                  <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-bold text-slate-700">#{v.id}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(v.fecha_hora).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3 capitalize">{v.metodo_pago}</td>
                    <td className="px-5 py-3 text-right font-bold text-lg">{$(v.total)}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setDetalleAbierto(detalleAbierto === v.id ? null : v.id)}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        {detalleAbierto === v.id ? "Ocultar" : "Ver detalle"}
                      </button>
                    </td>
                  </tr>
                  {detalleAbierto === v.id && (
                    <tr key={`det-${v.id}`} className="bg-slate-50">
                      <td colSpan={5} className="px-8 py-3">
                        <ul className="space-y-1">
                          {v.detalles.map((d, i) => (
                            <li key={i} className="flex justify-between text-sm text-slate-600">
                              <span>{d.nombre_producto} × {d.cantidad}</span>
                              <span className="font-medium">{$(d.precio_unitario * d.cantidad)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
