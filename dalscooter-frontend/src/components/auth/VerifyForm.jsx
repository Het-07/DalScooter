import PropTypes from "prop-types";

function VerifyForm({ verificationCode, setVerificationCode, onSubmit }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-yellow-50 mb-2">DALSCOOTER</h2>
        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E7F133] to-[#B8C932]">
          Verify Email
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="verification-code"
            className="block text-md font-medium text-gray-300 mb-2"
          >
            Verification Code
          </label>
          <input
            id="verification-code"
            name="verification-code"
            type="text"
            required
            className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-[#E7F133] focus:outline-none transition-all duration-300 placeholder-gray-400"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-3 px-4 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#E7F133]/30"
        >
          Verify
        </button>
      </form>
    </div>
  );
}

VerifyForm.propTypes = {
  verificationCode: PropTypes.string.isRequired,
  setVerificationCode: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default VerifyForm;
