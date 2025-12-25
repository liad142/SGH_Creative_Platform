import React from 'react';
import { Activity, Users, Image as ImageIcon, Coins } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-4 rounded-xl ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Platform overview and statistics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value="12,345" icon={Users} color="bg-blue-600" />
                <StatCard title="Active Sessions" value="843" icon={Activity} color="bg-green-500" />
                <StatCard title="Generated Assets" value="1.2M" icon={ImageIcon} color="bg-purple-500" />
                <StatCard title="Total Revenue" value="$45.2k" icon={Coins} color="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
                    Chart Placeholder
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
                    Activity Feed Placeholder
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
