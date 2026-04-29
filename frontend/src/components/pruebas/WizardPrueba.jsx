import { useState, useEffect } from 'react';
import { X, FlaskConical, TestTube, ChevronRight, Check } from 'lucide-react';
import api from '../../services/api';
import RangoReferenciaForm from './RangoReferenciaForm';

const FORM_PRUEBA_INICIAL = { nombre: '', tipo: 'Tabla', precio_usd: 0, descripcion: '', orden_visual: 0 };
const FORM_PARAMETRO_INICIAL = { nombre: '', unidad: '', categoria: '', orden_visual: 0 };

export default function WizardPrueba({ basePrueba = null, onClose, onComplete }) {
    const [step, setStep] = useState(basePrueba ? 2 : 1);
    const [prueba, setPrueba] = useState(basePrueba || FORM_PRUEBA_INICIAL);
    const [savedPrueba, setSavedPrueba] = useState(basePrueba);
    
    // Parámetros State
    const [parametros, setParametros] = useState([]);
    const [nuevoParam, setNuevoParam] = useState(FORM_PARAMETRO_INICIAL);
    const [isSavingPrueba, setIsSavingPrueba] = useState(false);

    useEffect(() => {
        if (savedPrueba?.id) {
            fetchParametros(savedPrueba.id);
        }
    }, [savedPrueba]);

    const fetchParametros = async (id) => {
        try {
            const res = await api.get(`/api/pruebas/${id}/parametros`);
            setParametros(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSavePrueba = async (e) => {
        e.preventDefault();
        setIsSavingPrueba(true);
        try {
            const payload = {
                ...prueba,
                precio_usd: parseFloat(prueba.precio_usd) || 0,
                orden_visual: parseInt(prueba.orden_visual) || 0
            };
            
            let res;
            if (savedPrueba?.id) {
                res = await api.put(`/api/pruebas/${savedPrueba.id}`, payload);
            } else {
                res = await api.post('/api/pruebas/', payload);
            }
            setSavedPrueba(res.data);
            setStep(2); // Avanzamos al paso de parámetros
        } catch (error) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'object' ? JSON.stringify(detail) : (detail || 'Error al guardar la prueba');
            alert(message);
        } finally {
            setIsSavingPrueba(false);
        }
    };

    const handleSaveParametro = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...nuevoParam, prueba_id: savedPrueba.id, orden_visual: parseInt(nuevoParam.orden_visual) || 0 };
            await api.post(`/api/pruebas/${savedPrueba.id}/parametros`, payload);
            setNuevoParam(FORM_PARAMETRO_INICIAL);
            fetchParametros(savedPrueba.id);
        } catch (error) {
            alert(error.response?.data?.detail || 'Error al guardar parámetro');
        }
    };

    const handleDeleteParametro = async (paramId) => {
        if (!window.confirm("¿Seguro que deseas eliminar este parámetro?")) return;
        try {
            await api.delete(`/api/pruebas/parametros/${paramId}`);
            fetchParametros(savedPrueba.id);
        } catch (error) {
            alert('Error eliminando parámetro');
        }
    };

    const handleDeleteRango = async (rangoId) => {
        try {
            await api.delete(`/api/pruebas/rangos/${rangoId}`);
            fetchParametros(savedPrueba.id);
        } catch (error) {
            alert('Error eliminando rango');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                
                {/* Header Navbar */}
                <div className="bg-gradient-to-r from-teal-700 to-teal-500 p-4 shrink-0 shadow-md">
                    <div className="flex justify-between items-center text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
                                <FlaskConical className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold tracking-tight">
                                    {savedPrueba ? `Gestor de Examen: ${savedPrueba.nombre}` : 'Registrar Nuevo Examen Médico'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 opacity-90 text-sm font-medium">
                                    <span className={`px-2 py-0.5 rounded-full ${step >= 1 ? 'bg-white text-teal-700' : 'bg-teal-800'}`}>Paso 1: Datos Base</span>
                                    <ChevronRight className="h-4 w-4" />
                                    <span className={`px-2 py-0.5 rounded-full ${step >= 2 ? 'bg-white text-teal-700' : 'bg-teal-800'}`}>Paso 2: Parámetros y Rangos</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {/* PASO 1: Datos de la Prueba */}
                    {step === 1 && (
                        <div className="max-w-xl mx-auto bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                            <form onSubmit={handleSavePrueba} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nombre del Examen</label>
                                    <input type="text" required value={prueba.nombre} onChange={e => setPrueba({...prueba, nombre: e.target.value})} autoFocus
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium text-gray-800"
                                        placeholder="Ej: Hematología Completa" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo de Reporte</label>
                                        <select value={prueba.tipo} onChange={e => setPrueba({...prueba, tipo: e.target.value})}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium text-gray-700">
                                            <option value="Tabla">📊 Estándar (Tabla)</option>
                                            <option value="Orina">🧪 Orina / Sedimento</option>
                                            <option value="Coproanalisis">📝 Coproanálisis</option>
                                            <option value="Cultivo">🔬 Microbiología / Cultivo</option>
                                            <option value="Cualitativa">✅ Cualitativa / Especial</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Precio (USD)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input type="number" step="0.01" min="0" required value={prueba.precio_usd} onChange={e => setPrueba({...prueba, precio_usd: e.target.value})}
                                                className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium text-gray-800" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Descripción / Metodología</label>
                                    <textarea value={prueba.descripcion} onChange={e => setPrueba({...prueba, descripcion: e.target.value})}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium text-gray-800 h-24 resize-none"
                                        placeholder="Información interna o método (ej: Método enzimático colorimétrico)..." />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button type="submit" disabled={isSavingPrueba} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 flex items-center transition-all disabled:opacity-50">
                                        {isSavingPrueba ? 'Guardando...' : 'Guardar y Continuar a Parámetros'}
                                        <ChevronRight className="ml-2 h-5 w-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* PASO 2: Parámetros y Rangos */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in h-full">
                            
                            {/* Formulario Lateral: Crear Parámetro */}
                            <div className="col-span-1 lg:col-span-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-min sticky top-0">
                                <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-4 flex items-center border-b pb-3">
                                    <PlusCircle className="h-5 w-5 mr-2 text-teal-600" />
                                    Nuevo Parámetro
                                </h4>
                                <form onSubmit={handleSaveParametro} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                                        <input type="text" required value={nuevoParam.nombre} onChange={e => setNuevoParam({...nuevoParam, nombre: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-teal-500" placeholder="Ej: Glucosa" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
                                            <input type="text" value={nuevoParam.categoria} onChange={e => setNuevoParam({...nuevoParam, categoria: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-teal-500" placeholder="Ej: Química" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Unidad</label>
                                            <input type="text" value={nuevoParam.unidad} onChange={e => setNuevoParam({...nuevoParam, unidad: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-teal-500" placeholder="Ej: mg/dL" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold shadow-md transition-colors">
                                        Añadir Parámetro
                                    </button>
                                </form>
                            </div>

                            {/* Lista de Parámetros configurados */}
                            <div className="col-span-1 lg:col-span-8 space-y-4">
                                {parametros.length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-gray-200 text-gray-400 p-10 rounded-xl flex flex-col items-center justify-center text-center">
                                        <TestTube className="h-10 w-10 mb-3 text-gray-300" />
                                        <h4 className="font-bold text-gray-600 text-lg">No hay parámetros configurados</h4>
                                        <p className="text-sm mt-1">Usa el formulario de la izquierda para agregar los metabolitos que arrojará este examen.</p>
                                    </div>
                                ) : (
                                    parametros.map(param => (
                                        <div key={param.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                            {/* Cabecera del Parámetro */}
                                            <div className="p-4 bg-gray-50/80 border-b flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                        <TestTube className="h-5 w-5 text-teal-600" />
                                                        {param.nombre}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wider">
                                                        {param.categoria || 'Genérico'} • Unidad: <span className="text-teal-700 bg-teal-50 px-1.5 rounded">{param.unidad || '-'}</span>
                                                    </p>
                                                </div>
                                                <button onClick={() => handleDeleteParametro(param.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>

                                            {/* Rangos de Referencia */}
                                            <div className="p-4">
                                                {param.rangos && param.rangos.length > 0 ? (
                                                    <div className="space-y-2 mb-4">
                                                        {param.rangos.map((rango, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100 group">
                                                                <div className="flex gap-4">
                                                                    <span className="font-bold text-gray-700 min-w-8">
                                                                        {rango.sexo === 'A' ? 'Ambos' : rango.sexo === 'M' ? 'Homb.' : 'Mujer.'}
                                                                    </span>
                                                                    <span className="text-gray-600">
                                                                        {rango.texto_referencia}
                                                                    </span>
                                                                </div>
                                                                <button onClick={() => handleDeleteRango(rango.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1">
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 font-medium mb-3">
                                                        No tiene valores médicos de referencia definados. Aparecerá en blanco en el reporte.
                                                    </p>
                                                )}

                                                {/* Formulario para inyectar rango */}
                                                <RangoReferenciaForm 
                                                    parametroId={param.id} 
                                                    onSaved={() => fetchParametros(savedPrueba.id)} 
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}

                                {/* Botón para finalizar Wizard */}
                                {parametros.length > 0 && (
                                    <div className="pt-6">
                                        <button onClick={() => { onComplete(); onClose(); }} className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-lg font-bold shadow-xl shadow-teal-500/20 flex items-center justify-center transition-all transform hover:-translate-y-1">
                                            <CheckCircle2 className="mr-2 h-6 w-6" />
                                            Hecho, regresar al Catálogo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scale-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
}
