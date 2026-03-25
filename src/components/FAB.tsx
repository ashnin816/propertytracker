"use client";

interface FABProps {
  onClick: () => void;
  label: string;
}

export default function FAB({ onClick, label }: FABProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center pointer-events-none">
      <button
        onClick={onClick}
        className="pointer-events-auto cursor-pointer bg-blue-600 text-white h-12 px-6 rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 transition-all duration-200 flex items-center gap-2 font-semibold text-sm"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
        {label}
      </button>
    </div>
  );
}
