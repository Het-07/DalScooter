import PropTypes from "prop-types";
import { useMemo } from "react";

const ALL_QUESTIONS = [
  "What is your favourite food?",
  "What is your favourite place?",
  "What is your favourite color?",
  "What is your favourite car?",
];

function SignupQuestionsForm({
  questions,
  handleQuestionChange,
  onSubmit,
  onBack,
}) {
  // Compute available options for each dropdown so no duplicate questions
  const availableOptions = useMemo(() => {
    return questions.map((q, idx) => {
      // Exclude questions already selected in other slots
      const selected = questions
        .map((qq, i) => (i !== idx ? qq.question : null))
        .filter(Boolean);
      return ALL_QUESTIONS.filter((qText) => !selected.includes(qText));
    });
  }, [questions]);

  return (
    <>
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[#E7F133] to-yellow-300 bg-clip-text text-transparent">
        Security Questions
      </h2>
      <form className="space-y-6 w-full max-w-2xl mx-auto" onSubmit={onSubmit}>
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div
              key={index}
              className="space-y-2 p-4 bg-gray-800/50 rounded-xl border border-gray-700"
            >
              <div className="relative">
                <select
                  value={q.question || ""}
                  onChange={(e) =>
                    handleQuestionChange(index, "question", e.target.value)
                  }
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#E7F133] focus:border-transparent transition-all duration-200 appearance-none pr-10"
                  style={{
                    backgroundImage:
                      "url('data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23E7F133' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e')",
                    backgroundPosition: "right 0.75rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                  }}
                >
                  <option value="" disabled>
                    Select a question...
                  </option>
                  {availableOptions[index].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow overlay for accessibility */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-[#E7F133]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 20 20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 8l4 4 4-4"
                    />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                value={q.answer || ""}
                onChange={(e) =>
                  handleQuestionChange(index, "answer", e.target.value)
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E7F133] focus:border-transparent transition-all duration-200"
                placeholder="Enter your answer"
                required
                disabled={!q.question}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="w-1/2 bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-600 transition-all duration-200 focus:outline-none"
          >
            Back
          </button>
          <button
            type="submit"
            className="w-1/2 bg-[#E7F133] text-black font-semibold py-3 px-6 rounded-xl hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#E7F133] focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Sign Up
          </button>
        </div>
      </form>
    </>
  );
}

SignupQuestionsForm.propTypes = {
  questions: PropTypes.array.isRequired,
  handleQuestionChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default SignupQuestionsForm;
