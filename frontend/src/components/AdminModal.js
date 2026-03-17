import { useState, useEffect, useRef } from "react";
import api from "../api/api";

const CloseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const SecurityIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
);

function AdminModal({ onClose }) {
    const modalRef = useRef(null);
    const [userId, setUserId] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [admins, setAdmins] = useState([]);

    const userString = localStorage.getItem("user");
    const currentUser = userString ? JSON.parse(userString) : {};

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/admin/list');
            setAdmins(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handlePromote = async (e) => {
        e.preventDefault();
        if (!userId.trim()) return;

        setIsLoading(true);
        setMessage("");

        try {
            const res = await api.patch(`/admin/promote/${userId}`);
            setMessage(`[ SUCCESS: ${res.data.message || 'User promoted to Admin.'} ]`);
            setUserId("");
            fetchAdmins();
        } catch (err) {
            setMessage(`[ ERROR: ${err.response?.data?.message || 'Failed to promote user.'} ]`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async (targetId) => {
        if (!window.confirm(`Are you sure you want to revoke ROOT ACCESS from ${targetId}?`)) return;

        setIsLoading(true);
        setMessage("");

        try {
            const res = await api.patch(`/admin/revoke/${targetId}`);
            setMessage(`[ SUCCESS: ${res.data.message || 'User revoked from Admin status.'} ]`);
            fetchAdmins();
        } catch (err) {
            setMessage(`[ ERROR: ${err.response?.data?.message || 'Failed to revoke user.'} ]`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#00000099] backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4 xl:p-0 font-mono">
            <div
                ref={modalRef}
                className="bg-[#0A0F13] w-full max-w-lg flex flex-col rounded-2xl border border-[#D96969]/30 shadow-[0_0_50px_rgba(217,105,105,0.15)] relative overflow-hidden animate-slide-up max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#1F2932] bg-[#11161B] shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="text-[#D96969] animate-pulse"><SecurityIcon /></div>
                        <h2 className="text-gray-200 tracking-widest text-[14px] font-bold">
                            [ ROOT_ACCESS_REGISTRY ]
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-[#D96969] transition-colors p-1"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                    <p className="text-[#5C8A70] text-[12px] mb-6 tracking-widest leading-relaxed border-b border-[#1F2932] pb-4">
                        WARNING: Managing ROOT accessibility protocols. Promoting a user grants them ROOT privileges across all environments. Revoking strips override control. System activities are logged.
                    </p>

                    <h3 className="text-gray-400 text-[11px] font-bold tracking-widest mb-3">[ ACTIVE_ADMINISTRATORS ]</h3>

                    <div className="space-y-2 mb-8 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                        {admins.map(admin => (
                            <div key={admin._id} className="flex items-center justify-between bg-[#11161B] p-3 rounded border border-[#1F2932] group hover:border-[#3A1919] transition-colors">
                                <div className="flex items-center space-x-3 truncate">
                                    <span className="text-[#D96969] text-[12px] font-bold tracking-widest w-[110px] shrink-0">{admin.collegeId}</span>
                                    <span className="text-gray-300 text-[12px] truncate">{admin.name}</span>
                                </div>

                                {currentUser.isAdmin && admin.collegeId !== "BT25CSH022" && (
                                    <button
                                        onClick={() => handleRevoke(admin.collegeId)}
                                        className="text-gray-500 hover:text-[#D96969] p-1.5 rounded hover:bg-[#1D1010] border border-transparent hover:border-[#3A1919] transition-all ml-2 shrink-0 opacity-0 group-hover:opacity-100"
                                        title="Revoke Root Access"
                                    >
                                        <TrashIcon />
                                    </button>
                                )}
                            </div>
                        ))}
                        {admins.length === 0 && <span className="text-gray-500 text-[12px] italic">No active admins found.</span>}
                    </div>

                    {currentUser.isAdmin && (
                        <form onSubmit={handlePromote} className="space-y-4 pt-4 border-t border-[#1F2932]">
                            <div>
                                <label className="block text-[#629778] text-[10px] font-bold mb-2 tracking-widest uppercase">
                                    TARGET_OPERATIVE_ID TO PROMOTE
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. BT25CSH022"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value.toUpperCase())}
                                    className="w-full bg-[#111814] border border-[#212A31] focus:border-[#D96969] text-[#D96969] px-4 py-3 rounded-sm outline-none transition-colors duration-200 placeholder-[#3A4A41] uppercase tracking-wider text-[12px]"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !userId.trim()}
                                className="w-full flex justify-center items-center px-6 h-[46px] rounded bg-[#1D1010] border border-[#3A1919] text-[#D96969] hover:bg-[#2B1515] hover:border-[#D96969] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                <span className="text-[12px] font-bold tracking-widest">
                                    {isLoading ? "EXECUTING..." : "GRANT_ROOT_ACCESS"}
                                </span>
                            </button>
                        </form>
                    )}

                    {message && (
                        <div className={`mt-6 text-[11px] font-bold tracking-widest text-center ${message.includes('ERROR') ? 'text-[#D96969]' : 'text-[#69D999]'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminModal;
