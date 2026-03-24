/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import logoImg from "../assets/archive_default_photo.jpg"; // ubaci svoj logo ovde

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError("");

  try {
    const data: { access_token: string; role: "ADMIN" | "EMPLOYEE" } =
      await api.login(email, password);

    localStorage.setItem("token", data.access_token);

    // Parsiramo payload tokena da dobijemo ime i prezime
    try {
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      const fullName = [payload.name, payload.surname].filter(Boolean).join(' ');
      localStorage.setItem('adminName', fullName || 'Administrator');
    } catch (err) {
      console.error('Ne mogu da parsiram token za ime admina', err);
      localStorage.setItem('adminName', 'Administrator'); // fallback
    }

    if (data.role === "ADMIN") {
      navigate("/admin");
    } else {
      navigate("/user");
    }
  } catch (err: any) {
    console.error("Login error:", err);
    setError(err.message || "Došlo je do greške pri login-u");
  }
};

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#e0f0ff", // svetlo plava pozadina
        padding: 20,
      }}
    >
      <div
        style={{
          backgroundColor: "#0077cc", // centralni plavi kvadrat
          borderRadius: 16,
          padding: 50,
          maxWidth: 500,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 25 }}>
  <img
    src={logoImg}
    alt="Logo"
    style={{ width: 220, height: "auto", objectFit: "contain" }} // VEĆI logo
  />
</div>

        {/* Naslov */}
        <h1
          style={{
            marginBottom: 15,
            fontSize: 32,
            fontWeight: "bold",
            color: "#fff",
            textAlign: "center",
          }}
        >
          Dobrodošli u CPSU
        </h1>
        <p
          style={{
            marginBottom: 30,
            fontSize: 16,
            lineHeight: 1.5,
            color: "#e0f7ff",
            textAlign: "center",
          }}
        >
          Sistem za praćenje godišnjih odmora i odsustava zaposlenih
        </p>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 15,
          }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 15,
            }}
          />
          <input
            type="password"
            placeholder="Lozinka"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 15,
            }}
          />

          {error && (
            <p style={{ color: "#ffcccc", fontSize: 14, textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 14,
              backgroundColor: "#004a99",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Prijavi se
          </button>
        </form>
      </div>
    </div>
  );
}