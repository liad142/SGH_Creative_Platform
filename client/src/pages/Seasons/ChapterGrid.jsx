import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft,
    Loader2,
    Map as MapIcon,
    ChevronRight,
    Grid3X3
} from 'lucide-react';
import IsometricEditor from '../../components/IsometricEditor';
import SeasonMap from '../../components/SeasonMap';

const ChapterGrid = () => {
    const { seasonId } = useParams();
    const navigate = useNavigate();
    const [chapters, setChapters] = useState([]);
    const [season, setSeason] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('isometric'); // 'isometric' or 'classic'

    useEffect(() => {
        fetchChapters();
        fetchSeason();
    }, [seasonId]);

    const fetchSeason = async () => {
        try {
            const response = await fetch('/api/seasons');
            if (response.ok) {
                const all = await response.json();
                const found = all.find(s => s.id === seasonId);
                if (found) setSeason(found);
            }
        } catch (err) {
            console.error('Failed to fetch season:', err);
        }
    };

    const fetchChapters = async () => {
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

    // Handler for saving asset position from IsometricEditor
    const handlePositionUpdate = useCallback(async (taskId, position) => {
        try {
            const response = await fetch(`/api/seasons/tasks/${taskId}/position`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(position)
            });
            if (!response.ok) {
                throw new Error('Failed to save position');
            }
            // Optionally refresh chapters data
            // await fetchChapters();
        } catch (err) {
            console.error('Position update failed:', err);
            throw err;
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Chapters Map...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/seasons')}
                        className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 group"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {season?.theme_name || 'Season Chapters'}
                        </h1>
                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Select a chapter to manage assets</p>
                    </div>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 ml-2">
                        <MapIcon className="w-5 h-5 text-gray-400" />
                        <h2 className="text-xl font-bold text-gray-800">Season Map</h2>
                    </div>

                    {/* View Mode Toggle Buttons */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('isometric')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'isometric'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Grid3X3 size={14} />
                            Isometric Editor
                        </button>
                        <button
                            onClick={() => setViewMode('classic')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'classic'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <MapIcon size={14} />
                            Classic View
                        </button>
                    </div>
                </div>

                {/* Conditional Map Rendering */}
                {viewMode === 'isometric' ? (
                    <IsometricEditor
                        season={season}
                        chapters={chapters}
                        onPositionUpdate={handlePositionUpdate}
                    />
                ) : (
                    <SeasonMap season={season} chapters={chapters} />
                )}
            </div>

            {error ? (
                <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 text-red-600 font-bold">
                    {error}
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2 ml-2">
                        <h2 className="text-xl font-bold text-gray-800">Chapter List</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                        {chapters.map((chap, idx) => {
                            const tasks = chap.tasks || chap.chapter_tasks || [];
                            const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'parts_ready' || t.status === 'ready').length;
                            const totalTasks = tasks.length || 6;
                            const progress = (completedTasks / totalTasks) * 100;

                            return (
                                <div
                                    key={chap.id}
                                    onClick={() => navigate(`/seasons/${seasonId}/chapter/${chap.id}`)}
                                    className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-90 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative flex-1 flex flex-col p-8 items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white mb-4 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                            <span className="text-xl font-black">{idx + 1}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">{chap.title || chap.chapter_title}</h3>

                                        <div className="mt-8 w-full space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase text-white/60 tracking-widest">
                                                <span>Progress</span>
                                                <span>{completedTasks}/{totalTasks} Assets</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-white transition-all duration-1000"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                            Open Workbench <ChevronRight size={12} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default ChapterGrid;
