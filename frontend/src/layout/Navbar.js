import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#eee" }}>
      <Link to="/" style={{ marginRight: "15px" }}>Home</Link>
      <Link to="/suggest">Suggest Project</Link>
    </nav>
  );
}

export default Navbar;