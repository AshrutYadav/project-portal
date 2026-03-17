import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import { socket } from "../socket/socket";

const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);



const CloseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const USER_COLORS = [
    "text-[#69D999]", // Green
    "text-[#4DA8DA]", // Blue
    "text-[#BB86FC]", // Purple
    "text-[#FFB74D]", // Orange
    "text-[#F06292]", // Pink
    "text-[#4DB6AC]", // Teal
    "text-[#DCE775]", // Lime
    "text-[#FF8A65]", // Coral
    "text-[#E0E0E0]", // Light Gray
    "text-[#9575CD]"  // Deep Purple
];

const getUserColor = (username) => {
    if (!username || username === "Anonymous" || username === "System") return "text-[#69D999]";
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

function GeneralChatModal({ onClose }) {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);
    const modalRef = useRef(null);
    const userString = localStorage.getItem("user");
    const currentUser = userString ? JSON.parse(userString) : {};
    const myCollegeId = currentUser.collegeId;

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load previous messages
    useEffect(() => {
        api.get(`/general-messages`)
            .then((res) => setMessages(res.data))
            .catch((err) => console.error(err));
    }, []);

    // Join general room + listen for new messages
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            socket.emit("authenticate", token);
        }

        socket.emit("joinGeneral");

        socket.on("receiveGeneralMessage", (data) => {
            setMessages((prev) => [...prev, data]);
        });

        return () => {
            socket.off("receiveGeneralMessage");
        };
    }, []);

    const sendMessage = (e) => {
        e?.preventDefault();
        if (!message.trim()) return;

        socket.emit("sendGeneralMessage", {
            message,
        });

        setMessage("");
    };

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

    return (
        <div className="fixed inset-0 bg-[#00000099] backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4 xl:p-0">
            <div
                ref={modalRef}
                className="bg-[#0A0F13] w-[95vw] md:w-[75vw] max-w-none h-[80vh] flex flex-col rounded-2xl border border-[#1F2932] shadow-[0_0_50px_rgba(105,217,153,0.15)] relative overflow-hidden animate-slide-up"
            >

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#1F2932] bg-[#11161B] shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-[#69D999] shadow-[0_0_8px_rgba(105,217,153,0.8)] animate-pulse"></div>
                        <h2 className="text-gray-200 font-mono tracking-widest text-[14px] font-bold">
                            [ GLOBAL_COMMS_LINK ]
                        </h2>
                        <span className="bg-[#101D17] border border-[#193A27] text-[#69D999] text-[9px] px-2 py-0.5 rounded tracking-widest leading-none">
                            PUBLIC
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-[#D96969] transition-colors p-1"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 min-h-0 relative">

                    {/* Faint Background graphic */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
                        <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="#69D999" strokeWidth="0.5">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                    </div>

                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[#5C8A70] tracking-widest text-[12px] opacity-70">
                            [ INITIATING_GLOBAL_HANDSHAKE... COMMS_LOG_EMPTY ]
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isSystemObj = msg.sender === "System" || !msg.sender;
                            const isMe = msg.sender === myCollegeId;

                            return (
                                <div key={index} className={`flex w-full animate-fade-in group relative z-10 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex flex-col max-w-[85%] ${isSystemObj ? 'items-center text-center w-full my-2' : isMe ? 'items-end' : 'items-start'}`}>

                                        {/* Message Bubble */}
                                        <div
                                            className={`flex flex-col px-4 py-2.5 rounded-2xl relative min-w-[150px] ${isSystemObj ? 'bg-transparent text-gray-500 border border-[#1F2932] rounded-md text-[11px] px-3 py-1' :
                                                isMe ? 'bg-[#101D17] text-gray-200 border border-[#193A27] rounded-tr-[4px] shadow-[0_4px_10px_rgba(25,58,39,0.15)]' :
                                                    'bg-[#11161B] text-gray-300 border border-[#212A31] rounded-tl-[4px] shadow-[0_4px_10px_rgba(0,0,0,0.2)]'
                                                }`}
                                        >
                                            {/* Sender Name */}
                                            {!isSystemObj && (
                                                <div className={`flex items-center mb-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <span className={`text-[11px] uppercase tracking-widest font-bold ${getUserColor(msg.sender)}`}>
                                                        {msg.sender || "Unknown"}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Message Body and Timestamp */}
                                            <div className="flex items-end justify-between space-x-6">
                                                <span className="text-[13px] leading-relaxed break-words flex-1 font-mono">
                                                    {msg.message}
                                                </span>
                                                <span className={`text-[10px] translate-y-1 opacity-60 font-mono shrink-0 ${isMe ? 'text-[#5EC285]' : 'text-gray-500'}`}>
                                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" }) : new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-[#1F2932] bg-[#11161B] shrink-0">
                    <form onSubmit={sendMessage} className="flex flex-col space-y-3 font-mono">
                        {/* Message Input & Submit */}
                        <div className="flex items-center space-x-3">
                            <div className="flex-1 flex items-center px-4 py-3 bg-[#080C10] border border-[#1F2932] rounded focus-within:border-[#69D999] transition-colors shadow-inner">
                                <span className="text-[#69D999] mr-3 font-bold opacity-70">&gt;</span>
                                <input
                                    type="text"
                                    placeholder="TRANSMIT_GLOBAL_MESSAGE..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="bg-transparent border-none outline-none text-[14px] text-gray-200 placeholder-[#3A4A41] w-full tracking-wide"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!message.trim()}
                                className="flex justify-center items-center px-4 md:px-6 h-[46px] rounded bg-[#101D17] border border-[#193A27] text-[#69D999] hover:bg-[#152B1E] transition-all duration-300 shadow-[0_0_10px_rgba(25,58,39,0.2)] hover:shadow-[0_0_15px_rgba(105,217,153,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group shrink-0"
                            >
                                <span className="text-[12px] font-bold tracking-widest md:mr-2 hidden md:block">TRANSMIT</span>
                                <span className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                                    <SendIcon />
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}

export default GeneralChatModal;
