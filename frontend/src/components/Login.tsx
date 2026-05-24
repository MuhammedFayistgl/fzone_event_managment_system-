import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "rsuite";

const LoginPage: FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const styles = {
    container: {
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f5f6f8",
      fontFamily: "Arial",
    },
    subtitle: {
      color: "gray",
      marginBottom: "20px",
    },
    button: {
      width: "100%",
      padding: "14px",
      borderRadius: "10px",
      border: "none",
      background: "#6c63ff",
      color: "white",
      marginTop: "20px",
      cursor: "pointer",
      fontSize: "16px",
    },
    error: {
      color: "red",
      marginTop: "10px",
    },
  };

  const handleChange = (value: string, name: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      alert("Login Success");
      navigate("/admin");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div
        style={{
          width: "420px",
          background: "#fff",
          padding: "40px",
          borderRadius: "20px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1>Fzone</h1>
        <p style={styles.subtitle}>Uniting hearts, creating smiles...</p>

        <Input
          size="lg"
          placeholder="Enter Email"
          value={form.email}
          onChange={(value) => handleChange(value, "email")}
        />

        <Input
          size="lg"
          type="password"
          placeholder="Enter Password"
          style={{ marginTop: "15px" }}
          value={form.password}
          onChange={(value) => handleChange(value, "password")}
        />

        <button style={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
