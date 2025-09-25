import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const { register } = useContext(AuthContext);
    const [form, setForm] = useState({
        email: "",
        full_name: "",
        phone: "",
        role: "individual",
        password: "",
        password2: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.password2) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        try {
            await register(form); // POST vers Django
            navigate("/login"); // redirige vers login après inscription
        } catch (err) {
            if (err.response && err.response.data) {
                const messages = Object.entries(err.response.data)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" | ");
                setError(messages);
            } else {
                setError("Erreur lors de l'inscription");
            }
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Inscription</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full p-2 mb-4 border rounded" />

                <label>Nom complet</label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required className="w-full p-2 mb-4 border rounded" />

                <label>Téléphone</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} required className="w-full p-2 mb-4 border rounded" />

                <label>Rôle</label>
                <select name="role" value={form.role} onChange={handleChange} className="w-full p-2 mb-4 border rounded">
                    <option value="individual">Particulier</option>
                    <option value="company">Entreprise</option>
                </select>

                <label>Mot de passe</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full p-2 mb-4 border rounded" />

                <label>Confirmer mot de passe</label>
                <input type="password" name="password2" value={form.password2} onChange={handleChange} required className="w-full p-2 mb-4 border rounded" />

                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">S'inscrire</button>
            </form>
        </div>
    );
}
