import { Link, NavLink } from 'react-router-dom';
import { useLogout } from '../../hooks/useLogout';
import { useAuthContext } from '../../hooks/useAuthContext';

const Navbar = () => {
  const { logout } = useLogout();
  const { user } = useAuthContext();

  return (
    <header 
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div 
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Link 
            to="/"
            style={{
              textDecoration: "none",
            }}
          >
            <p 
              style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.5px",
              }}
            >
              Workout Planner
            </p>
          </Link>
        </div>

        <nav>
          {user ? (
            <div 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
              }}
            >
                <span 
                  style={{
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: "0.9rem",
                  }}
                >
                  {user.email}
                </span>
              <button 
                type="button" 
                onClick={logout}
                style={{
                  padding: "0.6rem 1.4rem",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "#475569",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                  e.currentTarget.style.color = "#dc2626";
                  e.currentTarget.style.borderColor = "#fecaca";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;