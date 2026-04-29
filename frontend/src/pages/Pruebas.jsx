import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    PlusCircle, Search, FlaskConical, Pencil, Trash2, 
    ChevronDown, ChevronRight, TestTube, Tag, 
    AlignLeft, Info 
} from 'lucide-react';
import WizardPrueba from '../components/pruebas/WizardPrueba';

export default function Pruebas() {
    const [pruebas, setPruebas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pruebasExpandidas, setPruebasExpandidas] = useState({});

    const [wizardConfig, setWizardConfig] = useState(null); // { basePrueba: null | objeto }
    const [confirmDeletePrueba, setConfirmDeletePrueba] = useState(null);

    useEffect(() => {
        fetchPruebas();
    }, []);

    const fetchPruebas = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/pruebas/');
            const pruebasConParametros = await Promise.all(
                response.data.map(async (prueba) => {
                    const params = await api.get(`/api/pruebas/${prueba.id}/parametros`);
                    return { ...prueba, parametros: params.data };
                })
            );
            setPruebas(pruebasConParametros);
        } catch (error) {
            console.error('Error fetching pruebas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpansion = (pruebaId) => setPruebasExpandidas(prev => ({ ...prev, [pruebaId]: !prev[pruebaId] }));

    const handleDeletePrueba = async () => {
        try {
            await api.delete(`/api/pruebas/${confirmDeletePrueba}`);
            setConfirmDeletePrueba(null);
            fetchPruebas();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error al eliminar la prueba');
        }
    };

    const pruebasFiltradas = pruebas.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const GET_ICON = (tipo) => {
        switch(tipo?.toLowerCase()) {
            case 'orina': return <TestTube className="h-5 w-5" />;
            case 'coproanalisis': return <AlignLeft className="h-5 w-5" />;
            case 'cultivo': return <FlaskConical className="h-5 w-5" />;
            case 'cualitativa': return <Tag className="h-5 w-5" />;
            default: return <FlaskConical className="h-5 w-5" />;
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Catálogo de Pruebas</h2>
                    <p className="text-gray-500 mt-1">Configure los exámenes, precios y parámetros del laboratorio.</p>
                </div>
                <button
                    onClick={() => setWizardConfig({})}
                    className="mt-4 md:mt-0 bg-brand-teal hover:bg-teal-700 text-white font-semibold py-2.5 px-6 rounded-lg inline-flex items-center transition-all shadow-md transform hover:-translate-y-0.5"
                >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    <span>Registrar Nueva Prueba</span>
                </button>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="relative max-w-md">
                    <Search className="absolute inset-y-0 left-3 mt-2.5 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none transition-shadow text-sm"
                        placeholder="Buscar prueba por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center text-gray-500 font-medium">Cargando catálogo...</div>
                ) : pruebasFiltradas.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 font-medium">No hay pruebas.</div>
                ) : (
                    pruebasFiltradas.map((prueba) => {
                        const isExpanded = pruebasExpandidas[prueba.id];
                        return (
                            <div key={prueba.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-brand-teal/50 transition-colors">
                                <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => toggleExpansion(prueba.id)}>
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                                            {GET_ICON(prueba.tipo)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{prueba.nombre}</h3>
                                            <p className="text-xs text-brand-teal font-semibold tracking-wider uppercase mt-0.5">
                                                $ {prueba.precio_usd?.toFixed(2)} • {prueba.tipo}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={(e) => { e.stopPropagation(); setWizardConfig({ basePrueba: prueba }); }} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeletePrueba(prueba.id); }} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400 ml-1" /> : <ChevronRight className="h-5 w-5 text-gray-400 ml-1" />}
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-4 animate-fade-in">
                                        <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                            <Info className="h-5 w-5 text-brand-teal mt-0.5" />
                                            <div>
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Descripción Técnica</h4>
                                                <p className="text-sm text-gray-600 italic">
                                                    {prueba.descripcion || "Sin descripción configurada."}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Metabolitos y Rangos Evaluados ({prueba.parametros?.length || 0})</h4>
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                {prueba.parametros?.length > 0 ? (
                                                    prueba.parametros.map((param) => (
                                                        <div key={param.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <p className="text-sm font-bold text-gray-800">{param.nombre}</p>
                                                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                                                    {param.unidad || '-'}
                                                                </span>
                                                            </div>
                                                            {param.rangos && param.rangos.length > 0 ? (
                                                                <div className="space-y-1.5 mt-2">
                                                                    {param.rangos.map((r, i) => (
                                                                        <div key={i} className="flex justify-between text-[11px] bg-gray-50 p-1.5 rounded-lg border border-gray-100 items-center">
                                                                            <span className="font-bold text-gray-600 w-14">
                                                                                {r.sexo === 'A' ? 'Ambos' : r.sexo === 'M' ? 'Hombre' : 'Mujer'}:
                                                                            </span>
                                                                            <span className="text-teal-700 font-bold bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">
                                                                                {r.texto_referencia}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] text-amber-600 font-semibold pt-1">Sin rangos definidos</p>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="col-span-full text-xs text-gray-400 italic">No hay parámetros. Presioná el ícono del lápiz para agregarlos.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {wizardConfig && (
                <WizardPrueba 
                    basePrueba={wizardConfig.basePrueba} 
                    onClose={() => setWizardConfig(null)} 
                    onComplete={() => { setWizardConfig(null); fetchPruebas(); }} 
                />
            )}

            {confirmDeletePrueba && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm" onClick={() => setConfirmDeletePrueba(null)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scale-in border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar esta prueba?</h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Se borrarán todos sus parámetros asociados irreversiblemente. Asegúrese de que no haya órdenes activas que usen esta prueba.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDeletePrueba(null)} className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                            <button onClick={handleDeletePrueba} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors">Sí, eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
