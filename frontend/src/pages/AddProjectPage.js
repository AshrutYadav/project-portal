import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const BackIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
);

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

function AddProjectPage() {
    const navigate = useNavigate();
    const [domains, setDomains] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        domainId: "",
        startDate: "",
        deadline: "",
        status: "Proposed",
        members: [{ collegeId: "", name: "", role: "Lead" }]
    });

    useEffect(() => {
        api.get("/domains")
            .then(res => {
                setDomains(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, domainId: res.data[0]._id }));
                }
            })
            .catch(err => console.error("Failed to fetch domains:", err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMemberChange = (index, field, value) => {
        const newMembers = [...formData.members];

        // If assigning a new Lead, demote any existing Lead to Member
        if (field === "role" && value === "Lead") {
            newMembers.forEach(m => m.role = "Member");
        }

        newMembers[index][field] = value;
        setFormData(prev => ({ ...prev, members: newMembers }));
    };

    const addMember = () => {
        setFormData(prev => ({
            ...prev,
            members: [...prev.members, { collegeId: "", name: "", role: "Member" }]
        }));
    };

    const removeMember = (index) => {
        const newMembers = formData.members.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, members: newMembers }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (!formData.title) throw new Error("Project TITLE is required");

            const cleanedMembers = formData.members.filter(m => m.collegeId && m.collegeId.trim() !== "");

            const seenIds = new Set();
            for (const m of cleanedMembers) {
                const id = m.collegeId.trim().toUpperCase();
                if (seenIds.has(id)) {
                    throw new Error(`Duplicate operative ID detected: ${id}`);
                }
                seenIds.add(id);
            }

            const payload = {
                ...formData,
                members: cleanedMembers.map(m => ({
                    role: m.role,
                    name: (m.name || "").trim() ? `${m.collegeId.trim().toUpperCase()} - ${(m.name || "").trim()}` : m.collegeId.trim().toUpperCase()
                }))
            };

            const res = await api.post("/projects", payload);
            navigate(`/project/${res.data._id}`);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to create project");
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-[#070B0E] font-mono text-gray-300 p-4 md:p-8 selection:bg-[#5EC285] selection:text-white flex flex-col relative overflow-hidden">

            {/* Background Graphic */}
            <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] opacity-[0.05] pointer-events-none select-none z-0">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#69D999] fill-none" strokeWidth="0.5">
                    <circle cx="100" cy="100" r="80" strokeDasharray="4 4" />
                    <circle cx="100" cy="100" r="60" strokeDasharray="2 6" />
                    <line x1="100" y1="0" x2="100" y2="200" strokeDasharray="2 8" />
                    <line x1="0" y1="100" x2="200" y2="100" strokeDasharray="2 8" />
                </svg>
            </div>

            <div className="max-w-4xl mx-auto w-full relative z-10 flex-1 flex flex-col h-full space-y-6 overflow-hidden">

                {/* HEADER */}
                <div className="bg-[#11161B] rounded-2xl p-5 shadow-2xl border border-[#1F2932] relative shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center text-[#5C8A70] hover:text-[#69D999] transition-colors group w-max text-[11px] tracking-widest"
                        >
                            <span className="transform group-hover:-translate-x-1 transition-transform"><BackIcon /></span>
                            <span className="ml-1">ABORT_OPERATION</span>
                        </button>
                        <div className="text-[10px] text-[#5C8A70] opacity-80 tracking-widest hidden sm:block">
                            [root:initiate_new_project_sequence]&gt;_
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-wider flex items-center">
                        <span className="text-[#69D999] mr-3 text-xl">&gt;</span> [ INITIALIZE_NEW_PROJECT ]
                    </h1>
                </div>

                {/* FORM CONTAINER */}
                <div className="flex-1 bg-[#11161B] rounded-2xl p-5 md:p-8 shadow-2xl border border-[#1F2932] overflow-y-auto custom-scrollbar relative">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <div className="p-3 border border-[#D96969] bg-[#3A1C1C] text-[#FF8A8A] text-[13px] rounded tracking-wide">
                                [ ERROR_LOG ]: {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* TITLE */}
                            <div className="space-y-3 md:col-span-2">
                                <label className="block text-[11px] text-[#629778] tracking-widest font-bold">
                                    PROJECT_TITLE <span className="text-[#D96969]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    autoFocus
                                    placeholder="Enter Operation Designation..."
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full bg-[#0A0F13] border border-[#212A31] focus:border-[#69D999] rounded text-[14px] text-gray-200 p-3.5 outline-none transition-colors"
                                />
                            </div>

                            {/* DESCRIPTION */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-[11px] text-[#629778] tracking-widest font-bold">
                                    PROJECT_DESCRIPTION
                                </label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    placeholder="Detail the parameters of the operation..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-[#0A0F13] border border-[#212A31] focus:border-[#69D999] rounded text-[13px] text-gray-300 p-3 outline-none transition-colors resize-none custom-scrollbar"
                                ></textarea>
                            </div>

                            {/* DOMAIN */}
                            <div className="space-y-2">
                                <label className="block text-[11px] text-[#629778] tracking-widest font-bold">
                                    ASSIGN_DOMAIN
                                </label>
                                <div className="relative">
                                    <select
                                        name="domainId"
                                        value={formData.domainId}
                                        onChange={handleChange}
                                        className="w-full bg-[#0A0F13] border border-[#212A31] focus:border-[#69D999] rounded text-[13px] text-gray-300 p-3 outline-none transition-colors appearance-none"
                                    >
                                        <option value="" disabled>Select Domain Parameter</option>
                                        {domains.map(domain => (
                                            <option key={domain._id} value={domain._id}>{domain.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C8A70]">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                </div>
                            </div>

                            {/* STATUS */}
                            <div className="space-y-2">
                                <label className="block text-[11px] text-[#629778] tracking-widest font-bold">
                                    INITIAL_STATUS
                                </label>
                                <div className="relative">
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-[#0A0F13] border border-[#212A31] focus:border-[#69D999] rounded text-[13px] text-gray-300 p-3 outline-none transition-colors appearance-none"
                                    >
                                        <option value="Proposed">Proposed</option>
                                        <option value="Active">Active</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C8A70]">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                </div>
                            </div>

                            {/* START DATE */}
                            <div className="space-y-2">
                                <label className="block text-[11px] text-[#629778] tracking-widest font-bold">
                                    START_DATE
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full bg-[#0A0F13] border border-[#212A31] focus:border-[#69D999] rounded text-[13px] text-gray-300 p-3 outline-none transition-colors [color-scheme:dark]"
                                />
                            </div>

                            {/* DEADLINE */}
                            <div className="space-y-2">
                                <label className="block text-[11px] text-[#629778] tracking-widest font-bold">
                                    DEADLINE
                                </label>
                                <input
                                    type="date"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    className="w-full bg-[#0A0F13] border border-[#212A31] focus:border-[#69D999] rounded text-[13px] text-gray-300 p-3 outline-none transition-colors [color-scheme:dark]"
                                />
                            </div>

                        </div>

                        {/* MEMBERS SECTION */}
                        <div className="pt-6 mt-6 border-t border-[#1F2932]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[14px] font-bold text-gray-200 tracking-wider">
                                    &gt; ASSIGN_OPERATIVES
                                </h3>
                                <button
                                    type="button"
                                    onClick={addMember}
                                    className="flex items-center space-x-1 text-[#5C8A70] hover:text-[#69D999] text-[11px] tracking-widest transition-colors border border-[#212A31] hover:border-[#69D999] px-3 py-1.5 rounded bg-[#0A0F13]"
                                >
                                    <PlusIcon />
                                    <span>ADD_MEMBER</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.members.map((member, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[#0A0F13] p-3 rounded border border-[#1A2228] focus-within:border-[#304137] transition-colors">
                                        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                                          <span className="text-[#3A4A41] text-[10px] w-6 font-bold shrink-0">0{index + 1}</span>
                                          <button
                                              type="button"
                                              onClick={() => removeMember(index)}
                                              className="p-1.5 text-gray-500 hover:text-[#D96969] transition-colors shrink-0 sm:hidden"
                                              title="Remove Member"
                                          >
                                              <TrashIcon />
                                          </button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row flex-1 gap-4 w-full mt-2 sm:mt-0">
                                            <input
                                                type="text"
                                                placeholder="OPERATIVE_ID"
                                                value={member.collegeId || ""}
                                                onChange={(e) => handleMemberChange(index, "collegeId", e.target.value.toUpperCase())}
                                                className="w-full sm:w-1/3 bg-[#11161B] sm:bg-transparent border border-[#212A31] sm:border-0 sm:border-b focus:border-[#69D999] rounded sm:rounded-none outline-none text-[13px] text-[#69D999] placeholder-[#2A3F33] uppercase p-2.5 sm:pb-1 sm:p-0"
                                            />
                                            <input
                                                type="text"
                                                placeholder="OPERATIVE_NAME"
                                                value={member.name || ""}
                                                onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                                                className="w-full sm:w-2/3 bg-[#11161B] sm:bg-transparent border border-[#212A31] sm:border-0 sm:border-b focus:border-[#69D999] rounded sm:rounded-none outline-none text-[13px] text-gray-300 placeholder-[#2A3F33] p-2.5 sm:pb-1 sm:p-0"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0">
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleMemberChange(index, "role", e.target.value)}
                                                className="bg-[#11161B] border border-[#212A31] text-gray-400 text-[11px] p-2 sm:p-1.5 rounded outline-none w-full sm:w-28 shrink-0 tracking-widest uppercase cursor-pointer"
                                            >
                                            <option value="Lead">Lead</option>
                                            <option value="Member">Member</option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => removeMember(index)}
                                            className="p-1.5 text-gray-500 hover:text-[#D96969] transition-colors shrink-0 hidden sm:block"
                                            title="Remove Member"
                                        >
                                            <TrashIcon />
                                        </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <div className="pt-6 mt-4 border-t border-[#1F2932] flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center space-x-3 px-6 py-3 border border-[#193A27] rounded text-[#69D999] bg-[#0B1510] hover:bg-[#101D17] transition-all shadow-[0_0_15px_rgba(25,58,39,0.3)] hover:shadow-[0_0_20px_rgba(105,217,153,0.4)] tracking-widest font-bold text-[13px] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="animate-pulse">PROCESSING...</span>
                                ) : (
                                    <>
                                        <span>EXECUTE_INITIALIZATION</span>
                                        <span className="text-lg leading-none translate-y-[-1px]">&gt;</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddProjectPage;
