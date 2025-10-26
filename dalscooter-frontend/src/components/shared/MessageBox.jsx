import React from "react";
import PropTypes from "prop-types";

const MessageBox = ({ message, type }) => {
  if (!message) return null;

  const baseClasses = "p-4 mb-4 rounded-xl text-sm font-medium border";
  const typeClasses = {
    error: "bg-red-900/20 text-red-300 border-red-500/30",
    success: "bg-green-900/20 text-green-300 border-green-500/30",
    info: "bg-blue-900/20 text-blue-300 border-blue-500/30",
    warning: "bg-yellow-900/20 text-yellow-300 border-yellow-500/30",
  };

  return (
    <div
      className={`${baseClasses} ${typeClasses[type || "info"]}`}
      role="alert"
    >
      {message}
    </div>
  );
};

MessageBox.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(["error", "success", "info", "warning"]),
};

export default MessageBox;
