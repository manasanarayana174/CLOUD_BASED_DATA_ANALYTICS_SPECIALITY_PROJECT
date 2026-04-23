import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Activity,
    Stethoscope,
    Settings,
    Briefcase,
    LogOut
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['Doctor', 'Nurse', 'Admin'] },
        { icon: Users, label: 'Patients', path: '/patients', roles: ['Doctor', 'Nurse', 'Admin'] },
        { icon: Briefcase, label: 'Operations', path: '/operations', roles: ['Doctor', 'Nurse', 'Admin'] },
        // { icon: Activity, label: 'Live Monitoring', path: '/monitoring', roles: ['Doctor', 'Nurse'] }, // Placeholder
        { icon: Stethoscope, label: 'AI Assistant', path: '/ai-chat', roles: ['Doctor', 'Admin'] },
        { icon: Settings, label: 'Admin Panel', path: '/admin', roles: ['Admin'] },
    ];

    // Filter items based on user role
    const allowedItems = navItems.filter(item => item.roles.includes(user?.role || 'Doctor'));

    return (
        <div className="h-screen w-64 bg-slate-850 text-white fixed left-0 top-0 flex flex-col shadow-xl z-50">
            <div className="p-6 border-b border-slate-700 flex items-center gap-3">
                <div className="w-8 h-8 bg-medical-500 rounded-lg flex items-center justify-center font-bold text-lg">H</div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight">MedIntel AI</h1>
                    <p className="text-xs text-slate-400">HospitalOS v1.0</p>
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-800/50">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Signed in as</p>
                <p className="font-medium truncate">{user?.name}</p>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                    {user?.role}
                </span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {allowedItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive
                                ? 'bg-medical-600 text-white shadow-lg shadow-medical-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
            `}
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-rose-400 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
