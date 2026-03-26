import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
);

const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5L12 1Z" /></svg>
);

function DomainPage() {
  const { domainId } = useParams();
  const [projects, setProjects] = useState([]);
  const [domain, setDomain] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch Domain Details and Projects concurrently
    Promise.all([
      api.get(`/domains`),
      api.get("/projects")
    ]).then(([domainsRes, projectsRes]) => {
      const currentDomain = domainsRes.data.find(d => d._id === domainId);
      if (currentDomain) setDomain(currentDomain);

      const filtered = projectsRes.data.filter(
        (project) => project.domainId && project.domainId._id === domainId
      );
      setProjects(filtered);
    }).catch(err => console.error(err));
  }, [domainId]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB");
  };

  return (
    <div className="flex min-h-screen bg-[#070B0E] text-gray-300 font-mono selection:bg-[#5EC285] selection:text-white">
      {/* MAIN PANEL */}
      <div className="flex-1 p-4 md:p-8 w-full">
        <div className="h-full bg-[#11161B] rounded-2xl p-6 md:p-10 shadow-2xl border border-[#1F2932] relative overflow-hidden flex flex-col">

          {/* Top header & Back button */}
          <div className="flex justify-between items-start mb-10 relative z-10 text-[13px] tracking-widest">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-[#5C8A70] hover:text-[#69D999] transition-colors group"
            >
              <span className="transform group-hover:-translate-x-1 transition-transform"><BackIcon /></span>
              <span className="ml-2">[ BACK_TO_DOMAINS ]</span>
            </button>
            <div className="text-right text-[#5C8A70] space-y-1 opacity-90">
              <div>[cite: user@host:~]$ domain_nexus &gt;_</div>
              {domain && <div>[root:domain_{domain.name.toLowerCase().replace(/\s+/g, '_')}]&gt;_</div>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 mb-8 relative z-10 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-[#101D17] border border-[#193A27] flex items-center justify-center text-[#69D999] shadow-[0_0_15px_rgba(25,58,39,0.5)] shrink-0">
              <StarIcon />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-200 tracking-wider">
                [ {domain ? domain.name.toUpperCase() : "LOADING..."} ]
              </h2>
              {domain?.description && (
                <p className="text-[#5C8A70] text-[13px] mt-1 tracking-wide">{/* {domain.description} */}</p>
              )}
            </div>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
            {/* TABLE HEADER */}
            <div className="hidden md:grid grid-cols-4 text-[#629778] text-sm font-bold border-b border-[#212A31] pb-4 mb-4 tracking-widest whitespace-nowrap bg-[#0A0F13] p-3 rounded-t-md">
              <div className="pl-4">| &lt;PROJECT_NAME&gt;</div>
              <div className="pl-4">| &lt;START_DATE&gt;</div>
              <div className="pl-4">| &lt;DEADLINE&gt;</div>
              <div className="pl-4">| &lt;PROJECT_LEAD&gt; |</div>
            </div>

            {/* TABLE ROWS */}
            <div className="space-y-1">
              {projects.map((project, index) => {
                const lead = project.members?.find((m) => m.role === "Lead");
                const initial = lead?.user?.name?.charAt(0) || "A";
                const leadName = lead?.user?.name || "N/A";

                return (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/project/${project._id}`)}
                    className={`grid grid-cols-1 md:grid-cols-4 items-center py-4 md:py-4 gap-y-3 md:gap-y-0 text-[15px] text-[#8BA596] hover:bg-[#1A2228] transition-colors cursor-pointer rounded-md border-b md:border border-[#1A2228] md:border-transparent hover:border-[#212A31] group ${index % 2 === 0 ? 'bg-[#0E1318]' : 'bg-[#11161B]'}`}
                  >
                    <div className="flex items-center space-x-3 pl-2 truncate pr-4">
                      <span className="text-[#69D999] font-bold w-3 shrink-0">
                        &gt;
                      </span>
                      <span className="tracking-wide text-gray-200 truncate">[ {project.title} ]</span>
                    </div>

                    <div className="tracking-widest pl-2 md:pl-4">
                      <span className="hidden md:inline">|</span> <span className="mx-2 md:ml-2">START: [ {formatDate(project.startDate)} ] ]</span>
                    </div>

                    <div className="tracking-widest pl-2 md:pl-4">
                      <span className="hidden md:inline">|</span> <span className="mx-2 md:ml-2">DEADLINE: [ {formatDate(project.deadline)} ] ]</span>
                    </div>

                    <div className="flex items-center justify-between pl-2 md:pl-4 pr-6">
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

            {projects.length === 0 && (
              <div className="text-center text-[#5C8A70] py-20 tracking-wider">
                [ No projects found in this domain ]
              </div>
            )}
          </div>

          {/* Minimal graphic in corner */}
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] opacity-[0.05] pointer-events-none select-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#69D999] fill-none" strokeWidth="0.5">
              <circle cx="100" cy="100" r="80" strokeDasharray="4 4" />
              <circle cx="100" cy="100" r="60" strokeDasharray="2 4" />
              <circle cx="100" cy="100" r="40" />
              <line x1="100" y1="0" x2="100" y2="200" strokeOpacity="0.5" />
              <line x1="0" y1="100" x2="200" y2="100" strokeOpacity="0.5" />
            </svg>
          </div>

        </div>
      </div>
    </div>
  );
}

export default DomainPage;