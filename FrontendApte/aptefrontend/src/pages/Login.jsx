import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { MdAlternateEmail } from "react-icons/md";
import { FaFingerprint, FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const togglePasswordView = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
      navigate("/"); // redirection après connexion
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.error);
      } else {
        setError("Erreur lors de la connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: "url('src/assets/bglogregi.jpg')", 
      }}
    >
      {/* Overlay sombre pour lisibilité */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[90%] max-w-sm md:max-w-md p-6 md:p-8
                   bg-white/10 backdrop-blur-lg border border-white/20 text-white 
                   flex flex-col items-center gap-4 rounded-2xl shadow-2xl"
      >
        {/* Logo 
        <img src="src/assets/logo.png" alt="logo" className="w-20 md:w-24" />*/}

        <h1 className="text-lg md:text-2xl font-semibold text-center">
          Bienvenue 👋
        </h1>
        

        {/* Message d'erreur */}
        {error && (
          <p className="text-red-400 bg-red-500/20 w-full text-center rounded-md py-2 text-sm">
            {error}
          </p>
        )}

        {/* Champs du formulaire */}
        <div className="w-full flex flex-col gap-3 mt-3">
          <div className="w-full flex items-center gap-2 bg-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
            <MdAlternateEmail className="text-gray-200" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Adresse e-mail"
              required
              className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
            />
          </div>

          <div className="w-full flex items-center gap-2 bg-white/20 p-2 rounded-xl relative focus-within:ring-2 focus-within:ring-blue-500">
            <FaFingerprint className="text-gray-200" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mot de passe"
              required
              className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
            />
            {showPassword ? (
              <FaRegEyeSlash
                className="absolute right-5 text-gray-300 cursor-pointer hover:text-white"
                onClick={togglePasswordView}
              />
            ) : (
              <FaRegEye
                className="absolute right-5 text-gray-300 cursor-pointer hover:text-white"
                onClick={togglePasswordView}
              />
            )}
          </div>
        </div>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={loading}
          className="w-full p-1 bg-blue-500 rounded-xl mt-4 hover:bg-blue-600 transition-all duration-200 text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p className="text-xs md:text-sm text-gray-300 text-center">
          Pas encore de compte ?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Inscrivez-vous
          </a>
        </p>
        <p className="text-xs md:text-sm text-gray-300 text-center">
          <a href="/reset-password" className="text-blue-400 hover:underline">
            Mot de passe oublié ?
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
