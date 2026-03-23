import { useState, useEffect, useRef } from "react";
import { buscarPorBarcode, registrarVenta, getDeudores } from "../api";

const $ = (n) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

export default function PuntoVenta() {
  const [barcode, setBarcode] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [pagoCon, setPagoCon] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [deudores, setDeudores] = useState([]);
  const [deudorId, setDeudorId] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const barcodeRef = useRef(null);

  useEffect(() => {
    barcodeRef.current?.focus();
    getDeudores().then((r) => setDeudores(r.data)).catch(() => {});
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
        if (existente) {
          return prev.map((i) =>
            i.id === data.id ? { ...i, cantidad: i.cantidad + 1 } : i
          );
        }
        return [...prev, { ...data, cantidad: 1 }];
      });
    } catch {
      setError(`Código "${codigo}" no encontrado`);
    } finally {
      barcodeRef.current?.focus();
    }
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    );
  };

  const quitarItem = (id) => setCarrito((prev) => prev.filter((i) => i.id !== id));

  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const vuelto = metodo !== "fiado" && pagoCon ? parseFloat(pagoCon) - total : null;

  const cobrar = async () => {
    if (carrito.length === 0) return setError("El carrito está vacío");
    if (metodo !== "fiado" && (!pagoCon || parseFloat(pagoCon) < total))
      return setError("Monto insuficiente");
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
    } catch (e) {
      setError(e.response?.data?.detail ?? "Error al registrar");
    } finally {
      setCargando(false);
      barcodeRef.current?.focus();
    }
  };

  const nueva = () => { setResultado(null); barcodeRef.current?.focus(); };

  return (
    <div className="flex gap-6 h-full">
      {/* Columna izquierda: scanner + carrito */}
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-3xl font-black text-slate-800">Punto de Venta</h2>

        {/* Barcode input */}
        <div className="bg-white rounded-xl border-2 border-slate-300 p-5">
          <label className="block text-lg font-bold text-slate-600 mb-2">
            📷 Escanear código de barras
          </label>
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
            <button
              onClick={escanear}
              className="bg-slate-700 text-white px-6 py-3 rounded-lg text-xl font-bold hover:bg-slate-800"
            >
              Buscar
            </button>
          </div>
          {error && <p className="text-red-500 text-lg font-semibold mt-2">{error}</p>}
        </div>

        {/* Carrito */}
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
                    <td className="px-5 py-4 text-right text-2xl font-bold text-slate-800">
                      {$(item.precio * item.cantidad)}
                    </td>
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

        {resultado ? (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-6 flex flex-col items-center gap-4">
            <div className="text-5xl">✅</div>
            <p className="text-2xl font-black text-emerald-700">Venta registrada</p>
            <p className="text-xl font-bold text-emerald-600">{$(resultado.total)}</p>
            {resultado.vuelto > 0 && (
              <p className="text-xl text-emerald-600">Vuelto: {$(resultado.vuelto)}</p>
            )}
            {resultado.metodo_pago === "fiado" && (
              <p className="text-lg text-orange-600 font-semibold">Cargado como fiado</p>
            )}
            <button onClick={nueva} className="w-full bg-emerald-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-emerald-700">
              Nueva venta
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-5 flex flex-col gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-lg text-slate-500 font-medium">TOTAL</p>
              <p className="text-5xl font-black text-slate-800">{$(total)}</p>
              <p className="text-base text-slate-400 mt-1">{carrito.length} producto{carrito.length !== 1 ? "s" : ""}</p>
            </div>

            {/* Método de pago */}
            <div>
              <p className="text-base font-bold text-slate-600 mb-2">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {["efectivo", "débito", "fiado"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetodo(m)}
                    className={`py-3 rounded-lg text-base font-bold capitalize border-2 transition-colors ${
                      metodo === m
                        ? m === "fiado"
                          ? "bg-orange-100 border-orange-400 text-orange-700"
                          : "bg-blue-100 border-blue-400 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {metodo === "fiado" ? (
              <div>
                <p className="text-base font-bold text-slate-600 mb-2">Deudor</p>
                <select
                  value={deudorId}
                  onChange={(e) => setDeudorId(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-lg px-3 py-3 text-xl focus:outline-none focus:border-orange-400"
                >
                  <option value="">Seleccioná...</option>
                  {deudores.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <p className="text-base font-bold text-slate-600 mb-2">Pago con</p>
                <input
                  type="number"
                  value={pagoCon}
                  onChange={(e) => setPagoCon(e.target.value)}
                  placeholder="$0"
                  className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 text-3xl font-bold focus:outline-none focus:border-blue-400"
                />
                {vuelto !== null && vuelto >= 0 && (
                  <div className="mt-3 bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-base text-emerald-600">Vuelto</p>
                    <p className="text-3xl font-black text-emerald-700">{$(vuelto)}</p>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-500 text-base font-semibold text-center">{error}</p>}

            <button
              onClick={cobrar}
              disabled={carrito.length === 0 || cargando}
              className="w-full bg-emerald-600 text-white py-5 rounded-xl text-2xl font-black hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cargando ? "..." : "COBRAR"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
