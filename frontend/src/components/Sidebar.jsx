import { Link, useLocation } from 'react-router-dom';
import { 
    Home, Users, FlaskConical, ClipboardList, Receipt, 
    FileText, LogOut, Activity, Package
} from 'lucide-react';

export default function Sidebar() {
    const location = useLocation();

    const menuItems = [
        { name: 'Inicio', path: '/', icon: Home },
        { name: 'Pacientes', path: '/pacientes', icon: Users },
        { name: 'Pruebas', path: '/pruebas', icon: FlaskConical },
    ];

    const labSections = [
        { name: 'Órdenes', path: '/ordenes', icon: ClipboardList, desc: 'Crear órdenes' },
        { name: 'Reportes', path: '/reporte', icon: FileText, desc: 'Ingresar resultados' },
        { name: 'Facturación', path: '/facturacion', icon: Receipt, desc: 'Tasa BCV y pagos' },
        { name: 'Inventario', path: '/inventario', icon: Package, desc: 'Reactivos y costos' },
    ];

    return (
        <div className="flex flex-col w-64 h-full bg-gradient-to-b from-[#0f766e] to-[#0d5f57] text-white">
            {/* Logo / Brand */}
            <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-xl">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight">LabLink Precision</h1>
                        <p className="text-[10px] text-white/60 uppercase tracking-widest">Laboratory System</p>
                    </div>
                </div>
            </div>

            {/* Navegación principal */}
            <nav className="py-4 px-3">
                <p className="text-[10px] text-white/40 uppercase tracking-widest px-4 mb-2">General</p>
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Sección Laboratorio */}
            <div className="flex-1 py-2 px-3">
                <p className="text-[10px] text-white/40 uppercase tracking-widest px-4 mb-2">Laboratorio</p>
                <ul className="space-y-1">
                    {labSections.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Bottom / Logout */}
            <div className="p-4 border-t border-white/10">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all">
                    <LogOut className="h-5 w-5" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}
