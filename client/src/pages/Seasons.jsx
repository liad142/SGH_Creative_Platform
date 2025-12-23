import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    Loader2,
    ChevronLeft,
    Layers,
    Search,
    AlertCircle,
    Play,
    CheckCircle2,
    Clock,
    Image as ImageIcon,
    Puzzle,
    ChevronRight,
    Plus,
    Calendar
} from 'lucide-react';

const Seasons = () => {
    // Navigation State: 'dashboard' | 'map' | 'editor'
    const [view, setView] = useState('dashboard');

    // Data State
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [tasks, setTasks] = useState([]);

    // UI State
    const [themeName, setThemeName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState({}); // Tracking loading per taskId
    const [error, setError] = useState(null);

    // Initial Load: List Seasons
    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/seasons');
            if (!response.ok) throw new Error('Failed to fetch seasons');
            const data = await response.json();
            setSeasons(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
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

            setThemeName('');
            await fetchSeasons();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchChapters = async (seasonId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/seasons/chapters?seasonId=${seasonId}`);
            if (!response.ok) throw new Error('Failed to fetch chapters');
            const data = await response.json();
            setChapters(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSeason = (season) => {
        setSelectedSeason(season);
        fetchChapters(season.id);
        setView('map');
    };

    const handleSelectChapter = (chapter) => {
        setSelectedChapter(chapter);
        setTasks(chapter.chapter_tasks || []);
        setView('editor');
    };

    const handleAction = async (taskId, action) => {
        setIsActionLoading(prev => ({ ...prev, [taskId]: true }));
        try {
            const endpoint = action === 'generate' ? 'generate-full' : 'decompose';
            const response = await fetch(`/api/seasons/tasks/${taskId}/${endpoint}`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error(`Action ${action} failed`);

            // Refresh chapters to get updated task status
            await fetchChapters(selectedSeason.id);

            // Update local tasks state if we are in editor view
            if (selectedChapter) {
                const refreshedChapter = chapters.find(c => c.id === selectedChapter.id);
                if (refreshedChapter) {
                    setTasks(refreshedChapter.chapter_tasks || []);
                }
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setIsActionLoading(prev => ({ ...prev, [taskId]: false }));
        }
    };

    // --- LEVEL 1: DASHBOARD ---
    if (view === 'dashboard') {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Season Manager</h1>
                    <p className="text-gray-500 text-lg font-medium">Create and oversee high-level season planning.</p>
                </div>

                {/* Season Creation Card */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100 p-8 glass-morphism">
                    <form onSubmit={handleStartSeason} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 ml-1">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                New Season Theme
                            </label>
                            <input
                                type="text"
                                value={themeName}
                                onChange={(e) => setThemeName(e.target.value)}
                                placeholder="e.g. Victorian Steampunk, Atlantis Rising..."
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 placeholder:text-gray-400 font-semibold text-lg"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !themeName}
                            className="w-full md:w-auto px-10 py-4 rounded-2xl bg-gray-900 text-white font-black shadow-xl hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <Plus className="w-6 h-6" />}
                            Start Season Plan
                        </button>
                    </form>
                </div>

                {/* Season List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 ml-2">Open Seasons</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {seasons.map((season) => (
                            <div
                                key={season.id}
                                onClick={() => handleSelectSeason(season)}
                                className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col gap-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                        <Calendar size={24} />
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${season.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                                        }`}>
                                        {season.status}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">{season.theme_name}</h3>
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
                </div>
            </div>
        );
    }

    // --- LEVEL 2: CHAPTER MAP ---
    if (view === 'map' && selectedSeason) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('dashboard')}
                            className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 group"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{selectedSeason.theme_name}</h1>
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Chapter Master Map</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                    {chapters.map((chap, idx) => (
                        <div
                            key={chap.id}
                            onClick={() => handleSelectChapter(chap)}
                            className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-80" />
                            <div className="absolute inset-0 flex flex-col p-8 items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white mb-4 shadow-2xl">
                                    <span className="text-xl font-black">{idx + 1}</span>
                                </div>
                                <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">{chap.chapter_title}</h3>
                                <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                    Manage Blueprint <ChevronRight size={12} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- LEVEL 3: TASK MANAGER ---
    if (view === 'editor' && selectedChapter) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('map')}
                            className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 group"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{selectedChapter.chapter_title}</h1>
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Asset Production Table</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Blueprint Task</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Live Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Visual Preview</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Factory Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tasks.map((task) => (
                                <tr key={task.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                            <span className="text-lg font-bold text-gray-900">{task.task_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${task.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                                            task.status === 'generated' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                'bg-gray-100 text-gray-400 border-transparent'
                                            }`}>
                                            {task.status === 'completed' && <CheckCircle2 size={12} />}
                                            {task.status === 'generated' && <Clock size={12} />}
                                            {task.status === 'pending' && <div className="w-1 h-1 rounded-full bg-current" />}
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center">
                                            {task.full_asset_url ? (
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 bg-white p-1 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                    <img src={task.full_asset_url} className="w-full h-full object-cover rounded-xl" />
                                                </div>
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-200">
                                                    <ImageIcon size={32} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleAction(task.id, 'generate')}
                                                disabled={isActionLoading[task.id] || task.status === 'completed'}
                                                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${task.status === 'pending'
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    } flex items-center gap-2`}
                                            >
                                                {isActionLoading[task.id] && <Loader2 size={14} className="animate-spin" />}
                                                Generate Full
                                            </button>
                                            <button
                                                onClick={() => handleAction(task.id, 'decompose')}
                                                disabled={isActionLoading[task.id] || task.status !== 'generated'}
                                                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${task.status === 'generated'
                                                    ? 'bg-gray-900 text-white shadow-lg hover:bg-black'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                                    } flex items-center gap-2`}
                                            >
                                                {isActionLoading[task.id] && <Loader2 size={14} className="animate-spin" />}
                                                Decompose
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return null; // Should never happen
};

export default Seasons;
