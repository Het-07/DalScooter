// src/components/shared/DynamicKeyValueInput.jsx
import React from "react";
import PropTypes from "prop-types";

const DynamicKeyValueInput = ({
  label,
  value,
  onChange,
  placeholderKey,
  placeholderValue,
}) => {
  // Defensive check: Ensure 'value' is always an array.
  // If 'value' is not an array (e.g., undefined or null), default to an empty array
  // or an array with one empty pair if you always want at least one input field.
  const itemsToRender = Array.isArray(value) ? value : [{ key: "", value: "" }];

  const handleKeyChange = (index, newKey) => {
    const updatedPairs = [...itemsToRender]; // Use itemsToRender for consistency
    updatedPairs[index].key = newKey;
    onChange(updatedPairs);
  };

  const handleValueChange = (index, newValue) => {
    const updatedPairs = [...itemsToRender]; // Use itemsToRender for consistency
    updatedPairs[index].value = newValue;
    onChange(updatedPairs);
  };

  const handleAddField = () => {
    onChange([...itemsToRender, { key: "", value: "" }]); // Use itemsToRender for consistency
  };

  const handleRemoveField = (index) => {
    const updatedPairs = itemsToRender.filter((_, i) => i !== index); // Use itemsToRender for consistency
    onChange(updatedPairs);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-[#E7F133] mb-2 uppercase tracking-wider">
        {label}
      </label>
      {itemsToRender.map((pair, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            className="block w-1/2 bg-[#181F2A] border border-[#2C3440] text-white rounded-2xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-semibold text-base shadow-xl hover:border-[#E7F133]/80 focus:ring-2 focus:ring-[#E7F133]/40 placeholder-gray-400"
            placeholder={placeholderKey || "Key (e.g., maxSpeed)"}
            value={pair.key}
            onChange={(e) => handleKeyChange(index, e.target.value)}
          />
          <input
            type="text"
            className="block w-1/2 bg-[#181F2A] border border-[#2C3440] text-white rounded-2xl px-4 py-3 focus:border-[#E7F133] focus:outline-none transition-all duration-300 font-semibold text-base shadow-xl hover:border-[#E7F133]/80 focus:ring-2 focus:ring-[#E7F133]/40 placeholder-gray-400"
            placeholder={placeholderValue || "Value (e.g., 25 km/h)"}
            value={pair.value}
            onChange={(e) => handleValueChange(index, e.target.value)}
          />
          <button
            type="button"
            onClick={() => handleRemoveField(index)}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Remove field"
          >
            &times;
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddField}
        className="w-full bg-[#232B3A] hover:bg-black hover:text-white text-[#E7F133] font-bold py-3 px-4 rounded-2xl shadow-xl transition-all duration-300 text-base border-2 border-[#2C3440] hover:border-[#E7F133]"
      >
        Add Field
      </button>
    </div>
  );
};

DynamicKeyValueInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholderKey: PropTypes.string,
  placeholderValue: PropTypes.string,
};

export default DynamicKeyValueInput;
