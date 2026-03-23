import { useEffect, useState } from "react";
import { getProductos, crearProducto, actualizarProducto, eliminarProducto } from "../api";

const VACIO = { nombre: "", precio: "", stock: "", categoria: "", codigo_barras: "" };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState("");

  const cargar = () => getProductos().then((r) => setProductos(r.data));
  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setEditando(null); setForm(VACIO); setError(""); setModal(true); };
  const abrirEditar = (p) => {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      categoria: p.categoria ?? "",
      codigo_barras: p.codigo_barras ?? "",
    });
    setError("");
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.precio || form.stock === "") return setError("Completá nombre, precio y stock");
    const payload = {
      nombre: form.nombre,
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock),
      categoria: form.categoria || null,
      codigo_barras: form.codigo_barras || null,
    };
    try {
      editando ? await actualizarProducto(editando.id, payload) : await crearProducto(payload);
      setModal(false);
      cargar();
    } catch (e) {
      setError(e.response?.data?.detail ?? "Error al guardar");
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await eliminarProducto(id);
    cargar();
  };

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo_barras ?? "").includes(busqueda)
  );

  const $ = (n) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Productos</h2>
        <button onClick={abrirNuevo} className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-800">
          + Nuevo producto
        </button>
      </div>

      <div className="mb-4">
        <input
          className="border border-slate-300 rounded px-3 py-2 text-sm w-80"
          placeholder="Buscar por nombre o código de barras..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-5 py-3 text-left">Nombre</th>
              <th className="px-5 py-3 text-left">Cód. Barras</th>
              <th className="px-5 py-3 text-left">Categoría</th>
              <th className="px-5 py-3 text-right">Precio</th>
              <th className="px-5 py-3 text-right">Stock</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Sin productos</td></tr>
            )}
            {filtrados.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{p.nombre}</td>
                <td className="px-5 py-3 font-mono text-slate-500 text-xs">{p.codigo_barras ?? "—"}</td>
                <td className="px-5 py-3 text-slate-500">{p.categoria ?? "—"}</td>
                <td className="px-5 py-3 text-right">{$(p.precio)}</td>
                <td className="px-5 py-3 text-right">
                  <span className={p.stock < 10 ? "text-red-500 font-semibold" : ""}>{p.stock} {p.stock < 10 && "⚠️"}</span>
                </td>
                <td className="px-5 py-3 text-right space-x-2">
                  <button onClick={() => abrirEditar(p)} className="text-blue-600 hover:underline text-xs">Editar</button>
                  <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">{editando ? "Editar producto" : "Nuevo producto"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Código de Barras</label>
                <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono" placeholder="Ej: 7790001000010" value={form.codigo_barras} onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Precio *</label>
                  <input type="number" className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Stock *</label>
                  <input type="number" className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Categoría</label>
                <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ej: Lácteos, Limpieza..." />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
              <button onClick={guardar} className="px-4 py-2 text-sm bg-slate-700 text-white rounded hover:bg-slate-800">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
