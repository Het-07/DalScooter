import PropTypes from "prop-types";

function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  setView,
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-yellow-50 mb-2">DALSCOOTER</h2>
        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E7F133] to-[#B8C932]">
          Login
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="email-address-login"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Email address
          </label>
          <input
            id="email-address-login"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-[#E7F133] focus:outline-none transition-all duration-300 placeholder-gray-400"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="password-login"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Password
          </label>
          <input
            id="password-login"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-[#E7F133] focus:outline-none transition-all duration-300 placeholder-gray-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-3 px-4 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#E7F133]/30"
        >
          Sign In
        </button>
      </form>

      <div className="text-center">
        <p className="text-gray-400">
          Don't have an account?{" "}
          <button
            onClick={() => setView("signup")}
            className="text-[#E7F133] hover:text-[#D1E129] font-medium transition-colors duration-300"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

LoginForm.propTypes = {
  email: PropTypes.string.isRequired,
  setEmail: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  setPassword: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  setView: PropTypes.func.isRequired,
};

export default LoginForm;
