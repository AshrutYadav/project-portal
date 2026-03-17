import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import { socket } from "../socket/socket";

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
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

function ProjectChat({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

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

  // 1️⃣ Load previous messages
  useEffect(() => {
    api.get(`/messages/${projectId}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error(err));
  }, [projectId]);

  // 2️⃣ Join room + listen for new messages
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      socket.emit("authenticate", token);
    }

    socket.emit("joinProject", { projectId });

    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [projectId]);

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      projectId,
      message,
    });

    setMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0D141A] rounded-xl border border-[#1F2932] overflow-hidden">

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 min-h-0 bg-[#0A0F13]">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#5C8A70] tracking-widest text-[12px] opacity-70">
            [ COMMS_LOG_EMPTY ]
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystemObj = msg.sender === "System" || !msg.sender;
            const isMe = msg.sender === myCollegeId;

            return (
              <div key={index} className={`flex w-full animate-fade-in group ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`flex flex-col max-w-[85%] ${isSystemObj ? 'items-center text-center w-full my-2' :
                    isMe ? 'items-end' : 'items-start'
                    }`}
                >

                  {/* Message Bubble with Name Inside */}
                  <div
                    className={`flex flex-col px-4 py-2.5 rounded-2xl relative min-w-[120px] ${isSystemObj ? 'bg-transparent text-gray-500 border border-[#1F2932] rounded-md text-[11px] px-3 py-1' :
                      isMe ? 'bg-[#101D17] text-gray-200 border border-[#193A27] rounded-tr-[4px] shadow-[0_4px_10px_rgba(25,58,39,0.15)]' :
                        'bg-[#1A2228] text-gray-300 border border-[#212A31] rounded-tl-[4px] shadow-[0_4px_10px_rgba(0,0,0,0.2)]'
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
                    <div className="flex items-end justify-between space-x-4">
                      <span className="text-[13px] leading-snug break-words flex-1">
                        {msg.message}
                      </span>
                      <span className={`text-[10px] translate-y-1 opacity-60 shrink-0 ${isMe ? 'text-[#5EC285]' : 'text-gray-500'}`}>
                        {msg.timestamp || msg.createdAt ? new Date(msg.timestamp || msg.createdAt).toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" }) : new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" })}
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
      <div className="p-3 border-t border-[#1F2932] bg-[#11161B] shrink-0">
        <form onSubmit={sendMessage} className="flex flex-col space-y-3">

          {/* Message Input & Submit */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 flex items-center px-3 py-2.5 bg-[#080C10] border border-[#1F2932] rounded focus-within:border-[#69D999] transition-colors shadow-inner">
              <span className="text-[#69D999] mr-2 font-bold opacity-70">&gt;</span>
              <input
                type="text"
                placeholder="TRANSMIT_MESSAGE..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-transparent border-none outline-none text-[14px] text-gray-200 placeholder-[#3A4A41] w-full tracking-wide"
              />
            </div>

            <button
              type="submit"
              disabled={!message.trim()}
              className="flex justify-center flex-col items-center p-3 h-full rounded bg-[#101D17] border border-[#193A27] text-[#69D999] hover:bg-[#152B1E] transition-all duration-300 shadow-[0_0_10px_rgba(25,58,39,0.2)] hover:shadow-[0_0_15px_rgba(105,217,153,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group shrink-0"
            >
              <span className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <SendIcon />
              </span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

export default ProjectChat;