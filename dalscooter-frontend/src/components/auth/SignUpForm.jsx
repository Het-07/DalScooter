import PropTypes from "prop-types";

function SignUpForm({
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  userType,
  setUserType,
  onNext,
  setView,
}) {
  return (
    <>
      <div className="text-center">
        <h2 className="text-4xl font-bold text-yellow-50 mb-2">DALSCOOTER</h2>
        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E7F133] to-[#B8C932]">
          Sign Up
        </p>
      </div>
      <form className="space-y-6" onSubmit={onNext}>
        <div>
          <label htmlFor="email-address-signup" className="sr-only">
            Email address
          </label>
          <input
            id="email-address-signup"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E7F133] focus:border-transparent transition-all duration-200"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password-signup" className="sr-only">
            Password
          </label>
          <input
            id="password-signup"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E7F133] focus:border-transparent transition-all duration-200"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="name-signup" className="sr-only">
            Name
          </label>
          <input
            id="name-signup"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E7F133] focus:border-transparent transition-all duration-200"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="user-type" className="sr-only">
            User Type
          </label>
          <select
            id="user-type"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#E7F133] focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23E7F133' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.75rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
            }}
          >
            <option value="Customer">Customer</option>
            <option value="Franchise">Franchise</option>
          </select>
        </div>
        <div>
          <button
            type="submit"
            className="w-full bg-[#E7F133] text-black font-semibold py-3 px-6 rounded-xl hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#E7F133] focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Next
          </button>
        </div>
      </form>
      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => setView("login")}
            className="text-[#E7F133] hover:text-yellow-300 font-medium transition-colors duration-200"
          >
            Sign In
          </button>
        </p>
      </div>
    </>
  );
}

SignUpForm.propTypes = {
  email: PropTypes.string.isRequired,
  setEmail: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  setPassword: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  setName: PropTypes.func.isRequired,
  userType: PropTypes.string.isRequired,
  setUserType: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  setView: PropTypes.func.isRequired,
};

export default SignUpForm;
