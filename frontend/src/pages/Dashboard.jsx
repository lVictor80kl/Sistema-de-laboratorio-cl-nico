import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Users, Archive, Clock, Search, Eye, MoreHorizontal,
    ArrowUpRight, ArrowDownRight, TrendingUp
} from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({ pacientes: 0, ordenes: 0, pendientes: 0 });
    const [ordenesRecientes, setOrdenesRecientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const [pacientesRes, ordenesRes] = await Promise.all([
                api.get('/api/pacientes/'),
                api.get('/api/ordenes/')
            ]);

            const ordenes = ordenesRes.data;
            const pendientes = ordenes.filter(o => o.estado_pago === 'Pendiente').length;

            setStats({
                pacientes: pacientesRes.data.length,
                ordenes: ordenes.length,
                pendientes: pendientes
            });

            const ordenesOrdenadas = [...ordenes]
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 5);
            setOrdenesRecientes(ordenesOrdenadas);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                    {trend && (
                        <div className={`flex items-center mt-2 text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                            {trendValue}
                        </div>
                    )}
                </div>
                <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Resumen de actividad del laboratorio</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 w-64"
                        />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        LM
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Pacientes"
                    value={isLoading ? '...' : stats.pacientes}
                    icon={Users}
                    trend="up"
                    trendValue="+12% este mes"
                    color="bg-teal-600"
                />
                <StatCard
                    title="Total Órdenes"
                    value={isLoading ? '...' : stats.ordenes}
                    icon={Archive}
                    trend="up"
                    trendValue="+8% esta semana"
                    color="bg-blue-600"
                />
                <StatCard
                    title="Órdenes Pendientes"
                    value={isLoading ? '...' : stats.pendientes}
                    icon={Clock}
                    trend={stats.pendientes > 5 ? 'down' : 'up'}
                    trendValue={stats.pendientes > 5 ? 'Requiere atención' : 'Bajo control'}
                    color={stats.pendientes > 5 ? 'bg-amber-500' : 'bg-green-600'}
                />
            </div>

            {/* Charts / Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Chart Placeholder */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900">Actividad Semanal</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Órdenes procesadas por día</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="flex items-end justify-between h-40 px-4">
                        {[65, 45, 78, 55, 90, 70, 85].map((height, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div 
                                    className="w-8 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-md transition-all hover:opacity-80"
                                    style={{ height: `${height}%` }}
                                ></div>
                                <span className="text-xs text-gray-400">
                                    {['L', 'M', 'Mi', 'J', 'V', 'S', 'D'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
                    <div className="space-y-3">
                        <a href="/reporte" className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                            <div className="p-2 bg-teal-600 rounded-lg">
                                <Archive className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Nueva Orden</p>
                                <p className="text-xs text-teal-600/70">Crear orden de examen</p>
                            </div>
                        </a>
                        <a href="/pacientes" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Registrar Paciente</p>
                                <p className="text-xs text-blue-600/70">Agregar nuevo paciente</p>
                            </div>
                        </a>
                        <a href="/facturacion" className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                            <div className="p-2 bg-purple-600 rounded-lg">
                                <Clock className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Verificar Pagos</p>
                                <p className="text-xs text-purple-600/70">Órdenes pendientes</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900">Órdenes Recientes</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Últimas 5 órdenes registradas</p>
                    </div>
                    <a href="/ordenes" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
                        Ver todas →
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Exámenes</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-8 text-center text-gray-400">Cargando...</td>
                                </tr>
                            ) : ordenesRecientes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-8 text-center text-gray-400">No hay órdenes registradas</td>
                                </tr>
                            ) : (
                                ordenesRecientes.map((orden) => (
                                    <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {new Date(orden.fecha).toLocaleDateString('es-VE')}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                                                    {orden.paciente_nombre?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {orden.paciente_nombre || `Paciente #${orden.paciente_id}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {orden.num_examenes || orden.examenes?.length || '-'}
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                            ${orden.monto_usd?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                orden.estado_pago === 'Pagado' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {orden.estado_pago === 'Pagado' ? 'Completada' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <MoreHorizontal className="h-4 w-4" />
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

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
}
