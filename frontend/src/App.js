import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DomainPage from "./pages/DomainPage";
import ProjectPage from "./pages/ProjectPage";
import SuggestionPage from "./pages/SuggestionPage";
import AddProjectPage from "./pages/AddProjectPage";
import LoginPage from "./pages/LoginPage";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/domain/:domainId" element={<ProtectedRoute><DomainPage /></ProtectedRoute>} />
        <Route path="/project/:projectId" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
        <Route path="/create-project" element={<ProtectedRoute><AddProjectPage /></ProtectedRoute>} />
        <Route path="/suggest" element={<ProtectedRoute><SuggestionPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;