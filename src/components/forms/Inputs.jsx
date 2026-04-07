import React from 'react';
import { User, Mail, Phone, Gamepad2, MessageSquare } from 'lucide-react';

const BaseInput = ({ label, icon: Icon, type = "text", name, placeholder, required, value, onChange, hint }) => {
  return (
    <div className="w-full mb-4">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 font-body">
        {label} {required && <span className="text-esports-warning">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        </div>
        <input
          type={type}
          name={name}
          className={`input-field ${Icon ? 'pl-10' : 'pl-4'}`}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
        />
      </div>
      {hint && <p className="mt-1 text-[10px] text-gray-500 font-body">{hint}</p>}
    </div>
  );
};

export const TextInput = (props) => <BaseInput {...props} icon={User} />;
export const EmailInput = (props) => <BaseInput {...props} type="email" icon={Mail} />;
export const PhoneInput = (props) => <BaseInput {...props} type="tel" icon={Phone} />;
export const SteamIDInput = (props) => <BaseInput {...props} icon={Gamepad2} hint="Steam64 ID or Profile URL" />;
export const DiscordInput = (props) => <BaseInput {...props} icon={MessageSquare} hint="e.g. username#0000 or username" />;

export const SelectInput = ({ label, name, options, required, value, onChange }) => {
  return (
    <div className="w-full mb-4">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 font-body">
        {label} {required && <span className="text-esports-warning">*</span>}
      </label>
      <select
        name={name}
        className="input-field appearance-none cursor-pointer"
        required={required}
        value={value}
        onChange={onChange}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};
