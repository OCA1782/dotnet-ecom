"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice, formatDate, resolveMediaUrl } from "@/lib/utils";
import {
  ArrowLeft, User, Mail, Phone, Calendar, ShieldCheck,
  Package, MapPin, ToggleLeft, ToggleRight, AlertTriangle,
  ChevronRight, Clock, CheckCircle2, XCircle, ShieldAlert,
  Banknote, Star,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

interface UserDetails {
  id: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  emailConfirmed: boolean;
  failedLoginCount: number;
  lockoutUntil?: string;
  createdDate: string;
  lastLoginDate?: string;
  commercialConsent: boolean;
  roles: string[];
  addresses: AddressItem[];
  recentOrders: OrderItem[];
  totalOrderCount: number;
  totalSpent: number;
}

interface AddressItem {
  id: string;
  addressTitle: string;
  city: string;
  district: string;
  fullAddress: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  createdDate: string;
}

const STATUS_COLORS: Record<string, string> = {
  Created: "bg-slate-100 text-slate-600",
  Processing: "bg-blue-100 text-blue-700",
  PaymentPending: "bg-yellow-100 text-yellow-700",
  PaymentCompleted: "bg-teal-100 text-teal-700",
  Preparing: "bg-indigo-100 text-indigo-700",
  Shipped: "bg-purple-100 text-purple-700",
  Delivered: "bg-green-100 text-green-700",
  Returned: "bg-orange-100 text-orange-700",
  Cancelled: "bg-red-100 text-red-700",
  PartiallyRefunded: "bg-pink-100 text-pink-700",
  Refunded: "bg-rose-100 text-rose-700",
  Failed: "bg-gray-100 text-gray-600",
  OnHold: "bg-amber-100 text-amber-700",
  RefundRequested: "bg-red-100 text-red-700",
};

const STATUS_TR: Record<string, string> = {
  Created: "Oluşturuldu", Processing: "İşleniyor", PaymentPending: "Ödeme Bekleniyor",
  PaymentCompleted: "Ödeme Alındı", Preparing: "Hazırlanıyor", Shipped: "Kargoda",
  Delivered: "Teslim Edildi", Returned: "İade", Cancelled: "İptal", OnHold: "Askıda",
  PartiallyRefunded: "Kısmi İade", Refunded: "İade Edildi", Failed: "Başarısız",
  RefundRequested: "İade Talebi",
};

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: "bg-red-100 text-red-700",
  Admin: "bg-violet-100 text-violet-700",
  Customer: "bg-teal-100 text-teal-700",
  ContentManager: "bg-blue-100 text-blue-700",
  FinanceUser: "bg-green-100 text-green-700",
  OrderManager: "bg-orange-100 text-orange-700",
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleModal, setToggleModal] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<UserDetails>(`/api/admin/users/${userId}`);
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function handleToggleActive() {
    if (!user) return;
    setToggling(true);
    try {
      const endpoint = user.isActive
        ? `/api/admin/users/${user.id}/deactivate`
        : `/api/admin/users/${user.id}/activate`;
      await api.patch(endpoint, {});
      setMsg({ text: user.isActive ? "Kullanıcı pasife alındı." : "Kullanıcı aktif edildi.", ok: true });
      setUser(prev => prev ? { ...prev, isActive: !prev.isActive } : prev);
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "İşlem başarısız.", ok: false });
    } finally {
      setToggling(false);
      setToggleModal(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32 text-slate-400">Yükleniyor...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-slate-500 mb-4">Kullanıcı bulunamadı.</p>
        <Link href="/kullanicilar" className="text-teal-600 hover:underline text-sm">← Kullanıcılara Dön</Link>
      </div>
    );
  }

  const initials = `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase();
  const isLocked = user.lockoutUntil && new Date(user.lockoutUntil) > new Date();

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kullanıcı Detayı</h1>
          <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sol kolon — profil + istatistik */}
        <div className="space-y-4">
          {/* Profil Kartı */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col items-center text-center gap-3">
              {user.avatarUrl ? (
                <img src={resolveMediaUrl(user.avatarUrl)} alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-teal-200 shadow" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow">
                  {initials}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-900">{user.name} {user.surname}</h2>
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {user.roles.map(r => (
                    <span key={r} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[r] ?? "bg-slate-100 text-slate-600"}`}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full pt-3 border-t border-slate-100 space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <span>Kayıt: {formatDate(user.createdDate)}</span>
                </div>
                {user.lastLoginDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span>Son giriş: {formatDate(user.lastLoginDate)}</span>
                  </div>
                )}
              </div>

              {/* Durum badge'leri */}
              <div className="w-full pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {user.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {user.isActive ? "Aktif Hesap" : "Pasif Hesap"}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${user.emailConfirmed ? "bg-teal-50 text-teal-700" : "bg-slate-50 text-slate-500"}`}>
                  <Mail size={12} />
                  {user.emailConfirmed ? "E-posta Doğrulandı" : "E-posta Doğrulanmamış"}
                </div>
                {isLocked && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700">
                    <ShieldAlert size={12} />
                    Hesap Kilitli
                  </div>
                )}
                {user.failedLoginCount > 0 && !isLocked && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-600">
                    <AlertTriangle size={12} />
                    {user.failedLoginCount} başarısız giriş
                  </div>
                )}
              </div>

              {/* Aksiyonlar */}
              <div className="w-full pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => setToggleModal(true)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition ${
                    user.isActive
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {user.isActive ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                  {user.isActive ? "Pasife Al" : "Aktif Et"}
                </button>
                <Link
                  href={`/kullanicilar?highlight=${user.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
                >
                  <ShieldCheck size={15} />
                  Rol Yönetimi
                </Link>
              </div>
            </div>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
              <Package size={20} className="text-teal-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{user.totalOrderCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Toplam Sipariş</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
              <Banknote size={20} className="text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{formatPrice(user.totalSpent)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Toplam Harcama</p>
            </div>
          </div>

          {/* Adresler */}
          {user.addresses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" /> Adresler
              </h3>
              <div className="space-y-2">
                {user.addresses.map(a => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">{a.addressTitle}</span>
                      {a.isDefaultShipping && (
                        <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">Varsayılan</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{a.district}, {a.city}</p>
                    <p className="text-xs text-slate-400 truncate">{a.fullAddress}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ kolon — siparişler */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Package size={14} className="text-slate-400" /> Son Siparişler
              </h3>
              <Link
                href={`/siparisler?search=${encodeURIComponent(user.email)}`}
                className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                Tümü <ChevronRight size={12} />
              </Link>
            </div>

            {user.recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-400 text-sm">
                <Package size={28} className="mx-auto mb-2 text-slate-300" />
                Henüz sipariş yok.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {user.recentOrders.map(o => (
                  <Link key={o.id} href={`/siparisler/${o.orderNumber}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-teal-600 transition">{o.orderNumber}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {STATUS_TR[o.status] ?? o.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(o.createdDate)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-800">{formatPrice(o.grandTotal)}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-400 transition shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Ek Bilgiler */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <User size={14} className="text-slate-400" /> Hesap Bilgileri
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">E-posta İzni</p>
                <p className="text-sm text-slate-700">{user.commercialConsent ? "✓ İzin Verildi" : "— Verilmedi"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Başarısız Giriş</p>
                <p className={`text-sm font-semibold ${user.failedLoginCount > 3 ? "text-red-600" : "text-slate-700"}`}>
                  {user.failedLoginCount}
                </p>
              </div>
              {user.lockoutUntil && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Kilit Bitiş</p>
                  <p className="text-sm text-amber-600">{new Date(user.lockoutUntil).toLocaleString("tr-TR")}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                href={`/hareketler?search=${encodeURIComponent(user.email)}`}
                className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                <Star size={13} /> Audit log kayıtlarını görüntüle <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Confirm Modal */}
      {toggleModal && (
        <ConfirmModal
          title={user.isActive ? "Kullanıcıyı Pasife Al" : "Kullanıcıyı Aktif Et"}
          message={`${user.name} ${user.surname} (${user.email}) kullanıcısını ${user.isActive ? "pasife almak" : "aktif etmek"} istediğinizden emin misiniz?`}
          danger={user.isActive}
          confirmLabel={user.isActive ? "Pasife Al" : "Aktif Et"}
          onConfirm={() => { void handleToggleActive(); }}
          onCancel={() => setToggleModal(false)}
        />
      )}
    </div>
  );
}
