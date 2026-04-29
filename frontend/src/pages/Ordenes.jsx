import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    PlusCircle, Search, X, FileText, Trash2, Eye,
    ChevronRight, User, FlaskConical, CheckCircle, Edit3
} from 'lucide-react';
import CargarResultadosModal from '../components/ordenes/CargarResultadosModal';

const ESTADO_BADGE = {
    PENDIENTE: 'bg-amber-100 text-amber-700',
    PAGADO: 'bg-green-100 text-green-700'
};

export default function Ordenes() {
    const [ordenes, setOrdenes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal wizard
    const [modalAbierto, setModalAbierto] = useState(false);
    const [pasoActual, setPasoActual] = useState(0);

    // Paso 1 - Paciente
    const [pacientes, setPacientes] = useState([]);
    const [searchPaciente, setSearchPaciente] = useState('');
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
    const [fechaOrden, setFechaOrden] = useState(new Date().toISOString().split('T')[0]);

    // Paso 2 - Pruebas
    const [pruebas, setPruebas] = useState([]);
    const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState([]);
    const [searchPruebas, setSearchPruebas] = useState('');

    // Modal ver orden
    const [ordenViendo, setOrdenViendo] = useState(null);
    const [detalleOrden, setDetalleOrden] = useState(null);

    // Confirmar eliminar
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // Cargar resultados
    const [ordenCargandoResultados, setOrdenCargandoResultados] = useState(null);

    useEffect(() => {
        fetchOrdenes();
    }, []);

    // ── Fetch ──────────────────────────────────────────
    const fetchOrdenes = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/api/ordenes/');
            const conPaciente = await Promise.all(
                res.data.map(async (orden) => {
                    const pac = await api.get(`/api/pacientes/${orden.paciente_id}`);
                    return { ...orden, paciente: pac.data };
                })
            );
            setOrdenes(conPaciente);
        } catch (error) {
            console.error('Error fetching ordenes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPacientes = async (buscar = '') => {
        const res = await api.get(`/api/pacientes/?buscar=${buscar}`);
        setPacientes(res.data);
    };

    const fetchPruebas = async () => {
        const res = await api.get('/api/pruebas/');
        setPruebas(res.data);
    };

    // ── Wizard ─────────────────────────────────────────
    const abrirModal = () => {
        setPasoActual(0);
        setPacienteSeleccionado(null);
        setSearchPaciente('');
        setFechaOrden(new Date().toISOString().split('T')[0]);
        setPruebasSeleccionadas([]);
        fetchPacientes();
        fetchPruebas();
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
    };

    const siguientePaso = () => {
        if (pasoActual === 0 && !pacienteSeleccionado) return alert('Selecciona un paciente');
        if (pasoActual === 1 && pruebasSeleccionadas.length === 0) return alert('Selecciona al menos una prueba');
        setPasoActual(prev => prev + 1);
    };

    const pasoAnterior = () => setPasoActual(prev => prev - 1);

    // ── Paso 2: toggle prueba ──────────────────────────
    const togglePrueba = (prueba) => {
        const yaSeleccionada = pruebasSeleccionadas.find(p => p.id === prueba.id);
        if (yaSeleccionada) {
            setPruebasSeleccionadas(prev => prev.filter(p => p.id !== prueba.id));
        } else {
            setPruebasSeleccionadas(prev => [...prev, prueba]);
        }
    };

    // ── Guardar orden completa ─────────────────────────
    const handleGuardar = async () => {
        try {
            // Calcular monto USD sumando los precios de las pruebas
            const montoUsd = pruebasSeleccionadas.reduce((sum, p) => sum + (p.precio_usd || 0), 0);
            
            // Obtener tasa BCV para calcular monto_bs
            let montoBs = null;
            try {
                const tasaRes = await api.get('/api/facturacion/tasa');
                if (tasaRes.data?.tasa) {
                    montoBs = montoUsd * tasaRes.data.tasa;
                }
            } catch (e) {
                console.log('No se pudo obtener la tasa BCV');
            }

            const payload = {
                paciente_id: pacienteSeleccionado.id,
                fecha: fechaOrden,
                estado_pago: 'Pendiente',
                monto_usd: montoUsd,
                monto_bs: montoBs
            };
            
            const ordenRes = await api.post('/api/ordenes/', payload);

            // Inicializar Resultados de la orden
            const allParamsPost = [];
            for (const prueba of pruebasSeleccionadas) {
                const paramRes = await api.get(`/api/pruebas/${prueba.id}/parametros`);
                paramRes.data.forEach(param => {
                    allParamsPost.push({
                        orden_id: ordenRes.data.id,
                        parametro_id: param.id,
                        valor: "", // Espacio reservado para el bioanalista
                        marcado_anormal: false
                    });
                });
            }

            // Inserción en lote si hay parámetros
            if (allParamsPost.length > 0) {
                await api.post(`/api/ordenes/${ordenRes.data.id}/resultados/lote`, allParamsPost);
            }

            cerrarModal();
            fetchOrdenes();
            alert(`Orden #${ordenRes.data.id} creada exitosamente con todas sus pruebas asignadas.`);
        } catch (error) {
            console.error('Error completo:', error);
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'object' ? JSON.stringify(detail) : (detail || 'Error al guardar la orden');
            alert(message);
        }
    };

    // ── Ver detalle orden ──────────────────────────────
    const verOrden = async (orden) => {
        try {
            const res = await api.get(`/api/ordenes/${orden.id}`);
            setDetalleOrden({ ...res.data, paciente: orden.paciente });
            setOrdenViendo(orden);
        } catch (error) {
            console.error(error);
        }
    };

    // ── Cambiar estado pago ────────────────────────────
    const togglePago = async (orden) => {
        const nuevoEstado = orden.estado_pago === 'Pendiente' ? 'Pagado' : 'Pendiente';
        try {
            await api.patch(`/api/ordenes/${orden.id}`, { estado_pago: nuevoEstado });
            fetchOrdenes();
        } catch (error) {
            alert('Error al actualizar el estado de pago');
        }
    };

    // ── Eliminar orden ─────────────────────────────────
    const handleDelete = async () => {
        try {
            await api.delete(`/api/ordenes/${confirmDeleteId}`);
            setConfirmDeleteId(null);
            fetchOrdenes();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error al eliminar la orden');
        }
    };

    // ── Filtro ─────────────────────────────────────────
    const ordenesFiltradas = ordenes.filter(o =>
        o.paciente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.paciente?.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.paciente?.cedula?.includes(searchTerm)
    );

    const pruebasFiltradas = pruebas.filter(p => 
        p.nombre.toLowerCase().includes(searchPruebas.toLowerCase())
    );

    return (
        <div className="animate-fade-in p-6 space-y-6">
            {/* ── Encabezado ── */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Órdenes de Examen</h1>
                    <p className="text-sm text-gray-500 mt-1">Seleccione paciente y pruebas a realizar</p>
                </div>
                <button
                    onClick={abrirModal}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-5 rounded-xl inline-flex items-center transition-all shadow-md"
                >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Nueva Orden
                </button>
            </div>

            {/* ── Tabla ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                            placeholder="Buscar por paciente o cédula..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pruebas</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-5 py-12 text-center text-gray-400">Cargando...</td></tr>
                            ) : ordenesFiltradas.length === 0 ? (
                                <tr><td colSpan="5" className="px-5 py-12 text-center text-gray-400">No hay órdenes registradas</td></tr>
                            ) : (
                                ordenesFiltradas.map((orden) => (
                                    <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                                                    {orden.paciente?.nombre?.charAt(0)}{orden.paciente?.apellido?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{orden.paciente?.nombre} {orden.paciente?.apellido}</p>
                                                    <p className="text-xs text-gray-400">{orden.paciente?.cedula}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {new Date(orden.fecha + 'T00:00:00').toLocaleDateString('es-VE')}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-medium text-gray-600">
                                                {orden.num_examenes || '-'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => togglePago(orden)}
                                                className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-opacity hover:opacity-75 ${ESTADO_BADGE[orden.estado_pago]}`}
                                            >
                                                {orden.estado_pago === 'Pagado' ? 'Pagado' : 'Pendiente'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setOrdenCargandoResultados(orden)}
                                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Cargar Resultados"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => verOrden(orden)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver Orden"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(orden.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal Wizard Nueva Orden ── */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cerrarModal}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5" />
                                <h3 className="text-lg font-bold">Nueva Orden</h3>
                            </div>
                            <button onClick={cerrarModal} className="text-white/80 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Progress */}
                        <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 border-b border-gray-100">
                            {['Paciente', 'Pruebas'].map((paso, i) => (
                                <div key={paso} className="flex items-center">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                        i < pasoActual ? 'bg-teal-600 text-white' : 
                                        i === pasoActual ? 'bg-white text-teal-600 border-2 border-teal-600' : 
                                        'bg-gray-200 text-gray-500'
                                    }`}>
                                        {i < pasoActual ? <CheckCircle className="h-4 w-4" /> : i + 1}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium ${i === pasoActual ? 'text-gray-900' : 'text-gray-400'}`}>{paso}</span>
                                    {i < 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />}
                                </div>
                            ))}
                        </div>

                        {/* Contenido */}
                        <div className="p-5 max-h-[50vh] overflow-y-auto">
                            {/* Paso 0: Paciente */}
                            {pasoActual === 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Fecha del examen</label>
                                        <input
                                            type="date"
                                            value={fechaOrden}
                                            onChange={(e) => setFechaOrden(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Buscar paciente</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                                placeholder="Nombre, apellido o cédula..."
                                                value={searchPaciente}
                                                onChange={(e) => {
                                                    setSearchPaciente(e.target.value);
                                                    fetchPacientes(e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-52 overflow-y-auto">
                                        {pacientes.length === 0 ? (
                                            <p className="text-center py-4 text-sm text-gray-400">No se encontraron pacientes</p>
                                        ) : (
                                            pacientes.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setPacienteSeleccionado(p)}
                                                    className={`w-full flex items-center p-3 rounded-xl text-left transition-all ${
                                                        pacienteSeleccionado?.id === p.id 
                                                            ? 'bg-teal-50 border-2 border-teal-500' 
                                                            : 'border border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm mr-3">
                                                        {p.nombre.charAt(0)}{p.apellido.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{p.nombre} {p.apellido}</p>
                                                        <p className="text-xs text-gray-400">{p.cedula} • {p.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                                                    </div>
                                                    {pacienteSeleccionado?.id === p.id && (
                                                        <CheckCircle className="h-5 w-5 text-teal-600" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Paso 1: Pruebas */}
                            {pasoActual === 1 && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                            placeholder="Buscar prueba..."
                                            value={searchPruebas}
                                            onChange={(e) => setSearchPruebas(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2 max-h-72 overflow-y-auto">
                                        {pruebasFiltradas.map((prueba) => {
                                            const seleccionada = pruebasSeleccionadas.find(p => p.id === prueba.id);
                                            return (
                                                <button
                                                    key={prueba.id}
                                                    onClick={() => togglePrueba(prueba)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all ${
                                                        seleccionada 
                                                            ? 'bg-teal-50 border-2 border-teal-500' 
                                                            : 'border border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${seleccionada ? 'bg-teal-600' : 'bg-gray-100'}`}>
                                                            <FlaskConical className={`h-5 w-5 ${seleccionada ? 'text-white' : 'text-gray-400'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{prueba.nombre}</p>
                                                            <p className="text-xs text-gray-400">${prueba.precio_usd?.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    {seleccionada && <CheckCircle className="h-5 w-5 text-teal-600" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 flex justify-between">
                            <button 
                                onClick={pasoAnterior}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    pasoActual === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                disabled={pasoActual === 0}
                            >
                                Atrás
                            </button>
                            <button 
                                onClick={pasoActual === 1 ? handleGuardar : siguientePaso}
                                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
                            >
                                {pasoActual === 1 ? 'Crear Orden' : 'Siguiente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Ver Orden ── */}
            {ordenViendo && detalleOrden && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOrdenViendo(null)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5" />
                                <h3 className="font-bold">Orden #{ordenViendo.id}</h3>
                            </div>
                            <button onClick={() => setOrdenViendo(null)} className="text-white/80">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <User className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{ordenViendo.paciente?.nombre} {ordenViendo.paciente?.apellido}</p>
                                    <p className="text-xs text-gray-400">{ordenViendo.paciente?.cedula}</p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p><strong>Fecha:</strong> {new Date(detalleOrden.fecha + 'T00:00:00').toLocaleDateString('es-VE')}</p>
                                <p className="mt-2">
                                    <strong>Estado:</strong>{' '}
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        detalleOrden.estado_pago === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {detalleOrden.estado_pago === 'Pagado' ? 'Pagado' : 'Pendiente'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirmar eliminar ── */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar orden?</h3>
                        <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ordenCargandoResultados && (
                <CargarResultadosModal 
                    ordenId={ordenCargandoResultados.id} 
                    onClose={() => setOrdenCargandoResultados(null)}
                    onComplete={() => {
                        setOrdenCargandoResultados(null);
                        fetchOrdenes();
                    }}
                />
            )}

            <style>{`
                @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
}
