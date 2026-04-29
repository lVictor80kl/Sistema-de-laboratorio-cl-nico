import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Package, Plus, Search, Edit, Trash2, X, AlertTriangle,
    TrendingUp, TrendingDown, FlaskConical, Save
} from 'lucide-react';

const fmtUsd = (val) =>
    val != null ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-';

export default function Inventario() {
    const [categorias, setCategorias] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [bajoStock, setBajoStock] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal
    const [modalInsumo, setModalInsumo] = useState(false);
    const [modalCategoria, setModalCategoria] = useState(false);
    const [editando, setEditando] = useState(null);

    // Form insumo
    const [formInsumo, setFormInsumo] = useState({
        categoria_id: '',
        nombre: '',
        descripcion: '',
        unidad_medida: 'mL',
        precio_unitario: '',
        stock_actual: '',
        stock_minimo: ''
    });

    // Form categoría
    const [formCategoria, setFormCategoria] = useState({ nombre: '', descripcion: '' });

    // Filtros
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [catsRes, insRes, stockRes] = await Promise.all([
                api.get('/api/inventario/categorias'),
                api.get('/api/inventario/insumos'),
                api.get('/api/inventario/insumos/bajo-stock')
            ]);
            setCategorias(catsRes.data);
            setInsumos(insRes.data);
            setBajoStock(stockRes.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Categorías ──────────────────────────────────────
    const handleCrearCategoria = async () => {
        if (!formCategoria.nombre.trim()) return;
        try {
            await api.post('/api/inventario/categorias', formCategoria);
            setFormCategoria({ nombre: '', descripcion: '' });
            setModalCategoria(false);
            fetchData();
        } catch (error) {
            alert('Error al crear categoría');
        }
    };

    const handleEliminarCategoria = async (id) => {
        if (!confirm('¿Eliminar esta categoría?')) return;
        try {
            await api.delete(`/api/inventario/categorias/${id}`);
            fetchData();
        } catch (error) {
            alert('Error al eliminar categoría');
        }
    };

    // ── Insumos ────────────────────────────────────────
    const abrirModalInsumo = (insumo = null) => {
        if (insumo) {
            setEditando(insumo);
            setFormInsumo({
                categoria_id: insumo.categoria_id,
                nombre: insumo.nombre,
                descripcion: insumo.descripcion || '',
                unidad_medida: insumo.unidad_medida,
                precio_unitario: insumo.precio_unitario,
                stock_actual: insumo.stock_actual,
                stock_minimo: insumo.stock_minimo
            });
        } else {
            setEditando(null);
            setFormInsumo({
                categoria_id: categorias[0]?.id || '',
                nombre: '',
                descripcion: '',
                unidad_medida: 'mL',
                precio_unitario: '',
                stock_actual: '',
                stock_minimo: ''
            });
        }
        setModalInsumo(true);
    };

    const handleGuardarInsumo = async () => {
        const payload = {
            ...formInsumo,
            precio_unitario: parseFloat(formInsumo.precio_unitario) || 0,
            stock_actual: parseFloat(formInsumo.stock_actual) || 0,
            stock_minimo: parseFloat(formInsumo.stock_minimo) || 0
        };

        try {
            if (editando) {
                await api.patch(`/api/inventario/insumos/${editando.id}`, payload);
            } else {
                await api.post('/api/inventario/insumos', payload);
            }
            setModalInsumo(false);
            fetchData();
        } catch (error) {
            alert('Error al guardar insumo');
        }
    };

    const handleEliminarInsumo = async (id) => {
        if (!confirm('¿Eliminar este insumo?')) return;
        try {
            await api.delete(`/api/inventario/insumos/${id}`);
            fetchData();
        } catch (error) {
            alert('Error al eliminar insumo');
        }
    };

    const handleAjusteStock = async (insumo, tipo) => {
        const cantidad = parseFloat(prompt(`Cantidad a ${tipo === 'ENTRADA' ? 'agregar' : 'retirar'}:`));
        if (!cantidad || cantidad <= 0) return;

        try {
            await api.post('/api/inventario/movimientos', {
                insumo_id: insumo.id,
                tipo: tipo,
                cantidad: cantidad,
                fecha: new Date().toISOString().split('T')[0],
                notas: `Ajuste manual de stock`
            });
            fetchData();
        } catch (error) {
            alert('Error al ajustar stock: ' + (error.response?.data?.detail || 'Stock insuficiente'));
        }
    };

    // ── Filtros ────────────────────────────────────────
    const insumosFiltrados = insumos.filter(i => {
        const matchCategoria = !filtroCategoria || i.categoria_id === parseInt(filtroCategoria);
        const matchBusqueda = !busqueda || 
            i.nombre.toLowerCase().includes(busqueda.toLowerCase());
        return matchCategoria && matchBusqueda;
    });

    const getCategoriaNombre = (id) => {
        const cat = categorias.find(c => c.id === id);
        return cat?.nombre || '-';
    };

    return (
        <div className="animate-fade-in p-6 space-y-6">
            {/* ── Encabezado ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-xl">
                        <Package className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
                        <p className="text-sm text-gray-500">Reactivos, suplementos y materiales</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setModalCategoria(true)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        + Categoría
                    </button>
                    <button
                        onClick={() => abrirModalInsumo()}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold"
                    >
                        + Insumo
                    </button>
                </div>
            </div>

            {/* ── Alerta bajo stock ── */}
            {bajoStock.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <div>
                        <p className="font-semibold text-amber-800">{bajoStock.length} insumo(s) bajo stock</p>
                        <p className="text-sm text-amber-600">
                            {bajoStock.map(i => i.nombre).join(', ')}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Resumen stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Insumos</p>
                    <p className="text-2xl font-bold text-gray-900">{insumos.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Categorías</p>
                    <p className="text-2xl font-bold text-gray-900">{categorias.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Bajo Stock</p>
                    <p className={`text-2xl font-bold ${bajoStock.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {bajoStock.length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Valor Inventario</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {fmtUsd(insumos.reduce((sum, i) => sum + (i.stock_actual * i.precio_unitario), 0))}
                    </p>
                </div>
            </div>

            {/* ── Tabla de Insumos ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar insumo..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                        />
                    </div>
                    <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Insumo</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio Unit.</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor Total</th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-400">Cargando...</td></tr>
                            ) : insumosFiltrados.length === 0 ? (
                                <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-400">No hay insumos registrados</td></tr>
                            ) : (
                                insumosFiltrados.map((insumo) => {
                                    const bajoStockNivel = insumo.stock_actual <= insumo.stock_minimo;
                                    const valorTotal = insumo.stock_actual * insumo.precio_unitario;
                                    return (
                                        <tr key={insumo.id} className={`hover:bg-gray-50 ${bajoStockNivel ? 'bg-amber-50/50' : ''}`}>
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{insumo.nombre}</p>
                                                    <p className="text-xs text-gray-400">{insumo.descripcion || '-'}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {getCategoriaNombre(insumo.categoria_id)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`text-sm font-medium ${bajoStockNivel ? 'text-amber-600' : 'text-gray-900'}`}>
                                                    {insumo.stock_actual} {insumo.unidad_medida}
                                                </span>
                                                {bajoStockNivel && (
                                                    <span className="ml-2 text-amber-500">
                                                        <AlertTriangle className="h-4 w-4 inline" />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right text-sm text-gray-600">
                                                {fmtUsd(insumo.precio_unitario)}/{insumo.unidad_medida}
                                            </td>
                                            <td className="px-5 py-4 text-right text-sm font-medium text-gray-900">
                                                {fmtUsd(valorTotal)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleAjusteStock(insumo, 'ENTRADA')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                        title="Agregar stock"
                                                    >
                                                        <TrendingUp className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAjusteStock(insumo, 'SALIDA')}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Retirar stock"
                                                    >
                                                        <TrendingDown className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => abrirModalInsumo(insumo)}
                                                        className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminarInsumo(insumo.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal Categoría ── */}
            {modalCategoria && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalCategoria(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg">Nueva Categoría</h3>
                            <button onClick={() => setModalCategoria(false)} className="text-white/80">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Nombre</label>
                                <input
                                    type="text"
                                    value={formCategoria.nombre}
                                    onChange={(e) => setFormCategoria({...formCategoria, nombre: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                    placeholder="Ej: Reactivos"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Descripción</label>
                                <input
                                    type="text"
                                    value={formCategoria.descripcion}
                                    onChange={(e) => setFormCategoria({...formCategoria, descripcion: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                    placeholder="Descripción opcional"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setModalCategoria(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCrearCategoria}
                                    className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700"
                                >
                                    Crear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Insumo ── */}
            {modalInsumo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalInsumo(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 animate-scale-in overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editando ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                            <button onClick={() => setModalInsumo(false)} className="text-white/80">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Categoría</label>
                                <select
                                    value={formInsumo.categoria_id}
                                    onChange={(e) => setFormInsumo({...formInsumo, categoria_id: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                >
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Nombre</label>
                                <input
                                    type="text"
                                    value={formInsumo.nombre}
                                    onChange={(e) => setFormInsumo({...formInsumo, nombre: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                    placeholder="Nombre del insumo"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Descripción</label>
                                <input
                                    type="text"
                                    value={formInsumo.descripcion}
                                    onChange={(e) => setFormInsumo({...formInsumo, descripcion: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                    placeholder="Descripción opcional"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Unidad de Medida</label>
                                    <select
                                        value={formInsumo.unidad_medida}
                                        onChange={(e) => setFormInsumo({...formInsumo, unidad_medida: e.target.value})}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                    >
                                        <option value="mL">mL</option>
                                        <option value="L">L</option>
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        <option value="unidades">unidades</option>
                                        <option value="tiras">tiras</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Precio Unit. (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formInsumo.precio_unitario}
                                        onChange={(e) => setFormInsumo({...formInsumo, precio_unitario: e.target.value})}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Stock Actual</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formInsumo.stock_actual}
                                        onChange={(e) => setFormInsumo({...formInsumo, stock_actual: e.target.value})}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Stock Mínimo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formInsumo.stock_minimo}
                                        onChange={(e) => setFormInsumo({...formInsumo, stock_minimo: e.target.value})}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setModalInsumo(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleGuardarInsumo}
                                    className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700"
                                >
                                    <Save className="h-4 w-4 inline mr-1" />
                                    {editando ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
}
