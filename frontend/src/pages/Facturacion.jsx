import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../services/api';
import {
    TrendingUp, Clock, RefreshCw, DollarSign, Search,
    Filter, CheckCircle, Eye, Info, History, Trash2, X,
    AlertTriangle, FlaskConical, TrendingDown, Calculator,
    PieChart, Package
} from 'lucide-react';

const BADGE = {
    Pendiente: 'bg-yellow-100 text-yellow-800',
    Pagado:    'bg-green-100 text-green-800',
    Anulado:   'bg-red-100 text-red-800',
};

const fmtBs = (val) =>
    val != null ? val.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '-';
const fmtUsd = (val) =>
    val != null ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-';
const fmtFecha = (fechaStr) =>
    new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-ES');

export default function Facturacion() {
    // ── State ────────────────────────────────────────────────
    const [tasa, setTasa]               = useState(null);
    const [historial, setHistorial]     = useState([]);
    const [ordenes, setOrdenes]         = useState([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [tasaInput, setTasaInput]     = useState('');
    const [busqueda, setBusqueda]       = useState('');

    // Costos de inventario (por ahora fijo, después vendrá de BD)
    const [costoInventarioHoy, setCostoInventarioHoy] = useState(0);

    // Modales
    const [detalle, setDetalle]         = useState(null);
    const [deleteId, setDeleteId]       = useState(null);

    // Ref para evitar doble disparo del auto-update BCV
    const autoActualizado = useRef({ '09:00': false, '13:00': false });

    // ── Carga inicial ─────────────────────────────────────────
    const fetchTasa = useCallback(async () => {
        try {
            const res = await api.get('/api/facturacion/tasa');
            setTasa(res.data);
        } catch {
            setTasa(null);
        }
    }, []);

    const fetchHistorial = useCallback(async () => {
        try {
            const res = await api.get('/api/facturacion/tasa/historial?limit=5');
            setHistorial(res.data);
        } catch {
            setHistorial([]);
        }
    }, []);

    const fetchOrdenes = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/api/facturacion/ordenes?limit=50');
            setOrdenes(res.data);
        } catch {
            setOrdenes([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasa();
        fetchHistorial();
        fetchOrdenes();
    }, [fetchTasa, fetchHistorial, fetchOrdenes]);

    // ── Auto-update BCV a las 9:00 y 13:00 ───────────────────
    useEffect(() => {
        const intervalo = setInterval(() => {
            const ahora = new Date();
            const hh    = ahora.getHours();
            const mm    = ahora.getMinutes();
            const slot  = hh === 9 && mm === 0 ? '09:00' : hh === 13 && mm === 0 ? '13:00' : null;

            if (slot && !autoActualizado.current[slot]) {
                autoActualizado.current[slot] = true;
                // Lanzar actualización automática (notificación visual implícita al refrescar)
                api.post('/api/facturacion/tasa', {
                    tasa: tasa?.tasa ?? 0,
                    fecha: new Date().toISOString().split('T')[0],
                    slot
                }).then(() => {
                    fetchTasa();
                    fetchHistorial();
                });
            }

            // Resetear flags al cambiar de día
            const esMedianoche = hh === 0 && mm === 0;
            if (esMedianoche) autoActualizado.current = { '09:00': false, '13:00': false };
        }, 60000); // revisa cada minuto

        return () => clearInterval(intervalo);
    }, [tasa, fetchTasa, fetchHistorial]);

    // ── Acciones ──────────────────────────────────────────────
    const handleActualizarTasa = async () => {
        const valor = parseFloat(tasaInput.replace(',', '.'));
        if (isNaN(valor) || valor <= 0) return;
        try {
            await api.post('/api/facturacion/tasa', {
                tasa: valor,
                fecha: new Date().toISOString().split('T')[0],
                slot: 'manual'
            });
            setTasaInput('');
            await fetchTasa();
            await fetchHistorial();
        } catch (e) {
            alert(e.response?.data?.detail || 'Error al actualizar la tasa');
        }
    };

    const handleMarcarPagado = async (id) => {
        try {
            await api.patch(`/api/facturacion/ordenes/${id}/pagar`);
            fetchOrdenes();
        } catch (e) {
            alert(e.response?.data?.detail || 'Error al actualizar la orden');
        }
    };

    const handleEliminarOrden = async () => {
        try {
            await api.delete(`/api/ordenes/${deleteId}`);
            setDeleteId(null);
            fetchOrdenes();
        } catch (e) {
            alert(e.response?.data?.detail || 'Error al eliminar la orden');
        }
    };

    // ── Filtro ────────────────────────────────────────────────
    const pendientes = ordenes.filter(o => o.estado_pago === 'Pendiente').length;
    const ordenesFiltradas = ordenes.filter(o =>
        o.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        o.paciente_cedula.includes(busqueda) ||
        String(o.id).includes(busqueda)
    );

    const tasaActual = tasa?.tasa ?? null;

    // ── Cálculos de Ganancia del Día ─────────────────────────
    const hoy = new Date().toISOString().split('T')[0];
    const ordenesHoy = ordenes.filter(o => o.fecha === hoy);
    const ordenesPagadasHoy = ordenesHoy.filter(o => o.estado_pago === 'Pagado');

    // Ingresos brutos USD y Bs
    const ingresosUsdHoy = ordenesPagadasHoy.reduce((sum, o) => sum + (o.monto_usd || 0), 0);
    const ingresosBsHoy = ordenesPagadasHoy.reduce((sum, o) => sum + (o.monto_bs || 0), 0);

    // Costos (por ahora 0, después vendrá de inventario)
    const costosInventario = costoInventarioHoy;

    // Ganancia neta
    const gananciaNetaUsd = ingresosUsdHoy - costosInventario;
    const gananciaNetaBs = ingresosBsHoy - (costosInventario * tasaActual);

    // ── Render ────────────────────────────────────────────────
    return (
        <div className="animate-fade-in">

            {/* ── Encabezado ── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 text-teal-600 mb-1">
                        <DollarSign className="h-6 w-6" />
                        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Facturación / BCV</h2>
                    </div>
                    <p className="text-gray-500">Gestión de tasas oficiales y control de cobros de laboratorio.</p>
                </div>
                <div className="flex gap-4 flex-wrap">
                    <div className="bg-teal-600/10 border border-teal-600/20 p-4 rounded-xl min-w-[180px] flex items-center gap-4">
                        <div className="p-2 bg-teal-600/20 rounded-lg text-teal-600">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Tasa BCV Hoy</p>
                            <p className="text-xl font-bold text-gray-900">
                                {tasaActual != null ? `Bs. ${fmtBs(tasaActual)}` : '—'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-teal-600/10 border border-teal-600/20 p-4 rounded-xl min-w-[180px] flex items-center gap-4">
                        <div className="p-2 bg-teal-600/20 rounded-lg text-teal-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Órdenes Pendientes</p>
                            <p className="text-xl font-bold text-gray-900">{pendientes}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Sección de Ganancias del Día ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                            <Calculator className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Resumen del Día</h3>
                            <p className="text-xs text-gray-500">{new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                        {ordenesPagadasHoy.length} órdenes cobradas
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-5">
                    {/* Ingresos */}
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-semibold text-gray-500 uppercase">Ingresos USD</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{fmtUsd(ingresosUsdHoy)}</p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-semibold text-gray-500 uppercase">Ingresos Bs</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">Bs. {fmtBs(ingresosBsHoy)}</p>
                    </div>

                    {/* Costos */}
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="text-xs font-semibold text-gray-500 uppercase">Costos Reactivos</span>
                        </div>
                        <p className="text-2xl font-bold text-red-500">{fmtUsd(costosInventario)}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Inventario usado</p>
                    </div>

                    {/* Ganancia Neta */}
                    <div className={`text-center p-4 rounded-xl ${gananciaNetaUsd >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <PieChart className={`h-4 w-4 ${gananciaNetaUsd >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            <span className="text-xs font-semibold text-gray-500 uppercase">Ganancia Neta</span>
                        </div>
                        <p className={`text-2xl font-bold ${gananciaNetaUsd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gananciaNetaUsd >= 0 ? '+' : ''}{fmtUsd(gananciaNetaUsd)}
                        </p>
                        <p className={`text-[10px] mt-1 ${gananciaNetaBs >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Bs. {gananciaNetaBs >= 0 ? '+' : ''}{fmtBs(gananciaNetaBs)}
                        </p>
                    </div>
                </div>

                {/* Detalle de órdenes cobradas hoy */}
                {ordenesPagadasHoy.length > 0 && (
                    <div className="border-t border-gray-100 p-5">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Órdenes cobradas hoy
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-gray-500 uppercase">
                                        <th className="text-left py-2 px-3">Orden</th>
                                        <th className="text-left py-2 px-3">Paciente</th>
                                        <th className="text-right py-2 px-3">USD</th>
                                        <th className="text-right py-2 px-3">Bs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {ordenesPagadasHoy.map(o => (
                                        <tr key={o.id} className="hover:bg-gray-50">
                                            <td className="py-2 px-3 font-medium text-gray-900">#{o.id}</td>
                                            <td className="py-2 px-3 text-gray-600">{o.paciente_nombre}</td>
                                            <td className="py-2 px-3 text-right font-medium text-gray-900">{fmtUsd(o.monto_usd)}</td>
                                            <td className="py-2 px-3 text-right font-medium text-gray-900">Bs. {fmtBs(o.monto_bs)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {ordenesPagadasHoy.length === 0 && (
                    <div className="border-t border-gray-100 p-8 text-center text-gray-400">
                        <p className="text-sm">No hay órdenes cobradas el día de hoy</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Panel Tasa BCV ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                                <RefreshCw className="h-5 w-5 text-teal-600" />
                                Actualización de Tasa
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                        Tasa de Cambio Oficial (Bs.)
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="number" step="0.01" placeholder="Ej: 36.45"
                                            value={tasaInput}
                                            onChange={(e) => setTasaInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleActualizarTasa()}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleActualizarTasa}
                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-600/20 active:scale-[0.98]"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Actualizar Tasa
                                </button>
                                {tasa && (
                                    <div className="pt-4 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-500">
                                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        <span>
                                            Última actualización: {fmtFecha(tasa.fecha)}
                                            {tasa.slot && tasa.slot !== 'manual' ? ` (${tasa.slot})` : ' (manual)'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Historial */}
                        <div className="bg-gray-50/80 p-6 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 mb-4">
                                <History className="h-4 w-4 text-teal-600"/>
                                <span className="text-sm font-semibold text-gray-700">Historial Reciente</span>
                            </div>
                            {historial.length === 0 ? (
                                <p className="text-xs text-gray-400">Sin historial aún.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {historial.map((item) => (
                                        <li key={item.id} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">{fmtFecha(item.fecha)}</span>
                                            <span className="font-semibold text-gray-800">Bs. {fmtBs(item.tasa)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tabla de Órdenes ── */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Órdenes de Facturación</h3>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text" placeholder="Buscar paciente..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-gray-50"
                                    />
                                </div>
                                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                                    <Filter className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nº</th>
                                        <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Paciente</th>
                                        <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total USD</th>
                                        <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Bs.</th>
                                        <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">Cargando órdenes...</td></tr>
                                    ) : ordenesFiltradas.length === 0 ? (
                                        <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400 font-medium">No se encontraron órdenes.</td></tr>
                                    ) : ordenesFiltradas.map((orden) => {
                                        // Calcular Bs. desde USD en tiempo real si solo hay monto_usd
                                        const montoBs = orden.monto_bs ?? (orden.monto_usd && tasaActual ? orden.monto_usd * tasaActual : null);
                                        const estadoKey = orden.estado_pago === 'Pendiente' ? 'Pendiente' : orden.estado_pago === 'Pagado' ? 'Pagado' : 'Anulado';
                                        return (
                                            <tr key={orden.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                                                    ORD-{String(orden.id).padStart(4, '0')}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">{orden.paciente_nombre}</span>
                                                        <span className="text-xs text-gray-400">{orden.paciente_cedula}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-500">{fmtFecha(orden.fecha)}</td>
                                                <td className="px-5 py-4 text-sm font-semibold text-gray-700">{fmtUsd(orden.monto_usd)}</td>
                                                <td className="px-5 py-4 text-sm font-semibold text-gray-700">{fmtBs(montoBs)}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE[estadoKey]}`}>
                                                        {estadoKey}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {orden.estado_pago === 'Pendiente' && (
                                                            <button
                                                                onClick={() => handleMarcarPagado(orden.id)}
                                                                title="Marcar como Pagado"
                                                                className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setDetalle(orden)}
                                                            title="Ver Detalle"
                                                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteId(orden.id)}
                                                            title="Eliminar orden"
                                                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                {ordenesFiltradas.length} de {ordenes.length} órdenes
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal: Ver Detalle ── */}
            {detalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetalle(null)} />
                    <div className="relative bg-white max-w-md w-full rounded-xl shadow-2xl overflow-hidden border border-teal-600/10">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FlaskConical className="h-5 w-5" />
                                <div>
                                    <h3 className="font-bold text-lg leading-none">
                                        ORD-{String(detalle.id).padStart(4, '0')}
                                    </h3>
                                    <p className="text-white/75 text-xs mt-0.5">{detalle.paciente_nombre}</p>
                                </div>
                            </div>
                            <button onClick={() => setDetalle(null)} className="text-white/80 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Info básica */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">Paciente</p>
                                    <p className="font-semibold text-gray-800">{detalle.paciente_nombre}</p>
                                    <p className="text-gray-500 text-xs">{detalle.paciente_cedula}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">Fecha</p>
                                    <p className="font-semibold text-gray-800">{fmtFecha(detalle.fecha)}</p>
                                </div>
                            </div>

                            {/* Montos */}
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumen de Cobro</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Monto en USD</span>
                                        <span className="font-bold text-gray-900">{fmtUsd(detalle.monto_usd)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tasa BCV aplicada</span>
                                        <span className="font-medium text-gray-700">
                                            {tasaActual != null ? `Bs. ${fmtBs(tasaActual)}` : '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                                        <span className="font-semibold text-gray-700">Total en Bs.</span>
                                        <span className="font-bold text-teal-700 text-base">
                                            {fmtBs(
                                                detalle.monto_bs ??
                                                (detalle.monto_usd && tasaActual ? detalle.monto_usd * tasaActual : null)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Estado */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Estado de pago</span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${BADGE[detalle.estado_pago === 'Pendiente' ? 'Pendiente' : detalle.estado_pago === 'Pagado' ? 'Pagado' : 'Anulado']}`}>
                                    {detalle.estado_pago}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setDetalle(null)}
                                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Confirmar Eliminar ── */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Eliminar Orden</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            ¿Estás seguro? Esta acción eliminará la orden{' '}
                            <span className="font-semibold text-red-600">
                                ORD-{String(deleteId).padStart(4, '0')}
                            </span>{' '}
                            y todos sus resultados de forma permanente.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEliminarOrden}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all text-sm"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
