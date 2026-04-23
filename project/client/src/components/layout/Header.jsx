import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { User } from 'lucide-react';

const Header = () => {
    const { user } = useAuth();
    const { isConnected, alerts } = useSocket();
    const unreadCount = alerts.length;

    return (
        <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-40 flex items-center justify-end px-8">
            <div className="flex items-center gap-6">
                {/* Status Indicator */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {isConnected ? 'System Online' : 'Offline'}
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-slate-900 capitalize">
                            {user?.name || 'Guest User'}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                            {user?.role || 'Visitor'}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 border-2 border-white shadow-sm">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
