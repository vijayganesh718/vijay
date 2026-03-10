import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerTenant } from "../api";

const Login = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", tenant_name: "", gst_number: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    if (!form.email.includes("@gmail.com")) {
      setError("Email must be a @gmail.com address");
      return;
    }
    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await registerTenant({ tenant_name: form.tenant_name, gst_number: form.gst_number, email: form.email, password: form.password });
      } else {
        res = await loginUser(form.email, form.password);
      }
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("tenant_id", res.data.tenant_id);
      localStorage.setItem("role", res.data.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">Billing <span style={{ color: "var(--primary-red)" }}>System</span></div>
        <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>
        <p className="auth-subtitle">{isRegister ? "Register for an account" : "Sign in to your dashboard"}</p>

        {isRegister && (
          <>
            <input name="tenant_name" placeholder="Business Name" onChange={handleChange} className="input" />
            <input name="gst_number" placeholder="GST Number (optional)" onChange={handleChange} className="input" />
          </>
        )}
        <input name="email" type="email" placeholder="Email Address" onChange={handleChange} className="input" />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="input" />

        {error && <p className="error-msg">{error}</p>}

        <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        <p className="auth-toggle">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? " Login" : " Register"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;