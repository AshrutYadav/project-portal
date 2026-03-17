import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const LoginPage = () => {
    const [collegeId, setCollegeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { collegeId, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-[#111814] flex items-center justify-center p-4 font-mono">
            <div className="bg-[#1A2228] p-8 rounded-sm w-full max-w-md border border-[#212A31] shadow-2xl relative overflow-hidden">
                {/* Neon accent top border */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#69D999] opacity-70"></div>

                <h2 className="text-[#69D999] text-2xl mb-6 text-center font-bold tracking-widest uppercase">
                    [ ACCESS PORTAL ]
                </h2>

                {error && (
                    <div className="bg-[#2D1B1E] text-red-400 p-3 mb-6 rounded-sm text-sm border border-red-900/50 text-center">
                        &gt; ERROR: {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-[#629778] text-xs font-bold mb-2 tracking-widest uppercase">
                            Operative ID (College ID)
                        </label>
                        <input
                            type="text"
                            value={collegeId}
                            onChange={(e) => setCollegeId(e.target.value.toUpperCase())}
                            className="w-full bg-[#111814] border border-[#212A31] focus:border-[#69D999] text-[#8BA596] px-4 py-3 rounded-sm outline-none transition-colors duration-200 uppercase"
                            placeholder="e.g. BT25CSH022"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[#629778] text-xs font-bold mb-2 tracking-widest uppercase">
                            Security Key (Password)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#111814] border border-[#212A31] focus:border-[#69D999] text-[#8BA596] px-4 py-3 rounded-sm outline-none transition-colors duration-200"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#101D17] hover:bg-[#193A27] text-[#69D999] font-bold py-3 px-4 rounded-sm border border-[#193A27] hover:border-[#69D999] transition-all duration-300 uppercase tracking-widest mt-2"
                    >
                        Authenticate &gt;
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
