import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// ── Productos ─────────────────────────────────────────────
export const getProductos = () => api.get("/productos/");
export const buscarProductos = (termino) => api.get(`/productos/buscar?termino=${termino}`);
export const buscarPorBarcode = (codigo) => api.get(`/productos/barcode/${codigo}`);
export const getStockCritico = () => api.get("/productos/reporte-critico");
export const crearProducto = (data) => api.post("/productos/", data);
export const actualizarProducto = (id, data) => api.put(`/productos/${id}`, data);
export const eliminarProducto = (id) => api.delete(`/productos/${id}`);

// ── Ventas ────────────────────────────────────────────────
export const registrarVenta = (data) => api.post("/ventas/registrar", data);
export const getVentas = () => api.get("/ventas/");
export const getKpisHoy = () => api.get("/ventas/stats/hoy");
export const getGrafico = (inicio, fin) =>
  api.get(`/ventas/stats/grafico?inicio=${inicio}&fin=${fin}`);
export const getTopProducto = (inicio, fin) =>
  api.get(`/ventas/stats/top-producto?inicio=${inicio}&fin=${fin}`);
export const getTopProductos = (inicio, fin, limite = 8) =>
  api.get(`/ventas/stats/top-productos?inicio=${inicio}&fin=${fin}&limite=${limite}`);

// ── Fiados ────────────────────────────────────────────────
export const getDeudores = () => api.get("/fiados/deudores");
export const crearDeudor = (data) => api.post("/fiados/deudores", data);
export const agregarCargo = (id, data) => api.post(`/fiados/deudores/${id}/cargo`, data);
export const registrarPago = (id, data) => api.post(`/fiados/deudores/${id}/pago`, data);
export const getHistorialDeudor = (id) => api.get(`/fiados/deudores/${id}/historial`);

// ── Arqueo ────────────────────────────────────────────────
export const abrirCaja = (data) => api.post("/arqueo/abrir", data);
export const cerrarCaja = (data) => api.post("/arqueo/cerrar", data);
export const getArqueoHoy = () => api.get("/arqueo/hoy");
export const getHistorialArqueo = () => api.get("/arqueo/historial");
