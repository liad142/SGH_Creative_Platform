import React from 'react';
import { Image } from 'lucide-react';

const Album = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Cards Album</h1>
                <p className="text-gray-500 mt-1">Manage and view all collected cards.</p>
            </div>
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Image className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Cards Found</h3>
                <p className="text-gray-500 mt-1">Start generating or importing cards to see them here.</p>
            </div>
        </div>
    );
};

export default Album;
