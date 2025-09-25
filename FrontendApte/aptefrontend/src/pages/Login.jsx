import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


export default function Login() {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form);
      navigate("/"); // ou page principale
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.error);
      } else {
        setError("Erreur lors de la connexion");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full p-2 mb-4 border rounded" />

        <label>Mot de passe</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full p-2 mb-4 border rounded" />

        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Se connecter</button>
      </form>
    </div>
  );
}
