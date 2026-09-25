import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import authService from "../services/authService";
// Importée pour que Vite l'intègre au bundle.
import background from "../assets/bglogregi.jpg";
import {
  FaLock,
  FaRegEye,
  FaRegEyeSlash,
  FaCheckCircle,
  FaShieldAlt,
  FaEnvelope
} from "react-icons/fa";

/**
 * Réinitialisation du mot de passe, en deux temps.
 *
 * Sans jeton dans l'URL, le formulaire demande simplement l'envoi d'un lien par
 * e-mail. Avec un jeton (/reset-password/:token), il applique le nouveau mot de
 * passe. L'ancienne version envoyait « e-mail + nouveau mot de passe » et le
 * serveur l'appliquait sans preuve de possession de la boîte : n'importe qui
 * pouvait prendre le contrôle d'un compte en connaissant son adresse.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  // Un jeton dans l'URL fait passer le formulaire en mode « choix du mot de passe ».
  const hasToken = Boolean(token);

  const [form, setForm] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation du mot de passe
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(form.newPassword);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (hasToken) {
      if (form.newPassword !== form.confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }
      if (!passwordValidation.isValid) {
        setError("Le mot de passe ne respecte pas les critères de sécurité");
        return;
      }
    }

    try {
      setLoading(true);

      const { data } = hasToken
        ? await authService.confirmPasswordReset({ token, newPassword: form.newPassword })
        : await authService.requestPasswordReset(form.email);

      setSuccessMessage(data?.detail || "");
      setSuccess(true);

      // On ne redirige que si le mot de passe a bel et bien été changé : après
      // un simple envoi d'e-mail, l'utilisateur doit lire son message.
      if (hasToken) {
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (err) {
      const data = err?.response?.data;
      const fields = data?.errors && typeof data.errors === "object" ? data.errors : null;
      if (fields) {
        setError(
          Object.entries(fields)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join(" | "),
        );
      } else {
        setError(data?.detail || "Erreur lors de la réinitialisation du mot de passe");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${background})`,
      }}
    >
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Formulaire */}
      <div className="relative z-10 w-[90%] max-w-sm md:max-w-md">
        {success ? (
          // Message de succès
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-green-400 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {hasToken ? "Mot de passe réinitialisé !" : "Vérifiez votre boîte mail"}
            </h2>
            <p className="text-gray-300">
              {successMessage ||
                (hasToken
                  ? "Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter."
                  : "Si un compte existe pour cette adresse, un lien de réinitialisation vient de vous être envoyé.")}
            </p>
            {!hasToken && (
              <button
                type="button"
                onClick={handleCancel}
                className="mt-4 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Retour à la connexion
              </button>
            )}
          </div>
        ) : (
          // Formulaire de réinitialisation
          <form 
            onSubmit={handleSubmit}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white flex flex-col items-center gap-4 p-6 md:p-8 rounded-2xl shadow-2xl"
          >
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
              <FaShieldAlt className="text-blue-400 text-3xl" />
            </div>

            <h1 className="text-lg md:text-2xl font-semibold text-center">
              Réinitialiser le mot de passe
            </h1>
            <p className="text-xs md:text-sm text-gray-300 text-center">
              {hasToken
                ? "Choisissez votre nouveau mot de passe"
                : "Entrez votre email pour recevoir un lien de réinitialisation"}
            </p>

            {error && (
              <div className="text-red-400 bg-red-500/20 w-full text-center rounded-md py-2 px-3 text-sm">
                {error}
              </div>
            )}

            <div className="w-full flex flex-col gap-3 mt-3">
              {/* Email (étape 1 uniquement) */}
              {!hasToken && (
                <div className="flex items-center gap-2 bg-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
                  <FaEnvelope className="text-gray-300" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Votre adresse email"
                    required
                    className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
                  />
                </div>
              )}

              {/* Nouveau mot de passe (étape 2 uniquement) */}
              {hasToken && (
                <>
              <div className="relative flex items-center gap-2 bg-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
                <FaLock className="text-gray-300" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Nouveau mot de passe"
                  required
                  className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
                />
                {showNewPassword ? (
                  <FaRegEyeSlash
                    className="cursor-pointer text-gray-300 hover:text-white"
                    onClick={() => setShowNewPassword(false)}
                  />
                ) : (
                  <FaRegEye
                    className="cursor-pointer text-gray-300 hover:text-white"
                    onClick={() => setShowNewPassword(true)}
                  />
                )}
              </div>

              {/* Validation du mot de passe */}
              {form.newPassword && (
                <div className="bg-white/10 p-3 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-gray-200 mb-2">
                    Critères de sécurité :
                  </p>
                  <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{passwordValidation.minLength ? '✓' : '○'}</span>
                    <span>Au moins 8 caractères</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{passwordValidation.hasUpperCase ? '✓' : '○'}</span>
                    <span>Une lettre majuscule</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{passwordValidation.hasLowerCase ? '✓' : '○'}</span>
                    <span>Une lettre minuscule</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{passwordValidation.hasNumber ? '✓' : '○'}</span>
                    <span>Un chiffre</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{passwordValidation.hasSpecialChar ? '✓' : '○'}</span>
                    <span>Un caractère spécial (!@#$%...)</span>
                  </div>
                </div>
              )}

              {/* Confirmer mot de passe */}
              <div className="relative flex items-center gap-2 bg-white/20 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
                <FaLock className="text-gray-300" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmer le nouveau mot de passe"
                  required
                  className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-300"
                />
                {showConfirmPassword ? (
                  <FaRegEyeSlash
                    className="cursor-pointer text-gray-300 hover:text-white"
                    onClick={() => setShowConfirmPassword(false)}
                  />
                ) : (
                  <FaRegEye
                    className="cursor-pointer text-gray-300 hover:text-white"
                    onClick={() => setShowConfirmPassword(true)}
                  />
                )}
              </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                (hasToken ? !passwordValidation.isValid : !form.email)
              }
              className="w-full p-2 bg-blue-500 rounded-xl mt-4 hover:bg-blue-600 transition-all duration-200 text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed font-medium"
            >
              {loading
                ? "Envoi en cours..."
                : hasToken
                  ? "Réinitialiser le mot de passe"
                  : "Recevoir le lien de réinitialisation"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;