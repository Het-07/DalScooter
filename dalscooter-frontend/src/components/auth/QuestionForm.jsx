import PropTypes from "prop-types";

function QuestionForm({
  challengeQuestion,
  challengeAnswer,
  setChallengeAnswer,
  onSubmit,
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-yellow-50 mb-2">DALSCOOTER</h2>
        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E7F133] to-[#B8C932]">
          Security Question
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div>
          <label className="block text-lg font-medium text-gray-300 mb-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            {challengeQuestion}
          </label>
          <input
            type="text"
            value={challengeAnswer}
            onChange={(e) => setChallengeAnswer(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:border-[#E7F133] focus:outline-none transition-all duration-300 placeholder-gray-400"
            placeholder="Your answer"
            required
          />
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

QuestionForm.propTypes = {
  challengeQuestion: PropTypes.string.isRequired,
  challengeAnswer: PropTypes.string.isRequired,
  setChallengeAnswer: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default QuestionForm;
