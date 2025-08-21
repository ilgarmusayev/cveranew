'use client';

interface SimpleCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

export default function SimpleCheckbox({ checked, onChange, label, id }: SimpleCheckboxProps) {
  const handleChange = () => {
    onChange(!checked);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange();
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
      onClick={handleChange}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="checkbox"
      aria-checked={checked}
    >
      {/* Custom visual checkbox */}
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          checked 
            ? 'bg-blue-600 border-blue-600' 
            : 'bg-white border-gray-300 hover:border-blue-400'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        className="text-sm font-medium text-gray-900 select-none flex-1"
      >
        {checked ? (
          <span className="text-green-700">
            ✅ Hal-hazırda davam edir
          </span>
        ) : (
          <span className="text-gray-700">
            {label}
          </span>
        )}
      </span>
    </div>
  );
}
