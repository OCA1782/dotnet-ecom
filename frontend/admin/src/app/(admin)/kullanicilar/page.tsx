"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { AdminUser, PaginatedList } from "@/types";
import { Search } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: "bg-purple-100 text-purple-800",
  Admin: "bg-red-100 text-red-800",
  OrderManager: "bg-blue-100 text-blue-800",
  FinanceUser: "bg-green-100 text-green-800",
  Customer: "bg-zinc-100 text-zinc-600",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) qs.set("search", search);
      const data = await api.get<PaginatedList<AdminUser>>(`/api/admin/users?${qs}`);
      setUsers(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Kullanıcılar</h1>
        <span className="text-sm text-zinc-500">{totalCount} kullanıcı</span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ad, soyad veya e-posta..."
            className="pl-8 pr-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 w-64"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition">
          Ara
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            className="px-4 py-2 border border-zinc-300 text-zinc-600 text-sm rounded-lg hover:bg-zinc-50 transition">
            Temizle
          </button>
        )}
      </form>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Kullanıcı</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">E-posta</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Roller</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-400">Yükleniyor...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-400">Kullanıcı bulunamadı</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-zinc-900">{u.name} {u.surname}</p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles?.map((role) => (
                          <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role] ?? "bg-zinc-100 text-zinc-600"}`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-400 text-xs">{formatDate(u.createdDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-100">← Önceki</button>}
          <span className="px-4 py-2 text-sm text-zinc-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-100">Sonraki →</button>}
        </div>
      )}
    </div>
  );
}
