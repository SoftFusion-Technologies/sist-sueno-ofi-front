/*
 * Programador: Benjamin Orellana
 * Fecha Creación: 26 / 05 / 2025
 * Versión: 1.0
 *
 * Descripción:
 *  Este archivo (App.jsx) es el componente principal de la aplicación.
 *  Contiene la configuración de enrutamiento, carga de componentes asíncrona,
 *  y la lógica para mostrar un componente de carga durante la carga inicial.
 *  Además, incluye la estructura principal de la aplicación, como la barra de navegación,
 *  el pie de página y las diferentes rutas para las páginas de la aplicación.
 *
 * Tema: Configuración de la Aplicación Principal
 * Capa: Frontend
 * Contacto: benjamin.orellanaof@gmail.com || 3863531891
 */

import './App.css';
import {
  BrowserRouter as Router,
  Routes as Rutas,
  Route as Ruta
} from 'react-router-dom'; // IMPORTAMOS useLocation PARA OCULTAR COMPONENTES

import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import useLayoutVisibility from './Hooks/useLayoutVisibility';

// LOGIN
import LoginForm from './Components/login/LoginForm';
import AdminPage from './Pages/Dash/AdminPage';
import AdminPageStock from './Pages/Stock/AdminPageStock';
import LocalesGet from './Pages/MetodosGets/LocalesGet';
import TallesGet from './Pages/Stock/TallesGet';
import ProductosGet from './Pages/Stock/ProductosGet';
import StockGet from './Pages/Stock/StockGet';

import { Navigate } from 'react-router-dom';
import UsuariosGet from './Pages/MetodosGets/UsuariosGet';
import LugaresGet from './Pages/Stock/LugaresGet';
import EstadosGet from './Pages/Stock/Estados';
import CategoriasGet from './Pages/Stock/CategoriasGet';
import AdminPageVentas from './Pages/Ventas/AdminPageVentas';
import PuntoVenta from './Pages/Ventas/PuntoVenta';
import ConfiguracionPage from './Pages/Ventas/ConfiguracionPage';
import ClientesGet from './Pages/MetodosGets/ClientesGet';
import CajaPOS from './Pages/Ventas/CajaPos';
import MovimientosGlobal from './Pages/Ventas/MovimientosGlobal';
import VentasTimeline from './Pages/Ventas/VentasTimeline';
import EstadisticaVentasMes from './Pages/Ventas/EstadisticaVentasMes';
import DevolucionesPage from './Pages/Ventas/DevolucionesGet';
import HistorialCajasPorLocal from './Pages/Ventas/HistorialCajasPorLocal';
import DetalleCaja from './Pages/Ventas/DetalleCaja';
import AdminCajasAbiertas from './Pages/Ventas/AdminCajasAbiertas';
import AnaliticasCaja from './Pages/Ventas/AnaliticasCaja';
import AdminPageRecaptacion from './Pages/Recaptacion/AdminPageRecaptacion';
import CampanasGet from './Pages/Recaptacion/CampanasGet';
import ClientesInactivos from './Pages/Recaptacion/ClientesInactivos';
import AsignadosGet from './Pages/Recaptacion/AsignadosGet';
import EstadisticasRecaptacion from './Pages/Recaptacion/EstadisticasRecaptacion';
import AdminPageVendedores from './Pages/Vendedores/AdminPageVendedores';
import VendedoresGet from './Pages/Vendedores/VendedoresGet';
import VentasPorVendedor from './Pages/Vendedores/VentasPorVendedor';
import DashboardEstadisticasVendedores from './Pages/Vendedores/DashboardEstadisticasVendedores';
import CombosGet from './Pages/Stock/Combos/CombosGet';
import ComboEditarPermitidos from './Pages/Stock/Combos/ComboEditarPermitidos';

function AppContent() {
  const { hideLayoutFooter, hideLayoutNav } = useLayoutVisibility();

  return (
    <>
      <div className="w-full min-h-screen overflow-x-hidden bg-[#1f3636]">
        {/* {!hideLayoutNav && <NavBar />} */}
        <Rutas>
          {/* <Ruta path="/" element={<Home />} /> */}
          {/* componentes del staff y login INICIO */}
          <Ruta path="/login" element={<LoginForm />} />
          <Ruta
            path="/dashboard"
            element={
              <ProtectedRoute>
                {' '}
                <AdminPage />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/usuarios"
            element={
              <ProtectedRoute>
                {' '}
                <UsuariosGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/stock"
            element={
              <ProtectedRoute>
                {' '}
                <AdminPageStock />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/locales"
            element={
              <ProtectedRoute>
                {' '}
                <LocalesGet />{' '}
              </ProtectedRoute>
            }
          />
          {/* MODULO DENTRO DE STOCK INICIO BENJAMIN ORELLANA 22 06 25 */}
          <Ruta
            path="/dashboard/stock/talles"
            element={
              <ProtectedRoute>
                {' '}
                <TallesGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/stock/categorias"
            element={
              <ProtectedRoute>
                {' '}
                <CategoriasGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/stock/productos"
            element={
              <ProtectedRoute>
                {' '}
                <ProductosGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/stock/stock"
            element={
              <ProtectedRoute>
                {' '}
                <StockGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/stock/lugares"
            element={
              <ProtectedRoute>
                {' '}
                <LugaresGet />{' '}
              </ProtectedRoute>
            }
          />{' '}
          <Ruta
            path="/dashboard/stock/estados"
            element={
              <ProtectedRoute>
                {' '}
                <EstadosGet />{' '}
              </ProtectedRoute>
            }
          />{' '}
          <Ruta
            path="/dashboard/stock/combos"
            element={
              <ProtectedRoute>
                {' '}
                <CombosGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/stock/combos/:id/permitidos"
            element={
              <ProtectedRoute>
                <ComboEditarPermitidos />
              </ProtectedRoute>
            }
          />
          {/* MODULO DENTRO DE STOCK FINAL BENJAMIN ORELLANA 22 06 25 */}
          {/* MODULO DENTRO DE VENTAS INICIO BENJAMIN ORELLANA 22 06 25 */}
          <Ruta
            path="/dashboard/ventas"
            element={
              <ProtectedRoute>
                {' '}
                <AdminPageVentas />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/pos"
            element={
              <ProtectedRoute>
                {' '}
                <PuntoVenta />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/configuracion"
            element={
              <ProtectedRoute>
                {' '}
                <ConfiguracionPage />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/clientes"
            element={
              <ProtectedRoute>
                {' '}
                <ClientesGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/caja"
            element={
              <ProtectedRoute>
                {' '}
                <CajaPOS />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/cajas-abiertas"
            element={
              <ProtectedRoute>
                <AdminCajasAbiertas />
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/analiticas"
            element={
              <ProtectedRoute>
                <AnaliticasCaja />
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/movimientos"
            element={
              <ProtectedRoute>
                {' '}
                <MovimientosGlobal />{' '}
              </ProtectedRoute>
            }
          />{' '}
          <Ruta
            path="/dashboard/ventas/historial"
            element={
              <ProtectedRoute>
                {' '}
                <VentasTimeline />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/vendidos"
            element={
              <ProtectedRoute>
                {' '}
                <EstadisticaVentasMes />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/devoluciones"
            element={
              <ProtectedRoute>
                {' '}
                <DevolucionesPage />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/historico-movimientos"
            element={
              <ProtectedRoute>
                {' '}
                <HistorialCajasPorLocal />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/historico-movimientos/caja/:id"
            element={
              <ProtectedRoute>
                {' '}
                <DetalleCaja />{' '}
              </ProtectedRoute>
            }
          />
          {/* MODULO DENTRO DE VENTAS FINAL BENJAMIN ORELLANA 22 06 25 */}
          {/* MODULO DENTRO DE RECAPTACION INICIO BENJAMIN ORELLANA 28 07 25 */}
          <Ruta
            path="/dashboard/recaptacion"
            element={
              <ProtectedRoute>
                {' '}
                <AdminPageRecaptacion />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/recaptacion/campanas"
            element={
              <ProtectedRoute>
                {' '}
                <CampanasGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/recaptacion/clientes-inactivos"
            element={
              <ProtectedRoute>
                {' '}
                <ClientesInactivos />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/recaptacion/asignados"
            element={
              <ProtectedRoute>
                {' '}
                <AsignadosGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/recaptacion/estadisticas"
            element={
              <ProtectedRoute>
                {' '}
                <EstadisticasRecaptacion />{' '}
              </ProtectedRoute>
            }
          />
          {/* MODULO DENTRO DE RECAPTACION FINAL BENJAMIN ORELLANA 28 07 25 */}
          {/* MODULO DENTRO DE VENDEDORES INICIO BENJAMIN ORELLANA 01 08 25 */}
          <Ruta
            path="/dashboard/vendedores"
            element={
              <ProtectedRoute>
                {' '}
                <AdminPageVendedores />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/vendedores/listado"
            element={
              <ProtectedRoute>
                {' '}
                <VendedoresGet />{' '}
              </ProtectedRoute>
            }
          />{' '}
          <Ruta
            path="/dashboard/vendedores/masventas"
            element={
              <ProtectedRoute>
                {' '}
                <VentasPorVendedor />{' '}
              </ProtectedRoute>
            }
          />{' '}
          <Ruta
            path="/dashboard/vendedores/estadisticas"
            element={
              <ProtectedRoute>
                {' '}
                <DashboardEstadisticasVendedores />{' '}
              </ProtectedRoute>
            }
          />
          {/* MODULO DENTRO DE VENDEDORES FINAL BENJAMIN ORELLANA 01 08 25 */}
          {/* componentes del staff y login FINAL */}
          {/* <Ruta path="/*" element={<NotFound />} /> */}
          {/* 🔁 Redirección automática al login si se accede a "/" */}
          <Ruta path="/" element={<Navigate to="/login" replace />} />
          {/* 🔁 Ruta no encontrada */}
          <Ruta path="*" element={<Navigate to="/login" replace />} />
        </Rutas>
        {/* {!hideLayoutFooter && <Footer />} */}
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
