"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Beklenmeyen bir hata oluştu</h2>
              <p className="text-slate-500 text-sm mt-1">
                Sayfa yüklenirken sorun yaşandı. Sayfayı yenileyerek tekrar deneyin.
              </p>
              {this.state.message && (
                <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 font-mono break-all">
                  {this.state.message}
                </p>
              )}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, message: "" })}
              className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition"
            >
              <RefreshCw size={14} />
              Tekrar Dene
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
