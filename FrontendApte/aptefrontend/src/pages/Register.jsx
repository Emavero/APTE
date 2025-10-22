import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  MdAlternateEmail,
  MdPhone
} from "react-icons/md";
import {
  FaUser,
  FaLock,
  FaRegEye,
  FaRegEyeSlash
} from "react-icons/fa";

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "individual",
    password: "",
    password2: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password2) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      setLoading(true);
      await register(form);
      navigate("/login");
    } catch (err) {
      if (err.response && err.response.data) {
        const messages = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(" | ");
        setError(messages);
      } else {
        setError("Erreur lors de l'inscription");
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
      <div className="absolute inset-0 bg-black/50 "></div>

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[90%] max-w-sm md:max-w-md p-6 md:p-8 
                   bg-white/10 backdrop-blur-md border border-white/20 
                   text-white flex flex-col items-center gap-4 rounded-2xl shadow-2xl"
      >
        {/*<img src="/logo.png" alt="logo" className="w-12 md:w-16" />
                */}
        <h1 className="text-lg md:text-2xl font-semibold text-center">
          Créez votre compte
        </h1>
        <p className="text-xs md:text-sm text-gray-300 text-center">
          Vous avez déjà un compte ?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Connectez-vous
          </a>
        </p>

        {error && (
          <p className="text-red-400 bg-red-500/20 w-full text-center rounded-md py-2 text-sm">
            {error}
          </p>
        )}

        <div className="w-full flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-2 bg-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
            <MdAlternateEmail />
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

          <div className="flex items-center gap-2 bg-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
            <FaUser />
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Nom complet"
              required
              className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
            <MdPhone />
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Téléphone"
              required
              className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
            />
          </div>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="bg-white/20 p-2 rounded-xl text-white text-sm md:text-base focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="individual" className="text-gray-800">
              Particulier
            </option>
            <option value="company" className="text-gray-800">
              Entreprise
            </option>
          </select>

          <div className="relative flex items-center gap-2 bg-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
            <FaLock />
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
                className="absolute right-5 cursor-pointer"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <FaRegEye
                className="absolute right-5 cursor-pointer"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>

          <div className="relative flex items-center gap-2 bg-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
            <FaLock />
            <input
              type={showPassword2 ? "text" : "password"}
              name="password2"
              value={form.password2}
              onChange={handleChange}
              placeholder="Confirmer mot de passe"
              required
              className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
            />
            {showPassword2 ? (
              <FaRegEyeSlash
                className="absolute right-5 cursor-pointer"
                onClick={() => setShowPassword2(false)}
              />
            ) : (
              <FaRegEye
                className="absolute right-5 cursor-pointer"
                onClick={() => setShowPassword2(true)}
              />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-500 rounded-xl mt-4 hover:bg-blue-600 transition-all duration-200 text-sm md:text-base disabled:opacity-60"
        >
          {loading ? "Inscription..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
};

export default Register;
