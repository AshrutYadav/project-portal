import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import ProjectChat from "../components/ProjectChat";

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5L12 1Z" /></svg>
);

function ProjectPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTexts, setNewTaskTexts] = useState({});
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [visibleInputFor, setVisibleInputFor] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ collegeId: "", name: "", role: "Member" });
  const [memberError, setMemberError] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);
  const [editedMemberId, setEditedMemberId] = useState("");
  const [editedMemberName, setEditedMemberName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (project) {
      setEditedTitle(project.title);
      setEditedDescription(project.description || "");
    }
  }, [project]);

  const userString = localStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : {};
  const isAdmin = currentUser.isAdmin;

  const myMember = project?.members.find(
    (m) => m.user?.collegeId === currentUser.collegeId || m.name === currentUser.collegeId
  );
  const isLead = myMember?.role === "Lead";
  const canEdit = isAdmin || isLead;

  useEffect(() => {
    // Fetch Project Details
    api.get(`/projects/${projectId}`)
      .then((res) => setProject(res.data))
      .catch((err) => console.error(err));

    // Fetch Tasks for this Project
    api.get(`/tasks/${projectId}`)
      .then((res) => setTasks(res.data))
      .catch((err) => console.error(err));
  }, [projectId]);

  const handleTaskSubmit = async (memberName) => {
    const text = newTaskTexts[memberName];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post("/tasks", {
        projectId,
        title: text.trim(),
        assignedTo: memberName,
        status: "Todo"
      });
      setTasks([...tasks, res.data]);
      setNewTaskTexts({ ...newTaskTexts, [memberName]: "" });
      setVisibleInputFor(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startEditingTask = (task) => {
    if (task.status === "Done") return; // Don't edit completed tasks
    setEditingTaskId(task._id);
    setEditTaskText(task.title);
  };

  const saveEditedTask = async (taskId) => {
    if (!editTaskText.trim()) {
      setEditingTaskId(null);
      return;
    }

    try {
      const res = await api.patch(`/tasks/${taskId}`, { title: editTaskText.trim() });
      setTasks(tasks.map((t) => (t._id === taskId ? res.data : t)));
      setEditingTaskId(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to edit task");
    }
  };

  const handleTaskToggle = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "Done" ? "Todo" : "Done";
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to toggle task completion");
    }
  };

  const saveEditedMember = async (index) => {
    const finalId = canEdit ? editedMemberId.trim().toUpperCase() : project.members[index].user?.collegeId;
    if (!editedMemberName.trim() && !finalId) {
      setEditingMemberIndex(null);
      return;
    }

    const newMembersList = [...project.members];
    const combinedName = editedMemberName.trim() ? `${finalId} - ${editedMemberName.trim()}` : finalId;
    newMembersList[index].name = combinedName;

    try {
      const res = await api.patch(`/projects/${projectId}`, { members: newMembersList });
      setProject(res.data);
    } catch (err) {
      console.error(err);
    }
    setEditingMemberIndex(null);
  };

  const updateProjectField = async (field, value) => {
    try {
      const res = await api.patch(`/projects/${projectId}`, { [field]: value });
      setProject(res.data);
    } catch (err) {
      console.error("Failed to update project", err);
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone and will delete all associated tasks and messages.")) {
      try {
        await api.delete(`/projects/${projectId}`);
        navigate("/");
      } catch (err) {
        console.error("Failed to delete project", err);
        alert(err.response?.data?.message || "Failed to delete project");
      }
    }
  };

  const handleAddMember = async () => {
    if (!newMember.collegeId.trim()) return;

    const newMembersList = [...project.members];
    // Enforce single lead
    if (newMember.role === "Lead") {
      newMembersList.forEach(m => m.role = "Member");
    }
    const combinedName = newMember.name.trim()
      ? `${newMember.collegeId.trim().toUpperCase()} - ${newMember.name.trim()}`
      : newMember.collegeId.trim().toUpperCase();

    newMembersList.push({ name: combinedName, role: newMember.role });

    try {
      setMemberError("");
      const res = await api.patch(`/projects/${projectId}`, { members: newMembersList });
      setProject(res.data);
      setNewMember({ collegeId: "", name: "", role: "Member" });
      setIsAddingMember(false);
    } catch (err) {
      console.error("Failed to add member", err);
      if (err.response && err.response.data && err.response.data.message) {
        setMemberError(err.response.data.message);
      } else {
        setMemberError("Failed to verify user ID.");
      }
    }
  };



  if (!project)
    return <p className="p-10 text-[#5C8A70] tracking-widest font-mono text-center min-h-screen bg-[#070B0E] flex items-center justify-center">[ Loading Project Data ]...</p>;



  return (
    <div className="h-screen w-screen bg-[#070B0E] font-mono text-gray-300 p-8 selection:bg-[#5EC285] selection:text-white flex flex-col relative overflow-hidden">

      {/* Background Graphic */}
      <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] opacity-[0.05] pointer-events-none select-none z-0">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#69D999] fill-none" strokeWidth="0.5">
          <circle cx="100" cy="100" r="80" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="60" strokeDasharray="2 6" />
          <circle cx="100" cy="100" r="40" strokeOpacity="0.5" />
          <line x1="100" y1="0" x2="100" y2="200" strokeDasharray="2 8" />
          <line x1="0" y1="100" x2="200" y2="100" strokeDasharray="2 8" />
        </svg>
      </div>

      <div className="w-full lg:px-4 relative z-10 flex-1 flex flex-col h-full space-y-4 lg:space-y-6 overflow-hidden">

        {/* HEADER */}
        <div className="bg-[#11161B] rounded-2xl md:p-3 px-4 py-4 md:px-5 shadow-2xl border border-[#1F2932] relative shrink-0">

          {/* Top terminal detail */}
          <div className="absolute top-3 right-5 text-right text-[9px] text-[#5C8A70] space-y-1 opacity-80 tracking-widest pl-2 z-10 hidden sm:block">
            <div>[root:project_{projectId.substring(0, 6)}]&gt;_</div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-[#5C8A70] hover:text-[#69D999] transition-colors group w-max text-[11px] tracking-widest"
            >
              <span className="transform group-hover:-translate-x-1 transition-transform"><BackIcon /></span>
              <span className="ml-1">BACK_TO_DASHBOARD</span>
            </button>
            {canEdit && (
              <button
                onClick={handleDeleteProject}
                className="relative lg:right-[245px] flex items-center text-[#8A5C5C] hover:text-[#D96969] transition-colors w-max text-[10px] tracking-widest border border-transparent hover:border-[#D96969] px-2 py-1 rounded bg-[#1A0A0A] hover:bg-[#2A0F0F] group ml-auto"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 opacity-80 group-hover:opacity-100"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>[ DELETE_PROJECT ]</span>
              </button>
            )}
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold mb-1 text-gray-200 tracking-wider flex items-center w-full">
                <span className="text-[#69D999] mr-2 text-lg shrink-0 hidden sm:inline">&gt;</span>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={() => {
                    if (editedTitle.trim() && editedTitle.trim() !== project.title && canEdit) {
                      updateProjectField('title', editedTitle.trim());
                    } else {
                      setEditedTitle(project.title);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.target.blur();
                    if (e.key === 'Escape') {
                      setEditedTitle(project.title);
                      e.target.blur();
                    }
                  }}
                  readOnly={!canEdit}
                  className={`bg-transparent border-b border-transparent ${canEdit ? "focus:border-[#69D999] hover:border-[#304137]" : "opacity-90"} text-gray-200 outline-none transition-colors w-full`}
                />
              </h1>

              <div className="flex items-center mt-1">
                <span className="text-[#5C8A70] text-[12px] mr-1 truncate w-min">{/* DESC: */}</span>
                <input
                  type="text"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onBlur={() => {
                    if (editedDescription.trim() !== (project.description || "") && canEdit) {
                      updateProjectField('description', editedDescription.trim());
                    } else {
                      setEditedDescription(project.description || "");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.target.blur();
                    if (e.key === 'Escape') {
                      setEditedDescription(project.description || "");
                      e.target.blur();
                    }
                  }}
                  readOnly={!canEdit}
                  className={`bg-transparent border-b border-transparent ${canEdit ? "focus:border-[#69D999] hover:border-[#304137]" : "opacity-80"} text-gray-400 text-[12px] outline-none transition-colors w-full`}
                  placeholder="[ NO DESCRIPTION ]"
                />
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 text-[#8BA596] text-[11px] tracking-widest bg-[#0D141A] p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#1F2932] w-full xl:w-max shrink-0 mt-2 xl:mt-0">
              <div className="flex items-center flex-1 sm:flex-none justify-between sm:justify-start">
                <span className="mr-2 sm:hidden inline font-bold">STAT:</span>
                <span className="mr-2 hidden sm:inline">STATUS:</span>
                <select
                  value={project.status}
                  onChange={(e) => updateProjectField('status', e.target.value)}
                  disabled={!canEdit}
                  className={`px-1.5 py-0.5 bg-[#101D17] border border-[#193A27] text-[#69D999] rounded text-[10px] shadow-[0_0_10px_rgba(25,58,39,0.3)] outline-none ${canEdit ? "cursor-pointer" : "opacity-80"} tracking-widest uppercase appearance-none text-center`}
                >
                  <option value="Proposed">[PROPOSED]</option>
                  <option value="Active">[ACTIVE]</option>
                  <option value="Completed">[COMPLETED]</option>
                </select>
              </div>

              <span className="text-[#4A5D53] hidden sm:inline">|</span>

              <div className="flex sm:flex-col sm:space-y-0.5 justify-between w-full sm:w-auto mt-2 sm:mt-0">
                <div className="flex sm:justify-between items-center w-auto sm:w-48 relative group/date mt-1 sm:mt-0">
                  <span>DEADLINE:</span>
                  <input
                    type="date"
                    value={project.deadline ? project.deadline.split('T')[0] : ""}
                    onChange={(e) => updateProjectField('deadline', e.target.value)}
                    disabled={!canEdit}
                    className={`bg-transparent text-gray-300 text-[11px] outline-none tracking-widest text-right ${canEdit ? "cursor-pointer hover:text-[#69D999]" : "opacity-80"} [color-scheme:dark] w-[125px]`}
                  />
                  <div className="absolute right-0 bottom-[-2px] w-0 h-[1px] bg-[#69D999] group-hover/date:w-[125px] transition-all duration-300"></div>
                </div>
                <div className="flex justify-between items-center w-36 sm:w-48 relative group/date">
                  <span>CREATED:</span>
                  <input
                    type="date"
                    value={project.startDate ? project.startDate.split('T')[0] : ""}
                    onChange={(e) => updateProjectField('startDate', e.target.value)}
                    disabled={!canEdit}
                    className={`bg-transparent text-gray-300 text-[11px] outline-none tracking-widest text-right ${canEdit ? "cursor-pointer hover:text-[#69D999]" : "opacity-80"} [color-scheme:dark] w-[125px]`}
                  />
                  <div className="absolute right-0 bottom-[-2px] w-0 h-[1px] bg-[#69D999] group-hover/date:w-[125px] transition-all duration-300"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONNECT WITH MEMBERS BUTTON (Chat Toggle) */}
        <div className="flex justify-end pr-2 pt-0 pb-1 shrink-0 relative z-10 w-full mb-1 h-10">
          {(myMember || isAdmin) && (
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center space-x-3 px-4 py-2 border rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(25,58,39,0.2)] hover:shadow-[0_0_20px_rgba(105,217,153,0.4)]
                  ${isChatOpen
                  ? "bg-[#101D17] border-[#69D999] text-[#69D999]"
                  : "bg-[#0D141A] border-[#212A31] text-[#5C8A70] hover:text-[#69D999] hover:border-[#69D999]"}`}
            >
              <div className="w-2 h-2 rounded-full bg-[#69D999] shadow-[0_0_8px_rgba(105,217,153,0.8)] animate-pulse"></div>
              <span className="text-[11px] tracking-widest font-bold">
                {isChatOpen ? "[ CLOSE_SECURE_CHANNEL ]" : "CONNECT WITH MEMBERS"}
              </span>
            </button>
          )}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 lg:gap-6 overflow-hidden relative z-10 w-full transition-all duration-500 ease-in-out">

          {/* LEFT SIDE (MEMBERS & TASKS UNIFIED TABLE) */}
          <div className={`bg-[#11161B] rounded-xl border border-[#1F2932] shadow-2xl flex flex-col min-h-0 overflow-hidden transition-all duration-500 ease-in-out
              ${isChatOpen ? "h-1/2 lg:h-auto lg:w-[55%]" : "h-full w-full"}`}
          >
            {/* TABLE HEADER (Unified) */}
            <div className="md:flex hidden w-full border-b border-[#212A31] text-[#629778] tracking-[0.2em] font-bold text-[13px] bg-[#0A0F13] shrink-0">
              <div className="w-1/3 p-4 pl-6 border-r border-[#212A31] flex items-center">
                <span>[ TEAM_MEMBERS ]</span>
              </div>
              <div className="w-2/3 p-4 pl-6 flex items-center">
                <span>[ CONTRIBUTIONS ]</span>
              </div>
            </div>

            {/* TABLE BODY */}
            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {project.members.map((member, index) => {
                const displayId = member.user?.collegeId || member.name || "UNKNOWN";
                const initial = displayId.charAt(0);
                const memberTasks = tasks.filter(t => t.assignedTo === displayId);

                const isSelf = member.user?.collegeId === currentUser.collegeId;
                const canEditOnlyName = !canEdit && isSelf;

                return (
                  <div key={index} className="flex flex-col md:flex-row w-full border-b border-[#1A2228] hover:bg-[#151B20] transition-colors group relative">

                    {/* Member Column */}
                    <div className="w-full md:w-1/3 p-3 md:p-4 md:pl-6 border-b md:border-b-0 md:border-r border-[#212A31] flex justify-between items-start bg-[#0A0F13] md:bg-transparent">
                      <div className="flex items-center space-x-3 truncate w-full">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border border-[#69D999] text-[#69D999] text-[11px] uppercase font-bold bg-[#69D999]/10 shrink-0">
                          {initial}
                        </div>
                        {editingMemberIndex === index ? (
                          <div
                            className="flex items-center space-x-3 w-full"
                            onBlur={(e) => {
                              // If there is no relatedTarget (clicked outside window) 
                              // or if relatedTarget is not inside this div, then save
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                saveEditedMember(index);
                              }
                            }}
                          >
                            {canEdit ? (
                              <input
                                type="text"
                                placeholder="ID"
                                value={editedMemberId}
                                onChange={(e) => setEditedMemberId(e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditedMember(index);
                                  if (e.key === 'Escape') setEditingMemberIndex(null);
                                }}
                                className="bg-transparent border-b border-[#69D999] text-[#5C8A70] text-[12px] font-bold outline-none w-[110px] shrink-0 uppercase"
                              />
                            ) : (
                              <span className="text-[#5C8A70] text-[12px] font-bold shrink-0">{member.user?.collegeId || member.name?.split(' - ')[0] || "UNKNOWN"}</span>
                            )}
                            <input
                              type="text"
                              autoFocus
                              placeholder="NAME"
                              value={editedMemberName}
                              onChange={(e) => setEditedMemberName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditedMember(index);
                                if (e.key === 'Escape') setEditingMemberIndex(null);
                              }}
                              className="bg-transparent border-b border-[#69D999] text-gray-200 text-[13px] outline-none w-full"
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              if (canEdit || canEditOnlyName) {
                                setEditingMemberIndex(index);
                                setEditedMemberId(member.user?.collegeId || member.name?.split(' - ')[0] || "");
                                setEditedMemberName(member.user?.name || member.name?.split(' - ')[1] || member.name || "");
                              }
                            }}
                            className={`flex items-center space-x-3 w-full ${(canEdit || canEditOnlyName) ? "cursor-pointer group-hover:opacity-80 transition-opacity" : ""}`}
                          >
                            <span className="text-[#69D999] text-[12px] font-bold tracking-widest w-[110px] truncate shrink-0">{member.user?.collegeId || member.name?.split(' - ')[0] || "UNKNOWN"}</span>
                            <span className={`text-gray-300 text-[13px] truncate ${(canEdit || canEditOnlyName) ? "hover:underline decoration-[#304137] underline-offset-4" : ""}`}>
                              {member.user?.name || member.name?.split(' - ')[1] || member.name || "Unknown"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            if (!isAdmin) return;
                            const newMembersList = [...project.members];
                            newMembersList[index].role = newMembersList[index].role === "Lead" ? "Member" : "Lead";
                            if (newMembersList[index].role === "Lead") {
                              newMembersList.forEach((m, i) => { if (i !== index) m.role = "Member"; });
                            }
                            updateProjectField('members', newMembersList);
                          }}
                          className={`text-[10px] tracking-widest text-[#5C8A70] bg-[#070B0E] px-2 py-1 rounded border border-[#15201A] shrink-0 ml-2 ${isAdmin ? "hover:bg-[#101D17] hover:text-[#69D999] hover:border-[#193A27] transition-all cursor-pointer" : "cursor-default opacity-80"}`}
                        >
                          {member.role.toUpperCase()}
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => {
                              const newMembersList = project.members.filter((_, i) => i !== index);
                              updateProjectField('members', newMembersList);
                            }}
                            className="text-[#D96969] bg-[#070B0E] border border-[#1A0A0A] hover:bg-[#1A0A0A] p-1.5 rounded ml-2 transition-colors cursor-pointer"
                            title="Remove Member"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Task Column */}
                    <div className="w-full md:w-2/3 p-3 pt-4 md:p-4 md:pl-6 flex flex-col justify-center space-y-4 md:space-y-3 relative">
                      {memberTasks.length > 0 && <span className="md:hidden text-[#629778] tracking-widest text-[10px] uppercase font-bold mb-1">[ CONTRIBUTIONS ]</span>}
                      {memberTasks.map((task, tIndex) => (
                        <div key={task._id} className="flex flex-col sm:flex-row justify-between sm:items-center w-full group/task gap-2 sm:gap-0">
                          {editingTaskId === task._id ? (
                            <input
                              type="text"
                              autoFocus
                              value={editTaskText}
                              onChange={(e) => setEditTaskText(e.target.value)}
                              onBlur={() => saveEditedTask(task._id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditedTask(task._id);
                                if (e.key === "Escape") setEditingTaskId(null);
                              }}
                              className="text-[13px] bg-[#101D17]/50 border-b border-[#69D999] outline-none text-white w-full mr-4 pr-2 py-0.5"
                            />
                          ) : (
                            <span
                              onClick={() => {
                                if (canEdit || isSelf) startEditingTask(task);
                              }}
                              className={`text-[13px] transition-colors line-clamp-2 pr-4 ${(canEdit || isSelf) && task.status !== "Done" ? "cursor-text" : "cursor-default"}
                                ${task.status === "Done" ? "text-[#5C8A70] line-through opacity-60" : "text-gray-400 hover:text-white"}`}
                            >
                              {task.title}
                            </span>
                          )}

                          <div className="flex items-center space-x-2 shrink-0">
                            {/* Render + button only on the last task if input is not visible */}
                            {tIndex === memberTasks.length - 1 && visibleInputFor !== displayId && (canEdit || isSelf) && (
                              <button
                                onClick={() => setVisibleInputFor(displayId)}
                                className="flex items-center justify-center w-[30px] py-1.5 border border-dashed border-[#1F2932] rounded-md text-[#5C8A70] hover:text-[#69D999] hover:border-[#69D999] hover:bg-[#69D999]/5 transition-all group/plus shrink-0"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover/plus:scale-110 transition-transform">
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                              </button>
                            )}

                            <button
                              onClick={() => handleTaskToggle(task._id, task.status)}
                              disabled={task.assignedTo.toUpperCase() !== currentUser.collegeId.toUpperCase() && !isAdmin}
                              className={`w-[110px] py-1.5 border rounded-md text-[11px] tracking-widest transition-all shrink-0 
                                ${(task.assignedTo.toUpperCase() !== currentUser.collegeId.toUpperCase() && !isAdmin) ? "opacity-30 cursor-not-allowed " : ""}
                                ${task.status === "Done"
                                  ? "border-[#193A27] text-[#69D999] bg-[#0B1510] hover:bg-[#101D17] hover:border-[#204A30] uppercase"
                                  : "border-[#212A31] text-gray-300 hover:text-[#69D999] hover:border-[#69D999] bg-[#0A0F13]"}`}
                            >
                              {task.status === "Done" ? "[ COMPLETED ]" : "DONE"}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Zero Tasks State */}
                      {memberTasks.length === 0 && visibleInputFor !== displayId && (
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[13px] text-gray-600 italic">No task assigned</span>
                          {(canEdit || isSelf) && (
                            <button
                              onClick={() => setVisibleInputFor(displayId)}
                              className="flex items-center justify-center w-[30px] py-1.5 border border-dashed border-[#1F2932] rounded-md text-[#5C8A70] hover:text-[#69D999] hover:border-[#69D999] hover:bg-[#69D999]/5 transition-all group/plus shrink-0"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover/plus:scale-110 transition-transform">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Add Task Input */}
                      {visibleInputFor === displayId && (
                        <div className="flex justify-between items-center w-full mt-1 group/input">
                          <input
                            type="text"
                            autoFocus
                            placeholder={memberTasks.length > 0 ? "Add another task..." : "No task assigned - type to add..."}
                            value={newTaskTexts[displayId] || ""}
                            onChange={(e) => setNewTaskTexts({ ...newTaskTexts, [displayId]: e.target.value })}
                            onBlur={(e) => {
                              // Small timeout to allow the "ADD" button click to register first if they clicked it
                              setTimeout(() => {
                                if (!newTaskTexts[displayId]?.trim()) {
                                  setVisibleInputFor(null);
                                }
                              }, 150);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleTaskSubmit(displayId);
                              if (e.key === "Escape") setVisibleInputFor(null);
                            }}
                            className="text-[13px] bg-transparent border-0 border-b border-transparent focus:border-[#69D999] group-hover/input:border-[#212A31] outline-none text-gray-300 placeholder-[#3A4D42] focus:placeholder-[#4A6D5A] w-full mr-4 pb-1 transition-colors italic focus:not-italic"
                          />
                          <button
                            onClick={() => handleTaskSubmit(displayId)}
                            disabled={!newTaskTexts[displayId]?.trim()}
                            className={`px-5 py-1.5 border rounded-md text-[11px] tracking-widest transition-all shrink-0 
                              ${!newTaskTexts[displayId]?.trim()
                                ? "border-[#1A2228] text-[#4A5D53] bg-transparent cursor-not-allowed"
                                : "border-[#193A27] text-[#69D999] bg-[#0B1510] hover:bg-[#101D17] shadow-[0_0_10px_rgba(25,58,39,0.3)]"}`}
                          >
                            ADD
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

              {/* ADD MEMBER SECTION */}
              <div className="p-3 md:p-4 pl-4 md:pl-6 border-t border-[#1A2228] bg-[#0A0F13]/50 shrink-0">
                {!isAddingMember ? (
                  <button
                    onClick={() => setIsAddingMember(true)}
                    className="flex items-center space-x-2 text-[#5C8A70] hover:text-[#69D999] text-[11px] tracking-widest transition-colors font-bold group"
                  >
                    <span className="transform group-hover:scale-110 transition-transform"><PlusIcon /></span>
                    <span>ADD_MEMBER</span>
                  </button>
                ) : (
                  <div className="flex flex-col w-full">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:space-x-3 w-full animate-fade-in group/add">
                      <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 w-full lg:w-1/2">
                        <input
                          type="text"
                          autoFocus
                          placeholder="OPERATIVE_ID"
                          value={newMember.collegeId}
                          onChange={(e) => {
                            setNewMember({ ...newMember, collegeId: e.target.value.toUpperCase() });
                            setMemberError("");
                          }}
                          className="text-[12px] bg-transparent border-b border-[#304137] focus:border-[#69D999] outline-none text-[#69D999] placeholder-[#2A3F33] w-1/2 pb-1 uppercase"
                        />
                        <input
                          type="text"
                          placeholder="NAME"
                          value={newMember.name}
                          onChange={(e) => {
                            setNewMember({ ...newMember, name: e.target.value });
                            setMemberError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddMember();
                            if (e.key === "Escape") { setIsAddingMember(false); setMemberError(""); }
                          }}
                          className="text-[12px] bg-transparent border-b border-[#304137] focus:border-[#69D999] outline-none text-[#69D999] placeholder-[#2A3F33] w-full sm:w-1/2 pb-1"
                        />
                      </div>

                      <div className="flex items-center justify-between w-full lg:w-max">
                        <select
                          value={newMember.role}
                          onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                          className="bg-[#11161B] border border-[#212A31] text-gray-400 text-[10px] p-1.5 rounded outline-none tracking-widest uppercase cursor-pointer"
                        >
                        <option value="Member">Member</option>
                        <option value="Lead">Lead</option>
                      </select>

                      <button
                        onClick={handleAddMember}
                        disabled={!newMember.collegeId.trim()}
                        className="px-4 py-1.5 border border-[#193A27] rounded text-[#69D999] bg-[#0B1510] hover:bg-[#101D17] text-[10px] tracking-widest transition-all shadow-[0_0_10px_rgba(25,58,39,0.3)] disabled:opacity-50 disabled:cursor-not-allowed uppercase ml-auto lg:ml-4"
                      >
                        ASSIGN
                      </button>
                        <button
                          onClick={() => { setIsAddingMember(false); setMemberError(""); }}
                          className="px-3 py-1.5 text-gray-500 hover:text-[#D96969] text-[10px] tracking-widest uppercase ml-2"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>

                    {memberError && (
                      <div className="text-[#D96969] text-[10px] mt-2 ml-1 tracking-widest animate-pulse font-bold uppercase">
                        &gt; ERROR: {memberError}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT SIDE (CHAT) */}
          <div
            className={`bg-[#11161B] rounded-2xl p-3 px-4 shadow-2xl border border-[#1F2932] flex flex-col relative transition-all duration-500 ease-in-out
                ${isChatOpen ? "h-1/2 lg:h-auto lg:w-[45%] opacity-100 lg:translate-x-0" : "h-0 lg:h-auto lg:w-0 opacity-0 lg:translate-x-full overflow-hidden p-0 border-none lg:ml-[-24px]"}
              `}
          >
            {isChatOpen && (
              <>
                <h3 className="text-[13px] text-[#629778] tracking-[0.2em] border-b border-[#212A31] pb-2 mb-2 mt-1 font-bold flex justify-between items-center shrink-0 min-w-max px-1">
                  <span>[ SECURE_COMMS_CHANNEL ]</span>
                  <span className="flex items-center">
                    <span className="text-[10px] text-[#69D999] opacity-70">ONLINE</span>
                  </span>
                </h3>

                <div className="flex-1 w-full min-h-0 relative z-10 flex flex-col">
                  <ProjectChat projectId={projectId} />
                </div>

                <div className="absolute bottom-6 right-6 text-gray-400 opacity-20 pointer-events-none z-0">
                  <StarIcon />
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProjectPage;