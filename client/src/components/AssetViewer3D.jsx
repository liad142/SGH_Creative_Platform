import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Gltf, Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

/**
 * Loading indicator shown while 3D model loads
 */
function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 size={24} className="animate-spin text-blue-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider">
                    {progress.toFixed(0)}%
                </span>
            </div>
        </Html>
    );
}

/**
 * Auto-rotating model wrapper
 */
function RotatingModel({ url, scale = 1 }) {
    const groupRef = useRef();

    // Gentle auto-rotation when not being interacted with
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.3;
        }
    });

    return (
        <group ref={groupRef}>
            <Gltf
                src={url}
                scale={scale}
                castShadow
                receiveShadow
            />
        </group>
    );
}

/**
 * AssetViewer3D - Renders a 3D GLB/GLTF model with orbit controls
 * 
 * @param {string} url - URL to the .glb or .gltf file
 * @param {number} scale - Scale multiplier for the model (default: 1)
 * @param {boolean} autoRotate - Whether to auto-rotate the model (default: true)
 * @param {string} className - Additional CSS classes
 */
export function AssetViewer3D({
    url,
    scale = 1,
    autoRotate = true,
    className = ''
}) {
    if (!url) {
        return null;
    }

    return (
        <div className={`w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden ${className}`}>
            <Canvas
                camera={{
                    position: [4, 3, 4],
                    fov: 45,
                    near: 0.1,
                    far: 100
                }}
                shadows
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: true
                }}
            >
                {/* Ambient fill light */}
                <ambientLight intensity={0.4} />

                {/* Key light */}
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />

                {/* Rim light for that glossy clay look */}
                <directionalLight
                    position={[-5, 5, -5]}
                    intensity={0.3}
                    color="#b0c4de"
                />

                {/* Environment for reflections (makes clay look premium) */}
                <Environment preset="city" />

                {/* The 3D Model */}
                <Suspense fallback={<Loader />}>
                    {autoRotate ? (
                        <RotatingModel url={url} scale={scale} />
                    ) : (
                        <Gltf
                            src={url}
                            scale={scale}
                            castShadow
                            receiveShadow
                        />
                    )}
                </Suspense>

                {/* Soft contact shadow on the ground plane */}
                <ContactShadows
                    position={[0, -1, 0]}
                    opacity={0.5}
                    scale={10}
                    blur={2}
                    far={4}
                />

                {/* Orbit Controls */}
                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minDistance={2}
                    maxDistance={10}
                    autoRotate={false} // We handle rotation in RotatingModel
                    autoRotateSpeed={2}
                    dampingFactor={0.05}
                    enableDamping
                />
            </Canvas>
        </div>
    );
}

/**
 * Compact version for use in isometric grid - transparent background
 * Mouse interactions disabled to allow drag-and-drop on parent
 * Memoized to prevent context loss during parent re-renders (e.g. dragging)
 */
export const AssetViewer3DCompact = React.memo(function AssetViewer3DCompact({ url, scale = 1 }) {
    return (
        <div className="w-full h-full" style={{ background: 'transparent', pointerEvents: 'none' }}>
            <Canvas
                camera={{ position: [2.5, 2, 2.5], fov: 45 }}
                dpr={[1, 1.5]} // Reduced max DPR for performance during drag
                gl={{
                    antialias: true,
                    alpha: true,  // Enable transparency
                    preserveDrawingBuffer: false, // Optimization: false unless needed for screenshots
                    powerPreference: "high-performance"
                }}
                style={{ background: 'transparent', pointerEvents: 'none' }}
            >
                {/* Lighting setup for nice clay look */}
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
                <directionalLight position={[-3, 4, -3]} intensity={0.3} color="#a8dadc" />

                {/* Environment for reflections */}
                <Environment preset="city" />

                <Suspense fallback={<Loader />}>
                    <RotatingModel url={url} scale={scale} />
                </Suspense>

                {/* Contact shadow for grounding effect */}
                <ContactShadows
                    position={[0, -0.6, 0]}
                    opacity={0.35}
                    scale={5}
                    blur={2}
                    far={2}
                />

                {/* Auto rotate only, no user interaction */}
                <OrbitControls
                    enablePan={false}
                    enableZoom={false}
                    enableRotate={false}
                    autoRotate
                    autoRotateSpeed={2.5}
                />
            </Canvas>
        </div>
    );
}); // No custom comparison needed, standard shallow prop compare is fine for url/scale

export default AssetViewer3D;
