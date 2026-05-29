"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, ShoppingCart, CreditCard, Truck, RotateCcw,
  Server, Database, Layers, ArrowRight, Users, Package,
  Shield, Mail, Activity, GitBranch, Box, Zap,
  ChevronDown, ChevronRight, MessageSquare, Lock, RefreshCw,
  MapPin, FlaskConical, Settings, Calendar, Tag, Cpu,
  BarChart3, Palette, KeyRound, Bell, Globe, Code2,
  Warehouse, LayoutDashboard, FileText, AlertCircle, Clock,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api";

type DocTab = "surecler" | "teknik" | "yenilikler";

/* ─── Flow Diagram Helpers ────────────────────────────────────────────── */
function FlowStep({ icon: Icon, label, color = "teal", sub }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  color?: "teal" | "violet" | "emerald" | "amber" | "red" | "blue";
  sub?: string;
}) {
  const colors = {
    teal:    "bg-teal-50 border-teal-200 text-teal-700",
    violet:  "bg-violet-50 border-violet-200 text-violet-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber:   "bg-amber-50 border-amber-200 text-amber-700",
    red:     "bg-red-50 border-red-200 text-red-700",
    blue:    "bg-blue-50 border-blue-200 text-blue-700",
  };
  return (
    <div className="flex flex-col items-center gap-1 min-w-[90px]">
      <div className={`flex flex-col items-center gap-2 border rounded-xl px-3 py-3 ${colors[color]}`}>
        <Icon size={20} />
        <span className="text-xs font-semibold text-center leading-tight">{label}</span>
      </div>
      {sub && <span className="text-[10px] text-slate-400 text-center">{sub}</span>}
    </div>
  );
}

function Arrow() {
  return <ArrowRight size={16} className="text-slate-300 shrink-0 mx-1 self-center" />;
}

function FlowRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-2">
      {children}
    </div>
  );
}

function DocSection({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition">
        <Icon size={18} className="text-teal-600 shrink-0" />
        <span className="text-sm font-bold text-slate-800 flex-1">{title}</span>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 space-y-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function Badge({ label, color = "teal" }: { label: string; color?: "teal" | "violet" | "emerald" | "amber" | "red" | "blue" | "slate" }) {
  const colors = {
    teal:    "bg-teal-100 text-teal-700",
    violet:  "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber:   "bg-amber-100 text-amber-700",
    red:     "bg-red-100 text-red-700",
    blue:    "bg-blue-100 text-blue-700",
    slate:   "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[color]}`}>{label}</span>
  );
}

/* ─── Business Process Docs ───────────────────────────────────────────── */
function SureclerTab() {
  return (
    <div className="space-y-4">

      {/* Sipariş Akışı */}
      <DocSection title="Sipariş Akışı" icon={ShoppingCart}>
        <p className="text-xs text-slate-500 mb-3">Müşterinin sepet oluşturmasından siparişin tamamlanmasına kadar olan süreç.</p>
        <FlowRow>
          <FlowStep icon={Users} label="Müşteri" color="blue" sub="Giriş yapılır" />
          <Arrow />
          <FlowStep icon={ShoppingCart} label="Sepet" color="teal" sub="Ürün eklenir" />
          <Arrow />
          <FlowStep icon={CreditCard} label="Ödeme" color="violet" sub="Kart / Havale" />
          <Arrow />
          <FlowStep icon={Package} label="Sipariş" color="emerald" sub="Oluşturulur" />
          <Arrow />
          <FlowStep icon={Truck} label="Kargo" color="amber" sub="Gönderim" />
          <Arrow />
          <FlowStep icon={Shield} label="Tamamlandı" color="emerald" sub="Müşteri onayı" />
        </FlowRow>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {[
            { state: "Beklemede", desc: "Ödeme bekleniyor veya onay aşamasında", color: "amber" as const },
            { state: "İşleniyor", desc: "Ödeme alındı, hazırlanıyor", color: "blue" as const },
            { state: "Kargoda", desc: "Kargo firmasına teslim edildi", color: "violet" as const },
            { state: "Teslim Edildi", desc: "Müşteri teslim aldı", color: "emerald" as const },
            { state: "İptal", desc: "Müşteri veya admin iptal etti", color: "red" as const },
            { state: "İade", desc: "Ürün iade sürecinde", color: "amber" as const },
          ].map(s => (
            <div key={s.state} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Badge label={s.state} color={s.color} />
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Ödeme Akışı */}
      <DocSection title="Ödeme Akışı" icon={CreditCard}>
        <p className="text-xs text-slate-500 mb-3">Desteklenen ödeme yöntemleri ve işlem adımları.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Sanal POS (Kredi Kartı)</p>
            <FlowRow>
              <FlowStep icon={CreditCard} label="Kart Bilgisi" color="violet" />
              <Arrow />
              <FlowStep icon={Shield} label="3D Secure" color="amber" />
              <Arrow />
              <FlowStep icon={Zap} label="Pos Onayı" color="teal" />
              <Arrow />
              <FlowStep icon={Package} label="Sipariş" color="emerald" />
            </FlowRow>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Banka Havalesi / EFT</p>
            <FlowRow>
              <FlowStep icon={Users} label="Sipariş" color="blue" />
              <Arrow />
              <FlowStep icon={Database} label="IBAN'a Havale" color="amber" />
              <Arrow />
              <FlowStep icon={Shield} label="Admin Onayı" color="teal" />
              <Arrow />
              <FlowStep icon={Package} label="Hazırlanır" color="emerald" />
            </FlowRow>
          </div>
        </div>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          Havale ödemelerde sipariş admin onayına kadar <strong>Beklemede</strong> kalır. Onay sonrası otomatik olarak <strong>İşleniyor</strong> durumuna geçer.
        </div>
      </DocSection>

      {/* Kargo & İade */}
      <DocSection title="Kargo & İade Akışı" icon={Truck}>
        <p className="text-xs text-slate-500 mb-3">Kargo takip ve iade süreçleri. Kargo firmaları ShippingCarrier entity'sinde tanımlanır.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Kargo Süreci</p>
            <FlowRow>
              <FlowStep icon={Package} label="Paketleme" color="blue" />
              <Arrow />
              <FlowStep icon={Truck} label="Kargoya Ver" color="amber" sub="Kargo firması seçilir" />
              <Arrow />
              <FlowStep icon={Activity} label="Takip Kodu" color="violet" />
              <Arrow />
              <FlowStep icon={Shield} label="Teslim" color="emerald" />
            </FlowRow>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">İade Süreci</p>
            <FlowRow>
              <FlowStep icon={RotateCcw} label="Talep" color="amber" sub="ReturnRequested event" />
              <Arrow />
              <FlowStep icon={Truck} label="İade Kargo" color="blue" />
              <Arrow />
              <FlowStep icon={Shield} label="Admin Kontrol" color="violet" sub="Onayla / Reddet" />
              <Arrow />
              <FlowStep icon={CreditCard} label="Geri Ödeme" color="emerald" />
            </FlowRow>
          </div>
        </div>
      </DocSection>

      {/* Fatura Akışı */}
      <DocSection title="Fatura & e-Belge Akışı" icon={FileText} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">Sipariş tamamlandıktan sonra e-Arşiv / e-Fatura / e-İrsaliye oluşturma süreci. MockInvoiceService test ortamında kullanılır.</p>
        <FlowRow>
          <FlowStep icon={ShoppingCart} label="Sipariş" color="blue" sub="Tamamlandı/İşleniyor" />
          <Arrow />
          <FlowStep icon={FileText} label="Fatura Oluştur" color="violet" sub="FAT-YYYYMMDD-{seq}" />
          <Arrow />
          <FlowStep icon={Shield} label="Draft" color="amber" sub="Kalem detayları" />
          <Arrow />
          <FlowStep icon={Mail} label="Gönderim" color="teal" sub="e-Fatura sağlayıcısı" />
          <Arrow />
          <FlowStep icon={Shield} label="Tamamlandı" color="emerald" />
        </FlowRow>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {[
            { state: "e-Arşiv",    desc: "Bireysel müşteriler için standart fatura belgesi.", color: "teal" as const },
            { state: "e-Fatura",   desc: "Kurumsal müşteriler için elektronik fatura (GİB entegrasyonu).", color: "violet" as const },
            { state: "e-İrsaliye", desc: "Kargo öncesi sevk irsaliyesi oluşturma.", color: "blue" as const },
          ].map(s => (
            <div key={s.state} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Badge label={s.state} color={s.color} />
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Stok Alarm */}
      <DocSection title="Stok Alarm & Uyarı Akışı" icon={Zap} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">Ürün stoğu kritik eşiğin altına düştüğünde tetiklenen uyarı süreci.</p>
        <FlowRow>
          <FlowStep icon={Package} label="Stok Hareketi" color="blue" sub="StockMovement kaydı" />
          <Arrow />
          <FlowStep icon={Zap} label="Eşik Kontrolü" color="amber" sub="qty ≤ CriticalThreshold" />
          <Arrow />
          <FlowStep icon={Activity} label="StockAlert Event" color="red" sub="MassTransit" />
          <Arrow />
          <FlowStep icon={Mail} label="E-posta / Telegram" color="violet" sub="Admin bildirimi" />
          <Arrow />
          <FlowStep icon={Shield} label="Dashboard Uyarısı" color="teal" sub="Kırmızı badge" />
        </FlowRow>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          Kritik eşik her ürün için ayrı ayarlanır. Admin Ürünler listesinde ve Dashboard&apos;da stok uyarıları amber/kırmızı badge ile gösterilir.
        </div>
      </DocSection>

      {/* Yorum Moderasyon */}
      <DocSection title="Yorum Moderasyon Akışı" icon={MessageSquare} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">Müşteri yorumlarının yayınlanmadan önce geçtiği moderasyon süreci.</p>
        <FlowRow>
          <FlowStep icon={Users} label="Müşteri" color="blue" sub="Verified purchase" />
          <Arrow />
          <FlowStep icon={MessageSquare} label="Yorum Yazılır" color="teal" sub="isApproved=false" />
          <Arrow />
          <FlowStep icon={Shield} label="Admin İnceler" color="violet" sub="Yorumlar sayfası" />
          <Arrow />
          <FlowStep icon={Shield} label="Onayla / Reddet" color="emerald" sub="Bildirim opsiyonel" />
        </FlowRow>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {[
            { state: "Bekliyor",    desc: "isApproved=false, RejectionNote=null. Henüz işlem yapılmadı.", color: "amber" as const },
            { state: "Onaylı",      desc: "isApproved=true. Ürün sayfasında görünür.", color: "emerald" as const },
            { state: "Reddedildi",  desc: "isApproved=false, RejectionNote dolu. E-posta bildirimi opsiyonel.", color: "red" as const },
          ].map(s => (
            <div key={s.state} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Badge label={s.state} color={s.color} />
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Müşteri Akışı */}
      <DocSection title="Müşteri Kayıt & Doğrulama Akışı" icon={Users} defaultOpen={false}>
        <FlowRow>
          <FlowStep icon={Users} label="Kayıt Formu" color="blue" />
          <Arrow />
          <FlowStep icon={Mail} label="E-posta Kodu" color="violet" />
          <Arrow />
          <FlowStep icon={Shield} label="Doğrulama" color="teal" />
          <Arrow />
          <FlowStep icon={Shield} label="Hesap Aktif" color="emerald" />
        </FlowRow>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
          E-posta doğrulanmadan kullanıcı giriş yapabilir, ancak bazı özellikler (adres kaydetme, sipariş geçmişi) kısıtlıdır.
        </div>
      </DocSection>

      {/* Dış Kaynak Aktarma */}
      <DocSection title="Dış Kaynak İçe Aktarma Akışı" icon={Database} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">Excel veya REST API üzerinden Ürün / Kategori / Marka / Stok verisi aktarma süreci. Kaynak takibi: aktarılan kayıtlara hangi dış kaynaktan geldiği kaydedilir.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Excel ile Aktarma</p>
            <FlowRow>
              <FlowStep icon={Package} label="Dosya Yükle" color="amber" sub=".xlsx / .xls" />
              <Arrow />
              <FlowStep icon={Database} label="Parse & Önizle" color="teal" sub="Tüm satırlar" />
              <Arrow />
              <FlowStep icon={Settings} label="Alan Eşleme" color="violet" sub="Sütun → Entity" />
              <Arrow />
              <FlowStep icon={Zap} label="Aktarım" color="emerald" sub="Chunk × 500" />
              <Arrow />
              <FlowStep icon={Activity} label="Import Log" color="blue" />
            </FlowRow>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">REST API ile Aktarma</p>
            <FlowRow>
              <FlowStep icon={Globe} label="URL Gir" color="violet" sub="+ Headers / DataPath" />
              <Arrow />
              <FlowStep icon={RefreshCw} label="Test Çek" color="teal" sub="Modal önizleme" />
              <Arrow />
              <FlowStep icon={Settings} label="Alan Eşleme" color="violet" sub="JSON → Entity" />
              <Arrow />
              <FlowStep icon={Zap} label="Aktarım" color="emerald" sub="> 5K → MQ" />
              <Arrow />
              <FlowStep icon={Activity} label="Import Log" color="blue" />
            </FlowRow>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {[
            { state: "Aktarma Sırası", desc: "Önce Kategoriler, sonra Markalar, en son Ürünler aktarılmalıdır — FK bağımlılığı vardır.", color: "amber" as const },
            { state: "Çakışma Stratejisi", desc: "Atla: mevcut kaydı değiştirmez. Güncelle: mevcut kaydı üstüne yazar (ad/slug eşleşmesi).", color: "blue" as const },
            { state: "Kaynak Takibi", desc: "Aktarılan kayıtlarda ImportedFromSourceId FK'sı set edilir; Ürünler/Kategoriler/Markalar listesinde violet badge ile gösterilir.", color: "violet" as const },
          ].map(s => (
            <div key={s.state} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Badge label={s.state} color={s.color} />
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700">
          5.000+ satır için aktarım RabbitMQ&apos;ya kuyruğa alınır (async), daha az satır için chunked senkron işlem yapılır. Her iki durumda da import log kaydedilir.
        </div>
      </DocSection>

    </div>
  );
}

/* ─── Technical Docs ──────────────────────────────────────────────────── */
function TeknikTab() {
  return (
    <div className="space-y-4">

      {/* Mimari */}
      <DocSection title="Sistem Mimarisi" icon={Server}>
        <p className="text-xs text-slate-500 mb-4">Clean Architecture + CQRS ile katmanlı mimari yapı.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { layer: "Domain",         desc: "Entities, Enums, Value Objects. Dış bağımlılık yok.", color: "red" as const },
            { layer: "Application",    desc: "Commands/Queries (CQRS via MediatR), FluentValidation, Interface tanımları.", color: "amber" as const },
            { layer: "Infrastructure", desc: "EF Core, Redis, MassTransit/RabbitMQ, MailKit, Telegram, ClosedXML (Excel), GeoIP, Dapper. LicenseValidator (RSA-2048), LicenseJwtKey (türetilmiş JWT anahtarı), CryptoHelper (AES-256/SHA-256).", color: "blue" as const },
            { layer: "API",            desc: "Controllers, Middleware (LicenseMiddleware, Auth, ErrorLogging, SecurityHeaders, InputSanitization, RateLimit), JWT (lisanstan türetilir). Startup: RSA lisans doğrulama + Environment.Exit(1).", color: "violet" as const },
          ].map(l => (
            <div key={l.layer} className="border rounded-xl p-3 space-y-2">
              <Badge label={l.layer} color={l.color} />
              <p className="text-xs text-slate-500 leading-relaxed">{l.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-600">Frontend Mimarisi</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { item: "Admin Panel", tech: "Next.js 15 App Router, TypeScript, TailwindCSS", color: "teal" as const },
              { item: "Müşteri Sitesi", tech: "Next.js 15 App Router, TypeScript, TailwindCSS", color: "emerald" as const },
              { item: "State", tech: "React hooks, sessionStorage, localStorage", color: "slate" as const },
            ].map(f => (
              <div key={f.item} className="border rounded-xl p-3">
                <Badge label={f.item} color={f.color} />
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{f.tech}</p>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* Entity İlişkileri */}
      <DocSection title="Temel Entity İlişkileri" icon={Database}>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-[400px]">
            {[
              { entity: "User", relations: ["Orders (1:N)", "Addresses (1:N)", "Roles (1:N)", "RefreshTokens (1:N)"] },
              { entity: "Order", relations: ["OrderItems (1:N)", "Coupon (N:1)", "Shipment (1:1)", "Invoice (1:1)"] },
              { entity: "Product", relations: ["Category (N:1)", "Brand (N:1)", "Images (1:N)", "Variants (1:N)", "StockMovements (1:N)", "ImportedFromSource (N:1 nullable)"] },
              { entity: "Category", relations: ["SubCategories (1:N)", "Products (1:N)", "ImportedFromSource (N:1 nullable)"] },
              { entity: "Brand", relations: ["Products (1:N)", "ImportedFromSource (N:1 nullable)"] },
              { entity: "ExternalSource", relations: ["ImportJobs (1:N)", "ImportLogs (1:N)"] },
              { entity: "ImportJob", relations: ["ExternalSource (N:1)"] },
              { entity: "Invoice", relations: ["InvoiceItems (1:N)", "Order (N:1)"] },
              { entity: "ShippingCarrier", relations: ["(standalone — kargo firması tanımları)"] },
              { entity: "Cart", relations: ["CartItems (1:N)", "User/Session (N:1)"] },
              { entity: "Coupon", relations: ["Orders (1:N)"] },
              { entity: "VisitorLog", relations: ["User (N:1 nullable)"] },
            ].map(e => (
              <div key={e.entity} className="border border-slate-200 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Box size={12} className="text-teal-500" /> {e.entity}
                </p>
                <ul className="space-y-1">
                  {e.relations.map(r => (
                    <li key={r} className="text-xs text-slate-500 flex items-center gap-1.5">
                      <ArrowRight size={10} className="text-slate-300 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* API Endpoints */}
      <DocSection title="Temel API Endpoint Grupları" icon={GitBranch} defaultOpen={false}>
        <div className="space-y-3">
          {[
            { group: "/api/auth", desc: "Kayıt, giriş, token yenileme, şifre sıfırlama, e-posta doğrulama, hesap kilitleme (5 hatalı giriş)", badge: "Public", color: "emerald" as const },
            { group: "/api/products", desc: "Ürün listesi, detay, filtreleme, nitelik filtresi (slug bazlı Redis cache)", badge: "Public", color: "emerald" as const },
            { group: "/api/cart", desc: "Sepet CRUD, kupon uygulama, seçim toggle, misafir sepet merge", badge: "Auth", color: "blue" as const },
            { group: "/api/orders", desc: "Sipariş oluşturma (üye/misafir), listeleme, detay, iptal, durum güncelleme", badge: "Auth", color: "blue" as const },
            { group: "/api/wishlist", desc: "Favori ürün ekle/kaldır/listele", badge: "Auth", color: "blue" as const },
            { group: "/api/visitor", desc: "Sayfa ziyareti log, konum kaydı (IP → ülke/şehir)", badge: "Public", color: "emerald" as const },
            { group: "/api/chatbot", desc: "Chatbot widget config, n8n webhook mesaj iletimi", badge: "Public", color: "emerald" as const },
            { group: "/api/admin/dashboard", desc: "KPI özeti (satış/sipariş/kullanıcı), aylık gelir grafiği, satış hedefi takibi", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/products", desc: "Ürün CRUD, görsel yükleme, varyant yönetimi, stok uyarı eşiği", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/categories", desc: "Kategori CRUD, alt kategori ağacı, soft-delete", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/brands", desc: "Marka CRUD, aktif ürün kontrolü ile soft-delete", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/stocks", desc: "Stok görüntüleme, hareket ekleme, tüm hareketler (tip/ürün filtresi)", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/orders", desc: "Sipariş listesi, detay, durum güncelleme, soft-delete (iptal/tamamlananlar)", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/users", desc: "Kullanıcı listesi, oluştur, güncelle, aktif/pasif toggle, rol atama", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/coupons", desc: "Kupon CRUD — yüzde/sabit indirim, min sepet, kullanım limiti", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/reviews", desc: "Yorum listesi, onayla/reddet, yanıtlar, şikayet yönetimi", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/reports", desc: "Ziyaretçi istatistikleri, ürün satış raporu (Dapper), kuyruk istatistikleri", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/audit-logs", desc: "Kullanıcı aksiyon geçmişi — giriş, şifre değişikliği, kritik işlemler", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/error-logs", desc: "Sunucu hata kayıtları, istatistik özeti, ErrorLoggingMiddleware besler", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/goals", desc: "Satış hedefi CRUD, gerçekleşen vs hedef karşılaştırma", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/announcements", desc: "Site duyuruları CRUD (aktif/pasif, tarih aralığı)", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/external-sources", desc: "Dış kaynak CRUD, Excel yükleme/indirme, REST test-fetch, aktarım, async import job takibi", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/shipping-carriers", desc: "Kargo firması CRUD — fiyat, eşik, tahmini gün, ağırlık fiyatlandırma", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/invoices", desc: "e-Arşiv / e-Fatura / e-İrsaliye oluşturma ve durum güncelleme", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/settings", desc: "Site ayarları GET/PUT. PUT: SettingsVersion (Unix ms) otomatik güncellenir → favicon/logo cache-bust. Admin ve Customer için ayrı 6 logo/favicon slot (AdminLogoNamed, AdminLogoIcon, AdminFaviconUrl, CustomerLogoNamed, CustomerLogoIcon, CustomerFaviconUrl).", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/dev-key", desc: "Aktivasyon anahtarı: GET → maskelenmiş lisans token durumu (isConfigured, isValid, maskedKey). POST /reveal → görüntüleme şifresiyle tam token. License config'den okunur, RevealPasswordHash DB'de.", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/services", desc: "Arka plan servisleri: GET tümü (isPaused, isRunning, lastRunAt, uptime). POST /{name}/pause, POST /{name}/resume, POST /{name}/trigger — IServiceStateManager singleton.", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/health", desc: "Servis sağlık kontrolü (API/DB/Redis/RabbitMQ/Email) — meta + latency", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/docs", desc: "Git log, docs .md dosya listesi/içeriği, canlı aktivite feed'i", badge: "Admin", color: "violet" as const },
          ].map(ep => (
            <div key={ep.group} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
              <Badge label={ep.badge} color={ep.color} />
              <div>
                <p className="text-xs font-mono font-semibold text-slate-800">{ep.group}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Mesajlaşma */}
      <DocSection title="Mesajlaşma & Event Sistemi" icon={Activity} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">Outbox pattern + MassTransit ile güvenilir event dağıtımı.</p>
        <FlowRow>
          <FlowStep icon={Zap} label="Domain Event" color="violet" />
          <Arrow />
          <FlowStep icon={Database} label="Outbox Table" color="blue" sub="Transactional" />
          <Arrow />
          <FlowStep icon={Activity} label="RabbitMQ" color="amber" sub="MassTransit" />
          <Arrow />
          <FlowStep icon={Server} label="Consumer" color="teal" sub="Handler" />
        </FlowRow>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { event: "OrderCreated",       effect: "Sipariş onay e-postası gönderilir, saga başlar" },
            { event: "PaymentCompleted",   effect: "Stok düşülür, kargo süreci başlar" },
            { event: "OrderStatusChanged", effect: "Müşteriye e-posta bildirimi, saga state güncellenir" },
            { event: "OrderCancelled",     effect: "Stok iade edilir, geri ödeme tetiklenir" },
            { event: "StockAlert",         effect: "Kritik eşik altı stok — admin e-posta / Telegram bildirimi" },
            { event: "ReturnRequested",    effect: "İade talebi oluşturuldu — admin paneline düşer" },
            { event: "ImportJobQueued",    effect: "5.000+ satır aktarım — ImportJobConsumer chunk'lara bölerek işler" },
          ].map(e => (
            <div key={e.event} className="p-3 border border-slate-200 rounded-xl">
              <p className="text-xs font-mono font-semibold text-violet-700">{e.event}</p>
              <p className="text-xs text-slate-500 mt-1">{e.effect}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Cache Stratejisi */}
      <DocSection title="Cache Stratejisi" icon={Zap} defaultOpen={false}>
        <div className="space-y-3">
          {[
            { key: "product:slug:{slug}", ttl: "5 dakika", invalidate: "Ürün güncellenince", color: "teal" as const },
            { key: "cart:user:{userId}", ttl: "20 saniye", invalidate: "Sepet her mutasyonda", color: "violet" as const },
            { key: "cart:session:{sessionId}", ttl: "20 saniye", invalidate: "Sepet her mutasyonda", color: "violet" as const },
            { key: "visitor:stats:{days}", ttl: "5 dakika", invalidate: "TTL sonunda otomatik", color: "blue" as const },
            { key: "report:product-sales:{days}:{topN}", ttl: "10 dakika", invalidate: "TTL sonunda otomatik", color: "blue" as const },
          ].map(c => (
            <div key={c.key} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl">
              <Badge label={c.ttl} color={c.color} />
              <div>
                <p className="text-xs font-mono text-slate-800">{c.key}</p>
                <p className="text-xs text-slate-400 mt-0.5">İnvalidasyon: {c.invalidate}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Redis yapılandırıldıysa dağıtık önbellek, aksi halde bellek içi önbellek kullanılır.
        </p>
      </DocSection>

      {/* Katmanlı Mimari */}
      <DocSection title="Deployment & Ortam Konfigürasyonu" icon={Layers} defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { env: "Development", db: "SQL Server (local)", cache: "InMemory", queue: "InMemory", color: "amber" as const },
            { env: "Staging", db: "PostgreSQL (Neon.tech)", cache: "Redis", queue: "RabbitMQ", color: "blue" as const },
            { env: "Production", db: "PostgreSQL (Neon.tech)", cache: "Redis", queue: "RabbitMQ", color: "emerald" as const },
          ].map(e => (
            <div key={e.env} className="border rounded-xl p-4 space-y-2">
              <Badge label={e.env} color={e.color} />
              <div className="space-y-1.5 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Veritabanı</span>
                  <span className="font-medium text-slate-700">{e.db}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Cache</span>
                  <span className="font-medium text-slate-700">{e.cache}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Kuyruk</span>
                  <span className="font-medium text-slate-700">{e.queue}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
          <p className="text-xs font-bold text-red-700 flex items-center gap-1.5"><Shield size={13} /> RSA Lisans Zorunluluğu — Tüm Ortamlar</p>
          <div className="space-y-1.5">
            {[
              { label: "License token", desc: "appsettings.Development.json (git-ignored) → \"License\": \"eyJ...\" veya ECOM_LICENSE env var" },
              { label: "JWT anahtarı", desc: "Config'deki Jwt:Key artık kullanılmıyor — JWT imzalama anahtarı lisanstan HMACSHA256 ile türetilir" },
              { label: "LicenseMiddleware", desc: "Her HTTP isteğinde (1 dk cache) doğrulama — geçersiz lisansta 503 döner, /health bypass" },
              { label: "Private key", desc: "Sadece geliştiricide saklanır, repoya GİRMEZ — yeni lisans üretmek için gerekir (geçerlilik süresi: 2026–2028)" },
              { label: "DevRevealPassword", desc: "Admin panelinde lisansı görüntülemek için ayrı şifre — SHA256 hash DB'de (RevealPasswordHash key)" },
            ].map(r => (
              <div key={r.label} className="flex gap-2 text-xs">
                <span className="text-red-500 font-semibold shrink-0 w-36">{r.label}</span>
                <span className="text-red-700">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* Lisans Token — Sistem Mekanizması */}
      <DocSection title="Lisans Token — Sistem Mekanizması" icon={Shield} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-4">
          Token'ın format, doğrulama akışı ve sistem üzerindeki etkileri. Token admin panelinden reveal edildikten sonra bu mekanizma devreye girer.
        </p>
        <div className="space-y-5">

          {/* Token formatı */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Token Formatı</p>
            <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-slate-200 space-y-1 overflow-x-auto">
              <p><span className="text-violet-400">{"{"}</span><span className="text-amber-300">Base64Url(payload)</span><span className="text-violet-400">{"}"}</span><span className="text-slate-500"> . </span><span className="text-violet-400">{"{"}</span><span className="text-teal-300">Base64Url(RSA-2048 imza)</span><span className="text-violet-400">{"}"}</span></p>
              <p className="text-slate-400 mt-2">Payload (decode edilmiş):</p>
              <p className="text-emerald-300">{'{"app":"Ecom","iss":"OCA1782","nbf":"2026-01-01","exp":"2028-12-31"}'}</p>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { field: "app",  desc: "Uygulama adı — başka uygulamaların tokenini geçersiz kılar" },
                { field: "iss",  desc: "Lisans veren: OCA1782" },
                { field: "nbf",  desc: "Geçerlilik başlangıcı: 2026-01-01" },
                { field: "exp",  desc: "Son kullanma: 2028-12-31" },
              ].map(f => (
                <div key={f.field} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <code className="font-bold text-violet-600">{f.field}</code>
                  <p className="text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3 katman akışı */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">3 Bağımsız Doğrulama Katmanı</p>
            <div className="space-y-2">
              {[
                {
                  layer: "1",
                  title: "Startup Doğrulaması",
                  when: "Uygulama başlatılırken (Program.cs)",
                  how: "LicenseValidator.Validate() — RSA public key gömülü, imza + nbf/exp kontrolü",
                  fail: "Environment.Exit(1) — uygulama hiç ayağa kalkmaz",
                  color: "red" as const,
                },
                {
                  layer: "2",
                  title: "JWT Anahtar Türetme",
                  when: "AddJwtBearer ve JwtService yapılandırmasında (singleton)",
                  how: "HMACSHA256(licensePayload, UTF8(salt)) → LicenseJwtKey. Config'deki Jwt:Key kullanılmaz.",
                  fail: "Lisans geçersizse türetme başarısız → tüm login/auth istekleri 401",
                  color: "amber" as const,
                },
                {
                  layer: "3",
                  title: "LicenseMiddleware",
                  when: "Her HTTP isteğinde (1 dk önbellek ile)",
                  how: "RSA doğrulama cache'den okunur. /health endpoint bypass edilir.",
                  fail: "503 Service Unavailable — auth geçerli olsa bile erişim engellenir",
                  color: "violet" as const,
                },
              ].map(l => (
                <div key={l.layer} className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0">{l.layer}</span>
                    <span className="text-xs font-bold text-slate-700">{l.title}</span>
                    <Badge label={l.color === "red" ? "Startup" : l.color === "amber" ? "Singleton" : "Per-request"} color={l.color} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pl-7">
                    <div><span className="text-slate-400 block">Ne zaman</span><span className="text-slate-700">{l.when}</span></div>
                    <div><span className="text-slate-400 block">Nasıl</span><span className="text-slate-700">{l.how}</span></div>
                    <div><span className="text-slate-400 block">Başarısız olursa</span><span className="text-red-600 font-medium">{l.fail}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hata senaryoları */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Hata Senaryoları</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Senaryo","Katman","HTTP Kodu","Davranış"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { s: "Token eksik (config'de yok)",    k: "1 — Startup",        http: "—",   d: "Process başlamaz (Exit 1)" },
                    { s: "Token süresi dolmuş (exp geçti)", k: "1 — Startup",        http: "—",   d: "Process başlamaz (Exit 1)" },
                    { s: "İmza geçersiz (sahte token)",     k: "1 — Startup",        http: "—",   d: "Process başlamaz (Exit 1)" },
                    { s: "Lisans değiştiyse JWT uyuşmazlık",k: "2 — JWT Türetme",    http: "401", d: "Tüm login/auth başarısız" },
                    { s: "Runtime'da token bozulursa",      k: "3 — Middleware",     http: "503", d: "Auth geçerli olsa bile engel" },
                    { s: "Geçerli lisans + geçerli JWT",    k: "Tümü geçer",         http: "200", d: "Normal akış" },
                    { s: "GET /health (izleme)",            k: "3 bypass edilir",    http: "200", d: "Lisans olmasa da yanıt verir" },
                  ].map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                      <td className="py-2 px-3 text-slate-700">{r.s}</td>
                      <td className="py-2 px-3 text-slate-500">{r.k}</td>
                      <td className="py-2 px-3">
                        <code className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                          r.http === "200" ? "bg-emerald-100 text-emerald-700" :
                          r.http === "401" ? "bg-amber-100 text-amber-700" :
                          r.http === "503" ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-500"
                        }`}>{r.http}</code>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{r.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </DocSection>

      {/* Aktivasyon Anahtarı */}
      <DocSection title="Aktivasyon Anahtarı — Kullanım Kılavuzu" icon={KeyRound}>
        <p className="text-xs text-slate-500 mb-4">
          Sistem lisansı RSA-2048 ile imzalanmış bir JWT tokenidir. Geçersiz veya süresi dolmuş lisansta tüm API istekleri <code className="bg-slate-100 px-1 rounded">503</code> döner.
        </p>
        <div className="space-y-4">

          {/* Nerede saklanır */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Nerede Saklanır</p>
            <div className="space-y-2">
              {[
                { env: "Development", where: "appsettings.Development.json → \"License\": \"eyJ...\"", color: "emerald" as const },
                { env: "Production",  where: "Ortam değişkeni: ECOM_LICENSE veya appsettings.Production.json", color: "blue" as const },
              ].map(r => (
                <div key={r.env} className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <Badge label={r.env} color={r.color} />
                  <code className="text-slate-600 leading-relaxed">{r.where}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Nasıl görüntülenir */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Admin Panelinde Görüntüleme</p>
            <FlowRow>
              <FlowStep icon={Settings}  label="Yönetim"  color="teal" sub="Sol menü alt" />
              <Arrow />
              <FlowStep icon={Cpu}       label="Sistem"   color="teal" sub="Sekme" />
              <Arrow />
              <FlowStep icon={KeyRound}  label="Aktivasyon Anahtarı" color="violet" sub="Bölüm" />
              <Arrow />
              <FlowStep icon={Lock}      label="Şifre Gir" color="amber" sub="Reveal şifresi" />
              <Arrow />
              <FlowStep icon={Code2}     label="Token Görünür" color="teal" sub="Kopyala" />
            </FlowRow>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              Reveal şifresi <code className="bg-amber-100 px-1 rounded font-mono">DevRevealPassword</code> config değerinden okunur.
              Hash'i DB'ye <code className="bg-amber-100 px-1 rounded font-mono">RevealPasswordHash</code> key'i altında saklanır.
              Şifre sadece SuperAdmin tarafından bilinmeli; kimseyle paylaşılmamalıdır.
            </div>
          </div>

          {/* Deployment adımları */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Deployment Adımları</p>
            <div className="space-y-1.5">
              {[
                { step: "1", desc: "Admin paneli → Yönetim → Sistem → Aktivasyon Anahtarı → Görüntüle → Kopyala" },
                { step: "2", desc: "Sunucuda ECOM_LICENSE ortam değişkenine yapıştır (veya appsettings.Production.json)" },
                { step: "3", desc: "Uygulamayı yeniden başlat — startup'ta RSA doğrulaması yapılır, başarısızsa Exit(1)" },
                { step: "4", desc: "Lisans geçerliliği: 2026-01-01 – 2028-12-31. Süre dolmadan yeni lisans üretilmeli." },
              ].map(r => (
                <div key={r.step} className="flex items-start gap-3 text-xs">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{r.step}</span>
                  <span className="text-slate-600 leading-relaxed">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Güvenlik notları */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-1">Güvenlik Notları</p>
            {[
              "Lisans token'ı repoya commit etme — appsettings.Development.json gitignore'da.",
              "Private key sadece geliştiricide saklanır; yeni lisans üretmek için gerekir.",
              "JWT imzalama anahtarı lisanstan türetilir — lisans olmadan tüm auth başarısız olur.",
              "Her HTTP isteğinde LicenseMiddleware 1 dk cache ile doğrulama yapar.",
            ].map((note, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                <Shield size={11} className="text-red-400 shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>

        </div>
      </DocSection>

    </div>
  );
}

/* ─── Git Log Types ──────────────────────────────────────────────────── */

interface CommitFile {
  status: "A" | "M" | "D" | "R";
  path: string;
  oldPath: string | null;
  category: "admin" | "customer" | "backend" | "docs" | "infra";
}
interface CommitStats { added: number; modified: number; deleted: number; renamed: number; total: number; }
interface Commit {
  hash: string; shortHash: string; author: string; date: string; subject: string;
  files: CommitFile[]; stats: CommitStats;
}

const CAT_META: Record<string, { label: string; bg: string; text: string }> = {
  admin:    { label: "Admin",    bg: "bg-teal-100",    text: "text-teal-700" },
  customer: { label: "Müşteri",  bg: "bg-emerald-100", text: "text-emerald-700" },
  backend:  { label: "Backend",  bg: "bg-violet-100",  text: "text-violet-700" },
  docs:     { label: "Docs",     bg: "bg-amber-100",   text: "text-amber-700" },
  infra:    { label: "Altyapı",  bg: "bg-slate-100",   text: "text-slate-600" },
};


/* ─── Çalışma Notları ─────────────────────────────────────────────────── */
interface DocsFile { name: string; sizeKb: number; lastModified: string; }

function parseInline(text: string): React.ReactNode {
  const segs: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let last = 0, key = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push(text.slice(last, m.index));
    if (m[0].startsWith("**"))
      segs.push(<strong key={key++} className="font-semibold text-slate-800">{m[2]}</strong>);
    else
      segs.push(<code key={key++} className="text-[11px] font-mono bg-slate-100 text-teal-700 px-1 py-0.5 rounded">{m[3]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push(text.slice(last));
  return segs.length === 1 && typeof segs[0] === "string" ? segs[0] : <>{segs}</>;
}

function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;
  let listBuf: React.ReactNode[] = [];
  let codeBuf: string[] = [];
  let inCode = false;

  const flushList = (k: number) => {
    if (!listBuf.length) return;
    result.push(<ul key={`list-${k}`} className="space-y-1 ml-4 my-1">{[...listBuf]}</ul>);
    listBuf = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      if (!inCode) { flushList(i); inCode = true; codeBuf = []; }
      else {
        result.push(<pre key={`code-${i}`} className="bg-slate-900 text-emerald-300 text-[11px] font-mono rounded-xl p-3 overflow-x-auto my-2 whitespace-pre">{codeBuf.join("\n")}</pre>);
        inCode = false; codeBuf = [];
      }
      i++; continue;
    }
    if (inCode) { codeBuf.push(line); i++; continue; }

    if (/^(-{3,}|={3,})$/.test(line.trim())) {
      flushList(i);
      result.push(<hr key={`hr-${i}`} className="border-slate-200 my-3" />);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      flushList(i);
      result.push(<h1 key={`h1-${i}`} className="text-lg font-bold text-slate-800 mt-4 mb-1 pb-1 border-b border-slate-200">{parseInline(line.slice(2))}</h1>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      flushList(i);
      result.push(<h2 key={`h2-${i}`} className="text-base font-bold text-slate-700 mt-3 mb-1">{parseInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      flushList(i);
      result.push(<h3 key={`h3-${i}`} className="text-sm font-semibold text-slate-600 mt-2 mb-0.5">{parseInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith("#### ")) {
      flushList(i);
      result.push(<h4 key={`h4-${i}`} className="text-sm font-medium text-slate-600 mt-1.5 mb-0.5">{parseInline(line.slice(5))}</h4>);
      i++; continue;
    }
    if (line.startsWith("> ")) {
      flushList(i);
      result.push(<blockquote key={`bq-${i}`} className="border-l-4 border-teal-300 pl-3 py-0.5 my-1 text-sm text-slate-500 italic bg-teal-50/40 rounded-r">{parseInline(line.slice(2))}</blockquote>);
      i++; continue;
    }

    if (line.trimStart().startsWith("|") && line.includes("|", 1)) {
      flushList(i);
      const tLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) { tLines.push(lines[i]); i++; }
      if (tLines.length >= 2) {
        const allRows = tLines.map(l => l.split("|").slice(1, -1).map(c => c.trim()));
        const isSep = (r: string[]) => r.every(c => /^:?-+:?$/.test(c));
        const headers = allRows[0];
        const dataRows = allRows.slice(1).filter(r => !isSep(r));
        result.push(
          <div key={`tbl-${i}`} className="overflow-x-auto my-2">
            <table className="text-xs border-collapse w-full">
              <thead><tr>{headers.map((h, hi) => <th key={hi} className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold text-slate-600">{parseInline(h)}</th>)}</tr></thead>
              <tbody>{dataRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? "bg-slate-50/50" : ""}>{row.map((cell, ci) => <td key={ci} className="border border-slate-200 px-2 py-1 text-slate-600">{parseInline(cell)}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    const ckMatch = line.match(/^\s*[-*]\s+\[([xX~ ])\]\s+(.*)/);
    if (ckMatch) {
      const v = ckMatch[1].toLowerCase();
      const done = v === "x", partial = v === "~";
      listBuf.push(
        <li key={`ck-${i}`} className={`flex items-start gap-2 text-[13px] leading-relaxed ${done ? "text-slate-400" : "text-slate-700"}`}>
          <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[9px] font-bold ${done ? "bg-emerald-500 border-emerald-500 text-white" : partial ? "bg-amber-400 border-amber-400 text-white" : "border-slate-300"}`}>
            {done ? "✓" : partial ? "~" : ""}
          </span>
          <span className={done ? "line-through" : ""}>{parseInline(ckMatch[2])}</span>
        </li>
      );
      i++; continue;
    }

    const ulMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (ulMatch) {
      listBuf.push(
        <li key={`ul-${i}`} className="flex items-start gap-2 text-[13px] text-slate-700 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
          <span>{parseInline(ulMatch[1])}</span>
        </li>
      );
      i++; continue;
    }

    const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
    if (olMatch) {
      const num = listBuf.length + 1;
      listBuf.push(
        <li key={`ol-${i}`} className="flex items-start gap-2 text-[13px] text-slate-700 leading-relaxed">
          <span className="text-[11px] font-bold text-slate-400 w-4 shrink-0 mt-0.5">{num}.</span>
          <span>{parseInline(olMatch[1])}</span>
        </li>
      );
      i++; continue;
    }

    if (!line.trim()) { flushList(i); result.push(<div key={`sp-${i}`} className="h-1" />); i++; continue; }
    flushList(i);
    result.push(<p key={`p-${i}`} className="text-[13px] text-slate-700 leading-relaxed">{parseInline(line)}</p>);
    i++;
  }
  flushList(i);
  return <>{result}</>;
}

const DOCS_REFRESH_SEC = 30;

function DocsNotlarTab() {
  const [files, setFiles] = useState<DocsFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesRefreshing, setFilesRefreshing] = useState(false);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(DOCS_REFRESH_SEC);
  const [source, setSource] = useState<string>("");

  const fetchFiles = useCallback(async (manual = false) => {
    if (manual) setFilesRefreshing(true);
    try {
      const data = await api.get<{ files: DocsFile[]; source?: string }>("/api/admin/docs/files");
      setFiles(data.files ?? []);
      setSource(data.source ?? "");
      setCountdown(DOCS_REFRESH_SEC);
    } catch { /* silent */ } finally {
      setFilesLoading(false);
      if (manual) setFilesRefreshing(false);
    }
  }, []);

  const fetchContent = useCallback(async (name: string) => {
    setContentLoading(true);
    try {
      const data = await api.get<{ content: string; lastModified: string }>(`/api/admin/docs/file?name=${encodeURIComponent(name)}`);
      setContent(data.content);
      setLastModified(data.lastModified);
    } catch { setContent(null); } finally { setContentLoading(false); }
  }, []);

  useEffect(() => {
    fetchFiles();
    const t = setInterval(() => fetchFiles(), DOCS_REFRESH_SEC * 1000);
    return () => clearInterval(t);
  }, [fetchFiles]);

  // Countdown ticker
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 1 ? c - 1 : DOCS_REFRESH_SEC), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchContent(selected);
    const t = setInterval(() => fetchContent(selected), 30_000);
    return () => clearInterval(t);
  }, [selected, fetchContent]);

  const isRecent = (iso: string) => Date.now() - new Date(iso).getTime() < 86_400_000;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex gap-4 h-[calc(100vh-320px)] min-h-[400px]">
      <div className="w-60 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FileText size={14} className="text-teal-600" />
          <span className="text-xs font-bold text-slate-700">DOCS Dosyaları</span>
          <span className="text-[10px] text-slate-400">{files.length} dosya</span>
          {source && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
              source.includes("github") ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-500"
            }`}>
              {source}
            </span>
          )}
          <span className="ml-auto text-[10px] text-slate-300">{countdown}s</span>
          <button
            onClick={() => fetchFiles(true)}
            title="Yenile"
            className={`p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition ${filesRefreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw size={12} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filesLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">Yükleniyor…</div>
          ) : files.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">DOCS klasörü bulunamadı</div>
          ) : files.map(f => (
            <button key={f.name} onClick={() => setSelected(f.name)}
              className={`w-full text-left px-4 py-2.5 border-b border-slate-50 transition flex items-center gap-2 ${
                selected === f.name ? "bg-teal-50" : "hover:bg-slate-50"
              }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${isRecent(f.lastModified) ? "bg-emerald-400" : "bg-slate-200"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-medium truncate ${selected === f.name ? "text-teal-700" : "text-slate-700"}`}>{f.name}</p>
                <p className="text-[10px] text-slate-400">{fmtDate(f.lastModified)} · {f.sizeKb} KB</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-2 text-slate-400">
            <FileText size={36} className="text-slate-200" />
            <span className="text-sm">Görüntülemek için bir dosya seçin</span>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 shrink-0">
              <FileText size={14} className="text-teal-600" />
              <span className="text-sm font-semibold text-slate-700">{selected}</span>
              {lastModified && <span className="text-[10px] text-slate-400">{fmtDate(lastModified)}</span>}
              <button onClick={() => fetchContent(selected!)}
                className={`ml-auto p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 transition ${contentLoading ? "animate-spin" : ""}`}>
                <RefreshCw size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {contentLoading && !content ? (
                <div className="text-center text-sm text-slate-400 py-8">Yükleniyor…</div>
              ) : content ? (
                renderMarkdown(content)
              ) : (
                <div className="text-center text-sm text-slate-400 py-8">Dosya yüklenemedi</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Yenilikler Tab ─────────────────────────────────────────────────── */

type ChangeType = "frontend" | "backend" | "guvenik" | "ux" | "altyapi" | "ozellik";

interface ChangeEntry {
  type: ChangeType;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  items: string[];
}

interface DayLog {
  date: string;         // "19 Mayıs 2026"
  label?: string;       // "Adım 33 — ..." gibi
  defaultOpen?: boolean;
  changes: ChangeEntry[];
}

const TYPE_META: Record<ChangeType, { label: string; bg: string; text: string; dot: string }> = {
  frontend:  { label: "Frontend",  bg: "bg-teal-100",    text: "text-teal-700",    dot: "bg-teal-500"    },
  backend:   { label: "Backend",   bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500"  },
  guvenik:   { label: "Güvenlik",  bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
  ux:        { label: "UX",        bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-500"  },
  altyapi:   { label: "Altyapı",   bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"    },
  ozellik:   { label: "Özellik",   bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

const CHANGELOG: DayLog[] = [
  {
    date: "29 Mayıs 2026",
    label: "RSA Lisans Sistemi / Logo & Favicon Yönetimi / Servis Yönetimi UI",
    defaultOpen: true,
    changes: [
      {
        type: "guvenik", icon: KeyRound, title: "RSA-2048 Lisans Sistemi — Bypass Dayanıklı Aktivasyon",
        items: [
          "Eski SHA256 hash yaklaşımı kaldırıldı (tek satır yorum ile atlanabiliyordu)",
          "LicenseValidator.cs: RSA-2048 public key gömülü — imzayı doğrular, payload'ı ayrıştırır (app, iss, nbf, exp)",
          "Private key repoya girmez; yalnızca geliştiricide saklanır — private key olmadan geçerli lisans üretilemez",
          "Startup: RSA doğrulama başarısız → çarpıcı hata + Environment.Exit(1)",
          "Lisans formatı: Base64Url(payload).Base64Url(RSA-SHA256 imzası) — JSON Web Token benzeri",
          "Geçerlilik tarihi kontrolü: nbf (notBefore) ve exp (expiry) — süresi dolmuş lisans başlatmayı engeller",
          "LicenseJwtKey.cs: DI üzerinden paylaşılan wrapper — hem AddJwtBearer hem JwtService aynı anahtarı görür",
          "LicenseException özel exception tipi — startup ve middleware hata mesajlarını ayrıştırır",
        ],
      },
      {
        type: "guvenik", icon: Lock, title: "JWT Anahtarı Lisanstan Türetilir — İkinci Savunma Katmanı",
        items: [
          "JwtService.cs: configuration['Jwt:Key'] artık kullanılmıyor — LicenseJwtKey'den HMACSHA256 türetilir",
          "AddJwtBearer token doğrulama: aynı türetilmiş anahtar — oluşturma ile doğrulama senkron",
          "Startup lisans check kaldırılsa dahi: jwtKeyBytes = RandomNumberGenerator.GetBytes(32) → tüm token'lar geçersiz → login çalışmaz",
          "Hem startup check hem JWT derivation hem middleware kaldırılıp JWT hardcode edilmediği sürece sistem işlevsel değil",
          "Program.cs: LicenseJwtKey singleton DI'ya AddJwtBearer kurulumundan önce kaydedilir",
        ],
      },
      {
        type: "guvenik", icon: Shield, title: "LicenseMiddleware — Her İstekte Runtime Doğrulama",
        items: [
          "LicenseMiddleware.cs: pipeline'a UseCors'tan sonra, UseAuthentication'dan önce eklendi",
          "Her HTTP isteğinde lisans doğrulanır (sonuç 1 dakika cache — thread-safe lock ile)",
          "Geçersiz lisansta 503 Service Unavailable döner, hata mesajı JSON formatında",
          "/health ve /openapi path'leri bypass — Docker/K8s health probe'ları engellenmiyor",
          "Startup check'ten bağımsız: Program.cs değiştirilse bile middleware etkin kalmaya devam eder",
        ],
      },
      {
        type: "frontend", icon: KeyRound, title: "Admin Panel — Aktivasyon Anahtarı Bölümü",
        items: [
          "Yönetim > Sistem sekmesi sonuna 'Aktivasyon Anahtarı' Section eklendi",
          "Maskelenmiş token gösterimi: ilk 10 karakter + '···' + '***' — tam token görünmez",
          "isValid / isConfigured / revealPasswordSet durumları badge ile gösterilir",
          "'Görüntüle' butonu → modal: ayrı şifre girişi (admin şifresinden bağımsız)",
          "Doğru şifrede tam lisans token'ı teal kartta gösterilir — 'Kopyala' butonu ile panoya",
          "Modal kapanınca token bellekten silinir — tekrar açmak için şifre yeniden girilmeli",
          "DevKeyController.cs: License artık config'den okunur (DB'den değil) — RevealPasswordHash DB'de",
          "DbInitializer: SeedDevKey → SeedRevealPassword olarak güncellendi, DevKeyEncrypted artık seed edilmiyor",
        ],
      },
      {
        type: "ozellik", icon: ImageIcon, title: "6 Slot Logo & Favicon Sistemi — Admin + Müşteri Ayrı",
        items: [
          "Admin Panel Görselleri: İsimli Logo (sidebar genişken), İsimsiz Logo (sidebar daraltılmışken), Favicon (tarayıcı sekmesi)",
          "Müşteri Sitesi Görselleri: İsimli Logo (header full brand), İsimsiz Logo (header icon-only), Favicon",
          "Yönetim > Görünüm sekmesinde 2 ayrı 3-sütun upload bölümü — aynı sıralama (İsimli → İsimsiz → Favicon)",
          "SiteSettings key'leri: AdminLogoNamed, AdminLogoIcon, AdminFaviconUrl, CustomerLogoNamed, CustomerLogoIcon, CustomerFaviconUrl",
          "Admin sidebar: daraltılmış → AdminLogoIcon, genişletilmiş + named set → AdminLogoNamed, named yok → icon + metin",
          "Müşteri Header: logoUrl prop (named), logoIconUrl prop (icon) — sunucu bileşeninden geçirilir",
          "uploadFor(file, settingKey) helper: PUT /api/admin/settings/upload — hangi slot için yüklendiği belirli",
        ],
      },
      {
        type: "frontend", icon: RefreshCw, title: "Logo & Favicon Tarayıcı Cache Sorunu Çözümü",
        items: [
          "Sorun: Ayarlar kaydedilince admin sidebar logosu güncellenmiyordu, favicon eski kalıyordu",
          "CustomEvent çözümü: save() sonrası window.dispatchEvent(new CustomEvent('ecom:settings-updated', { detail: settings }))",
          "Admin layout.tsx: 'ecom:settings-updated' dinler → logoUrl ve logoNamedUrl state'leri anında güncellenir",
          "SettingsVersion: PUT /api/admin/settings her çağrıda Unix ms timestamp yazar (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())",
          "Favicon cache-bust: generateMetadata() → favicon URL'sine ?v={SettingsVersion} query param eklenir",
          "Admin root layout.tsx ve Customer layout.tsx her ikisi de SettingsVersion parametresini favicon URL'sine ekler",
          "Customer Header: logoUrl ve logoIconUrl server component'tan prop olarak geçirilir (no-store fetch)",
        ],
      },
      {
        type: "ozellik", icon: Activity, title: "Servis Yönetimi UI — Yönetim > Sistem Sekmesi",
        items: [
          "IServiceStateManager singleton: pause/resume/trigger durumu ve meta bilgileri tutar",
          "DependencyInjection.cs: AddSingleton<IServiceStateManager, ServiceStateManager> — AddHostedService'lerden önce kaydedilir",
          "Yönetim > Sistem > Servis Yönetimi: her servis kart olarak listelenir (isPaused, isRunning, uptime, runCount)",
          "Duraklatıldı → amber kart / Çalışıyor → teal pulse kart / Bekliyor → gri kart",
          "Butonlar: Duraklat (amber) / Devam Ettir (emerald) / Tetikle (teal) — işlem sırasında Loader2 spin",
          "10 saniyede bir otomatik yenileme (useEffect setInterval, tab ayrılınca clearInterval)",
          "Manuel Yenile butonu: RefreshCw + spin animasyonu",
        ],
      },
      {
        type: "altyapi", icon: Globe, title: "3 Ortam × 3 Servis URL Tablosu",
        items: [
          "Yönetim > Sistem > Ortam URL Konfigürasyonu: Admin Panel, Müşteri Sitesi, API — Development / Staging / Production",
          "Her hücre düzenlenebilir input — SiteSettings'e ApiBaseUrl_dev/_staging/_prod vb. olarak kaydedilir",
          "'Aktif Et' butonu: ilgili ortam URL'lerini aktif (ApiBaseUrl, CustomerBaseUrl, AdminBaseUrl) key'lerine kopyalar",
          "Aktif ortam badge'i (dev=emerald/staging=blue/prod=red) tablo başlığında gösterilir",
          "AppEnvironment SiteSettings key'i ile seçili ortam takip edilir",
        ],
      },
    ],
  },
  {
    date: "25 Mayıs 2026",
    label: "Dış Kaynaklar — Kaynak Takibi / Excel İndirme / REST Fetch Modal / Bug Fix",
    defaultOpen: false,
    changes: [
      {
        type: "ozellik", icon: Database, title: "Dış Kaynaklar — Kaynak Takibi (Source Tracking)",
        items: [
          "Product, Category, Brand entity'lerine ImportedFromSourceId (Guid?) nullable FK alanı eklendi",
          "Migration: AddImportedFromSource — Products, Categories, Brands tablolarına kolon + index eklendi",
          "ImportBatchProcessor.ProcessAsync: Guid? sourceId parametresi — aktarım sırasında yeni kayıtlara kaynak bağlantısı kaydedilir (güncellemelerde değiştirilmez)",
          "ImportExternalSourceCommand ve ImportJobConsumer güncellendi: request.SourceId / job.ExternalSourceId iletimi",
          "GetProductsQuery + GetBrandsQuery: correlated subquery → ImportedFromSourceName string döner",
          "GetCategoriesQuery: batch dictionary lookup — ağaç oluşturma sırasında kaynak adları ayrı sorgudan yüklenir (N+1 önlendi)",
          "AdminProduct, CategoryDto, BrandDto: importedFromSourceName?: string alanı eklendi",
          "Admin Ürünler / Kategoriler / Markalar listeleri: 'Kaynak' sütunu — violet badge ile kaynak adı gösterilir, yoksa '—'",
        ],
      },
      {
        type: "ozellik", icon: FileText, title: "Dış Kaynaklar — Excel İndirme & 20K Test Excel Seeder",
        items: [
          "GET /api/admin/external-sources/{id}/download-excel: sunucudaki dosyayı File() stream ile indirir",
          "ExternalSourceDto: HasExcelFile bool flag eklendi — frontend yüklü dosya varlığını bilir",
          "DbInitializer.SeedAsync: imza string contentRootPath parametresi aldı, Program.cs güncellendi",
          "SeedTestExternalSources: 'Test Excel Kaynağı' (Excel) + 'Test REST Kaynağı DummyJSON' (RestApi) seed edilir",
          "CreateTestExcel: ClosedXML ile 3 sheet — 5 kategori, 5 marka, 20.000 ürün satırı (random fiyat, döngüsel kategori/marka)",
          "Yeniden oluşturma: dosya yoksa veya < 50 KB ise her yeniden başlatmada üretilir",
          "Düzenle modalı: yüklü Excel bilgi kartı (satır sayısı + tarih) + fetch+blob authenticated indirme butonu",
        ],
      },
      {
        type: "ux", icon: RefreshCw, title: "Dış Kaynaklar — REST Fetch Modala Taşındı",
        items: [
          "Liste satırındaki 'Veri Çek' butonu kaldırıldı — REST aktarımı artık yalnızca ekle/düzenle modalinde başlatılır",
          "POST /api/admin/external-sources/test-fetch: kaydedilmiş kaynak olmadan ad-hoc URL fetch — Url, Headers, DataPath alır, { columns, rows, error } döner",
          "SourceModal (REST modu): URL + headers alanlarının altına violet 'Veri Çek & Önizle' butonu eklendi",
          "restFetching ve restPreview state'leri: yükleniyor durumu + önizleme tablosu (sütun adları + ilk 5 satır + toplam sayı)",
          "Hata durumunda kırmızı hata mesajı, URL boşken buton devre dışı",
        ],
      },
      {
        type: "backend", icon: AlertCircle, title: "Bug Fix — TestFetchRequest Record Eksikti",
        items: [
          "ExternalSourcesController: TestFetch metodu TestFetchRequest record'unu kullanıyordu ancak sınıf tanımı dosyada yoktu",
          "Sonuç: backend derlenmiyordu — çalışan proses önceki build'dan kalmıştı, endpoint 404 dönüyordu",
          "Düzeltme: public record TestFetchRequest(string Url, Dictionary<string, string>? Headers, string? DataPath) controller'a eklendi",
        ],
      },
    ],
  },
  {
    date: "21 Mayıs 2026",
    label: "Kargo Yönetimi / Fatura Yönetimi / Dokümanlar Canlı Aktivite / Ödeme 400 Fix",
    defaultOpen: true,
    changes: [
      {
        type: "ozellik", icon: Truck, title: "Kargo Yönetimi — ShippingCarriers CRUD",
        items: [
          "ShippingCarrier entity: ad, kod, basePrice, freeShippingThreshold, estimatedDays, maxWeightKg, trackingUrlTemplate, logoUrl, apiEndpoint, weightPricingJson",
          "EF Core migration: AddShippingCarriersAndInvoices — DB'ye uygulandı",
          "Backend: GET/POST/PUT/DELETE /api/admin/shipping-carriers — Roles: SuperAdmin,Admin,OrderManager",
          "Frontend /kargo: stats bar (toplam/aktif/pasif/ort.fiyat), logo+kod+fiyat+eşik+gün tablosu",
          "Oluştur/düzenle/sil modalları — tüm alanlar, isActive toggle, kaydet/sil akışı",
          "Sidebar'a Kargo menü öğesi eklendi (Truck ikonu, Satış grubu)",
        ],
      },
      {
        type: "ozellik", icon: FileText, title: "Fatura Yönetimi — e-Arşiv / e-Fatura / e-İrsaliye",
        items: [
          "Invoice + InvoiceItem entity: docType (eArchive/eInvoice/eDispatch), status (Draft/Pending/Sent/Cancelled/Error)",
          "IInvoiceService provider arayüzü: MockInvoiceService test ortamı, gelecekte Luca/eFinans entegrasyonu",
          "CreateInvoiceCommand: sipariş satırlarından fatura oluşturma, numara: FAT-YYYYMMDD-{seq:D6}",
          "Backend: GET/POST/PATCH {id}/status /api/admin/invoices — Roles: SuperAdmin,Admin,FinanceUser,OrderManager",
          "Frontend /faturalar: sayfalı liste, durum/tip/arama filtreleri, test mod banner",
          "Oluştur modal: orderId+docType+notlar. Detay modal: meta grid, satır kalemler tablosu, durum güncelleme",
          "Sidebar'a Faturalar menü öğesi eklendi (FileText ikonu, Satış grubu)",
        ],
      },
      {
        type: "frontend", icon: Activity, title: "Dokümanlar > Son Güncellemeler — 10s Canlı Aktivite",
        items: [
          "GET /api/admin/docs/activity endpoint: son N AuditLog, ErrorLog, OrderStatusHistory, Invoice kaydı birleşik timeline",
          "ActivityFeed bileşeni: 10 saniyede bir setInterval polling (cleanup on unmount)",
          "'Son güncelleme: HH:MM:SS' zaman damgası başlık satırında canlı gösterilir",
          "Aktivite türüne göre renk + ikon: AuditLog(teal), ErrorLog(kırmızı), OrderStatus(violet), Invoice(emerald)",
          "Manuel yenile butonu (RefreshCw), max-h scroll ile 60 kayıt gösterir",
          "GET /api/admin/docs/files ve /file?name=: DOCS klasörü .md dosyaları API üzerinden erişilebilir",
        ],
      },
      {
        type: "backend", icon: CreditCard, title: "Ödeme POST 400 Bug Fix — String Enum Deserializasyon",
        items: [
          "POST /api/payments/initiate: method: 'CreditCard' string → HTTP 400 veriyordu",
          "Kök neden: ASP.NET Core varsayılan JSON parser yalnızca integer enum değeri kabul eder",
          "Düzeltme: [JsonConverter(typeof(JsonStringEnumConverter))] → InitiatePaymentRequest.Method",
          "PaymentsController + OrdersController: BadRequest(result.Error) → BadRequest(new { error }) — api.ts friendlyError() uyumluluğu",
        ],
      },
    ],
  },
  {
    date: "20 Mayıs 2026",
    label: "Sipariş Silme / Kategori Modal / Marka-Kategori Filtre Bug / Test Verisi",
    defaultOpen: true,
    changes: [
      {
        type: "backend", icon: Database, title: "Sipariş Silme — DeleteOrderCommand + DELETE /api/orders/admin/{id}",
        items: [
          "DeleteOrderCommand: yalnızca İptal(8)/Tamamlandı(7)/İade Edildi(10)/Başarısız(11) statüsündeki siparişler silinebilir",
          "Soft-delete: IsDeleted=true, audit logu yazılır",
          "GetAdminOrdersQuery: !IsDeleted filtresi eklendi — silinen siparişler listede görünmez",
          "Admin siparişler: Trash2 butonu + ConfirmModal (DELETABLE set: 7,8,10,11 statüsleri için gösterilir)",
        ],
      },
      {
        type: "backend", icon: Tag, title: "Marka ve Kategori Silme Sonrası Listede Kalıyordu",
        items: [
          "GetBrandsQuery: db.Brands.AsQueryable() yerine db.Brands.Where(b => !b.IsDeleted) — soft-delete filtresi eksikti",
          "GetCategoriesQuery: aynı sorun — db.Categories.Where(c => !c.IsDeleted) ile düzeltildi",
          "Silinen marka/kategori artık admin listesinde görünmüyor (onlyActive=false ile bile)",
        ],
      },
      {
        type: "ux", icon: Palette, title: "Kategori Silme — window.confirm() → Kullanıcı Dostu Modal",
        items: [
          "Kategoriler sayfası: window.confirm() kaldırıldı — tam ConfirmModal eklendi (başlık, ikon, uyarı metni)",
          "deleteTarget state + handleDelete() ile async silme akışı",
          "Alt kategori ve aktif ürün uyarısı modal içinde gösteriliyor",
        ],
      },
      {
        type: "altyapi", icon: Warehouse, title: "Test Verisi — 22 Marka / 25 Kategori / 23 Ürün / 60+ Stok Hareketi",
        items: [
          "22 marka: Apple, Samsung, Sony, LG, Nike, Adidas, Lenovo, ASUS, HP, Dell, Microsoft, Xiaomi, Canon, Philips, Bosch, Dyson, Logitech, Puma, Zara + diğerleri — logo URL ile",
          "25 kategori: 6 ana + 19 alt/yeni (Bilgisayar & Tablet, Telefon & Aksesuar, TV & Ses, Erkek Giyim, Kadın Giyim, Fitness, Mobilya, Mutfak, vb.) — görsel + açıklama",
          "23 ürün: iPhone 15 Pro, Galaxy S24 Ultra, Sony XM5, ThinkPad X1, ROG Strix, LG OLED TV, Nike Air Max, Adidas Ultraboost, Canon EOS R8, Dyson V15, PS5 vb. — picsum görsel + tam detay",
          "Her ürüne 50 başlangıç stoku + ek hareket (StockIn/Adjustment, farklı notlar ve kritik eşik değerleri)",
        ],
      },
    ],
  },
  {
    date: "20 Mayıs 2026",
    label: "Dış Kaynaklar E2E Testi — REST / Excel Bug Düzeltmeleri / Marka Silme",
    defaultOpen: false,
    changes: [
      {
        type: "backend", icon: Database, title: "Dış Kaynaklar — REST API JSON Bug Düzeltmesi",
        items: [
          "ExternalSourceFetcher: JsonSerializer.Deserialize varsayılan case-sensitive → 'url' JSON key, 'Url' C# property'ye eşleşmiyordu",
          "Sonuç: her REST API fetch 'Config'de url alanı bulunamadı' hatası veriyordu",
          "Düzeltme: JsonSerializerOptions { PropertyNameCaseInsensitive = true } eklendi",
          "E2E test: JSONPlaceholder /users → 10 satır, 8 sütun başarıyla çekildi",
        ],
      },
      {
        type: "backend", icon: Warehouse, title: "Dış Kaynaklar — Stock Import SKU Field Name Bug",
        items: [
          "ImportExternalSourceCommand: Map(row, mapping, 'Sku') — UI'da field adı 'SKU' (büyük harf) olarak tanımlanmış",
          "Sonuç: SKU mapping dictionary'de 'SKU' key'i var, 'Sku' yok → Quantity eşleşiyor ama SKU bulunamıyor → tüm stok satırları atlanıyordu",
          "Düzeltme: Map('SKU') ?? Map('Sku') ?? Map('ProductName') ile her üç varyant deneniyor",
          "E2E test: 2 ürün stoku güncellendi (99, 50), 1 geçersiz SKU atlandı",
        ],
      },
      {
        type: "backend", icon: Tag, title: "Marka Silme — DeleteBrandCommand + DELETE /api/brands/{id}",
        items: [
          "BrandsController: yalnızca GET/POST/PUT vardı — DELETE endpoint eksikti",
          "DeleteBrandCommand: aktif ürünü varsa 'silinemez' hatası döndürür, yoksa IsActive=false + IsDeleted=true",
          "Admin markalar sayfası: Trash2 butonu + ConfirmModal (aktif ürün uyarısı)",
          "E2E test: 10 test markası başarıyla silindi (204 No Content)",
        ],
      },
    ],
  },
  {
    date: "20 Mayıs 2026",
    label: "Kapsamlı Ekran Testi — Backend Auth Yetki Düzeltmeleri",
    defaultOpen: false,
    changes: [
      {
        type: "backend", icon: Shield, title: "SuperAdmin Yetki Sorunu — 3 Controller Düzeltildi",
        items: [
          "ReportsController: [Authorize(Roles='Admin')] → 'SuperAdmin,Admin,FinanceUser' — analiz ekranı SuperAdmin'e açıldı",
          "CouponsController: [Authorize(Roles='Admin')] → 'SuperAdmin,Admin,FinanceUser' — kuponlar SuperAdmin'e açıldı",
          "VisitorController.GetLogs: [Authorize(Roles='Admin')] → 'SuperAdmin,Admin' — ziyaretçi logları açıldı",
          "Kök neden: ASP.NET Core Authorize(Roles='X') AND değil OR mantığıyla çalışır, SuperAdmin ayrıca belirtilmeli",
          "23 admin ekranının tümü TypeScript + endpoint tutarlılık testi ile doğrulandı — 0 hata",
        ],
      },
    ],
  },
  {
    date: "20 Mayıs 2026",
    label: "Bug Fix & Özellik — Yorumlar / Analiz / Chatbot / Test Merkezi",
    defaultOpen: false,
    changes: [
      {
        type: "frontend", icon: MessageSquare, title: "Admin Yorumlar — Yanıt Detay Modalı",
        items: [
          "Etkileşimler kolonunda yanıt sayısı (replyCount > 0) tıklanabilir buton oldu",
          "Tıklanınca 'Yanıtlar' modalı açılır: avatar baş harfi, kullanıcı adı, tarih, yanıt metni",
          "Modal tasarımı: teal tema, max-h-80 scroll, kapatma butonu (X) — şikayetler modalı ile tutarlı",
          "Backend: GET /api/admin/reviews/{id}/replies endpoint admin controller'a eklendi",
        ],
      },
      {
        type: "backend", icon: Shield, title: "Admin Review Arama + HasReports Pagination Bug Fix",
        items: [
          "GetAdminReviewsQuery: arama artık kullanıcı e-posta, ad, soyad ve ürün adında da çalışıyor",
          "Önceki durum: arama sadece yorum body/title'ında çalışıyordu (placeholder ile tutarsız)",
          "HasReports filtresi in-memory'den (sayfalama SONRASI) DB-level subquery'ye taşındı",
          "Önceki durum: filtre uygulanınca sayfa başına düşen kayıt sayısı yanlış hesaplanıyordu",
          "Düzeltme: db.ReviewReports.Where(!IsDeleted && !IsResolved).Select(ReviewId) subquery",
        ],
      },
      {
        type: "frontend", icon: BarChart3, title: "Admin Analiz — Canlı/Dinamik Veri Polling",
        items: [
          "raporlar/page.tsx: 60 saniyelik setInterval auto-refresh + cleanup on unmount",
          "Manuel 'Yenile' butonu: RefreshCw ikonu, tıklanınca spin animasyonu gösterir",
          "'Son güncelleme: HH:MM:SS' zaman damgası header alt metninde canlı gösterilir",
          "3 API çağrısı (visitor-stats, product-sales, dashboard) Promise.allSettled ile paralel",
          "useCallback + days dependency: period değişince timer yeniden kurulur",
        ],
      },
      {
        type: "ozellik", icon: Settings, title: "Chatbot Widget Aktif/Pasif Bug Fix",
        items: [
          "ChatWidget.tsx: config.enabled=false olsa da floating buton render ediliyordu",
          "Düzeltme: if (!config.enabled) return null — widget tamamen gizlenir",
          "showWhatsApp/showTelegram/showInline hesaplaması sadeleştirildi (enabled garantili)",
          "Admin toggle: ChatbotEnabled değişince anında api.put ile auto-save",
          "Önceki durum: toggle sadece local state güncelliyordu, 'Kaydet' basılması gerekiyordu",
        ],
      },
      {
        type: "frontend", icon: FlaskConical, title: "Test Merkezi — Veri Modeli Genişletme",
        items: [
          "TEST_MODELS 4 kategoriden 5'e çıkarıldı: yeni 'Siparişler' kategorisi eklendi",
          "Kullanıcılar: 3'ten 6'ya — Onaylı alıcı, ContentManager, Kilitli hesap eklendi",
          "Ürünler: 4'ten 6'ya — Varyantlı ürün ve Öne çıkan ürün eklendi",
          "Siparişler (YENİ): 5 fikstür — Bekleyen, Onaylı→Kargoda, İptal, İade, Misafir",
          "Kuponlar: 2'den 4'e — Tek kullanım ve Süresi dolmuş fikstürleri eklendi",
          "Senaryolar: 2'den 6'ya — Hesap kilit, Token yenileme, Stok alarm, Misafir+hesap akışları",
          "Her fikstür test beklentisi ve edge case açıklamaları içeriyor",
        ],
      },
      {
        type: "backend", icon: Warehouse, title: "Stok — Tüm Hareketler Tab",
        items: [
          "GetAllStockMovementsQuery: StockMovements JOIN Stocks, ProductId JOIN Products",
          "GET /api/admin/stocks/movements?page&pageSize&movementType&productId endpoint",
          "Enum.TryParse ile MovementType filtresi (EF'de ToString() SQL'e çevrilemiyor)",
          "Frontend: tab state 'stok' | 'hareketler', type renkli badge, miktar +/- işaretli",
        ],
      },
    ],
  },
  {
    date: "19 Mayıs 2026",
    label: "Adım 33 — Test, UX, Güvenlik & İzleme",
    defaultOpen: false,
    changes: [
      {
        type: "frontend", icon: FlaskConical, title: "Test Merkezi Tam Yenileme",
        items: [
          "57 testten 89 teste çıkarıldı — 9 test grubu, tüm alanlar kapsandı",
          "Filtre sekmeleri: Tümü / Bekliyor / Başarısız / Geçti + metin arama",
          "API yanıtları inline gösterilir: süre (ms), veri snippet, yeşil/kırmızı panel",
          "Adım adım howTo → numaralı adım listesi olarak yeniden tasarlandı",
          "Tüm API testlerini tek seferde çalıştır butonu eklendi",
          "Per-grup mini ilerleme çubuğu + global progress ring (%)",
          "Butonlar sembolik (✓/✗/→) yerine etiketli: Geçti / Başarısız / Atla",
          "Not alanı her test için her zaman görünür",
          "Yeni test kategorileri: chatbot, bildirim, stok alarm, RBAC, token yenileme, sidebar accordion",
        ],
      },
      {
        type: "frontend", icon: KeyRound, title: "RBAC Matrisi Düzenlenebilir Yapıldı",
        items: [
          "Yönetim > Yetkiler: her hücre tıklanabilir — yetki ekle/kaldır",
          "Süper Admin sütunu kilitli (her zaman tam yetkili, değiştirilemez)",
          "Değişen satırlar amber zemin + 'değişti' badge ile vurgulanır",
          "Varsayılana Sıfırla butonu tüm matrixi geri alır",
          "Kaydet butonu AdminRbacMatrix JSON olarak SiteSettings'e yazar",
          "layout.tsx: settings yüklenince matrixi okur, nav item allowedRoles override edilir",
        ],
      },
      {
        type: "frontend", icon: LayoutDashboard, title: "Sidebar Grup Accordion",
        items: [
          "Her grup başlığı (Genel, Katalog, Satış, Kullanıcı, Sistem) tıklanabilir buton",
          "ChevronDown ikonu grup açıkken döner (transition-transform 200ms)",
          "Açık/kapalı durum localStorage'da 'sidebar_open_groups' key'ine kaydedilir",
          "Daraltılmış (icon-only) moddaki sidebar'da tüm gruplar her zaman açık",
          "Aktif sayfa olan kapalı bir gruba küçük teal nokta göstergesi eklendi",
        ],
      },
      {
        type: "backend", icon: Shield, title: "Hassas Alan Audit Log",
        items: [
          "ResetPasswordCommand: şifre başarıyla sıfırlanınca 'PasswordReset' audit kaydı",
          "RefreshTokenCommand: token yenilenince 'TokenRefreshed' audit kaydı",
          "Her iki kayıt userId ve IP adresi içerir (IAuditService.LogAsync)",
        ],
      },
      {
        type: "frontend", icon: MessageSquare, title: "Mesajlar Sekmesi Accordion",
        items: [
          "Yönetim > Mesajlar: 5 grup başlığı açılır/kapanır accordion yapısına geçirildi",
          "Varsayılan açık grup: Doğrulama Mesajları",
          "openMsgGroups: Set<string> state — her grup bağımsız toggle edilir",
          "ChevronDown ikonu açık/kapalı duruma göre döner",
        ],
      },
      {
        type: "frontend", icon: Activity, title: "Servis Badge Flash Animasyonu",
        items: [
          "prevStatusRef ile her 5 saniyede önceki ve yeni status karşılaştırılır",
          "Status değişince karta 1 saniye ring flash uygulanır (emerald/amber/red)",
          "Durum noktası ve etiketi transition-colors duration-700 ile yumuşak geçer",
          "flashMap state ile birden fazla servis aynı anda animasyon gösterebilir",
        ],
      },
      {
        type: "frontend", icon: Cpu, title: "Servisler Sayfası Kapsamlı Genişletme",
        items: [
          "HealthRing SVG bileşeni: genel sistem sağlık skoru (0–100) canlı olarak header'da dönen grafik",
          "computeServiceStats(): min / ort. / P95 / max latency + oturum uptime yüzdesi hesaplama",
          "Her servis kartına hızlı stat satırı: 4 sütun (min/ort./P95/max) at-a-glance",
          "Detaylar genişletme paneli: SLA hedefi, oturum uptime kartı, meta tablo, threshold açıklaması",
          "Servis Karşılaştırması tablosu: tüm servislerin yanıt süreleri ve uptime'ları tek tabloda",
          "Olay Günlüğü bölümü: oturum boyunca status değişikliklerini zaman damgasıyla kaydeder",
          "IncidentEntry arayüzü: ts, service, from, to — maksimum 40 kayıt saklanır",
          "MAX_HISTORY 20→30 artırıldı; sparkline daha uzun geçmiş gösteriyor",
          "SLA hedefleri SERVICE_META'ya eklendi: API %99.9, DB %99.95, Redis %99.9, vs.",
        ],
      },
      {
        type: "frontend", icon: Layers, title: "Kuyruklar Sayfası Kapsamlı Genişletme",
        items: [
          "QueueSnapshot arayüzü: ts, processed, pending, failed — son 24 ölçüm saklanır",
          "Throughput hesabı: ardışık iki snapshot arasındaki delta / geçen süre → msg/dakika",
          "4. KPI kartı: Throughput (mesaj/dakika) canlı hesaplanır",
          "Kuyruk Tarihçesi paneli: işlenen ve bekleyen sayılarının sparkline grafikleri",
          "Mesaj Akışı diyagramı: Event → Outbox DB → MassTransit → Consumer → Tamamlandı / DLQ",
          "Tanımlı Event Tipleri tablosu: 6 event (OrderCreated, PaymentCompleted, OrderStatusChanged, OrderCancelled, StockAlert, ReturnRequested) — açıklama, kuyruk adı, ikon",
          "Consumer Listesi tablosu: 4 consumer + görev açıklaması",
          "DLQ kartı genişletildi: retry stratejisi, saklama süresi, yeniden gönderme",
          "Çok-sütun alt panel: DLQ + Broker bilgisi + Outbox tablosu yan yana 3 kart",
          "Header gradyen rengi: failedCount > 0 → kırmızı, pendingCount > 100 → amber, normal → teal",
        ],
      },
      {
        type: "ux", icon: BookOpen, title: "Dokümanlar Son Güncellemeler Senkronizasyonu",
        items: [
          "CHANGELOG statik verisi her geliştirme adımından sonra güncelleniyor",
          "Mevcut 19 Mayıs girişi genişletildi: label, 3 yeni ChangeEntry eklendi",
          "Prensip: her kayda değer değişiklik aynı gün ya da sonraki gün CHANGELOG'a işlenir",
        ],
      },
    ],
  },
  {
    date: "18 Mayıs 2026",
    label: "Adım 33 — Görünüm, Servisler & Filtreler",
    defaultOpen: false,
    changes: [
      {
        type: "frontend", icon: Palette, title: "Yönetim > Görünüm Kapsamlı Genişletme",
        items: [
          "8 Customer + 4 Admin renk kategorisi (toplam 12 alan), her biri 12 swatch",
          "COLOR_SWATCHES: 9 key, 12 renk her biri",
          "FONT_OPTIONS: 25 font (Sans-serif × 19, Serif × 4, Monospace × 2) — kategorize dropdown",
          "Font boyutu seçimi: xs / sm / base / lg / xl — Admin ve Customer ayrı ayrı",
          "Canlı önizleme paneli: font ve boyut seçimine göre gerçek zamanlı güncellenir",
          "THEME_PRESETS: 8 hazır tema (Teal, Ocean Blue, Forest Green, Berry Purple, Rose Red, Midnight Slate, Warm Amber, Coral Orange)",
          "Tema ön ayarı seçince tüm renk alanları tek tıkla güncellenir",
        ],
      },
      {
        type: "frontend", icon: MessageSquare, title: "Yönetim > Mesajlar Sekmesi",
        items: [
          "5 mesaj grubu: Doğrulama (🔒), Sipariş (📦), Sepet (🛒), Sistem & Hata (⚠️), Başarı & Bilgi (✅)",
          "Toplam 18 özelleştirilebilir mesaj — SiteSettings Msg_* key'leri",
          "Her mesaj: etiket, açıklama (hint), özelleştirildi badge, sıfırla butonu, input, varsayılan gösterimi",
          "Varsayılan değerden farklı her mesaj 'Özelleştirildi' badge'i alır",
          "Kaydet butonu tüm mesajları API'ye yazar, sayfayı yenilemek gerekmez",
        ],
      },
      {
        type: "frontend", icon: Activity, title: "Servisler Sayfası Yapısal Meta Panel",
        items: [
          "ServiceMeta interface: typeLabel, url, provider, database, port, extra",
          "Her servis kartına yapılandırılmış meta bilgi bölümü eklendi",
          "Alanlar: Tür / Sağlayıcı / URL-Bağlantı / Veritabanı / Port / Güvenlik",
        ],
      },
      {
        type: "backend", icon: Server, title: "HealthController ServiceMeta Record",
        items: [
          "ServiceMeta record: TypeLabel, Url, Provider, Database, Port, Extra",
          "ServiceStatus'a Meta?: ServiceMeta alanı eklendi",
          "API: ortam URL, versiyon, env; DB: masked connection, DB adı regex; Redis: masked host/port",
          "RabbitMQ: amqp://host:port/vhost, vhost, port, kullanıcı adı",
          "E-posta: smtpHost:port, gönderici e-posta, SSL/TLS modu",
          "MaskConnectionString(), MaskRedis(), ExtractDbName() yardımcı metodları",
        ],
      },
      {
        type: "frontend", icon: Database, title: "Kuyruklar Sayfası Broker + Outbox Detayları",
        items: [
          "GET /api/admin/system-info ile broker bilgisi çekilir",
          "'Mesaj Broker' kartı: sağlayıcı, host, port, vhost bilgileri",
          "'Outbox Tablosu' kartı: tablo adı, pattern, yeniden deneme sayısı, event tipleri",
          "Yeni ikonlar: Server, Database, GitBranch, Package, Zap, Hash",
        ],
      },
      {
        type: "frontend", icon: MapPin, title: "Ziyaretçiler Tutarlı İkon Seti",
        items: [
          "Tüm satır ikonları tek boyut (size=11) ile standardize edildi",
          "Üye → User (teal), Misafir → UserX (gri), IP → Globe, Konum → MapPin",
          "Masaüstü → Monitor, Mobil → Smartphone",
          "browserLabel() fonksiyonu { label, isMobile } tuple döndürecek şekilde güncellendi",
        ],
      },
      {
        type: "ozellik", icon: Tag, title: "Ürün Nitelik Filtreleri (Attribute Filters)",
        items: [
          "GET /api/products/attributes?categorySlug=... → distinct {key: [values]} haritası döner",
          "GetProductAttributesQuery: ProductVariant.AttributesJson'dan in-memory deserialize",
          "ProductFilters.tsx: useEffect ile API'den nitelikler yüklenir, kategori değişince yenilenir",
          "Pill buton UI: her nitelik değeri toggle edilebilir, aktifler teal vurguyla gösterilir",
          "URL: nitelikler parametresi olarak encode edilir, FilterBadge her çift için eklenir",
        ],
      },
      {
        type: "frontend", icon: RefreshCw, title: "Müşteri Sitesi Beni Hatırla Düzeltmesi",
        items: [
          "Customer api.ts'e tryRefreshToken() interceptor eklendi",
          "401 yanıtında: POST /api/auth/refresh → başarılıysa orijinal isteği yeniden dene",
          "Refresh başarısızsa: localStorage temizlenir, kullanıcı login sayfasına yönlendirilir",
          "REFRESH_TOKEN_KEY: 'refresh_token' — admin api.ts ile aynı yapı",
        ],
      },
      {
        type: "backend", icon: Shield, title: "InputSanitizationMiddleware Düzeltmesi",
        items: [
          "Eksik 'using Microsoft.AspNetCore.Http;' direktifi eklendi",
          "Build hatası CS0246 (RequestDelegate bulunamadı) giderildi",
        ],
      },
    ],
  },
  {
    date: "15 Mayıs 2026",
    label: "Adım 33 — Güvenlik, UX & İade",
    defaultOpen: false,
    changes: [
      {
        type: "frontend", icon: RotateCcw, title: "İade Yönetimi Sayfası",
        items: [
          "/iade sayfası: müşteri iade taleplerini listeleme ve aksiyon alma",
          "İade onayla (status=10) / reddet (status=7) işlemleri ConfirmModal ile",
          "Admin not girişi — reddetme sebebi müşteriye iletilebilir",
          "Sidebar'a 'İadeler' (RotateCcw ikonu) menü öğesi eklendi",
        ],
      },
      {
        type: "ozellik", icon: MessageSquare, title: "Yorum Moderasyon Genişletmesi",
        items: [
          "Reddet + Not alanı: admin reddederken mesaj girebilir (RejectionNote)",
          "E-posta bildir seçeneği: müşteriye reddetme e-postası gönderilir",
          "RejectionNote alanı Review entity'sine eklendi, migration oluşturuldu",
        ],
      },
      {
        type: "guvenik", icon: Lock, title: "Hesap Kilitleme (5 Deneme)",
        items: [
          "LoginCommandHandler: art arda 5 başarısız giriş → hesap 15 dakika kilitlenir",
          "User entity: FailedLoginCount ve LockoutUntil alanları eklendi",
          "Migration: AddUserLockout oluşturuldu",
          "Başarılı girişte sayaç sıfırlanır (FailedLoginCount=0, LockoutUntil=null)",
          "AccountLocked audit kaydı yazılır",
        ],
      },
      {
        type: "guvenik", icon: Shield, title: "Güvenlik Headers Middleware",
        items: [
          "SecurityHeadersMiddleware: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection",
          "CSP (Content Security Policy): script-src, style-src, img-src direktifleri",
          "HSTS: max-age=31536000, includeSubDomains",
          "Referrer-Policy: strict-origin-when-cross-origin",
        ],
      },
      {
        type: "frontend", icon: Bell, title: "Session Timeout Uyarısı",
        items: [
          "SessionTimeoutWarning bileşeni: token süresine 5 dakika kala sağ altta toast",
          "JWT exp claim decode edilerek kalan süre hesaplanır",
          "'Oturumu Yenile' butonu: onRefresh callback → token yenileme",
          "'Çıkış Yap' butonu: logout + login yönlendirme",
          "Admin layout'a sarılı — tüm sayfalarda aktif",
        ],
      },
      {
        type: "frontend", icon: Settings, title: "Global Error Boundary",
        items: [
          "ErrorBoundary React sınıf bileşeni — beklenmeyen hataları yakalar",
          "Kullanıcı dostu hata mesajı + 'Sayfayı Yenile' butonu",
          "Admin main content'e sarılı, sidebar etkilenmez",
          "api.ts'e friendlyError() — 'Failed to fetch' gibi teknik mesajları Türkçeye çevirir",
        ],
      },
      {
        type: "frontend", icon: CreditCard, title: "Ödeme Yönetimi Sayfası",
        items: [
          "/odemeler sayfası: tüm ödemelerin listesi, durum, tutar, yöntem filtresi",
          "Havale/EFT ödemeler için manuel onay (Onayla / Askıya Al / İptal)",
          "Ödeme durum geçmişi — her aksiyon timeline olarak kaydedilir",
          "Detay modalı: sipariş, müşteri, işlem adımları",
          "Sidebar'a 'Ödemeler' (CreditCard ikonu) menü öğesi eklendi",
        ],
      },
    ],
  },
  {
    date: "10 Mayıs 2026",
    label: "Adım 33 — Auth, Roller & Rate Limiting",
    defaultOpen: false,
    changes: [
      {
        type: "guvenik", icon: KeyRound, title: "Rol Tabanlı Admin Nav Guard",
        items: [
          "Her NavItem'a allowedRoles dizisi eklendi",
          "filterByRole(): SuperAdmin/Admin her şeyi görür, diğerleri kısıtlıdır",
          "Sidebar nav listesi JWT roles claim'ine göre filtrelenir",
          "Tanımlı roller: SuperAdmin, Admin, ProductManager, StockManager, OrderManager, CustomerSupport, FinanceUser, ContentManager",
        ],
      },
      {
        type: "ozellik", icon: Users, title: "Kullanıcıya Rol Atama UI",
        items: [
          "Kullanıcılar sayfasına ShieldCheck ikonu butonu eklendi",
          "Violet modal: checkbox listesi ile birden fazla rol seçimi",
          "PUT /api/admin/users/{id}/roles → UpdateUserRolesCommand",
          "Mevcut roller önceden seçili gelir",
        ],
      },
      {
        type: "backend", icon: RefreshCw, title: "Refresh Token (Beni Hatırla)",
        items: [
          "UserRefreshToken entity: UserId, Token (64 char), ExpiresAt, IsRevoked",
          "Migration: AddUserRefreshToken",
          "LoginCommand: RememberMe=true → 30 günlük token üretilir, DB'ye yazılır",
          "POST /api/auth/refresh: eski token iptal edilir, yeni token döndürülür",
          "RefreshTokenCommand: token doğrulama, kullanıcı aktiflik kontrolü",
        ],
      },
      {
        type: "backend", icon: Mail, title: "Şifremi Unuttum — Çok Kanallı",
        items: [
          "/sifre-sifirla sayfası: E-posta / WhatsApp / Telegram kanal seçimi",
          "E-posta akışı: ForgotPasswordCommand → PasswordResetToken → e-posta",
          "WhatsApp: wa.me deep link ile destek hattına yönlendirme",
          "Telegram: t.me deep link ile destek botuna yönlendirme",
          "Token 1 saat geçerli, kullanılınca sıfırlanır",
        ],
      },
      {
        type: "guvenik", icon: Shield, title: "Rate Limiting & Input Sanitizasyon",
        items: [
          "Tüm public endpoint'lere rate limiting uygulandı (app.MapControllers().RequireRateLimiting)",
          "InputSanitizationMiddleware: XSS ve SQL injection için string temizleme",
          "CORS: production'da sadece izin verilen origin'ler (WithOrigins config tabanlı)",
        ],
      },
    ],
  },
  {
    date: "5 Mayıs 2026",
    label: "Adım 30–32 — İzleme, Sidebar & Dashboard",
    defaultOpen: false,
    changes: [
      {
        type: "frontend", icon: Activity, title: "Servis & Kuyruk Canlı İzleme",
        items: [
          "Servisler ve Kuyruklar sayfaları 5 saniyede bir otomatik yenileme (setInterval)",
          "Sparkline SVG latency geçmişi (son 20 ölçüm) her servis kartında",
          "Latency bar: eşik değerlere göre yeşil/amber/kırmızı",
          "Countdown sayacı ve son güncelleme zamanı göstergesi",
          "Uptime sayacı: sayfa açıldığından bu yana geçen süre",
        ],
      },
      {
        type: "frontend", icon: LayoutDashboard, title: "Sidebar Daraltma/Genişletme",
        items: [
          "Sol alt köşede PanelLeftClose/PanelLeftOpen toggle butonu",
          "Daraltılmış halde (w-16): sadece ikonlar, hover tooltip ile label",
          "Genişletilmiş halde (w-60): gruplar, etiketler, arama çubuğu",
          "Durum localStorage'da 'sidebar_collapsed' key'ine kaydedilir",
        ],
      },
      {
        type: "frontend", icon: Settings, title: "Sol Menü Arama Çubuğu",
        items: [
          "Genişletilmiş sidebar'da canlı filtreleme input alanı",
          "Yazarken sonuçlar anında filtrelenir — Yönetim ve Test dahil",
          "Escape tuşu ile temizlenir, sonuç bulunamazsa 'Sonuç bulunamadı' gösterilir",
          "Arama modunda grup başlıkları gizlenir, düz liste gösterilir",
        ],
      },
      {
        type: "frontend", icon: BarChart3, title: "Dashboard Period Filtresi",
        items: [
          "Bugün / Bu Hafta / Bu Ay filtre sekmeleri eklendi",
          "weeklyOrders verisi dönem seçimine göre filtrelenerek gösterilir",
          "KPI kartları seçili döneme uygun verilerle güncellenir",
        ],
      },
      {
        type: "frontend", icon: Bell, title: "Bildirimler Paneli",
        items: [
          "Üst barda zil ikonu + sayı rozeti (okunmamış bildirim sayısı)",
          "Dropdown: yeni sipariş / düşük stok / bekleyen yorum bildirimleri",
          "Bildirime tıklayınca ilgili sayfaya yönlendirme",
          "Okundu işaretleme ve panel kapama desteği",
        ],
      },
    ],
  },
  {
    date: "25 Nisan 2026",
    label: "Adım 27–29 — Sepet, Test & UX",
    defaultOpen: false,
    changes: [
      {
        type: "ozellik", icon: ShoppingCart, title: "Seçici Checkout & Sepet İyileştirmeleri",
        items: [
          "CartItem.IsSelected alanı eklendi — seçili/Daha Sonra ayrımı",
          "Her ürüne checkbox, 'Seçili X Ürünle Devam Et' butonu",
          "Silme modalı: Favorilere Ekle & Kaldır / Direkt Sil seçeneği",
          "Header sepet rozeti sadece seçili ürünleri sayar",
          "Aktif kuponken 'Önce mevcut kuponu kaldırın' uyarısı",
        ],
      },
      {
        type: "frontend", icon: FlaskConical, title: "Test Merkezi (İlk Sürüm)",
        items: [
          "/test sayfası: API & Altyapı / Admin Ekranlar / Müşteri Ekranlar / Özellik Testleri",
          "Her test adımı: PASS/FAIL/SKIP toggle, not alanı, dış link",
          "Sonuçlar localStorage'da saklanır",
          "Özet: geçti/başarısız/bekliyor sayıları + ilerleme çubuğu",
        ],
      },
      {
        type: "frontend", icon: BookOpen, title: "Dokümanlar Sayfası",
        items: [
          "/dokuman sayfası: İş Süreçleri / Teknik Analiz / Son Güncellemeler sekmeleri",
          "Flow diyagramları: sipariş, ödeme, kargo, iade, yorum, kayıt akışları",
          "Teknik: mimari katmanlar, entity ilişkileri, API grupları, cache stratejisi",
        ],
      },
    ],
  },
  {
    date: "15 Nisan 2026",
    label: "Adım 23–26 — Redis, Dapper & Event-Driven",
    defaultOpen: false,
    changes: [
      {
        type: "altyapi", icon: Cpu, title: "Redis Cache Entegrasyonu",
        items: [
          "StackExchangeRedis paketi eklendi",
          "ICacheService + CacheService: IDistributedCache wrapper",
          "Kategori listesi (10 dk TTL), dashboard stats (1 dk), ürün detay (5 dk)",
          "Sepet session cache, Docker Compose'a redis:7-alpine servisi",
        ],
      },
      {
        type: "altyapi", icon: Database, title: "Dapper Sorgu Optimizasyonu",
        items: [
          "IDapperQueryService + DapperQueryService ham SQL sorgu servisi",
          "Dashboard: TodaySales/OrderCount/MonthSales Dapper ile optimize edildi",
          "GetVisitorLogsQuery Dapper ile sayfalı sorgu",
          "Ürün satış raporu GroupBy + JOIN sorgusu",
        ],
      },
      {
        type: "altyapi", icon: Activity, title: "RabbitMQ Event-Driven Mimari",
        items: [
          "MassTransit.RabbitMQ paketi, Outbox pattern",
          "Events: OrderCreated, OrderStatusChanged, OrderCancelled, PaymentCompleted",
          "Consumer'lar: OrderCreated, PaymentCompleted, OrderStatusChanged",
          "OrderProcessingSaga: ödeme → kargo → teslim state machine",
          "DLQ: MassTransit retry + outbox RetryCount<5 koruması",
        ],
      },
      {
        type: "altyapi", icon: Globe, title: "PostgreSQL & Fly.io Deployment",
        items: [
          "SQL Server → PostgreSQL geçişi: Npgsql.EntityFrameworkCore.PostgreSQL",
          "Database:Provider config (dev=SqlServer, prod=PostgreSQL)",
          "fly.toml deployment konfigürasyonu, multi-stage Docker build",
          "GitHub Actions CI/CD: Fly.io otomatik deploy (.github/workflows/deploy.yml)",
          "appsettings.Production.json şablonu, seed admin şifresi env'den",
        ],
      },
    ],
  },
  {
    date: "1 Nisan 2026",
    label: "Adım 19–22 — Chatbot, Lokasyon & Dış Kaynaklar",
    defaultOpen: false,
    changes: [
      {
        type: "ozellik", icon: MessageSquare, title: "Chatbot Entegrasyonu",
        items: [
          "SiteSettings: ChatbotEnabled, ChatbotProvider, WhatsApp/Telegram/n8n alanları",
          "POST /api/chatbot/message: n8n webhook'a mesaj iletir",
          "GET /api/chatbot/config: token içermeden widget config",
          "ChatWidget bileşeni: sağ alt yüzen buton, WhatsApp/Telegram/n8n inline chat",
          "Sohbet geçmişi sessionStorage'da tutulur",
          "Müşteri layout'a entegre — tüm sayfalarda aktif",
        ],
      },
      {
        type: "ozellik", icon: MapPin, title: "Ziyaretçi IP & Lokasyon Takibi",
        items: [
          "VisitorLog entity: SessionId, UserId, IP, UserAgent, Page, Country, City, Lat, Lon",
          "Migration: AddVisitorLogs",
          "POST /api/visitor/log: sayfa ziyareti + opsiyonel konum kaydı",
          "IP'den ülke/şehir: ip-api.com free tier async entegrasyonu",
          "Konum izin banner'ı: sağ altta fixed non-blocking card, localStorage'a kaydedilir",
          "Admin: Ziyaretçiler sayfası — IP, tarayıcı, konum, Google Maps linki",
        ],
      },
      {
        type: "ozellik", icon: Database, title: "Dış Veri Kaynakları Modülü",
        items: [
          "ExternalSource entity: Id, Name, Type (Excel/RestApi), Config JSON, IsActive",
          "Migration: AddExternalSources",
          "Excel: ClosedXML ile .xlsx parse, REST API: HttpClient JSON endpoint",
          "FetchExternalSourceCommand: ham satırları döndürür (önizleme)",
          "ImportExternalSourceCommand: Product/Category/Brand/Stock tablolarına yazar",
          "Çakışma stratejisi: skip/update seçimi, import log kaydı",
          "/dis-kaynaklar sayfası: kaynak listesi, önizleme tablosu, içe aktarma",
        ],
      },
      {
        type: "backend", icon: Activity, title: "Başarısız Giriş Audit Log",
        items: [
          "LoginCommandHandler: hatalı şifre → 'LoginFailed' audit kaydı",
          "Pasif hesap girişi → 'LoginFailed' audit kaydı",
          "IAuditService/AuditFilter: IP adresi audit kaydına eklendi",
          "Admin Hareketler sayfası: LoginFailed kırmızı satır rengi + filtre seçeneği",
        ],
      },
    ],
  },
  {
    date: "15 Mart 2026",
    label: "Adım 17–18 — Misafir Checkout & Gelişmiş Filtreler",
    defaultOpen: false,
    changes: [
      {
        type: "ozellik", icon: ShoppingCart, title: "Misafir Checkout (Üye Olmadan Sipariş)",
        items: [
          "GuestAddressInfo inline adres formu checkout adımında",
          "POST /api/orders/guest: misafir sipariş oluşturma",
          "Checkout sonrası 'Hesap Oluştur' CTA, üye olunca sepet merge",
          "/siparis-sorgula: misafir sipariş sorgulama (order number + email)",
        ],
      },
      {
        type: "ozellik", icon: Tag, title: "Gelişmiş Ürün Filtreleme",
        items: [
          "Fiyat aralığı: min-max input, URL param olarak encode",
          "Puan filtresi: 4+, 3+, 2+, 1+ yıldız — backend minRating param",
          "Marka çoklu seçim: checkbox listesi, brandIds[] param",
          "Sıralama: En Yeni, Çok Satan, Fiyat ↑↓",
          "FilterBadge bileşeni: aktif filtreler için rozet + 'Tümünü Temizle' butonu",
        ],
      },
      {
        type: "ozellik", icon: Users, title: "Favoriler / Wishlist",
        items: [
          "Wishlist entity + migration",
          "GET/POST/DELETE /api/wishlist/{productId}",
          "/favoriler sayfası: favori ürün listesi",
          "ProductCard'a kalp butonu entegrasyonu (toggle, login gerekli)",
          "Header dropdown'a favoriler linki eklendi",
        ],
      },
    ],
  },
  {
    date: "1 Mart 2026",
    label: "Adım 1–16 — Platform Temeli",
    defaultOpen: false,
    changes: [
      {
        type: "altyapi", icon: Server, title: "Clean Architecture Backend",
        items: [
          "Domain / Application / Infrastructure / API 4 katmanlı yapı",
          "MediatR CQRS: Commands ve Queries ayrımı",
          "EF Core + otomatik migration, seed data",
          "JWT auth (60 dk access token), FluentValidation",
        ],
      },
      {
        type: "ozellik", icon: Package, title: "Ürün & Katalog Modülü",
        items: [
          "Category, Brand, Product, ProductVariant, ProductImage CRUD",
          "ProductVariant.AttributesJson: JSON dizisi olarak nitelikler",
          "SEO: metaTitle/metaDescription, generateMetadata",
          "Product.IsFeatured, stok uyarı eşiği",
        ],
      },
      {
        type: "ozellik", icon: ShoppingCart, title: "Sipariş & Ödeme Sistemi",
        items: [
          "Sepet: AddToCart, UpdateCartItem, RemoveCartItem, MergeGuestCart",
          "Sipariş: CreateOrder, CancelOrder, UpdateOrderStatus",
          "İyzico HMAC-SHA256 Checkout Form API entegrasyonu",
          "MockPaymentService geliştirme ortamı için",
          "Kupon/indirim sistemi: min sepet, yüzde/sabit, kullanım limiti",
        ],
      },
      {
        type: "ozellik", icon: Mail, title: "E-posta & Bildirimler",
        items: [
          "MailKit SMTP entegrasyonu, UseSsl config, test endpoint",
          "Sipariş onayı, kargo takip, şifre sıfırlama, yorum reddetme e-postaları",
          "HTML e-posta şablonları (EmailTemplates.cs)",
          "Dev modda e-posta loglanır, prod'da SMTP'ye gönderilir",
        ],
      },
      {
        type: "frontend", icon: LayoutDashboard, title: "Admin Panel Temel Modüller",
        items: [
          "Dark sidebar, responsive layout, role-based nav",
          "Dashboard: KPI kartları, gelir grafiği, stok uyarıları, hedefler",
          "Siparişler: listeleme, filtre, detay, durum değiştirme, kargo takip",
          "Ürünler: CRUD, çoklu görsel yükleme, varyant yönetimi",
          "Kullanıcılar, Kuponlar, Yorumlar, Hareketler, Hedefler modülleri",
        ],
      },
      {
        type: "frontend", icon: Globe, title: "Müşteri Sitesi Temel Modüller",
        items: [
          "Ana sayfa, ürün listesi, ürün detay, sepet, checkout",
          "ProductImageGallery: fullscreen + swipe desteği",
          "Yorum bölümü: ReviewSection, verified purchase kontrolü",
          "Hesabım: sipariş geçmişi, adresler, profil güncelleme",
          "Konum izin bileşeni, chatbot widget",
        ],
      },
    ],
  },
];

function ChangeTypeBadge({ type }: { type: ChangeType }) {
  const m = TYPE_META[type];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function DayEntry({ day }: { day: DayLog }) {
  const [open, setOpen] = useState(day.defaultOpen ?? false);
  const total = day.changes.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="relative pl-8">
      {/* Timeline dot + line */}
      <div className="absolute left-0 top-0 flex flex-col items-center h-full">
        <div className={`w-3 h-3 rounded-full border-2 shrink-0 mt-1 ${open ? "border-teal-500 bg-teal-500" : "border-slate-300 bg-white"}`} />
        <div className="flex-1 w-px bg-slate-200 mt-1" />
      </div>

      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 pb-3 text-left group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Calendar size={11} />
              {day.date}
            </span>
            {day.label && (
              <span className="text-xs font-semibold text-slate-700">{day.label}</span>
            )}
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
              {day.changes.length} değişiklik · {total} madde
            </span>
          </div>
        </div>
        <div className={`shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </button>

      {/* Changes */}
      {open && (
        <div className="space-y-3 mb-5">
          {day.changes.map(change => (
            <div key={change.title} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <change.icon size={14} className="text-slate-600" />
                </div>
                <span className="text-sm font-bold text-slate-800 flex-1">{change.title}</span>
                <ChangeTypeBadge type={change.type} />
              </div>
              <ul className="px-4 py-3 space-y-1.5">
                {change.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function YeniliklerTab() {
  const [subTab, setSubTab] = useState<"git" | "notlar" | "degisiklikler">("git");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [expandedHashes, setExpandedHashes] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(40);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ commits: Commit[] }>(`/api/admin/docs/git-log?limit=${limit}`);
      setCommits(data.commits ?? []);
      setLastUpdated(new Date());
    } catch { /* silent */ } finally { setLoading(false); }
  }, [limit]);

  useEffect(() => {
    fetchLog();
    const t = setInterval(fetchLog, 30_000);
    return () => clearInterval(t);
  }, [fetchLog]);

  function toggleExpand(hash: string) {
    setExpandedHashes(prev => {
      const next = new Set(prev);
      next.has(hash) ? next.delete(hash) : next.add(hash);
      return next;
    });
  }

  const relDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  };

  const dayKey = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  // filter commits by selected category
  const filtered = catFilter === "all"
    ? commits
    : commits.filter(c => c.files.some(f => f.category === catFilter));

  // group by day
  const grouped: { day: string; commits: Commit[] }[] = [];
  for (const c of filtered) {
    const day = dayKey(c.date);
    const last = grouped[grouped.length - 1];
    if (last?.day === day) last.commits.push(c);
    else grouped.push({ day, commits: [c] });
  }

  const allCats = ["all", "admin", "customer", "backend", "docs", "infra"];
  const CAT_ALL = { label: "Tümü", bg: "bg-slate-100", text: "text-slate-700" };

  const statusIcon = (s: string) => {
    if (s === "A") return <span className="text-emerald-500 font-bold text-[10px]">+</span>;
    if (s === "D") return <span className="text-red-500 font-bold text-[10px]">-</span>;
    if (s === "R") return <span className="text-amber-500 font-bold text-[10px]">→</span>;
    return <span className="text-blue-400 font-bold text-[10px]">~</span>;
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1.5">
        {[
          { id: "git", label: "Git Geçmişi", icon: GitBranch },
          { id: "degisiklikler", label: "Değişiklik Günlüğü", icon: Clock },
          { id: "notlar", label: "Çalışma Notları", icon: FileText },
        ].map(st => (
          <button key={st.id} onClick={() => setSubTab(st.id as "git" | "notlar" | "degisiklikler")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition ${
              subTab === st.id ? "bg-teal-600 text-white border-teal-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
            }`}>
            <st.icon size={13} />
            {st.label}
          </button>
        ))}
      </div>

      {subTab === "notlar" ? <DocsNotlarTab /> : subTab === "degisiklikler" ? (
        <div className="space-y-2">
          {CHANGELOG.map(day => <DayEntry key={day.date + (day.label ?? "")} day={day} />)}
        </div>
      ) : (<>
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-teal-600" />
            <span className="text-sm font-bold text-slate-700">Git Geliştirme Geçmişi</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
              {filtered.length} commit
            </span>
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock size={10} /> {lastUpdated.toLocaleTimeString("tr-TR")} — 30s'de bir yenilenir
            </span>
          )}
          <div className="ml-auto flex gap-1.5 items-center">
            <button onClick={fetchLog}
              className={`p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 transition ${loading ? "animate-spin" : ""}`}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap mt-3">
          {allCats.map(cat => {
            const m = cat === "all" ? CAT_ALL : (CAT_META[cat] ?? CAT_ALL);
            const active = catFilter === cat;
            return (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition ${
                  active ? `${m.bg} ${m.text} border-transparent shadow-sm` : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Commit list */}
      {loading && commits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-400">
          Git geçmişi yükleniyor…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-400">
          Bu kategoride commit bulunamadı.
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ day, commits: dayCmts }) => (
            <div key={day}>
              {/* Day separator */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</span>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] text-slate-400">{dayCmts.length} commit</span>
              </div>

              {/* Commits */}
              <div className="ml-5 space-y-2 border-l-2 border-slate-200 pl-4">
                {dayCmts.map(c => {
                  const expanded = expandedHashes.has(c.hash);
                  // deduplicate categories
                  const cats = [...new Set(c.files.map(f => f.category))];
                  return (
                    <div key={c.hash} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-teal-200 transition">
                      <button onClick={() => toggleExpand(c.hash)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left">
                        {/* Hash badge */}
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                          {c.shortHash}
                        </span>
                        {/* Subject */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{c.subject}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-slate-400">{c.author}</span>
                            <span className="text-[10px] text-slate-300">·</span>
                            <span className="text-[10px] text-slate-400">{relDate(c.date)}</span>
                            {c.stats.total > 0 && (
                              <>
                                <span className="text-[10px] text-slate-300">·</span>
                                <span className="text-[10px] text-slate-400">{c.stats.total} dosya</span>
                                {c.stats.added > 0 && <span className="text-[10px] text-emerald-600 font-semibold">+{c.stats.added}</span>}
                                {c.stats.modified > 0 && <span className="text-[10px] text-blue-500 font-semibold">~{c.stats.modified}</span>}
                                {c.stats.deleted > 0 && <span className="text-[10px] text-red-500 font-semibold">-{c.stats.deleted}</span>}
                              </>
                            )}
                          </div>
                        </div>
                        {/* Category badges */}
                        <div className="flex gap-1 flex-wrap justify-end shrink-0 max-w-[160px]">
                          {cats.map(cat => {
                            const m = CAT_META[cat] ?? { label: cat, bg: "bg-slate-100", text: "text-slate-500" };
                            return (
                              <span key={cat} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.bg} ${m.text}`}>
                                {m.label}
                              </span>
                            );
                          })}
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform mt-0.5 ${expanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* File list */}
                      {expanded && c.files.length > 0 && (
                        <div className="border-t border-slate-100 px-4 py-2 max-h-52 overflow-y-auto bg-slate-50/40">
                          <div className="space-y-0.5">
                            {c.files.map((f, fi) => {
                              const cm = CAT_META[f.category] ?? { label: f.category, bg: "bg-slate-100", text: "text-slate-500" };
                              const fileName = f.path.split("/").pop() ?? f.path;
                              return (
                                <div key={fi} className="flex items-center gap-2 py-0.5">
                                  {statusIcon(f.status)}
                                  <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${cm.bg} ${cm.text} shrink-0`}>{cm.label}</span>
                                  <span className="text-[11px] font-mono text-slate-600 truncate" title={f.path}>{fileName}</span>
                                  <span className="text-[10px] text-slate-300 truncate hidden md:block">{f.path}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {commits.length >= limit && (
            <div className="text-center">
              <button onClick={() => setLimit(l => l + 40)}
                className="px-5 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
                Daha fazla yükle (+40)
              </button>
            </div>
          )}
        </div>
      )}
      </>)}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function DokumanPage() {
  const [tab, setTab] = useState<DocTab>("surecler");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600" />
            Dokümanlar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">İş süreçleri ve teknik mimari dokümantasyonu</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { id: "surecler" as DocTab, label: "İş Süreçleri", icon: ShoppingCart },
          { id: "teknik" as DocTab, label: "Teknik Analiz", icon: Server },
          { id: "yenilikler" as DocTab, label: "Son Güncellemeler", icon: Zap },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
              tab === t.id
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
            }`}>
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "surecler" && <SureclerTab />}
      {tab === "teknik" && <TeknikTab />}
      {tab === "yenilikler" && <YeniliklerTab />}
    </div>
  );
}
