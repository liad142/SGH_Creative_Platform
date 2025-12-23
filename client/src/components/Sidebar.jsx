import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Image, Dog, Zap } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/seasons', label: 'Seasons', icon: Calendar },
        { to: '/album', label: 'Album', icon: Image },
        { to: '/pets', label: 'Pets', icon: Dog },
        { to: '/generations', label: 'Generations', icon: Zap },
    ];

    return (
        <div className="h-screen w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    SGH Platform
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-gray-900">
                        A
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">Admin User</p>
                        <p className="text-xs text-gray-500 truncate">admin@sgh.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
