"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  CheckCircle2, XCircle, RefreshCw, Loader2, ShieldCheck,
  AlertTriangle, Clock, ChevronDown, ChevronUp,
} from "lucide-react";

interface VerificationItem {
  category: string;
  name: string;
  passed: boolean;
  detail: string;
  latencyMs: number;
}

interface VerificationResult {
  ran: boolean;
  message?: string;
  checkedAt?: string;
  total?: number;
  passed?: number;
  failed?: number;
  passRate?: number;
  items?: VerificationItem[];
}

export default function DogrulamaPage() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const data = await api.get<VerificationResult>("/api/admin/verification");
      setResult(data);
      if (data.items) {
        const groups: Record<string, boolean> = {};
        data.items.forEach((i) => { groups[i.category] = true; });
        setOpenGroups(groups);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async () => {
    setRunning(true);
    try {
      await api.post("/api/admin/verification/run", {});
      await load();
    } catch {
      // ignore
    } finally {
      setRunning(false);
    }
  };

  const toggleGroup = (cat: string) =>
    setOpenGroups((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const grouped = result?.items
    ? result.items.reduce<Record<string, VerificationItem[]>>((acc, item) => {
        (acc[item.category] ??= []).push(item);
        return acc;
      }, {})
    : {};

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
          <div>
            <h1 className="text-xl font-semibold">TODO Doğrulama</h1>
            <p className="text-sm text-gray-500">
              Tamamlanan özelliklerin gerçekten implemente edildiğini doğrular
            </p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={running || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {running ? "Çalışıyor..." : "Manuel Çalıştır"}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {!loading && result && !result.ran && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-700">{result.message}</p>
        </div>
      )}

      {!loading && result?.ran && (
        <>
          {/* Summary Bar */}
          <div className="bg-white border rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{result.total}</div>
              <div className="text-xs text-gray-500 mt-1">Toplam</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.passed}</div>
              <div className="text-xs text-gray-500 mt-1">Başarılı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{result.failed}</div>
              <div className="text-xs text-gray-500 mt-1">Başarısız</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  (result.passRate ?? 0) >= 100
                    ? "text-green-600"
                    : (result.passRate ?? 0) >= 80
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                %{result.passRate}
              </div>
              <div className="text-xs text-gray-500 mt-1">Başarı Oranı</div>
            </div>
          </div>

          {/* Timestamp */}
          {result.checkedAt && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              Son kontrol: {new Date(result.checkedAt).toLocaleString("tr-TR")}
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                (result.passRate ?? 0) >= 100
                  ? "bg-green-500"
                  : (result.passRate ?? 0) >= 80
                  ? "bg-yellow-400"
                  : "bg-red-500"
              }`}
              style={{ width: `${result.passRate ?? 0}%` }}
            />
          </div>

          {/* Groups */}
          <div className="space-y-3">
            {Object.entries(grouped).map(([cat, items]) => {
              const catPassed = items.filter((i) => i.passed).length;
              const catFailed = items.filter((i) => !i.passed).length;
              const isOpen = openGroups[cat] ?? true;

              return (
                <div key={cat} className="bg-white border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleGroup(cat)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {catFailed === 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-gray-800">{cat}</span>
                      <span className="text-xs text-gray-500">
                        {catPassed}/{items.length}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t divide-y">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 px-4 py-3 text-sm ${
                            item.passed ? "bg-white" : "bg-red-50"
                          }`}
                        >
                          {item.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-700">{item.name}</div>
                            <div
                              className={`text-xs mt-0.5 ${
                                item.passed ? "text-gray-500" : "text-red-600"
                              }`}
                            >
                              {item.detail}
                            </div>
                          </div>
                          {item.latencyMs > 0 && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {item.latencyMs}ms
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
