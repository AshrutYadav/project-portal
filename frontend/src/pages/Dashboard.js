import { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import GeneralChatModal from "../components/GeneralChatModal";
import AdminModal from "../components/AdminModal";

// Icons (Inline SVGs to avoid dependencies)
const AllIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);

const LightbulbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
);

const OngoingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><polygon points="10 8 16 12 10 16 10 8" /><path d="M10 22v-4" /><path d="M14 22v-4" /></svg>
);

const UpcomingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><circle cx="12" cy="15" r="2.5" /></svg>
);

const PastIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8" /><rect width="22" height="5" x="1" y="3" rx="1" /><line x1="10" x2="14" y1="12" y2="12" /></svg>
);

const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5L12 1Z" /></svg>
);

const SecurityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
);

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedType, setSelectedType] = useState("Ongoing");
  const [isGeneralChatOpen, setIsGeneralChatOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/projects"),
      api.get("/domains")
    ]).then(([projectsRes, domainsRes]) => {
      setProjects(projectsRes.data);
      setDomains(domainsRes.data);
    }).catch(err => console.error(err));
  }, []);

  const filteredProjects = projects.filter((project) => {
    if (selectedType === "All") return true;
    if (selectedType === "Ongoing") return project.status === "Active";
    if (selectedType === "Upcoming") return project.status === "Proposed";
    if (selectedType === "Past")
      return project.status === "Completed" || project.status === "Archived";
    return false;
  });



  const updateProjectDate = async (projectId, field, value) => {
    try {
      const res = await api.patch(`/projects/${projectId}`, { [field]: value });
      setProjects((prev) => prev.map((p) => p._id === projectId ? res.data : p));
    } catch (err) {
      console.error("Failed to update project date", err);
    }
  };

  const getIcon = (type) => {
    if (type === "All") return <AllIcon />;
    if (type === "Ongoing") return <OngoingIcon />;
    if (type === "Upcoming") return <UpcomingIcon />;
    return <PastIcon />;
  };

  return (
    <div className="flex min-h-screen bg-[#070B0E] text-gray-300 font-mono selection:bg-[#5EC285] selection:text-white relative overflow-hidden">

      {/* Mobile Menu Toggle */}
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 bg-[#11161B] border border-[#1F2932] rounded-md text-[#69D999] shadow-lg"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isSidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </div>

      {/* SIDEBAR */}
      <div className={`w-[20rem] p-8 flex flex-col z-40 selection:bg-transparent shrink-0 bg-[#070B0E] lg:bg-transparent lg:translate-x-0 absolute top-0 left-0 lg:relative h-full transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0 border-r border-[#1F2932]' : '-translate-x-full'}`}>

        {/* Top Links */}
        <div className="flex space-x-6 mb-12 text-[#688a78] text-[13px] tracking-wide">
          <div className="flex items-center space-x-2 cursor-pointer hover:text-[#5EC285] transition-colors">
            <HomeIcon />
            <span>Home</span>
          </div>
          <div className="flex items-center space-x-2 cursor-pointer hover:text-[#5EC285] transition-colors">
            <LightbulbIcon />
            <span>Suggest Project</span>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-6 text-gray-200 tracking-wider">
          Projects
        </h2>

        <div className="flex flex-col space-y-2">
          {["All", "Ongoing", "Upcoming", "Past"].map((type) => {
            const isActive = selectedType === type;
            const displayName = type === "Past" ? "Past Projects" : type === "All" ? "All Projects" : `${type} Projects`;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`relative flex items-center w-full px-5 py-3.5 rounded-xl transition-all duration-300 group
                  ${isActive
                    ? "bg-[#101D17] border border-[#193A27] text-[#69D999] shadow-[0_0_15px_rgba(25,58,39,0.3)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#0D141A] border border-transparent"
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${isActive ? "text-[#69D999]" : "text-gray-500 group-hover:text-gray-400"} transition-colors`}>
                    {getIcon(type)}
                  </div>
                  <span className="text-[15px] tracking-wide">{displayName}</span>
                </div>

                {isActive && (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#69D999] ml-5 shadow-[0_0_8px_rgba(105,217,153,0.8)]"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-l-md bg-[#5EC285] shadow-[0_0_10px_rgba(94,194,133,0.8)]"></div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom dots pattern / Action Buttons */}
        <div className="mt-auto pt-10 pb-2 space-y-4">
          <button
            className="flex items-center space-x-4 px-4 py-3 border border-[#193A27] rounded-xl hover:border-[#69D999] bg-[#0B1510] hover:bg-[#101D17] hover:shadow-[0_0_15px_rgba(25,58,39,0.3)] group cursor-pointer transition-all duration-300 w-full"
            onClick={() => setIsGeneralChatOpen(true)}
          >
            <div className="w-2 h-2 rounded-full bg-[#69D999] opacity-60 group-hover:opacity-100 transition-opacity animate-pulse shadow-[0_0_8px_rgba(105,217,153,0.8)]"></div>
            <span className="text-[#69D999] text-[13px] tracking-[0.10em] font-bold transition-colors duration-300">
              GLOBAL CHAT
            </span>
          </button>

          <button
            className="flex items-center space-x-4 px-4 py-3 border border-[#212A31] rounded-xl hover:border-[#69D999] bg-[#0D141A] hover:bg-[#101D17] hover:shadow-[0_0_15px_rgba(25,58,39,0.3)] group cursor-pointer transition-all duration-300 w-full"
            onClick={() => navigate('/create-project')}
          >
            <div className="grid grid-cols-3 gap-1.5 w-max">
              <div className="w-1.5 h-1.5 rounded-full bg-[#69D999] opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#69D999] opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#D96969] opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#D96969] opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#69D999] opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#D96969] opacity-80 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-[#5C8A70] text-[13px] tracking-[0.15em] font-bold group-hover:text-[#69D999] transition-colors duration-300">
              ADD PROJECT
            </span>
          </button>

          <button
            className="flex items-center space-x-4 px-4 py-3 border border-[#3A1919] rounded-xl hover:border-[#D96969] bg-[#150B0B] hover:bg-[#1D1010] hover:shadow-[0_0_15px_rgba(217,105,105,0.2)] group cursor-pointer transition-all duration-300 w-full mt-2"
            onClick={() => setIsAdminModalOpen(true)}
          >
            <div className="text-[#D96969] opacity-80 group-hover:opacity-100 transition-opacity animate-pulse shadow-[0_0_8px_rgba(217,105,105,0.4)]">
              <SecurityIcon />
            </div>
            <span className="text-[#D96969] text-[13px] tracking-[0.10em] font-bold transition-colors duration-300">
              ROOT REGISTRY
            </span>
          </button>

          <button
            className="flex items-center space-x-4 px-4 py-3 border border-[#302121] rounded-xl hover:border-[#D96969] bg-[#0E0B0B] hover:bg-[#140D0D] hover:shadow-[0_0_15px_rgba(217,105,105,0.2)] group cursor-pointer transition-all duration-300 w-full mt-8"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/login");
            }}
          >
            <span className="text-[#8A5C5C] text-[13px] tracking-[0.15em] font-bold group-hover:text-[#D96969] transition-colors duration-300 mx-auto">
              LOGOUT
            </span>
          </button>
        </div>
      </div>

      {/* MAIN PANEL */}
      <div className="flex-1 p-4 lg:p-8 lg:pl-0 pt-16 lg:pt-8 w-full">
        <div className="h-full bg-[#11161B] rounded-2xl p-6 lg:p-10 shadow-2xl border border-[#1F2932] relative overflow-hidden flex flex-col w-full">

          {/* Constellation graphic placeholder (bottom right lines) */}
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] opacity-[0.10] pointer-events-none select-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-gray-400 fill-none" strokeWidth="0.5">
              <circle cx="150" cy="150" r="2" fill="currentColor" />
              <circle cx="100" cy="120" r="1.5" fill="currentColor" />
              <circle cx="180" cy="90" r="1" fill="currentColor" />
              <circle cx="60" cy="160" r="1.5" fill="currentColor" />
              <line x1="150" y1="150" x2="100" y2="120" />
              <line x1="150" y1="150" x2="180" y2="90" />
              <line x1="100" y1="120" x2="60" y2="160" />
              <line x1="100" y1="120" x2="180" y2="90" />
              {/* grid lines */}
              <line x1="0" y1="180" x2="200" y2="180" strokeDasharray="2,2" />
              <line x1="20" y1="0" x2="20" y2="200" strokeDasharray="2,2" />
              <line x1="0" y1="0" x2="200" y2="200" strokeOpacity="0.5" />
            </svg>
          </div>

          {/* Terminal Text */}
          <div className="absolute top-8 right-10 text-right text-[12px] text-[#5C8A70] space-y-1 opacity-90 tracking-wider">
            <div>[cite: user@host:~]$ {selectedType.toLowerCase()}_projects &gt;_</div>
            <div>[cite: [root:{selectedType.toLowerCase()}_projects]]&gt;_</div>
          </div>

          <h2 className="text-3xl font-bold mb-8 text-gray-200 tracking-wider">
            [ DOMAINS ]
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6 relative z-10 shrink-0">
            {domains.map((domain) => (
              <div
                key={domain._id}
                onClick={() => navigate(`/domain/${domain._id}`)}
                className="group relative bg-[#0D141A] border border-[#1F2932] hover:border-[#69D999] rounded-lg p-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_5px_15px_-5px_rgba(105,217,153,0.3)] overflow-hidden"
              >
                {/* Glowing accent line top */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#69D999] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded bg-[#101D17] border border-[#193A27] flex items-center justify-center text-[#69D999] shadow-[0_0_8px_rgba(25,58,39,0.5)]">
                      <StarIcon />
                    </div>
                    <h3 className="text-[13px] font-bold text-gray-200 tracking-wide group-hover:text-[#69D999] transition-colors truncate">
                      {domain.name}
                    </h3>
                  </div>
                  <span className="text-[#5C8A70] text-[8px] tracking-widest bg-[#0A0F13] px-1 py-0.5 rounded">
                    SYS_NODE
                  </span>
                </div>

                {domain.description && (
                  <p className="text-gray-500 text-[10px] line-clamp-1 leading-relaxed pl-8">
                    {domain.description}
                  </p>
                )}

              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold mb-4 text-gray-200 tracking-wider border-t border-[#1F2932] pt-6 shrink-0">
            [ {selectedType.toUpperCase()}_PROJECTS ]
          </h2>

          <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
            {/* TABLE HEADER */}
            <div className={`hidden md:grid ${selectedType === "All" ? "grid-cols-5" : "grid-cols-4"} text-[#629778] text-[13px] border-b border-[#212A31] pb-4 mb-4 tracking-widest whitespace-nowrap`}>
              <div className="pl-4">| &lt;PROJECT_NAME&gt;</div>
              {selectedType === "All" && <div className="pl-4">| &lt;STATUS&gt;</div>}
              <div className="pl-4">| &lt;START_DATE&gt;</div>
              <div className="pl-4">| &lt;DEADLINE&gt;</div>
              <div className="pl-4">| &lt;PROJECT_LEAD&gt; |</div>
            </div>

            {/* TABLE ROWS */}
            <div className="space-y-1">
              {filteredProjects.map((project, index) => {
                const lead = project.members?.find((m) => m.role === "Lead");
                const initial = lead?.user?.name?.charAt(0) || "A";
                const leadName = lead?.user?.name || "N/A";

                return (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/project/${project._id}`)}
                    className={`grid grid-cols-1 md:${selectedType === "All" ? "grid-cols-5" : "grid-cols-4"} items-center py-4 md:py-3.5 gap-y-3 md:gap-y-0 text-[14px] text-[#8BA596] hover:bg-[#1A2228] transition-colors cursor-pointer rounded-sm border-b md:border border-[#1A2228] md:border-transparent hover:border-[#212A31] group`}
                  >
                    <div className="flex items-center space-x-3 pl-2 truncate pr-4">
                      <span className="text-[#69D999] font-bold w-3 shrink-0">
                        &gt;
                      </span>
                      <span className="tracking-wide text-gray-200 truncate">[ {project.title} ]</span>
                    </div>

                    {selectedType === "All" && (
                      <div className="tracking-widest pl-2 md:pl-4 flex items-center pr-4">
                        <span className="shrink-0 mr-3 hidden md:inline">|</span>
                        <span className="text-[12px] md:text-[10px] tracking-widest px-2 py-0.5 rounded border border-[#193A27] bg-[#101D17] text-[#69D999] opacity-80 shrink-0 truncate mt-[1px]">
                          [{project.status.toUpperCase()}]
                        </span>
                      </div>
                    )}

                    <div className="tracking-widest pl-4 flex items-center">
                      <span className="shrink-0 mr-3">|</span>
                      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[#5C8A70] mr-2">[</span>
                        <input
                          type="date"
                          value={project.startDate ? project.startDate.split('T')[0] : ""}
                          onChange={(e) => updateProjectDate(project._id, 'startDate', e.target.value)}
                          className="bg-transparent text-[#8BA596] outline-none hover:text-[#69D999] focus:text-[#69D999] cursor-pointer [color-scheme:dark] text-[12px] uppercase w-[125px]"
                        />
                        <span className="text-[#5C8A70] ml-2">]</span>
                      </div>
                    </div>

                    <div className="tracking-widest pl-2 md:pl-4 flex items-center">
                      <span className="shrink-0 mr-3 hidden md:inline">|</span>
                      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[#5C8A70] mr-2">[</span>
                        <input
                          type="date"
                          value={project.deadline ? project.deadline.split('T')[0] : ""}
                          onChange={(e) => updateProjectDate(project._id, 'deadline', e.target.value)}
                          className="bg-transparent text-[#8BA596] outline-none hover:text-[#69D999] focus:text-[#69D999] cursor-pointer [color-scheme:dark] text-[12px] uppercase w-[125px]"
                        />
                        <span className="text-[#5C8A70] ml-2">]</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-2 md:pl-4 pr-6 w-full">
                      <div className="flex items-center space-x-3 tracking-widest min-w-0">
                        <span className="shrink-0 hidden md:inline">|</span>
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border border-[#69D999] text-[#69D999] text-[10px] uppercase font-bold bg-[#69D999]/10 shrink-0">
                          {initial}
                        </div>
                        <span className="text-gray-300 truncate">{leadName} ]</span>
                      </div>
                      <div className="text-gray-600 tracking-widest leading-none mb-2 group-hover:text-[#69D999] transition-colors shrink-0 ml-4">...</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center text-[#5C8A70] py-20 tracking-wider">
                [ No projects found ]
              </div>
            )}
          </div>

          <div className="absolute bottom-6 right-6 text-gray-400 opacity-60">
            <StarIcon />
          </div>

        </div>
      </div>

      {/* Mobile Overlay for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* General Chat Modal Overlay */}
      {isGeneralChatOpen && (
        <GeneralChatModal onClose={() => setIsGeneralChatOpen(false)} />
      )}

      {/* Admin Modal Overlay */}
      {isAdminModalOpen && (
        <AdminModal onClose={() => setIsAdminModalOpen(false)} />
      )}
    </div>
  );
}

export default Dashboard;
