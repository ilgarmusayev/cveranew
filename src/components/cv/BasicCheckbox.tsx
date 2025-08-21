'use client';

interface BasicCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function BasicCheckbox({ checked, onChange, label }: BasicCheckboxProps) {
  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newValue = !checked;
    console.log('🔥 BasicCheckbox clicked:', {
      currentValue: checked,
      newValue: newValue,
      label: label,
      timestamp: new Date().toLocaleTimeString()
    });

    // Call the onChange immediately
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      handleClick(e);
    }
  };

  // Add debugging for render
  console.log('🎯 BasicCheckbox render:', { checked, label });

  return (
    <div className="checkbox-wrapper flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200" style={{ cursor: 'default !important' }}>
      {/* Native HTML checkbox hidden but functional for accessibility */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          console.log('📋 Native checkbox change:', e.target.checked);
          onChange(e.target.checked);
        }}
        className="sr-only"
        tabIndex={-1}
      />

      {/* Visual checkbox button */}
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`checkbox-button w-5 h-5 rounded border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          checked 
            ? 'bg-blue-600 border-blue-600' 
            : 'bg-white border-gray-300 hover:border-blue-400'
        }`}
        aria-checked={checked}
        aria-label={label}
        style={{ cursor: 'default !important' }}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" style={{ cursor: 'default !important' }}>
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Clickable label */}
      <label
        className="checkbox-label text-sm font-medium text-gray-900 flex-1"
        onClick={handleClick}
        style={{ cursor: 'default !important' }}
      >
        {checked ? (
          <span className="text-green-700 font-semibold" style={{ cursor: 'default !important' }}>
            ✅ Hal-hazırda davam edir
          </span>
        ) : (
          <span className="text-gray-700" style={{ cursor: 'default !important' }}>
            {label}
          </span>
        )}
      </label>
    </div>
  );
}
