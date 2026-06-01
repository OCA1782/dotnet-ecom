"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-zinc-800 mb-2">Bir şeyler ters gitti</h2>
      <p className="text-zinc-500 text-sm mb-6 max-w-sm">
        {error.message || "Sayfa yüklenirken beklenmeyen bir hata oluştu."}
      </p>
      <button
        onClick={reset}
        className="bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
