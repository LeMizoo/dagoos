'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
  label?: string;
}

export default function PasswordInput({ value, onChange, placeholder, required, minLength, className, label }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder || '••••••••'}
          required={required}
          minLength={minLength}
          className={`w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${className || ''}`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
