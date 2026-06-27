import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        await auth.login(form.email, form.password);
        setMessage("Logged in successfully");
      } else {
        await auth.register(form.name, form.email, form.password, form.role);
        setMessage("Account created successfully");
      }

      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="hero-panel">
        <div className="badge">Library Management System</div>
        <h1>Run the library workflow in one dashboard.</h1>
        <p>
          Librarians manage the catalog and members. Members register, log in, borrow books, and return them from a
          clean browser UI backed by the API.
        </p>
        <div className="hero-stats">
          <div>
            <strong>JWT</strong>
            <span>Secure sessions</span>
          </div>
          <div>
            <strong>RBAC</strong>
            <span>Role-aware access</span>
          </div>
          <div>
            <strong>MongoDB</strong>
            <span>Persistent records</span>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-switch">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
            Login
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <>
              <label>
                Name
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
              </label>
              <label>
                Role
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="user">👤 Member</option>
                  <option value="librarian">📚 Librarian</option>
                </select>
              </label>
            </>
          )}
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" />
          </label>

          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}

          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Working..." : mode === "login" ? "Login" : "Create account"}
          </button>

          <p className="helper-text">
            Demo librarian: librarian@library.com / Password123
          </p>
        </form>
      </section>
    </main>
  );
}
