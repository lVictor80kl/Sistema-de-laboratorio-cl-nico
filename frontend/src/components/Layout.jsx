import Sidebar from './Sidebar';

export default function Layout({ children }) {
    return (
        <div className="flex h-screen bg-[#f8fafc] text-gray-800 font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
