import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
    Search, FileText, Download, MessageCircle, X, Eye, Loader2, 
    FileCheck, AlertCircle
} from 'lucide-react';

export default function Reporte() {
    const [ordenes, setOrdenes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal vista previa PDF
    const [pdfPreview, setPdfPreview] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const iframeRef = useRef(null);

    useEffect(() => {
        fetchOrdenes();
    }, []);

    const fetchOrdenes = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/api/ordenes/');
            const enriched = await Promise.all(
                res.data.map(async (orden) => {
                    const pac = await api.get(`/api/pacientes/${orden.paciente_id}`);
                    return { ...orden, paciente: pac.data };
                })
            );
            setOrdenes(enriched);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const ordenesFiltradas = ordenes.filter(o =>
        o.paciente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.paciente?.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.paciente?.cedula?.includes(searchTerm) ||
        o.id.toString().includes(searchTerm)
    );

    const handleWhatsApp = (paciente, ordenId) => {
        if (!paciente.telefono) {
            alert("El paciente no tiene un número de teléfono registrado.");
            return;
        }
        
        let telefono = paciente.telefono.replace(/\D/g, '');
        if (telefono.length === 11 && telefono.startsWith('0')) {
            telefono = '58' + telefono.substring(1);
        } else if (telefono.length === 10) {
            telefono = '58' + telefono;
        }

        const mensaje = `Hola ${paciente.nombre}, nos comunicamos del Laboratorio Clínico. Te informamos que el reporte analítico de tus exámenes médicos (Orden #${ordenId}) ya está listo.`;
        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    const abrirVistaPrevia = async (orden) => {
        if (orden.num_resultados === 0) {
            alert("Debe cargar resultados antes de generar el PDF.");
            return;
        }

        setPdfLoading(true);
        setPdfError(null);
        setPdfPreview(null);

        try {
            const res = await api.get(`/api/ordenes/${orden.id}/reporte/preview`);
            setPdfPreview({
                ...res.data,
                paciente: orden.paciente
            });
        } catch (error) {
            console.error('Error al cargar PDF:', error);
            setPdfError(error.response?.data?.detail || 'Error al cargar la vista previa');
        } finally {
            setPdfLoading(false);
        }
    };

    const cerrarVistaPrevia = () => {
        setPdfPreview(null);
        setPdfError(null);
    };

    const descargarPdf = () => {
        if (!pdfPreview?.pdf_base64) return;
        
        const linkSource = `data:application/pdf;base64,${pdfPreview.pdf_base64}`;
        const downloadLink = document.createElement('a');
        downloadLink.href = linkSource;
        downloadLink.download = pdfPreview.filename;
        downloadLink.click();
    };

    const enviarWhatsAppPdf = async () => {
        if (!pdfPreview?.pdf_base64 || !pdfPreview.paciente?.telefono) return;

        const telefono = pdfPreview.paciente.telefono.replace(/\D/g, '');
        let telFormat = telefono;
        if (telefono.length === 11 && telefono.startsWith('0')) {
            telFormat = '58' + telefono.substring(1);
        } else if (telefono.length === 10) {
            telFormat = '58' + telefono;
        }

        const mensaje = `Hola ${pdfPreview.paciente.nombre}, ${pdfPreview.paciente.apellido}, su reporte de laboratorio (Orden #${pdfPreview.orden_id}) ya está disponible.`;
        const url = `https://wa.me/${telFormat}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="animate-fade-in py-6 px-4 md:px-8 space-y-6 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-100/50 rounded-2xl border border-teal-100">
                    <FileText className="h-7 w-7 text-teal-700" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Emisión de Reportes</h1>
                    <p className="text-gray-500 font-medium mt-1">Descargue los certificados analíticos en PDF o avise a los pacientes vía WhatsApp.</p>
                </div>
            </div>

            {/* ── Tabla de Órdenes ── */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all placeholder:text-gray-400 shadow-sm"
                            placeholder="Buscar paciente, cédula u orden..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Nº Orden</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Paciente</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Fecha Emitida</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-6 py-16 text-center text-gray-400 font-medium">Cargando...</td></tr>
                            ) : ordenesFiltradas.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-16 text-center text-gray-400 font-medium">No hay órdenes registradas</td></tr>
                            ) : (
                                ordenesFiltradas.map((orden) => (
                                    <tr key={orden.id} className="hover:bg-teal-50/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200/50">#{orden.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center text-teal-800 font-bold text-sm shadow-sm border border-teal-200/50">
                                                    {orden.paciente?.nombre?.charAt(0)}{orden.paciente?.apellido?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{orden.paciente?.nombre} {orden.paciente?.apellido}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{orden.paciente?.cedula}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                            {new Date(orden.fecha + 'T00:00:00').toLocaleDateString('es-VE')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-4 py-1.5 text-xs font-bold rounded-full border shadow-sm ${
                                                orden.num_resultados > 0 
                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {orden.num_resultados > 0 ? `${orden.num_resultados} resultados` : 'Sin resultados'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Botón Vista Previa */}
                                                <button
                                                    onClick={() => abrirVistaPrevia(orden)}
                                                    disabled={orden.num_resultados === 0}
                                                    className={`p-2.5 rounded-xl transition-all ${
                                                        orden.num_resultados > 0
                                                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 shadow-sm'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                    }`}
                                                    title="Vista previa del PDF"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                {/* Botón WhatsApp */}
                                                <button
                                                    onClick={() => handleWhatsApp(orden.paciente, orden.id)}
                                                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 hover:from-emerald-100 hover:to-green-100 rounded-xl transition-all flex items-center gap-2 font-bold text-xs border border-emerald-200 shadow-sm"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                    Notificar
                                                </button>

                                                {/* Botón Descargar PDF */}
                                                <a
                                                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/ordenes/${orden.id}/reporte`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => { 
                                                        if (orden.num_resultados === 0) { 
                                                            e.preventDefault(); 
                                                            alert("Debe cargar resultados antes de generar el PDF."); 
                                                        } 
                                                    }}
                                                    className={`px-4 py-2.5 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm ${
                                                        orden.num_resultados > 0 
                                                            ? 'bg-gradient-to-r from-teal-600 to-teal-500 hover:shadow-teal-500/25 hover:shadow-lg' 
                                                            : 'bg-gray-400 cursor-not-allowed opacity-60'
                                                    }`}
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Descargar PDF
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal Vista Previa PDF ── */}
            {pdfPreview !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cerrarVistaPrevia}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Vista Previa del Reporte</h3>
                                    <p className="text-teal-100 text-sm">{pdfPreview.paciente?.nombre} {pdfPreview.paciente?.apellido} • Orden #{pdfPreview.orden_id}</p>
                                </div>
                            </div>
                            <button onClick={cerrarVistaPrevia} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenido del PDF */}
                        <div className="flex-1 overflow-hidden bg-gray-100">
                            {pdfLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
                                    <p className="text-gray-500 font-medium">Generando vista previa...</p>
                                </div>
                            ) : pdfError ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <AlertCircle className="h-12 w-12 text-red-500" />
                                    <p className="text-gray-700 font-medium">{pdfError}</p>
                                </div>
                            ) : pdfPreview?.pdf_base64 ? (
                                <iframe
                                    ref={iframeRef}
                                    src={`data:application/pdf;base64,${pdfPreview.pdf_base64}`}
                                    className="w-full h-full border-0"
                                    title="Vista previa del PDF"
                                />
                            ) : null}
                        </div>

                        {/* Footer con acciones */}
                        <div className="flex items-center justify-between p-4 bg-white border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <FileCheck className="h-4 w-4 text-green-500" />
                                Reporte generado correctamente
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={enviarWhatsAppPdf}
                                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Enviar por WhatsApp
                                </button>
                                <button
                                    onClick={descargarPdf}
                                    className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
}
