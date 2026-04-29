import { useState, useEffect } from 'react';
import api from '../services/api';
import { PlusCircle, Search, X, User, Phone, Hash, Pencil, Trash2 } from 'lucide-react';

// Convierte edad (años) a fecha de nacimiento aproximada (1 julio del año calculado)
const edadAFecha = (edad) => {
    const anio = new Date().getFullYear() - parseInt(edad, 10);
    return `${anio}-07-01`;
};

// Convierte fecha de nacimiento a edad en años
const fechaAEdad = (fechaStr) => {
    const hoy = new Date();
    const nac = new Date(fechaStr + 'T00:00:00');
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
};

const FORM_INICIAL = {
    cedula: '',
    nombre: '',
    apellido: '',
    edad: '',
    sexo: 'F',
    telefono: ''
};

export default function Pacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [pacienteEditando, setPacienteEditando] = useState(null); // null = creando, objeto = editando
    const [confirmDeleteId, setConfirmDeleteId] = useState(null); // ID del paciente a eliminar

    const [formData, setFormData] = useState(FORM_INICIAL);

    useEffect(() => {
        fetchPacientes();
    }, []);

    const fetchPacientes = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/pacientes/');
            setPacientes(response.data);
        } catch (error) {
            console.error('Error fetching pacientes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const abrirModalCrear = () => {
        setPacienteEditando(null);
        setFormData(FORM_INICIAL);
        setIsModalOpen(true);
    };

    const abrirModalEditar = (paciente) => {
        setPacienteEditando(paciente);
        setFormData({
            cedula: paciente.cedula,
            nombre: paciente.nombre,
            apellido: paciente.apellido,
            edad: String(fechaAEdad(paciente.fecha_nacimiento)),
            sexo: paciente.sexo,
            telefono: paciente.telefono || ''
        });
        setIsModalOpen(true);
    };

    const cerrarModal = () => {
        setIsModalOpen(false);
        setPacienteEditando(null);
        setFormData(FORM_INICIAL);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Convertir edad a fecha_nacimiento antes de enviar
        const payload = {
            ...formData,
            fecha_nacimiento: edadAFecha(formData.edad),
        };
        delete payload.edad;
        try {
            if (pacienteEditando) {
                await api.put(`/api/pacientes/${pacienteEditando.id}`, payload);
            } else {
                await api.post('/api/pacientes/', payload);
            }
            cerrarModal();
            fetchPacientes();
        } catch (error) {
            alert(error.response?.data?.detail || "Error al guardar el paciente");
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/api/pacientes/${confirmDeleteId}`);
            setConfirmDeleteId(null);
            fetchPacientes();
        } catch (error) {
            alert(error.response?.data?.detail || "Error al eliminar el paciente");
        }
    };

    const pacientesFiltrados = pacientes.filter(p =>
        p.cedula.includes(searchTerm) ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.apellido.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            {/* ── Encabezado ── */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Directorio de Pacientes</h2>
                    <p className="text-gray-500 mt-1">Gestione la información clínica y personal de los pacientes.</p>
                </div>
                <button
                    onClick={abrirModalCrear}
                    className="bg-brand-teal hover:bg-teal-700 text-white font-semibold py-2.5 px-5 rounded-lg inline-flex items-center transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    <span>Registrar Paciente</span>
                </button>
            </div>

            {/* ── Tabla ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal sm:text-sm transition-shadow"
                            placeholder="Buscar por cédula o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cédula</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Edad</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sexo</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Cargando datos...</td></tr>
                            ) : pacientesFiltrados.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">No se encontraron pacientes.</td></tr>
                            ) : (
                                pacientesFiltrados.map((paciente) => (
                                    <tr key={paciente.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paciente.cedula}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold uppercase">
                                                    {paciente.nombre.charAt(0)}{paciente.apellido.charAt(0)}
                                                </div>
                                                <div className="ml-4 text-sm font-medium text-gray-900">{paciente.nombre} {paciente.apellido}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {fechaAEdad(paciente.fecha_nacimiento)} años
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paciente.telefono || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${paciente.sexo === 'F' ? 'bg-pink-100 text-pink-800' : paciente.sexo === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : 'Ambos'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => abrirModalEditar(paciente)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(paciente.id)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                                                    title="Eliminar"
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

            {/* ── Modal Crear / Editar ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={cerrarModal}></div>
                    <div className="relative bg-white max-w-md w-full rounded-xl shadow-2xl overflow-hidden transform transition-all border border-teal-600/10">
                        {/* Header con gradiente teal */}
                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <User className="h-6 w-6" />
                                <h3 className="text-xl font-bold tracking-tight">
                                    {pacienteEditando ? 'Editar Paciente' : 'Nuevo Paciente'}
                                </h3>
                            </div>
                            <button onClick={cerrarModal} className="text-white/80 hover:text-white transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Nombre y Apellido */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/60" />
                                        <input
                                            type="text" name="nombre" required
                                            value={formData.nombre} onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                                            placeholder="Ej. Juan"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Apellido</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/60" />
                                        <input
                                            type="text" name="apellido" required
                                            value={formData.apellido} onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                                            placeholder="Ej. Pérez"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Edad y Sexo */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Edad</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/60" />
                                        <input
                                            type="number" name="edad" required
                                            min="0" max="150"
                                            value={formData.edad} onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all text-sm placeholder:text-slate-400"
                                            placeholder="Ej: 35"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Sexo</label>
                                    <select
                                        name="sexo" required
                                        value={formData.sexo} onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all text-sm"
                                    >
                                        <option value="F">Femenino</option>
                                        <option value="M">Masculino</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cédula */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Cédula de Identidad</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/60" />
                                    <input
                                        type="text" name="cedula" required
                                        value={formData.cedula} onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                                        placeholder="V-00.000.000"
                                    />
                                </div>
                            </div>

                            {/* Teléfono */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Teléfono de Contacto</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/60" />
                                    <input
                                        type="tel" name="telefono"
                                        value={formData.telefono} onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                                        placeholder="0414-0000000"
                                    />
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button" onClick={cerrarModal}
                                    className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] text-sm"
                                >
                                    {pacienteEditando ? 'Actualizar Paciente' : 'Guardar Paciente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal Confirmar Eliminar ── */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={() => setConfirmDeleteId(null)}></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <Trash2 className="h-5 w-5 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Eliminar Paciente</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">
                                ¿Estás seguro? Esta acción eliminará al paciente y <span className="font-semibold text-red-600">todas sus órdenes y resultados</span> de forma permanente.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => setConfirmDeleteId(null)} className="bg-white py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button onClick={handleDelete} className="bg-red-600 py-2 px-4 rounded-lg text-sm font-medium text-white hover:bg-red-700">
                                    Sí, eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}