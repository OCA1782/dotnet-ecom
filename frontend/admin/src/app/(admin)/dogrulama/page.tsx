"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  CheckCircle2, XCircle, RefreshCw, Loader2, ShieldCheck,
  AlertTriangle, Clock, ChevronDown, ChevronUp, Monitor,
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

// Hangi doğrulama kontrolünün hangi admin/müşteri ekranlarıyla ilişkili olduğu
const SCREEN_MAP: Record<string, string[]> = {
  // API endpoint kontrolleri
  "GET /health → 200":                            ["Sistem Sağlığı"],
  "GET /api/products → 200":                      ["Ürünler", "Mağaza"],
  "GET /api/categories → 200":                    ["Kategoriler", "Mağaza"],
  "GET /api/brands → 200":                        ["Markalar", "Mağaza"],
  "GET /api/admin/dashboard → 401 (auth guard)":  ["Dashboard"],
  "GET /api/orders/admin/list → 401 (auth guard)":["Siparişler"],
  "GET /api/admin/users → 401 (auth guard)":      ["Kullanıcılar"],
  "GET /api/admin/coupons → 401 (auth guard)":    ["Kuponlar"],
  "GET /api/admin/shipments → 401 (auth guard)":  ["Kargo"],
  "GET /api/admin/invoices → 401 (auth guard)":   ["Faturalar"],
  // Multi-tenant kod kontrolleri
  "GetDashboardQuery: ICurrentUserService":        ["Dashboard"],
  "GetDashboardQuery: managedUserIds":             ["Dashboard"],
  "GetDashboardQuery: tenant cache key":           ["Dashboard"],
  "GetModuleStatsQuery: managedUserIds":           ["Dashboard → Modüller"],
  "GetNotificationsQuery: managedUserIds":         ["Bildirimler (header)"],
  "GetProductSalesReportQuery: tenant filter":     ["Raporlar"],
  "GetDocsActivityQuery: tenant filter":           ["Hareketler"],
  "GetCouponUsagesQuery: tenant filter":           ["Kuponlar"],
  "GetAllStockMovementsQuery: tenant filter":      ["Stok Hareketleri"],
  "GetStockMovementsQuery: tenant filter":         ["Stok → Ürün Detayı"],
  "GetProductHistoryQuery: tenant filter":         ["Ürünler → Geçmiş"],
  "GetUserDetailsQuery: tenant filter":            ["Kullanıcılar → Detay"],
  "Product.cs: CreatedByAdminId":                  ["Ürünler", "Stok", "Raporlar"],
  "Category.cs: CreatedByAdminId":                 ["Kategoriler"],
  "Brand.cs: CreatedByAdminId":                    ["Markalar"],
  "User.cs: CreatedByAdminId":                     ["Kullanıcılar"],
  "ICurrentUserService: IsSuperAdmin":             ["Tüm Admin Ekranları"],
  "UploadController: CreatedByAdminId":            ["Dosya Yükleme"],
  "Migration: AddCreatedByAdminId mevcut":         ["DB Altyapısı"],
  // Lisans
  "LicenseAssignmentsController: UserRoles.AnyAsync (Include fix)": ["Yönetim → Lisans"],
  "LicenseValidator: RSA":                         ["Lisans Doğrulama (Middleware)"],
  // Frontend
  "Admin error.tsx: backend error logging":        ["Tüm Admin Ekranları"],
  "Customer error.tsx: backend error logging":     ["Tüm Müşteri Ekranları"],
  // Jobs
  "JobScheduler kayıtlı":                          ["Joblar"],
  "TodoVerificationJob kayıtlı":                   ["Doğrulama"],
  // SEO
  "sitemap.ts mevcut":                             ["Mağaza — Sitemap"],
  // DB
  "Products tablosu":                              ["Ürünler", "Stok", "Mağaza"],
  "Categories tablosu":                            ["Kategoriler", "Mağaza"],
  "Users tablosu":                                 ["Kullanıcılar", "Siparişler"],
  "JobLogs tablosu":                               ["Joblar"],
  "Announcements tablosu":                         ["Duyurular"],
  "Orders tablosu":                                ["Siparişler", "Raporlar"],
};

export default function DogrulamaPage() {
  const { t } = useI18n();
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
            <h1 className="text-xl font-semibold">{t("page./dogrulama", "TODO Doğrulama")}</h1>
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

      {/* Kullanım Kılavuzu */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Bu Ekran Ne İşe Yarar?
        </p>
        <p className="text-blue-700">
          Bu sayfa, projede &quot;tamamlandı&quot; olarak işaretlenen özelliklerin gerçekten kodda var olup olmadığını otomatik olarak denetler.
          Kontroller 3 kategoride yürütülür: <strong>API</strong> (endpoint erişilebilirliği),{" "}
          <strong>Kod</strong> (kaynak dosyalarda kritik pattern varlığı), <strong>DB</strong> (tablo erişilebilirliği).
        </p>
        <p className="text-blue-700">
          Her kontrol satırında <Monitor className="inline w-3 h-3" />{" "}
          <strong>İlgili Ekranlar</strong> bilgisi gösterilir — o kontrolün hangi admin veya müşteri sayfasıyla ilişkili olduğunu belirtir.
          Kontroller her 12 saatte bir otomatik çalışır; <em>Manuel Çalıştır</em> ile anlık tetiklenebilir.
        </p>
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
                      {items.map((item, idx) => {
                        const screens = SCREEN_MAP[item.name];
                        return (
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
                              {screens && screens.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {screens.map((s) => (
                                    <span
                                      key={s}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100"
                                    >
                                      <Monitor className="w-2.5 h-2.5" />
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {item.latencyMs > 0 && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {item.latencyMs}ms
                              </span>
                            )}
                          </div>
                        );
                      })}
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
