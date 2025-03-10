import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface AutocompleteProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  suggestions: string[];
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export function Autocomplete({
  label,
  id,
  value,
  onChange,
  onBlur,
  suggestions,
  className,
  placeholder,
  required = false,
  disabled = false,
  error,
}: AutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle clicks outside of the component
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Use a timeout to allow the click event on suggestions to fire first
    setTimeout(() => {
      if (onBlur) onBlur();
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            id={id}
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("pl-10", error && "border-red-500")}
          />
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionRef}
            className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md py-1 text-sm border border-gray-200 max-h-60 overflow-y-auto"
          >
            <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-100">
              {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} found
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => handleSelectSuggestion(suggestion)}
                type="button"
              >
                <span className="font-medium">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
