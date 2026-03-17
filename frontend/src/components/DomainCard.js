import { Link } from "react-router-dom";

function DomainCard({ domain }) {
  return (
    <div style={{
      border: "1px solid #ccc",
      padding: "15px",
      marginBottom: "10px",
      borderRadius: "6px"
    }}>
      <h3>{domain.name}</h3>
      <p>{domain.description}</p>
      <Link to={`/domain/${domain._id}`}>
        View Projects
      </Link>
    </div>
  );
}

export default DomainCard;