import PropTypes from "prop-types";

function CaesarForm({
  challengeClue,
  challengeShift,
  challengeAnswer,
  setChallengeAnswer,
  onSubmit,
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-yellow-50 mb-2">DALSCOOTER</h2>
        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E7F133] to-[#B8C932]">
          Caesar Cipher
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <label className="block text-lg font-medium text-gray-300 mb-2">
              Clue:{" "}
              <span className="font-semibold text-[#E7F133]">
                {challengeClue}
              </span>
            </label>
            <label className="block text-lg font-medium text-gray-300">
              Shift:{" "}
              <span className="font-semibold text-[#E7F133]">
                {challengeShift}
              </span>
            </label>
          </div>

          <div>
            <label
              htmlFor="caesar-answer"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Decrypted Text
            </label>
            <input
              id="caesar-answer"
              type="text"
              value={challengeAnswer}
              onChange={(e) => setChallengeAnswer(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-[#E7F133] focus:outline-none transition-all duration-300 placeholder-gray-400"
              placeholder="Enter decrypted text"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold py-3 px-4 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#E7F133]/30"
        >
          Submit Answer
        </button>
      </form>
    </div>
  );
}

CaesarForm.propTypes = {
  challengeClue: PropTypes.string.isRequired,
  challengeShift: PropTypes.string.isRequired,
  challengeAnswer: PropTypes.string.isRequired,
  setChallengeAnswer: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default CaesarForm;
