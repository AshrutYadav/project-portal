import { Link } from "react-router-dom";

function ProjectCard({ project }) {
  return (
    <div style={{
      border: "1px solid #aaa",
      padding: "15px",
      marginBottom: "10px",
      borderRadius: "6px"
    }}>
      <h3>{project.title}</h3>
      <p>Status: {project.status}</p>
      <Link to={`/project/${project._id}`}>
        Open Project
      </Link>
    </div>
  );
}

export default ProjectCard;