import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Sparkles,
    Loader2,
    Calendar,
    ChevronRight,
    Search,
    AlertCircle
} from 'lucide-react';

const SeasonDashboard = () => {
    const [themeName, setThemeName] = useState('');
    const [seasons, setSeasons] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSeasonsLoading, setIsSeasonsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        setIsSeasonsLoading(true);
        try {
            const response = await fetch('/api/seasons');
            if (!response.ok) throw new Error('Failed to fetch seasons');
            const data = await response.json();
            setSeasons(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSeasonsLoading(false);
        }
    };

    const handleStartSeason = async (e) => {
        e.preventDefault();
        if (!themeName) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/seasons/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: themeName })
            });
            if (!response.ok) throw new Error('Failed to initialize season');
            const data = await response.json();

            setThemeName('');
            fetchSeasons();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Season Manager</h1>
                <p className="text-gray-500 text-lg font-medium">Create and oversee high-level season planning.</p>
            </div>

            {/* Season Creation Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100 p-8 relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-gray-900">Planning season structure (text)...</span>
                            <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Generating chapters and tasks</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleStartSeason} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2 ml-1">
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            New Season Theme
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={themeName}
                                onChange={(e) => setThemeName(e.target.value)}
                                placeholder="e.g. Victorian Steampunk, Atlantis Rising..."
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 placeholder:text-gray-400 font-semibold text-lg"
                                disabled={isLoading}
                            />
                            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !themeName}
                        className="w-full md:w-auto px-10 py-4 rounded-2xl bg-gray-900 text-white font-black shadow-xl hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <Plus className="w-6 h-6" />}
                        Plan Season
                    </button>
                </form>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-bold text-sm tracking-tight">{error}</p>
                </div>
            )}

            {/* Season List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between ml-2">
                    <h2 className="text-xl font-bold text-gray-800">Open Seasons</h2>
                    <button onClick={fetchSeasons} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Refresh</button>
                </div>

                {isSeasonsLoading && seasons.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-[2rem] bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {seasons.map((season) => (
                            <div
                                key={season.id}
                                onClick={() => navigate(`/seasons/${season.id}`)}
                                className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col gap-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                        <Calendar size={24} />
                                    </div>
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">
                                        Active
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{season.theme_name}</h3>
                                    <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-tighter">
                                        Created {new Date(season.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
                                    <span className="text-sm font-bold text-gray-400">12 Chapters</span>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeasonDashboard;
