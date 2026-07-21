interface CustomSelectProps {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
}

export default function CustomSelect({ label, options, value, onChange }: CustomSelectProps) {
    return (
        <div className="relative">
            <label className="block text-sm font-semibold mb-2 text-slate-700">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer pr-10 font-medium"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="text-slate-900 bg-white">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
