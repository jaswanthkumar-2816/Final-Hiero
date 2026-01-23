import React from 'react';
import { useHistory } from 'react-router-dom';
import Logo from './Logo';

const LoginSelectionScreen = () => {
    const history = useHistory();

    const handleStudentLogin = () => {
        history.push('/student-login');
    };

    const handleJobSeekerLogin = () => {
        history.push('/jobseeker-login');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black">
            <Logo />
            <h1 className="text-4xl text-green-500 glow mt-4">Welcome to Hiero</h1>
            <div className="mt-8">
                <button 
                    className="bg-transparent border border-green-500 text-green-500 py-2 px-4 rounded-lg text-xl glow hover:bg-green-500 hover:text-black transition duration-300 mr-4"
                    onClick={handleStudentLogin}
                >
                    Login as Student
                </button>
                <button 
                    className="bg-transparent border border-green-500 text-green-500 py-2 px-4 rounded-lg text-xl glow hover:bg-green-500 hover:text-black transition duration-300"
                    onClick={handleJobSeekerLogin}
                >
                    Login as Job Seeker
                </button>
            </div>
        </div>
    );
};

export default LoginSelectionScreen;