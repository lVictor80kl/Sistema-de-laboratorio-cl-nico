import { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Save, AlertTriangle, User, FlaskConical, TestTube } from 'lucide-react';

export default function CargarResultadosModal({ ordenId, onClose, onComplete }) {
    const [formData, setFormData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [resultados, setResultados] = useState({}); 

    useEffect(() => {
        fetchEstructura();
    }, [ordenId]);

    const fetchEstructura = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/api/ordenes/${ordenId}/form-resultados`);
            const data = res.data;
            setFormData(data);

            // Inicializar el estado de los inputs
            const initialResultados = {};
            data.pruebas.forEach(prueba => {
                prueba.parametros.forEach(param => {
                    initialResultados[param.resultado_id] = {
                        valor: param.valor || "",
                        marcado_anormal: param.marcado_anormal || false,
                        rango_referencia_manual: param.texto_referencia || ""
                    };
                });
            });
            setResultados(initialResultados);
        } catch (error) {
            console.error(error);
            alert("Error al cargar la estructura de la orden");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleValorChange = (id, newValor) => {
        setResultados(prev => ({
            ...prev,
            [id]: { ...prev[id], valor: newValor }
        }));
    };

    const handleRefChange = (id, newRef) => {
        setResultados(prev => ({
            ...prev,
            [id]: { ...prev[id], rango_referencia_manual: newRef }
        }));
    };

    const toggleAnormal = (id) => {
        setResultados(prev => ({
            ...prev,
            [id]: { ...prev[id], marcado_anormal: !prev[id].marcado_anormal }
        }));
    };

    const handleGuardar = async () => {
        setIsSaving(true);
        try {
            const payload = Object.entries(resultados).map(([id, data]) => ({
                id: parseInt(id),
                valor: data.valor,
                marcado_anormal: data.marcado_anormal,
                rango_referencia_manual: data.rango_referencia_manual
            }));

            await api.put(`/api/ordenes/${ordenId}/resultados/lote`, payload);
            alert("Resultados guardados exitosamente.");
            if (onComplete) onComplete();
        } catch (error) {
            console.error(error);
            alert("Error al guardar los resultados.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
                <div className="relative bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Cargando plantilla de resultados...</p>
                </div>
            </div>
        );
    }

    if (!formData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-700 to-teal-600 p-5 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <TestTube className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Carga de Resultados • Orden #{formData.orden_id}</h2>
                            <p className="text-teal-100 text-sm flex items-center gap-2 mt-0.5">
                                <User className="h-4 w-4" /> 
                                {formData.paciente_nombre} • {formData.edad_anios} años ({formData.sexo === 'M' ? 'Masculino' : 'Femenino'})
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto bg-gray-50/50 flex-1">
                    {formData.pruebas.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium text-lg">Esta orden no tiene pruebas vinculadas.</p>
                            <p className="text-sm mt-1">Si insertó esta orden antes de la corrección del sistema, deberá crearla de nuevo.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {formData.pruebas.map((prueba) => (
                                <div key={prueba.prueba_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-100/80 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                                        <FlaskConical className="h-5 w-5 text-teal-700" />
                                        <h3 className="font-bold text-gray-800 uppercase tracking-wide">{prueba.prueba_nombre}</h3>
                                    </div>
                                    <div className="p-5">
                                        {/* Titulos tabla desktop */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 mb-3 px-3">
                                            <div className="col-span-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Parámetro</div>
                                            <div className="col-span-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Resultado</div>
                                            <div className="col-span-1 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Unidad</div>
                                            <div className="col-span-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Referencia</div>
                                            <div className="col-span-1 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Alerta</div>
                                        </div>

                                        <div className="space-y-4 md:space-y-2">
                                            {prueba.parametros.map((param) => {
                                                const resState = resultados[param.resultado_id];
                                                if (!resState) return null;
                                                
                                                return (
                                                    <div 
                                                        key={param.resultado_id} 
                                                        className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-lg p-3 transition-colors ${
                                                            resState.marcado_anormal ? 'bg-red-50/50 border border-red-100' : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {/* Nombre Param */}
                                                        <div className="col-span-1 md:col-span-4 flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${resState.valor ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                                                            <span className="font-bold text-sm text-gray-700">{param.nombre}</span>
                                                        </div>

                                                        {/* Input Valor */}
                                                        <div className="col-span-1 md:col-span-3">
                                                            <input
                                                                type="text"
                                                                value={resState.valor}
                                                                onChange={(e) => handleValorChange(param.resultado_id, e.target.value)}
                                                                className={`w-full px-3 py-2 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-colors ${
                                                                    resState.marcado_anormal ? 'border-red-300 text-red-700 bg-white focus:border-red-500' : 'border-gray-300 text-gray-900 bg-white focus:border-teal-500'
                                                                }`}
                                                                placeholder="Ingrese valor..."
                                                            />
                                                        </div>

                                                        {/* Unidad */}
                                                        <div className="col-span-1 md:col-span-1 text-center">
                                                            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded inline-block w-full">
                                                                {param.unidad || '-'}
                                                            </span>
                                                        </div>

                                                        {/* Referencia */}
                                                        <div className="col-span-1 md:col-span-3 text-center">
                                                            <input
                                                                type="text"
                                                                value={resState.rango_referencia_manual || ""}
                                                                onChange={(e) => handleRefChange(param.resultado_id, e.target.value)}
                                                                className="w-full text-xs text-center text-gray-500 font-medium bg-transparent border border-transparent hover:border-gray-200 focus:border-teal-500 focus:bg-white rounded px-2 py-1.5 transition-colors focus:outline-none"
                                                                title="Editar referencia aplicable para este paciente"
                                                                placeholder="Rango de referencia..."
                                                            />
                                                        </div>

                                                        {/* Anormal Toggle */}
                                                        <div className="col-span-1 md:col-span-1 flex justify-center">
                                                            <button
                                                                onClick={() => toggleAnormal(param.resultado_id)}
                                                                className={`p-2 rounded-lg transition-colors ${
                                                                    resState.marcado_anormal 
                                                                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                                                        : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                                                                }`}
                                                                title="Marcar como valor patológico/anormal"
                                                            >
                                                                <AlertTriangle className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
                    <p className="text-sm text-gray-500 font-medium">
                        Presione el ícono de alerta (<AlertTriangle className="inline h-4 w-4 mx-0.5 text-gray-400" />) para destacar valores patológicos.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleGuardar}
                            disabled={isSaving || formData.pruebas.length === 0}
                            className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold shadow-md hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save className="h-5 w-5" />
                            {isSaving ? 'Guardando...' : 'Guardar Resultados'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
