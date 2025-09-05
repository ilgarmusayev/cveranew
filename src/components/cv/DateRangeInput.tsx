'use client';

import React, { useEffect, useState } from 'react';
import { MONTH_NAMES, CVLanguage } from '@/lib/cvLanguage';

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
  cvLanguage?: CVLanguage;
  singleDate?: boolean; // For certifications - only show start date
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
  currentLabel,
  required = false,
  cvLanguage = 'azerbaijani',
  singleDate = false
}: DateRangeInputProps) {

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Get localized month names and labels
  const language = cvLanguage || 'azerbaijani';
  const monthNames = MONTH_NAMES[language];
  
  // Localized UI texts
  const texts = {
    clear: language === 'english' ? 'Clear' : 'Təmizlə',
    thisMonth: language === 'english' ? 'This Month' : 'Bu ay',
    close: language === 'english' ? 'Close' : 'Bağla',
    selectMonth: language === 'english' ? 'Select month' : 'Ay seçin',
    year: language === 'english' ? 'Year' : 'İl',
    month: language === 'english' ? 'Month' : 'Ay',
    currentlyWorking: language === 'english' ? 'Currently working' : 'Davam edir'
  };

  // Format date for display (showing localized month names)
  const formatDateForDisplay = (date: string) => {
    if (!date) return '';
    
    // Parse YYYY-MM format
    const match = date.match(/^(\d{4})-(\d{2})$/);
    if (!match) return date;
    
    const year = match[1];
    const monthIndex = parseInt(match[2]) - 1;
    
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]} ${year}`;
    }
    
    return date;
  };

  // Generate years (current year back to 50 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 50; year--) {
      years.push(year);
    }
    return years;
  };

  // Handle date selection
  const handleDateSelect = (year: number, monthIndex: number, isStartDate: boolean) => {
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    const dateStr = `${year}-${monthStr}`;
    
    if (isStartDate) {
      onStartDateChange(dateStr);
      setShowStartPicker(false);
    } else {
      onEndDateChange(dateStr);
      setShowEndPicker(false);
    }
  };

  // Custom date picker component
  const DatePicker = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    currentValue, 
    isStartDate 
  }: { 
    isOpen: boolean;
    onClose: () => void;
    onSelect: (year: number, monthIndex: number) => void;
    currentValue: string;
    isStartDate: boolean;
  }) => {
    const [selectedYear, setSelectedYear] = useState(() => {
      if (currentValue) {
        const match = currentValue.match(/^(\d{4})-(\d{2})$/);
        return match ? parseInt(match[1]) : new Date().getFullYear();
      }
      return new Date().getFullYear();
    });

    const years = generateYears();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    if (!isOpen) return null;

    return (
      <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
        {/* Year selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {texts.year}
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Month grid */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {texts.month}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((month, index) => {
              const isDisabled = selectedYear === currentYear && index > currentMonth;
              const isSelected = currentValue === `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
              
              return (
                <button
                  key={index}
                  onClick={() => !isDisabled && onSelect(selectedYear, index)}
                  disabled={isDisabled}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => {
              if (isStartDate) {
                onStartDateChange('');
              } else {
                onEndDateChange('');
              }
              onClose();
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {texts.clear}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => onSelect(currentYear, currentMonth)}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {texts.thisMonth}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {texts.close}
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  return (
    <div className="space-y-3">
      <div className={`grid gap-4 ${singleDate ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Start Date */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {startLabel} {required && <span className="text-red-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowStartPicker(!showStartPicker)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left bg-white hover:bg-gray-50 transition-colors"
          >
            {formatDateForDisplay(startDate) || texts.selectMonth}
          </button>
          
          <DatePicker
            isOpen={showStartPicker}
            onClose={() => setShowStartPicker(false)}
            onSelect={(year, monthIndex) => handleDateSelect(year, monthIndex, true)}
            currentValue={startDate}
            isStartDate={true}
          />
        </div>

        {/* End Date - only show if not singleDate */}
        {!singleDate && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {endLabel}
            </label>
            <button
              type="button"
              onClick={() => !current && setShowEndPicker(!showEndPicker)}
              disabled={current}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left transition-colors ${
                current ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
              }`}
            >
              {current 
                ? texts.currentlyWorking
                : formatDateForDisplay(endDate || '') || texts.selectMonth
              }
            </button>
            
            {!current && (
              <DatePicker
                isOpen={showEndPicker}
                onClose={() => setShowEndPicker(false)}
                onSelect={(year, monthIndex) => handleDateSelect(year, monthIndex, false)}
                currentValue={endDate || ''}
                isStartDate={false}
              />
            )}
          </div>
        )}
      </div>

      {/* Current checkbox - only show if not singleDate */}
      {!singleDate && currentLabel && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="current-work"
            checked={current}
            onChange={(e) => onCurrentChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="current-work" className="ml-2 text-sm text-gray-700">
            {currentLabel}
          </label>
        </div>
      )}

      {/* Validation Message - only show if not singleDate */}
      {!singleDate && startDate && endDate && !current && new Date(startDate) > new Date(endDate) && (
        <div className="text-red-500 text-sm">
          {language === 'english' 
            ? 'End date must be after start date'
            : 'Bitirmə tarixi başlama tarixindən sonra olmalıdır'
          }
        </div>
      )}
    </div>
  );
}
