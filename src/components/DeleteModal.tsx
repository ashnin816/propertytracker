"use client";

interface DeleteModalProps {
  title: string;
  message: string;
  warning?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({
  title,
  message,
  warning,
  onConfirm,
  onCancel,
}: DeleteModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-sm animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 text-center">
          {/* Warning icon */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>

          {warning && (
            <div className="mt-3 px-3 py-2 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 font-medium">{warning}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
