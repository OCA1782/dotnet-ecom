"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Address } from "@/types";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

interface AddressForm {
  addressTitle: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  city: string;
  district: string;
  neighborhood: string;
  fullAddress: string;
  postalCode: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

const emptyForm: AddressForm = {
  addressTitle: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  city: "",
  district: "",
  neighborhood: "",
  fullAddress: "",
  postalCode: "",
  isDefaultShipping: false,
  isDefaultBilling: false,
};

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/giris");
  }, [authLoading, user, router]);

  const fetchAddresses = useCallback(async () => {
    try {
      const data = await api.get<Address[]>("/api/addresses");
      setAddresses(data);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user, fetchAddresses]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  }

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(addr: Address) {
    setEditId(addr.id);
    setForm({
      addressTitle: addr.addressTitle,
      firstName: addr.firstName,
      lastName: addr.lastName,
      phoneNumber: addr.phoneNumber,
      city: addr.city,
      district: addr.district,
      neighborhood: addr.neighborhood ?? "",
      fullAddress: addr.fullAddress,
      postalCode: addr.postalCode ?? "",
      isDefaultShipping: addr.isDefaultShipping,
      isDefaultBilling: addr.isDefaultBilling,
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/api/addresses/${id}`);
      await fetchAddresses();
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/addresses/${editId}`, form);
      } else {
        await api.post("/api/addresses", { ...form, invoiceType: 1 });
      }
      setShowForm(false);
      await fetchAddresses();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Adreslerim</h1>
        <button
          onClick={openNew}
          className="bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-teal-700 transition"
        >
          + Yeni Adres
        </button>
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <p>Kayıtlı adresiniz yok.</p>
          <button onClick={openNew} className="mt-3 text-sm underline text-slate-600 hover:text-slate-900">
            İlk adresinizi ekleyin
          </button>
        </div>
      )}

      <div className="space-y-4">
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-900">{addr.addressTitle}</p>
                  {addr.isDefaultShipping && (
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">Varsayılan</span>
                  )}
                </div>
                <p className="text-sm text-slate-700">
                  {addr.firstName} {addr.lastName} · {addr.phoneNumber}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{addr.fullAddress}</p>
                <p className="text-sm text-slate-500">
                  {addr.district}, {addr.city}
                  {addr.postalCode ? ` ${addr.postalCode}` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(addr)}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 transition"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs px-3 py-1.5 border border-red-200 rounded-xl hover:bg-red-50 text-red-500 transition"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-5">
            {editId ? "Adresi Düzenle" : "Yeni Adres Ekle"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adres Başlığı</label>
              <input
                name="addressTitle"
                required
                value={form.addressTitle}
                onChange={handleChange}
                placeholder="Örn: Ev, İş"
                className={INPUT}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                <input
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label>
                <input
                  name="lastName"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input
                name="phoneNumber"
                required
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="05XXXXXXXXX"
                className={INPUT}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İl</label>
                <input
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İlçe</label>
                <input
                  name="district"
                  required
                  value={form.district}
                  onChange={handleChange}
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Açık Adres</label>
              <textarea
                name="fullAddress"
                required
                value={form.fullAddress}
                onChange={handleChange}
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefaultShipping"
                name="isDefaultShipping"
                checked={form.isDefaultShipping}
                onChange={handleChange}
                className="rounded"
              />
              <label htmlFor="isDefaultShipping" className="text-sm text-slate-700">
                Varsayılan teslimat adresi olarak ayarla
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 text-sm"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
