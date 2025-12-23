import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Loader2,
    Image as ImageIcon,
    RefreshCw,
    Puzzle,
    CheckCircle2,
    Clock,
    X,
    Edit3,
    Eye,
    Maximize2,
    Box
} from 'lucide-react';

const TaskManager = () => {
    const { seasonId, chapterId } = useParams();
    const navigate = useNavigate();
    const [chapter, setChapter] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState({});
    const [error, setError] = useState(null);

    // Modal states
    const [selectedTask, setSelectedTask] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState('');

    useEffect(() => {
        fetchChapterData();
    }, [chapterId]);

    const fetchChapterData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/seasons/chapters?seasonId=${seasonId}`);
            if (!response.ok) throw new Error('Failed to fetch chapters');
            const allChapters = await response.json();
            const currentChapter = allChapters.find(c => c.id === chapterId);
            if (currentChapter) {
                setChapter(currentChapter);
                setTasks(currentChapter.tasks || []);
            } else {
                throw new Error('Chapter not found');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (taskId, action, customPrompt = null) => {
        setIsActionLoading(prev => ({ ...prev, [taskId]: action }));
        try {
            let endpoint;
            if (action === 'generate' || action === 'regenerate') {
                endpoint = 'generate-full';
            } else if (action === 'decompose') {
                endpoint = 'decompose';
            } else if (action === 'make-3d') {
                endpoint = 'make-3d';
            }

            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            };

            // If custom prompt provided, send it in the body
            if (customPrompt) {
                options.body = JSON.stringify({ customPrompt });
            }

            const response = await fetch(`/api/seasons/tasks/${taskId}/${endpoint}`, options);
            if (!response.ok) throw new Error(`Action ${action} failed`);

            await fetchChapterData();
            setShowPromptModal(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsActionLoading(prev => ({ ...prev, [taskId]: false }));
        }
    };

    const openImageModal = (task) => {
        setSelectedTask(task);
        setShowImageModal(true);
    };

    const openPromptModal = (task) => {
        setSelectedTask(task);
        setEditedPrompt(task.prompt_used || `Create a detailed isometric 3D game asset: ${task.task_name}`);
        setShowPromptModal(true);
    };

    const handleRegenerateWithPrompt = () => {
        if (selectedTask) {
            handleAction(selectedTask.id, 'regenerate', editedPrompt);
        }
    };

    if (isLoading && !chapter) {
        return (
            <div className="flex flex-col items-center justify-center p-24 gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Workbench...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/seasons/${seasonId}`)}
                        className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 group"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{chapter?.title || 'Chapter Workbench'}</h1>
                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Asset Production & Approval</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Blueprint Task</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Visual Preview</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tasks.map((task) => {
                            const isGenerating = isActionLoading[task.id] === 'generate' || isActionLoading[task.id] === 'regenerate';
                            const isDecomposing = isActionLoading[task.id] === 'decompose';
                            const hasFullImage = !!task.full_asset_url;
                            const hasParts = !!(task.part_1_url || task.part_2_url || task.part_3_url);
                            const isCompleted = task.status === 'completed' || task.status === 'parts_ready' || (hasFullImage && hasParts);

                            return (
                                <tr key={task.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`} />
                                            <span className="text-lg font-bold text-gray-900">{task.task_name}</span>
                                        </div>
                                    </td>

                                    <td className="px-8 py-6">
                                        {(isGenerating || isDecomposing) ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                                                <Loader2 size={12} className="animate-spin" />
                                                {isGenerating ? 'Generating Image' : 'Decomposing'}
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isCompleted ? 'bg-green-50 text-green-600 border-green-100' :
                                                hasFullImage ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    'bg-gray-100 text-gray-400 border-transparent'
                                                }`}>
                                                {isCompleted ? <CheckCircle2 size={12} /> : hasFullImage ? <Clock size={12} /> : null}
                                                {isCompleted ? 'Completed' : hasFullImage ? 'Generated' : 'Pending'}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            {hasFullImage ? (
                                                <div className="relative group/thumb">
                                                    {/* Increased image size from 32x32 to 44x44 */}
                                                    <div
                                                        className="w-44 h-44 rounded-2xl overflow-hidden border border-gray-200 bg-white p-1 shadow-sm cursor-pointer hover:scale-105 transition-transform duration-300 relative group/main"
                                                        onClick={() => openImageModal(task)}
                                                    >
                                                        <img src={task.full_asset_url} className="w-full h-full object-cover rounded-xl" alt={task.task_name} />
                                                        <div className="absolute inset-0 bg-black/0 group-hover/main:bg-black/20 transition-colors rounded-2xl flex items-center justify-center opacity-0 group-hover/main:opacity-100">
                                                            <Maximize2 className="text-white" size={32} />
                                                        </div>
                                                    </div>
                                                    {isCompleted && (
                                                        <div className="flex gap-1 mt-2 justify-center">
                                                            {[task.part_1_url, task.part_2_url, task.part_3_url].map((url, i) => (
                                                                url && (
                                                                    <div
                                                                        key={i}
                                                                        className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white p-0.5 cursor-pointer hover:scale-110 transition-transform"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openImageModal(task);
                                                                        }}
                                                                    >
                                                                        <img src={url} className="w-full h-full object-cover rounded-lg" alt={`part ${i + 1}`} />
                                                                    </div>
                                                                )
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-44 h-44 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-200">
                                                    {isGenerating ? <Loader2 size={48} className="animate-spin" /> : <ImageIcon size={48} />}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {!hasFullImage ? (
                                                <button
                                                    onClick={() => handleAction(task.id, 'generate')}
                                                    disabled={isActionLoading[task.id]}
                                                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isActionLoading[task.id] === 'generate' && <Loader2 size={14} className="animate-spin" />}
                                                    Generate Image
                                                </button>
                                            ) : (
                                                <>
                                                    {/* View/Edit Prompt Button */}
                                                    <button
                                                        onClick={() => openPromptModal(task)}
                                                        disabled={!!isActionLoading[task.id]}
                                                        className="p-3 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all"
                                                        title="View/Edit Prompt"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(task.id, 'regenerate')}
                                                        disabled={!!isActionLoading[task.id]}
                                                        className="p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all"
                                                        title="Regenerate"
                                                    >
                                                        <RefreshCw size={18} className={isActionLoading[task.id] === 'regenerate' ? 'animate-spin' : ''} />
                                                    </button>
                                                    {!isCompleted && (
                                                        <button
                                                            onClick={() => handleAction(task.id, 'decompose')}
                                                            disabled={!!isActionLoading[task.id]}
                                                            className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {isActionLoading[task.id] === 'decompose' && <Loader2 size={14} className="animate-spin" />}
                                                            <Puzzle size={14} />
                                                            Decompose Image
                                                        </button>
                                                    )}

                                                    {/* Make 3D Button */}
                                                    {hasFullImage && !task.asset_model_url && (
                                                        <button
                                                            onClick={() => handleAction(task.id, 'make-3d')}
                                                            disabled={!!isActionLoading[task.id]}
                                                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-600/30 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {isActionLoading[task.id] === 'make-3d' && <Loader2 size={14} className="animate-spin" />}
                                                            <Box size={14} />
                                                            Make 3D
                                                        </button>
                                                    )}

                                                    {/* 3D Ready Badge */}
                                                    {task.asset_model_url && (
                                                        <div className="px-4 py-2 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                                            <Box size={14} />
                                                            3D Ready
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Image Preview Modal */}
            {showImageModal && selectedTask && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center animate-in fade-in duration-300"
                    onClick={() => setShowImageModal(false)}
                >
                    <div className="relative w-full max-w-6xl px-8 flex flex-col items-center gap-8" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute -top-16 right-8 p-3 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full"
                        >
                            <X size={32} />
                        </button>

                        <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
                            {/* Main Image */}
                            <div className="flex-1 flex flex-col items-center gap-4">
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Master Asset</span>
                                <div className="relative group rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10">
                                    <img
                                        src={selectedTask.full_asset_url}
                                        alt={selectedTask.task_name}
                                        className="max-h-[60vh] object-contain"
                                    />
                                </div>
                            </div>

                            {/* Parts if they exist */}
                            {(selectedTask.part_1_url || selectedTask.part_2_url || selectedTask.part_3_url) && (
                                <div className="flex flex-col items-center gap-4">
                                    <span className="text-xs font-black uppercase tracking-[0.3em] text-purple-500">Decomposed Layers</span>
                                    <div className="flex lg:flex-col gap-4">
                                        {[selectedTask.part_1_url, selectedTask.part_2_url, selectedTask.part_3_url].map((url, i) => url && (
                                            <div key={i} className="group relative rounded-3xl overflow-hidden border-2 border-white/10 hover:border-blue-500/50 transition-all shadow-xl bg-white/5 p-2">
                                                <img
                                                    src={url}
                                                    alt={`Part ${i + 1}`}
                                                    className="w-32 h-32 lg:w-40 lg:h-40 object-cover rounded-2xl"
                                                />
                                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-[10px] font-black px-2 py-1 rounded-lg text-white border border-white/20">
                                                    PART {i + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black text-white tracking-tight">{selectedTask.task_name}</h2>
                            <p className="text-gray-400 font-medium">{chapter?.title} • Task Asset</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Prompt View/Edit Modal */}
            {showPromptModal && selectedTask && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-8" onClick={() => setShowPromptModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-gray-900">Generation Prompt</h2>
                            <button
                                onClick={() => setShowPromptModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Task Name
                            </label>
                            <p className="text-lg font-bold text-gray-900">{selectedTask.task_name}</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Prompt (editable)
                            </label>
                            <textarea
                                value={editedPrompt}
                                onChange={(e) => setEditedPrompt(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none font-mono text-sm"
                                placeholder="Enter your custom prompt..."
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowPromptModal(false)}
                                className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRegenerateWithPrompt}
                                disabled={isActionLoading[selectedTask.id]}
                                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isActionLoading[selectedTask.id] && <Loader2 size={16} className="animate-spin" />}
                                <RefreshCw size={16} />
                                Regenerate with this Prompt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskManager;
