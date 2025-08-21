'use client';

import React, { useEffect } from 'react';

interface DateRangeInputProps {
  startDate: string;
  endDate?: string;
  current: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onCurrentChange: (current: boolean) => void;
  startLabel?: string;
  endLabel?: string;
  currentLabel?: string;
  required?: boolean;
}

export default function DateRangeInput({
  startDate,
  endDate = '',
  current,
  onStartDateChange,
  onEndDateChange,
  onCurrentChange,
  startLabel = 'Başlama tarixi',
  endLabel = 'Bitirmə tarixi',
  currentLabel = 'Hal-hazırda davam edir',
  required = false
}: DateRangeInputProps) {

  // Auto-sync: Only auto-set current if user hasn't explicitly set it to false
  useEffect(() => {
    // Don't auto-manage current state - let components handle it explicitly
    // This prevents unwanted side effects and lets users control the state
  }, [startDate, endDate, current]);

  const handleCurrentToggle = () => {
    const newCurrentState = !current;
    console.log('DateRangeInput: Current status toggled to:', newCurrentState);
    onCurrentChange(newCurrentState);
    // If setting to current, clear the end date
    if (newCurrentState) {
      console.log('DateRangeInput: Clearing end date because current is true');
      onEndDateChange('');
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    onStartDateChange(newStartDate);

    // If there's an end date and it's before the new start date, clear it
    if (endDate && newStartDate && new Date(newStartDate) > new Date(endDate)) {
      onEndDateChange('');
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;

    // IMPORTANT: If end date is selected, immediately deactivate current status
    if (newEndDate && newEndDate.trim() !== '') {
      console.log('DateRangeInput: End date selected, deactivating current status');
      onCurrentChange(false);
    }

    onEndDateChange(newEndDate);
  };

  // Format date for input (YYYY-MM format for month/year inputs)
  const formatDateForInput = (date: string) => {
    if (!date) return '';

    // If it's already in YYYY-MM format, return as is
    if (/^\d{4}-\d{2}$/.test(date)) {
      return date;
    }

    // Try to parse various date formats and convert to YYYY-MM
    try {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      }
    } catch (error) {
      console.warn('Invalid date format:', date);
    }

    return date;
  };

  // Determine if this should be considered "current" - only use explicit current state
  const isEffectivelyCurrent = current;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {startLabel} {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="month"
            value={formatDateForInput(startDate)}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required={required}
            max={new Date().toISOString().slice(0, 7)} // Don't allow future dates
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {endLabel}
          </label>
          <input
            type="month"
            value={formatDateForInput(endDate || '')}
            onChange={handleEndDateChange}
            disabled={current} // Disable when current is true
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              current ? 'bg-gray-100 text-gray-500' : ''
            }`}
            min={startDate ? formatDateForInput(startDate) : undefined}
            max={new Date().toISOString().slice(0, 7)} // Don't allow future dates
          />
        </div>
      </div>

      {/* Current Position Toggle with + Icon */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleCurrentToggle}
          className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 ${
            current
              ? 'bg-green-500 border-green-500 text-white shadow-md' 
              : 'bg-white border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500'
          }`}
        >
          <span className={`text-sm font-bold transition-transform duration-200 ${current ? 'rotate-45' : ''}`}>
            +
          </span>
        </button>
        <label
          onClick={handleCurrentToggle}
          className="text-sm text-gray-700 cursor-pointer select-none hover:text-green-600 transition-colors"
        >
          {currentLabel}
        </label>
      </div>

      {/* Validation Message */}
      {startDate && endDate && !current && new Date(startDate) > new Date(endDate) && (
        <div className="text-red-500 text-sm">
          Bitirmə tarixi başlama tarixindən sonra olmalıdır
        </div>
      )}
    </div>
  );
}
