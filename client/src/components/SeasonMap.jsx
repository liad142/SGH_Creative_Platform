import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion } from 'framer-motion';
import { Package, Hammer, Loader2, CheckCircle2 } from 'lucide-react';

// Diamond Grid Zones - positioned to match the isometric game layout from reference
const ZONES = [
    // Row 1 (Bottom - closest to camera)
    { id: 1, top: '68%', left: '15%', zIndex: 40 },
    { id: 2, top: '75%', left: '35%', zIndex: 40 },
    { id: 3, top: '72%', left: '55%', zIndex: 40 },
    // Row 2
    { id: 4, top: '52%', left: '5%', zIndex: 30 },
    { id: 5, top: '55%', left: '25%', zIndex: 30 },
    { id: 6, top: '60%', left: '45%', zIndex: 30 },
    { id: 7, top: '55%', left: '65%', zIndex: 30 },
    // Row 3
    { id: 8, top: '38%', left: '15%', zIndex: 20 },
    { id: 9, top: '42%', left: '35%', zIndex: 20 },
    { id: 10, top: '42%', left: '55%', zIndex: 20 },
    { id: 11, top: '38%', left: '75%', zIndex: 20 },
    // Row 4 (Top - furthest)
    { id: 12, top: '22%', left: '35%', zIndex: 10 }
];

const SeasonMap = ({ season, chapters = [] }) => {
    const hasBackground = season?.map_background_url;

    return (
        <div className="w-full h-[600px] bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-slate-800 shadow-2xl relative">

            {/* Game Controls (Floating UI) */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <div className="bg-black/50 text-white px-4 py-2 rounded-full text-xs font-mono backdrop-blur-md border border-white/10 flex items-center gap-3">
                    <span>🖱️ Drag to Pan</span>
                    <span className="text-white/30">•</span>
                    <span>📜 Scroll to Zoom</span>
                </div>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 z-50 flex items-center gap-4 px-4 py-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Generated</span>
                </div>
                <div className="flex items-center gap-2">
                    <Package size={12} className="text-amber-400" />
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Pending</span>
                </div>
            </div>

            {/* Infinite Canvas with Pan/Zoom */}
            <TransformWrapper
                initialScale={0.8}
                minScale={0.3}
                maxScale={3}
                centerOnInit={true}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
            >
                <TransformComponent
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{ width: '100%', height: '100%' }}
                >
                    <div
                        className="relative w-[2000px] h-[1500px]"
                        style={{
                            backgroundImage: hasBackground
                                ? `url(${season.map_background_url})`
                                : 'radial-gradient(circle at 50% 50%, #1e3a5f 0%, #0f172a 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {/* Fallback Grid Pattern */}
                        {!hasBackground && (
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                    backgroundSize: '50px 50px'
                                }}
                            />
                        )}

                        {/* Interactive Zones */}
                        {ZONES.map((zone, index) => {
                            const chapter = chapters[index];
                            if (!chapter) {
                                // Empty zone placeholder
                                return (
                                    <div
                                        key={zone.id}
                                        className="absolute border-2 border-dashed border-white/10 rounded-xl bg-white/5"
                                        style={{
                                            top: zone.top,
                                            left: zone.left,
                                            width: '200px',
                                            height: '150px',
                                            zIndex: zone.zIndex
                                        }}
                                    >
                                        <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">
                                            Zone {zone.id}
                                        </div>
                                    </div>
                                );
                            }

                            const tasks = chapter.tasks || chapter.chapter_tasks || [];
                            const completedCount = tasks.filter(t =>
                                t.status === 'generated' || t.status === 'completed' || t.status === 'parts_ready'
                            ).length;

                            return (
                                <motion.div
                                    key={zone.id}
                                    className="absolute border-2 border-white/20 bg-black/40 backdrop-blur-sm rounded-xl p-3 cursor-pointer transition-colors"
                                    style={{
                                        top: zone.top,
                                        left: zone.left,
                                        width: '200px',
                                        height: '160px',
                                        zIndex: zone.zIndex
                                    }}
                                    whileHover={{
                                        scale: 1.08,
                                        zIndex: 100,
                                        borderColor: 'rgba(250, 204, 21, 0.8)',
                                        backgroundColor: 'rgba(0, 0, 0, 0.6)'
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                >
                                    {/* Zone Header */}
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-10 uppercase tracking-tight">
                                        CH {chapter.chapter_index || index + 1}: {chapter.chapter_title || chapter.title}
                                    </div>

                                    {/* Progress Badge */}
                                    <div className="absolute -top-3 right-2 bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                                        {completedCount}/{tasks.length}
                                    </div>

                                    {/* Task Grid Inside Zone */}
                                    <div className="grid grid-cols-3 gap-1.5 h-full content-center mt-2">
                                        {tasks.slice(0, 6).map((task) => (
                                            <TaskCell key={task.id} task={task} />
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
};

// Individual Task Cell with game-like animations
const TaskCell = ({ task }) => {
    const isGenerated = task.status === 'generated' || task.status === 'completed' || task.status === 'parts_ready';
    const isGenerating = task.status === 'generating';
    const hasImage = isGenerated && task.full_asset_url;

    if (isGenerating) {
        return (
            <div className="aspect-square relative flex items-center justify-center bg-blue-500/20 rounded-lg border border-blue-400/30 animate-pulse">
                <Loader2 size={16} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    if (hasImage) {
        return (
            <motion.div
                className="aspect-square relative group"
                initial={{ opacity: 0, scale: 0, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <motion.img
                    src={task.full_asset_url}
                    alt={task.task_name}
                    className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] rounded-lg"
                    whileHover={{ y: -4, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                />
                {/* Completed checkmark */}
                {(task.status === 'completed' || task.status === 'parts_ready') && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <CheckCircle2 size={10} className="text-white" />
                    </div>
                )}
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-[8px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {task.task_name}
                </div>
            </motion.div>
        );
    }

    // Pending state - Construction Site
    return (
        <motion.div
            className="aspect-square relative flex items-center justify-center bg-white/10 rounded-lg border border-white/10 group cursor-help"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            title={task.task_name}
        >
            <div className="flex flex-col items-center gap-0.5">
                <Package size={14} className="text-amber-400/60" />
            </div>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-[8px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                🔨 {task.task_name}
            </div>
        </motion.div>
    );
};

export default SeasonMap;
