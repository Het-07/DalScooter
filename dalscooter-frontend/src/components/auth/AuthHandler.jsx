import { useState, useEffect } from "react";
import { Auth, Hub } from "aws-amplify";
import { useNavigate } from "react-router-dom"; // Keep useNavigate
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import VerifyForm from "./VerifyForm";
import QuestionForm from "./QuestionForm";
import CaesarForm from "./CaesarForm";
import Dashboard from "../dashboard/Dashboard";
import MessageBox from "../shared/MessageBox";
import PropTypes from "prop-types";
import "../../aws-config";
import SignupQuestionsForm from "./SignupQuestionsForm";

function AuthHandler({ className, initialView }) {
  // Accept initialView prop
  // Use initialView directly for the state, so it reacts to prop changes
  const [currentView, setCurrentView] = useState(initialView || "login"); // Renamed `view` to `currentView` for clarity
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState("Customer");
  const [questions, setQuestions] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);
  const [verificationCode, setVerificationCode] = useState("");
  const [challengeSession, setChallengeSession] = useState(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [_challengeType, setChallengeType] = useState("");
  const [challengeQuestion, setChallengeQuestion] = useState("");
  const [challengeClue, setChallengeClue] = useState("");
  const [challengeShift, setChallengeShift] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loggedInUserType, setLoggedInUserType] = useState(null);
  const [signupStep, setSignupStep] = useState(1);
  const navigate = useNavigate();

  // Effect to synchronize internal view with initialView prop
  useEffect(() => {
    setCurrentView(initialView || "login");
    setError("");
    setSuccess("");
    setSignupStep(1); // Reset signup step on view change

    // Special handling for the 'dashboard' view, as it implies authentication check
    if (initialView === "dashboard") {
      Auth.currentAuthenticatedUser()
        .then((user) => {
          const userType = user.attributes["custom:userType"] || "Customer";
          setLoggedInUserType(userType);
          localStorage.setItem(
            "userInfo",
            JSON.stringify({
              userId: user.attributes.sub,
              email: user.attributes.email,
              name: user.attributes.name,
              userType: userType,
            })
          );
          // Dispatch signIn event to AuthContext
          Hub.dispatch("auth", { event: "signIn", data: user });
        })
        .catch(() => {
          // If AuthHandler is told to show dashboard but user is not authenticated,
          // redirect to login page.
          navigate("/login", { replace: true });
        });
    } else {
      // For other views (login, signup, verify), ensure local storage is cleared
      // if user is not authenticated, to prevent stale data issues.
      Auth.currentAuthenticatedUser()
        .then(() => {})
        .catch(() => {
          localStorage.removeItem("userInfo");
        });
    }
  }, [initialView, navigate]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (questions.some((q) => !q.question || !q.answer)) {
      setError("All questions and answers are required.");
      return;
    }
    try {
      await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name,
          "custom:userType": userType,
          "custom:questions": JSON.stringify(questions),
        },
      });
      setSuccess(
        "Registration successful! Please check your email for the verification code."
      );
      navigate("/verify", { replace: true });
      Hub.dispatch("auth", {
        event: "signUp",
        data: { username: email, userConfirmed: false },
      });
    } catch (err) {
      console.error("SignUp error:", err);
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await Auth.confirmSignUp(email, verificationCode);
      setSuccess("Email verified! Please log in.");
      navigate("/login", { replace: true });
      Hub.dispatch("auth", {
        event: "confirmSignUp",
        data: { username: email, userConfirmed: true },
      });
    } catch (err) {
      console.error("Verify error:", err);
      setError(err.message || "Verification failed. Please check the code.");
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    console.log("Initiating Auth.signIn with:", {
      username: email,
      password: password.replace(/./g, "*"),
      authFlowType: "CUSTOM_AUTH",
    });
    try {
      const session = await Auth.signIn({
        username: email,
        password: password,
        authFlowType: "CUSTOM_AUTH",
      });
      console.log("SignIn response:", session);
      if (session.challengeName === "CUSTOM_CHALLENGE") {
        setChallengeSession(session);
        setChallengeType(session.challengeParam.challengeName);
        if (
          Object.prototype.hasOwnProperty.call(
            session.challengeParam,
            "question"
          )
        ) {
          setChallengeQuestion(session.challengeParam.question);
          navigate("/question", { replace: true }); // Navigate to /question URL
        } else {
          setChallengeClue(
            session.challengeParam.publicChallengeParameters.clue
          );
          navigate("/caesar", { replace: true }); // Navigate to /caesar URL
        }
        Hub.dispatch("auth", { event: "customChallenge", data: session });
      } else {
        const user = await Auth.currentAuthenticatedUser();
        const userType = user.attributes["custom:userType"] || "Customer";
        setLoggedInUserType(userType);
        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            userId: user.attributes.sub,
            email: user.attributes.email,
            name: user.attributes.name,
            userType: userType,
          })
        );
        setSuccess("Login successful!");
        navigate("/dashboard", { replace: true }); // Navigate to /dashboard URL
        Hub.dispatch("auth", { event: "signIn", data: user });
      }
    } catch (err) {
      console.error("SignIn error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  const handleChallengeAnswer = async (e) => {
    e.preventDefault();
    if (!challengeAnswer) {
      setError("Please provide an answer.");
      return;
    }
    try {
      console.log("challenge session", challengeSession);
      console.log("challenge answer", challengeAnswer);
      const response = await Auth.sendCustomChallengeAnswer(
        challengeSession,
        challengeAnswer
      );
      console.log("Challenge response:", response);
      if (response.challengeName === "CUSTOM_CHALLENGE") {
        setChallengeSession(response);
        setChallengeType(response.challengeParam.challengeMetadata);
        console.log("Response ::::::::", response);
        if (
          response.challengeParam.challengeMetadata === "QUESTION_CHALLENGE"
        ) {
          setChallengeQuestion(
            response.challengeParam.publicChallengeParameters.question
          );
          navigate("/question", { replace: true }); // Navigate to /question URL
        } else {
          console.log("challengeParam ::::::::", response.challengeParam);
          setChallengeClue(response.challengeParam.clue);
          setChallengeShift(response.challengeParam.shift);
          navigate("/caesar", { replace: true }); // Navigate to /caesar URL
        }
        setChallengeAnswer("");
        Hub.dispatch("auth", {
          event: "customChallengeAnswer",
          data: response,
        });
      } else {
        const user = await Auth.currentAuthenticatedUser();
        const userType = user.attributes["custom:userType"] || "Customer";
        setLoggedInUserType(userType);
        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            userId: user.attributes.sub,
            email: user.attributes.email,
            name: user.attributes.name,
            userType: userType,
          })
        );
        setSuccess("Login successful!");
        navigate("/dashboard", { replace: true }); // Navigate to /dashboard URL
        Hub.dispatch("auth", { event: "signIn", data: user });
      }
    } catch (err) {
      console.error("Challenge error:", err);
      setError("Challenge response failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      localStorage.removeItem("userInfo");
      setLoggedInUserType(null);
      // No need to setView('login') here, navigate handles it
      navigate("/", { replace: true }); // Navigate to home page
      Hub.dispatch("auth", { event: "signOut" });
    } catch (err) {
      console.error("Logout error:", err);
      setError("Logout failed. Please try again.");
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  // Handler for step 1 (basic info) -> step 2 (questions)
  const handleSignupNext = (e) => {
    e.preventDefault();
    // Basic validation (keep minimal, logic unchanged)
    if (!email || !password || !name || !userType) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setSignupStep(2);
  };

  // Handler for step 2 (questions) -> submit
  const handleSignupBack = () => {
    setSignupStep(1);
  };

  return (
    <>
      {currentView !== "dashboard" ? (
        <div className={className}>
          <div className="space-y-6">
            <MessageBox message={error} type="error" />
            <MessageBox message={success} type="success" />
            {currentView === "login" && (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleSignIn}
                setView={setCurrentView}
              />
            )}
            {currentView === "signup" &&
              (signupStep === 1 ? (
                <SignUpForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  name={name}
                  setName={setName}
                  userType={userType}
                  setUserType={setUserType}
                  onNext={handleSignupNext}
                  setView={setCurrentView}
                />
              ) : (
                <SignupQuestionsForm
                  questions={questions}
                  handleQuestionChange={handleQuestionChange}
                  onSubmit={handleSignUp}
                  onBack={handleSignupBack}
                />
              ))}
            {currentView === "verify" && (
              <VerifyForm
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
                onSubmit={handleVerify}
              />
            )}
            {currentView === "question" && (
              <QuestionForm
                challengeQuestion={challengeQuestion}
                challengeAnswer={challengeAnswer}
                setChallengeAnswer={setChallengeAnswer}
                onSubmit={handleChallengeAnswer}
              />
            )}
            {currentView === "caesar" && (
              <CaesarForm
                challengeClue={challengeClue}
                challengeShift={challengeShift}
                challengeAnswer={challengeAnswer}
                setChallengeAnswer={setChallengeAnswer}
                onSubmit={handleChallengeAnswer}
              />
            )}
          </div>
        </div>
      ) : (
        <div>
          {currentView === "dashboard" && (
            <Dashboard userType={loggedInUserType} onLogout={handleLogout} />
          )}
        </div>
      )}
    </>
  );
}

AuthHandler.propTypes = {
  className: PropTypes.string,
  initialView: PropTypes.string, // Add this prop type
};

export default AuthHandler;
