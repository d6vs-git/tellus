import React from "react";

/**
 * A full-screen white loading overlay with a centered spinning icon.
 * Use as <LoadingOverlay /> anywhere in the app for a consistent loading UI.
 */
export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-white z-[9999] flex items-center justify-center">
      <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  );
}
