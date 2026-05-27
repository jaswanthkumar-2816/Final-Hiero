import React from 'react';
import { useHistory } from 'react-router-dom';
import Logo from './Logo';

const LoginSelectionScreen: React.FC = () => {
    const history = useHistory();

    const handleStudentLogin = () => {
        history.push('/student-login');
    };

    const handleJobSeekerLogin = () => {
        history.push('/jobseeker-login');
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
            <Logo />
            <h1 className="text-4xl font-bold text-green-500 glow-text mb-8">Welcome to Hiero</h1>
            <div className="flex flex-col space-y-4">
                <button
                    onClick={handleStudentLogin}
                    className="bg-green-500 text-white text-lg font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-green-600 glow-button"
                >
                    Login as Student
                </button>
                <button
                    onClick={handleJobSeekerLogin}
                    className="bg-green-500 text-white text-lg font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-green-600 glow-button"
                >
                    Login as Job Seeker
                </button>
            </div>
        </div>
    );
};

export default LoginSelectionScreen;