import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { loginJobSeeker } from '../services/api';

const JobSeekerLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await loginJobSeeker(email, password);
            history.push('/dashboard'); // Redirect to dashboard or another page after successful login
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-black">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl text-white mb-4">Job Seeker Login</h2>
                {error && <p className="text-red-500">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-white mb-2" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 rounded border border-gray-600"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-white mb-2" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 rounded border border-gray-600"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JobSeekerLogin;