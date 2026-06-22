"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Address } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

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
  const { t } = useI18n();
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
    if (user) window.setTimeout(() => fetchAddresses(), 0);
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
    if (!confirm(t("addr.delete_confirm"))) return;
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
      setFormError(err instanceof Error ? err.message : t("addr.save_fail"));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <div className="py-16 text-center text-slate-400">{t("addr.loading")}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t("addr.title")}</h1>
        <button
          onClick={openNew}
          className="bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-teal-700 transition"
        >
          {t("addr.add_btn")}
        </button>
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <p>{t("addr.empty")}</p>
          <button onClick={openNew} className="mt-3 text-sm underline text-slate-600 hover:text-slate-900">
            {t("addr.add_first")}
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
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t("addr.default_badge")}</span>
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
                  {t("addr.edit_btn")}
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs px-3 py-1.5 border border-red-200 rounded-xl hover:bg-red-50 text-red-500 transition"
                >
                  {t("addr.delete_btn")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-5">
            {editId ? t("addr.form.edit_title") : t("addr.form.add_title")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("addr.form.label")}</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("addr.form.name")}</label>
                <input
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("addr.form.surname")}</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("addr.form.phone")}</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("addr.form.city")}</label>
                <input
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("addr.form.district")}</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("addr.form.full_address")}</label>
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
                {t("addr.form.default_shipping")}
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 text-sm"
              >
                {saving ? t("addr.form.saving") : t("addr.form.save_btn")}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm"
              >
                {t("addr.form.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
