'use client';

import React from 'react';

interface NativeCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function NativeCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = ''
}: NativeCheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Checkbox clicked, new value:', e.target.checked);
    onChange(e.target.checked);
  };

  const handleLabelClick = () => {
    if (!disabled) {
      console.log('Label clicked, current checked:', checked);
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
        id={`checkbox-${Math.random().toString(36).substr(2, 9)}`}
      />
      {label && (
        <label
          onClick={handleLabelClick}
          className={`ml-2 text-sm text-gray-700 select-none ${disabled ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer'}`}
        >
          {label}
        </label>
      )}
    </div>
  );
}
