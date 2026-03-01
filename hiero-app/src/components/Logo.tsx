import React from 'react';

const Logo: React.FC = () => {
    return (
        <div className="flex justify-center mb-6">
            <img 
                src="/path/to/logo.png" 
                alt="Hiero Logo" 
                className="w-32 h-32 glow" 
            />
        </div>
    );
};

export default Logo;