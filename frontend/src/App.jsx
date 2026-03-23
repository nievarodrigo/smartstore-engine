import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import PuntoVenta from "./pages/PuntoVenta";
import Fiados from "./pages/Fiados";
import Arqueo from "./pages/Arqueo";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/venta" element={<PuntoVenta />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/fiados" element={<Fiados />} />
        <Route path="/arqueo" element={<Arqueo />} />
      </Routes>
    </Layout>
  );
}
