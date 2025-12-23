import React from 'react';
import { Dog } from 'lucide-react';

const Pets = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Pets Registry</h1>
                <p className="text-gray-500 mt-1">Manage user pets and companions.</p>
            </div>
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Dog className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Pets Registered</h3>
                <p className="text-gray-500 mt-1">The registry is currently empty.</p>
            </div>
        </div>
    );
};

export default Pets;
