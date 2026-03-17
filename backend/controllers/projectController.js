const Project = require("../models/Project");

exports.getProjects = async (req, res) => {
  const projects = await Project.find().populate("domainId").populate("members.user", "name collegeId");
  res.json(projects);
};

exports.getProjectById = async (req, res) => {
  const project = await Project.findById(req.params.id).populate("domainId").populate("members.user", "name collegeId");
  res.json(project);
};

exports.createProject = async (req, res) => {
  try {
    if (req.body.members) {
      const User = require("../models/User");
      const uniqueMembers = [];
      const seenUserIds = new Set();
      for (const m of req.body.members) {
        if (m.name) {
          const [collegeId, ...nameParts] = m.name.split("-");
          const parsedId = collegeId.trim().toUpperCase();
          const parsedName = nameParts.join("-").trim();

          let userObj = await User.findOne({ collegeId: parsedId });
          if (!userObj) {
            return res.status(400).json({ message: `Operative ID ${parsedId} not found in system` });
          }

          if (parsedName && userObj.name && userObj.name.toLowerCase() !== parsedName.toLowerCase()) {
            return res.status(400).json({ message: `Operative ID mismatch: ID ${parsedId} is registered to ${userObj.name}` });
          }

          const userObjId = userObj._id.toString();
          if (seenUserIds.has(userObjId)) {
            return res.status(400).json({ message: "Duplicate operative IDs are not permitted." });
          }
          seenUserIds.add(userObjId);
          uniqueMembers.push({ user: userObjId, role: m.role || "Member" });
        } else if (m.user) {
          const repId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
          if (seenUserIds.has(repId)) return res.status(400).json({ message: "Duplicate operative IDs are not permitted." });
          seenUserIds.add(repId);
          uniqueMembers.push(m);
        }
      }
      req.body.members = uniqueMembers;
    }
    const project = new Project(req.body);
    await project.save();
    const populatedProject = await Project.findById(project._id).populate("domainId").populate("members.user", "name collegeId");
    res.status(201).json(populatedProject);
  } catch (err) {
    res.status(500).json({ message: "Error creating project", error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { status } = req.body;

    // Check privileges
    if (!req.user.isAdmin) {
      const membership = project.members.find(
        (m) => m.user && m.user.toString() === req.user.userId
      );

      if (!membership) {
        return res.status(403).json({ message: "Cannot edit. User not part of project." });
      }

      if (membership.role !== "Lead") {
        // Intercept Member-only name update hack
        if (req.body.members && Object.keys(req.body).length === 1) {
          const m = req.body.members.find(mem => mem.name && mem.name.toUpperCase().startsWith(req.user.collegeId.toUpperCase()));
          if (m) {
            const parsedName = m.name.split('-').slice(1).join('-').trim();
            if (parsedName) {
              const User = require('../models/User');
              await User.findByIdAndUpdate(req.user.userId, { name: parsedName });
              const updatedProject = await Project.findById(req.params.id)
                .populate("domainId")
                .populate("members.user", "name collegeId");
              return res.json(updatedProject);
            }
          }
        }
        return res.status(403).json({ message: "Only Lead can edit project details." });
      }

      if (status === "Active" && project.status === "Proposed") {
        return res.status(403).json({ message: "Only an Admin can activate a proposed project." });
      }
    }

    if (req.body.members) {
      const User = require("../models/User");
      const updatedMembers = [];
      const seenUserIds = new Set();
      let memIndex = 0;
      for (const m of req.body.members) {
        let userObjId = null;
        if (m.name) {
          const [collegeId, ...nameParts] = m.name.split("-");
          const parsedId = collegeId.trim().toUpperCase();
          const parsedName = nameParts.join("-").trim();

          let userObj = await User.findOne({ collegeId: parsedId });
          if (!userObj) {
            return res.status(400).json({ message: `Operative ID ${parsedId} not found in system` });
          }

          let isRenameAllowed = false;
          if (memIndex < project.members.length) {
            const existingMember = project.members[memIndex];
            const existingUserId = existingMember.user ? existingMember.user.toString() : null;
            if (existingUserId === userObj._id.toString()) {
              isRenameAllowed = true;
            }
          }

          if (parsedName && userObj.name && userObj.name.toLowerCase() !== parsedName.toLowerCase()) {
            if (isRenameAllowed) {
              if (userObj.isAdmin) {
                return res.status(403).json({ message: `Cannot modify the global name of an Admin account (${userObj.collegeId}).` });
              }
              userObj.name = parsedName;
              await userObj.save();
            } else {
              return res.status(400).json({ message: `Operative ID mismatch: ID ${parsedId} is registered to ${userObj.name}, not ${parsedName}` });
            }
          } else if (parsedName && !userObj.name) {
            // Edge case if user database somehow had no name at all previously
            userObj.name = parsedName;
            await userObj.save();
          }

          userObjId = userObj._id.toString();
        } else if (m.user && m.user._id) {
          userObjId = m.user._id.toString();
        } else {
          userObjId = m.user.toString();
        }

        if (seenUserIds.has(userObjId)) {
          return res.status(400).json({ message: "Duplicate operative IDs are not permitted." });
        }
        seenUserIds.add(userObjId);

        let finalRole = m.role || "Member";
        if (!req.user.isAdmin) {
          const existingMem = project.members.find(em => em.user && em.user.toString() === userObjId);
          if (existingMem) {
            finalRole = existingMem.role;
          } else {
            finalRole = "Member";
          }
        }

        updatedMembers.push({ user: userObjId, role: finalRole });
        memIndex++;
      }
      req.body.members = updatedMembers;
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("domainId")
      .populate("members.user", "name collegeId");

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: "Error updating project", error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!req.user.isAdmin) {
      const membership = project.members.find(
        (m) => m.user && m.user.toString() === req.user.userId
      );

      if (!membership || membership.role !== "Lead") {
        return res.status(403).json({ message: "Only an Admin or Project Lead can delete a project." });
      }
    }

    const Task = require("../models/Task");
    const Message = require("../models/Message");

    await Task.deleteMany({ projectId: project._id });
    await Message.deleteMany({ projectId: project._id });

    await Project.findByIdAndDelete(project._id);
    res.json({ message: "Project and associated data successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
};
