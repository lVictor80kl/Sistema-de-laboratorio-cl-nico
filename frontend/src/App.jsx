import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Pruebas from './pages/Pruebas';
import Ordenes from './pages/Ordenes';
import Facturacion from './pages/Facturacion';
import Reporte from './pages/Reporte';
import Inventario from './pages/Inventario';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pacientes" element={<Pacientes />} />
                    <Route path="/pruebas" element={<Pruebas />} />
                    <Route path="/ordenes" element={<Ordenes />} />
                    <Route path="/facturacion" element={<Facturacion />} />
                    <Route path="/reporte" element={<Reporte />} />
                    <Route path="/inventario" element={<Inventario />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;


