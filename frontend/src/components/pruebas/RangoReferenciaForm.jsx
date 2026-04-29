import { useState } from 'react';
import { PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function RangoReferenciaForm({ parametroId, onSaved }) {
    const [rango, setRango] = useState({
        sexo: 'A',
        edad_min_dias: 0,
        edad_max_dias: 36500,
        texto_referencia: '',
        valor_min_num: '',
        valor_max_num: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                ...rango,
                valor_min_num: rango.valor_min_num ? parseFloat(rango.valor_min_num) : null,
                valor_max_num: rango.valor_max_num ? parseFloat(rango.valor_max_num) : null,
            };
            await api.post(`/api/pruebas/parametros/${parametroId}/rangos`, payload);
            setRango({
                sexo: 'A', edad_min_dias: 0, edad_max_dias: 36500,
                texto_referencia: '', valor_min_num: '', valor_max_num: ''
            });
            onSaved();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error al guardar el rango');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-3 animate-fade-in shadow-inner">
            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Agregar Rango de Referencia</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sexo (M/F/A)</label>
                    <select
                        value={rango.sexo}
                        onChange={(e) => setRango({ ...rango, sexo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                    >
                        <option value="A">Ambos (A)</option>
                        <option value="M">Masculino (M)</option>
                        <option value="F">Femenino (F)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mínimo (Numérico)</label>
                    <input
                        type="number" step="0.01"
                        value={rango.valor_min_num}
                        onChange={(e) => setRango({ ...rango, valor_min_num: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-teal-500 outline-none placeholder:text-gray-300"
                        placeholder="Ej: 13.5"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Máximo (Numérico)</label>
                    <input
                        type="number" step="0.01"
                        value={rango.valor_max_num}
                        onChange={(e) => setRango({ ...rango, valor_max_num: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-teal-500 outline-none placeholder:text-gray-300"
                        placeholder="Ej: 17.5"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Texto a mostrar en Reporte</label>
                    <input
                        type="text" required
                        value={rango.texto_referencia}
                        onChange={(e) => setRango({ ...rango, texto_referencia: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-teal-500 outline-none placeholder:text-gray-300"
                        placeholder="Ej: 13.5 - 17.5 g/dL"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                    >
                        <PlusCircle className="h-4 w-4 mr-1.5" />
                        Añadir Rango
                    </button>
                </div>
            </div>
        </form>
    );
}
