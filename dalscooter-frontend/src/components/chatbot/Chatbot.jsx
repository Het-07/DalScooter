import React, { useState, useEffect, useRef } from "react";
import {
  RecognizeTextCommand,
  LexRuntimeV2Client,
} from "@aws-sdk/client-lex-runtime-v2";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { useAuth } from "../../context/AuthContext"; // ✅ Import AuthContext

// Load from .env
const REGION = import.meta.env.VITE_AWS_REGION;
const BOT_ID = import.meta.env.VITE_BOT_ID;
const BOT_ALIAS_ID = import.meta.env.VITE_BOT_ALIAS_ID;
const IDENTITY_POOL_ID = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
const LOCALE_ID = "en_US";
const SESSION_ID = `guest-${Math.random().toString(36).substring(7)}`;

const ChatBot = () => {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const { isAuthenticated, isCustomer, isAdmin } = useAuth(); // ✅ useAuth

  // ✅ Determine user role from auth context
  let userRole = "guest";
  if (isAuthenticated) {
    if (isCustomer) userRole = "customer";
    else if (isAdmin) userRole = "franchise";
  }

  const lexClient = new LexRuntimeV2Client({
    region: REGION,
    credentials: fromCognitoIdentityPool({
      identityPoolId: IDENTITY_POOL_ID,
      clientConfig: { region: REGION },
    }),
  });

  const sendMessage = async (text) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");

    const command = new RecognizeTextCommand({
      botId: BOT_ID,
      botAliasId: BOT_ALIAS_ID,
      localeId: LOCALE_ID,
      sessionId: SESSION_ID,
      text,
      sessionState: {
        sessionAttributes: {
          userRole: userRole,
        },
      },
    });

    try {
      const response = await lexClient.send(command);
      const reply =
        response.messages?.[0]?.content ||
        "I'm not sure how to help with that.";
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch (error) {
      console.error("Lex error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) sendMessage(input);
  };

  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showChat]);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-red-900 hover:bg-red-500 text-black rounded-full p-4 shadow-xl border-2 border-[#E7F133]/40 transition-all duration-300 transform hover:scale-110 hover:shadow-[#E7F133]/30 focus:outline-none focus:ring-2 focus:ring-[#E7F133]"
        >
          💬
        </button>
      </div>

      {showChat && (
        <div className="fixed bottom-24 right-8 w-96 max-w-full max-h-[80vh] bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-fadeInUp backdrop-blur-xl">
          <div className="bg-red-900 text-yellow-200 p-4 font-bold flex justify-between items-center border-b border-gray-700 text-lg tracking-wide">
            DALScooter Assistant
            <button
              onClick={() => setShowChat(false)}
              className="text-yellow-200 text-2xl font-bold hover:text-red-500 transition-colors"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-gray-900/80 to-gray-800/80 custom-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`px-4 py-2 rounded-2xl max-w-[85%] shadow-md text-base font-medium break-words ${
                  msg.sender === "user"
                    ? "bg-[#E7F133]/90 text-black ml-auto rounded-br-sm border border-[#E7F133]/40"
                    : "bg-gray-800/80 text-gray-100 mr-auto rounded-bl-sm border border-gray-700"
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex p-3 border-t border-gray-700 bg-gradient-to-br from-gray-900/80 to-gray-800/80"
          >
            <input
              type="text"
              className="flex-1 p-3 rounded-2xl bg-gray-800 text-white border border-gray-700 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-medium text-base placeholder-gray-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              autoFocus
            />
            <button
              type="submit"
              className="ml-3 px-5 py-2 bg-[#E7F133] hover:bg-[#D1E129] text-black font-bold rounded-2xl text-base transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-[#E7F133]/40 drop-shadow-lg"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;
