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
  Image as ImageIcon, Eye, Search, Megaphone,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">E-posta / Şifre</p>
            <FlowRow>
              <FlowStep icon={Users} label="Kayıt Formu" color="blue" />
              <Arrow />
              <FlowStep icon={Mail} label="E-posta Kodu" color="violet" />
              <Arrow />
              <FlowStep icon={Shield} label="Doğrulama" color="teal" />
              <Arrow />
              <FlowStep icon={Shield} label="Hesap Aktif" color="emerald" />
            </FlowRow>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Google OAuth</p>
            <FlowRow>
              <FlowStep icon={Globe} label="Google Butonu" color="blue" sub="@react-oauth/google" />
              <Arrow />
              <FlowStep icon={Shield} label="Consent Ekranı" color="violet" />
              <Arrow />
              <FlowStep icon={KeyRound} label="id_token" color="amber" sub="Backend doğrular" />
              <Arrow />
              <FlowStep icon={Shield} label="Hesap Aktif" color="emerald" sub="Yeni veya eşleşen" />
            </FlowRow>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">2FA / TOTP (Opsiyonel)</p>
          <FlowRow>
            <FlowStep icon={Shield} label="Giriş Yap" color="blue" sub="E-posta + şifre" />
            <Arrow />
            <FlowStep icon={Lock} label="2FA İstenir" color="amber" sub="requiresTwoFactor" />
            <Arrow />
            <FlowStep icon={KeyRound} label="TOTP Kodu" color="violet" sub="6 haneli" />
            <Arrow />
            <FlowStep icon={Shield} label="JWT Verilir" color="emerald" sub="Giriş tamamlandı" />
          </FlowRow>
          <p className="text-xs text-slate-400 mt-2">2FA kurulumu: Hesabım → QR kod tarayıcı uygulamasıyla (Google Authenticator vb.) tarandıktan sonra etkinleştirilir.</p>
        </div>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
          Google OAuth ile giriş yapan kullanıcıların şifresi yoktur. 2FA her iki kayıt tipinde de etkinleştirilebilir. Hesap kilitleme: 5 ardışık başarısız giriş → 15 dakika kilit.
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

      {/* Lisans Yönetimi Rehberi */}
      <DocSection title="Lisans Yönetimi — Başlangıç Rehberi" icon={KeyRound}>
        <p className="text-xs text-slate-500 mb-4">
          Uygulamanın çalışabilmesi için geçerli bir aktivasyon anahtarının (lisans) yapılandırılmış olması gerekir.
          Bu rehber, lisansı hiç bilmeyen birinin süreci başından sonuna kadar takip edebilmesi için hazırlanmıştır.
        </p>
        <div className="space-y-5">

          {/* Lisans nedir */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
            <p className="text-xs font-bold text-teal-700 flex items-center gap-1.5"><Lock size={13} /> Lisans Nedir?</p>
            <p className="text-xs text-teal-700 leading-relaxed">
              Aktivasyon anahtarı, uygulamanın yalnızca yetkili ortamlarda çalışmasını sağlayan dijital bir imzadır.
              Olmadan uygulama başlamaz, giriş yapılamaz ve hiçbir API isteği yanıt almaz.
              Bir yapılandırma dosyasına tek satır olarak yazılır; başka bir kurulum gerektirmez.
            </p>
          </div>

          {/* Durum kontrolü */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">1 — Lisans Durumunu Kontrol Et</p>
            <p className="text-xs text-slate-500 mb-2">Admin panelinde <strong>Yönetim → Sistem → Aktivasyon Anahtarı</strong> bölümüne git. Karşılaşabileceğin durumlar:</p>
            <div className="space-y-2">
              {[
                { badge: "Yapılandırılmış", color: "emerald" as const, desc: "Lisans config'de mevcut ve RSA imzası geçerli. Sistem normal çalışıyor." },
                { badge: "Yapılandırılmamış", color: "amber" as const, desc: "Lisans config'de bulunamadı. Aşağıdaki adımları uygula." },
                { badge: "Geçersiz İmza", color: "red" as const, desc: "Dosyadaki token bozulmuş veya yanlış yapıştırılmış. Token'ı doğru kopyalayıp tekrar dene." },
              ].map(r => (
                <div key={r.badge} className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <Badge label={r.badge} color={r.color} />
                  <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Token'ı görüntüleme */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">2 — Token'ı Görüntüle ve Kopyala</p>
            <FlowRow>
              <FlowStep icon={Settings} label="Yönetim" color="teal" sub="Sol menü altında" />
              <Arrow />
              <FlowStep icon={Cpu} label="Sistem" color="teal" sub="Sekmeye tıkla" />
              <Arrow />
              <FlowStep icon={KeyRound} label="Aktivasyon Anahtarı" color="violet" sub="Bölümü bul" />
              <Arrow />
              <FlowStep icon={Eye} label="Görüntüle" color="amber" sub="Butona tıkla" />
              <Arrow />
              <FlowStep icon={Lock} label="Şifre Gir" color="amber" sub="Sistem yöneticisinden al" />
              <Arrow />
              <FlowStep icon={Code2} label="Kopyala" color="emerald" sub="Tam token görünür" />
            </FlowRow>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <strong>Görüntüleme şifresi</strong> sistem yöneticisinde saklanır. Şifreyi bilmiyorsan yöneticine danış. Şifre panelde hiçbir yerde gösterilmez.
            </div>
          </div>

          {/* Token'ı yapılandırma */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">3 — Token'ı Yapılandır</p>
            <div className="space-y-2">
              {[
                {
                  env: "Geliştirme (Local)",
                  color: "amber" as const,
                  steps: [
                    'backend/src/Ecom.API/appsettings.Development.json dosyasını aç',
                    '"License" anahtarına kopyalanan token\'ı yapıştır',
                    'ECOM_PUBLIC_KEY ortam değişkenine SPKI base64 public key\'i ekle',
                    'Dosyayı kaydet — git\'e commit etme (gitignore\'da)',
                    'Uygulamayı yeniden başlat: dotnet run --project src/Ecom.API',
                  ],
                },
                {
                  env: "Production (Sunucu)",
                  color: "blue" as const,
                  steps: [
                    '.env dosyasına ECOM_LICENSE değişkenini ekle (token değeri, tek satır)',
                    'ECOM_PUBLIC_KEY değişkenine SPKI base64 public key\'i ekle',
                    'Opsiyonel: LICENSE_ACTIVATION_URL\'ye Cloudflare Worker URL\'ini ekle',
                    'docker compose up -d api komutuyla API konteynerini yeniden başlat',
                  ],
                },
              ].map(e => (
                <div key={e.env} className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <Badge label={e.env} color={e.color} />
                  <ol className="space-y-1.5 pl-1">
                    {e.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          {/* Doğrulama */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">4 — Doğrula</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { check: "Uygulama başladı mı?", ok: "Konsol/log'da hata yok, sunucu ayağa kalktı", fail: "LicenseException veya Exit(1) → ECOM_LICENSE veya ECOM_PUBLIC_KEY eksik/hatalı" },
                { check: "Giriş yapılıyor mu?", ok: "Admin paneline email/şifre ile giriş yapılabiliyor", fail: "401 hatası → JWT anahtarı lisanstan türetilir, token değiştiyse oturumu kapat/aç" },
                { check: "Panel açılıyor mu?", ok: "Yönetim → Lisans → 'Yapılandırılmış' badge görünüyor", fail: "503 hatası → LicenseMiddleware engelledi, token veya aktivasyon sunucusu sorunu" },
              ].map(c => (
                <div key={c.check} className="border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                  <p className="font-semibold text-slate-700">{c.check}</p>
                  <div className="flex items-start gap-1.5 text-emerald-700"><span className="font-bold shrink-0">✓</span>{c.ok}</div>
                  <div className="flex items-start gap-1.5 text-red-600"><span className="font-bold shrink-0">✗</span>{c.fail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SSS */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Sık Sorulan Sorular</p>
            {[
              { q: "Token çok uzun, doğru mu?", a: "Evet. Token ~400–500 karakter uzunluğundadır. Tamamını tek satır olarak yapıştır, boşluk veya satır sonu bırakma." },
              { q: "Eski token silinirse ne olur?", a: "Uygulama bir sonraki başlatmada başlamayı reddeder. Token'ı yeniden yapıştırıp uygulamayı başlat." },
              { q: "Token'ın süresi ne zaman dolar?", a: "2028-12-31. Dolmadan önce sistem yöneticisinden yeni lisans talep et." },
              { q: "Token'ı başkasıyla paylaşabilir miyim?", a: "Hayır. Token uygulamaya özeldir; yanlış ellere geçerse yetkisiz kopyalar oluşturulabilir." },
            ].map(f => (
              <div key={f.q} className="text-xs space-y-0.5">
                <p className="font-semibold text-slate-700">{f.q}</p>
                <p className="text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

        </div>
      </DocSection>

      {/* Canlı Arama */}
      <DocSection title="Canlı Arama Akışı" icon={Search} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">Müşteri header arama kutusunda yazan karakter sayısı 2&apos;yi geçince tetiklenen anlık öneri akışı.</p>
        <FlowRow>
          <FlowStep icon={Users} label="Müşteri Yazar" color="blue" sub="≥2 karakter" />
          <Arrow />
          <FlowStep icon={Clock} label="300ms Debounce" color="amber" sub="Fazla istek önlenir" />
          <Arrow />
          <FlowStep icon={Search} label="GET /suggestions" color="violet" sub="q parametresi" />
          <Arrow />
          <FlowStep icon={Database} label="DB Sorgusu" color="teal" sub="Kategori/Marka/Ürün" />
          <Arrow />
          <FlowStep icon={Zap} label="Dropdown" color="emerald" sub="Anında gösterilir" />
        </FlowRow>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { state: "Kategoriler", desc: "İsimle eşleşen kategoriler — slug ile filtrelenmiş ürün listesine yönlendirme.", color: "teal" as const },
            { state: "Markalar", desc: "İsimle eşleşen markalar — markaya göre filtreli ürün listesine yönlendirme.", color: "violet" as const },
            { state: "Ürünler", desc: "İsim veya açıklamada geçen ürünler — doğrudan ürün detay sayfasına.", color: "emerald" as const },
          ].map(s => (
            <div key={s.state} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Badge label={s.state} color={s.color} />
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
          Backend: <code className="bg-slate-100 px-1 rounded">GetSearchSuggestionsQuery</code> — EF Core Contains ile 5 kategori + 5 marka + 10 ürün limiti. Sonuçlar birleştirilip tek response&apos;da döner.
        </div>
      </DocSection>

      {/* Google OAuth & 2FA */}
      <DocSection title="Google OAuth & 2FA Kimlik Doğrulama" icon={Shield} defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Google OAuth Akışı</p>
            <FlowRow>
              <FlowStep icon={Globe} label="Google Butonu" color="blue" sub="Client credential flow" />
              <Arrow />
              <FlowStep icon={KeyRound} label="id_token alınır" color="violet" />
              <Arrow />
              <FlowStep icon={Shield} label="POST /auth/google" color="amber" sub="Backend doğrular" />
              <Arrow />
              <FlowStep icon={Lock} label="JWT + Refresh" color="emerald" sub="Hesap oluşturulur" />
            </FlowRow>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">2FA Kurulum (TOTP)</p>
            <FlowRow>
              <FlowStep icon={Settings} label="Hesabım" color="blue" sub="2FA bölümü" />
              <Arrow />
              <FlowStep icon={KeyRound} label="QR Kod Üretilir" color="violet" sub="TOTP secret" />
              <Arrow />
              <FlowStep icon={Shield} label="Authenticator App" color="amber" sub="QR taranır" />
              <Arrow />
              <FlowStep icon={Shield} label="Etkinleştir" color="emerald" sub="6 haneli onay" />
            </FlowRow>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">2FA ile Giriş</p>
          <FlowRow>
            <FlowStep icon={Users} label="E-posta + Şifre" color="blue" />
            <Arrow />
            <FlowStep icon={Lock} label="requiresTwoFactor" color="amber" sub="true dönerse" />
            <Arrow />
            <FlowStep icon={KeyRound} label="TOTP Girişi" color="violet" sub="POST /auth/2fa/login" />
            <Arrow />
            <FlowStep icon={Shield} label="JWT Verilir" color="emerald" />
          </FlowRow>
        </div>
        <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700">
          TOTP secret <code className="bg-violet-100 px-1 rounded">TotpService</code> (HMACSHA1 tabanlı) ile üretilir, şifreli DB&apos;ye kaydedilir. QR kod <code className="bg-violet-100 px-1 rounded">qrcode</code> paketi ile client-side üretilir. Google OAuth kullanıcıları şifresiz giriş yapar.
        </div>
      </DocSection>

      {/* Lisans Atama */}
      <DocSection title="Lisans Atama & Modül Yönetimi" icon={KeyRound} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">SuperAdmin, WebCrypto RSA-2048 ile ürettiği lisansı belirli kullanıcılara atayabilir. Regular admin görüntüleyebilir, SuperAdmin şifresiz görür.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Lisans Üretimi (SuperAdmin)</p>
            <FlowRow>
              <FlowStep icon={Settings} label="Yönetim" color="blue" sub="Lisans sekmesi" />
              <Arrow />
              <FlowStep icon={KeyRound} label="Lisans Üretici" color="violet" sub="WebCrypto RSA-2048" />
              <Arrow />
              <FlowStep icon={Shield} label="Private Key + Parametreler" color="amber" />
              <Arrow />
              <FlowStep icon={Code2} label="Token Üretildi" color="emerald" sub="Base64url imza" />
            </FlowRow>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Lisans Atama Akışı</p>
            <FlowRow>
              <FlowStep icon={Users} label="Kullanıcı Seç" color="blue" />
              <Arrow />
              <FlowStep icon={KeyRound} label="Token Yapıştır" color="violet" />
              <Arrow />
              <FlowStep icon={Mail} label="E-posta Gönderilir" color="amber" sub="SendLicenseAssignment" />
              <Arrow />
              <FlowStep icon={Shield} label="DB&apos;ye Kaydedilir" color="emerald" />
            </FlowRow>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {[
            { state: "Aktif", desc: "LicenseAssignment.IsActive=true. Regular admin view-password ile kendi lisansını görebilir.", color: "emerald" as const },
            { state: "İptal Edildi", desc: "Admin iptal ettiğinde IsActive=false. Kullanıcıya bildirim e-postası gönderilir.", color: "red" as const },
            { state: "SuperAdmin Bypass", desc: "SuperAdmin rolünde DevKeyController tam token'ı şifresiz döner (fullKey=true).", color: "violet" as const },
          ].map(s => (
            <div key={s.state} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Badge label={s.state} color={s.color} />
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Kampanya */}
      <DocSection title="Kampanya Yönetimi Akışı" icon={Megaphone} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">Sezonluk / özel kampanyalar oluşturma ve hero slider&apos;da yayınlama süreci.</p>
        <FlowRow>
          <FlowStep icon={Megaphone} label="Kampanya Oluştur" color="blue" sub="Admin /kampanyalar" />
          <Arrow />
          <FlowStep icon={Palette} label="Stil & Renk Şeması" color="violet" sub="StylesJson" />
          <Arrow />
          <FlowStep icon={Shield} label="Kaydet" color="teal" sub="POST /api/admin/campaigns" />
          <Arrow />
          <FlowStep icon={Globe} label="Hero Slider" color="emerald" sub="Müşteri ana sayfa" />
        </FlowRow>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { state: "Başlık / Açıklama", desc: "Kampanya adı, kısa açıklama ve opsiyonel CTA butonu metni.", color: "teal" as const },
            { state: "Görsel Şeması", desc: "StylesJson ile renk şeması — campaign-card-{scheme} + hero-slide-0 CSS şablonları.", color: "violet" as const },
            { state: "Tarih Aralığı", desc: "startDate / endDate ile kampanya yayın dönemi kontrolü — geçmiş kampanyalar gizlenir.", color: "amber" as const },
          ].map(s => (
            <div key={s.state} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Badge label={s.state} color={s.color} />
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
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
              { entity: "User", relations: ["Orders (1:N)", "Addresses (1:N)", "Roles (1:N)", "RefreshTokens (1:N)", "Wishlist (1:N)", "LicenseAssignments (1:N)"] },
              { entity: "Order", relations: ["OrderItems (1:N)", "Coupon (N:1)", "Shipment (1:1)", "Invoice (1:1)", "ReturnRequest (1:1 nullable)"] },
              { entity: "Product", relations: ["Category (N:1)", "Brand (N:1)", "Images (1:N)", "Variants (1:N)", "StockMovements (1:N)", "Reviews (1:N)", "ImportedFromSource (N:1 nullable)"] },
              { entity: "Category", relations: ["SubCategories (1:N)", "Products (1:N)", "ImportedFromSource (N:1 nullable)"] },
              { entity: "Brand", relations: ["Products (1:N)", "ImportedFromSource (N:1 nullable)"] },
              { entity: "ExternalSource", relations: ["ImportJobs (1:N)", "ImportLogs (1:N)"] },
              { entity: "ImportJob", relations: ["ExternalSource (N:1)"] },
              { entity: "Invoice", relations: ["InvoiceItems (1:N)", "Order (N:1)"] },
              { entity: "ShippingCarrier", relations: ["(standalone — kargo firması tanımları)"] },
              { entity: "Cart", relations: ["CartItems (1:N)", "User/Session (N:1)"] },
              { entity: "Coupon", relations: ["Orders (1:N)"] },
              { entity: "VisitorLog", relations: ["User (N:1 nullable)"] },
              { entity: "Wishlist", relations: ["User (N:1)", "Product (N:1)"] },
              { entity: "UserRefreshToken", relations: ["User (N:1)", "Token, ExpiresAt, IsRevoked"] },
              { entity: "Review", relations: ["User (N:1)", "Product (N:1)", "Reports (1:N)", "IsApproved, RejectionNote"] },
              { entity: "LicenseAssignment", relations: ["User (N:1)", "IsActive, AssignedAt, ExpiresAt, Token"] },
              { entity: "Campaign", relations: ["(standalone)", "Title, StylesJson, StartDate, EndDate, IsActive"] },
              { entity: "Announcement", relations: ["(standalone)", "StylesJson, IsActive, StartDate, EndDate"] },
              { entity: "SalesGoal", relations: ["(standalone)", "Month, TargetAmount, ActualAmount"] },
              { entity: "AuditLog", relations: ["User (N:1 nullable)", "Action, EntityName, EntityId, IPAddress"] },
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
            { group: "/api/auth", desc: "Kayıt, giriş, token yenileme, şifre sıfırlama, e-posta doğrulama, hesap kilitleme (5 hatalı giriş). POST /auth/google (OAuth), POST /auth/2fa/setup|enable|disable|login (TOTP)", badge: "Public", color: "emerald" as const },
            { group: "/api/products", desc: "Ürün listesi, detay, filtreleme, nitelik filtresi (slug bazlı Redis cache). GET /products/suggestions?q= → kategori+marka+ürün canlı arama önerileri (debounced)", badge: "Public", color: "emerald" as const },
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
            { group: "/api/admin/announcements", desc: "Site duyuruları CRUD — içerik RichTextEditor, StylesJson ile stil (aktif/pasif, tarih aralığı)", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/campaigns", desc: "Kampanya CRUD — başlık, açıklama, StylesJson renk şeması, tarih aralığı. Müşteri hero slider&apos;ı besler.", badge: "Admin", color: "violet" as const },
            { group: "/api/admin/license-assignments", desc: "Lisans atama CRUD — SuperAdmin kullanıcıya lisans atar/iptal eder. E-posta bildirimi gönderilir.", badge: "SuperAdmin", color: "red" as const },
            { group: "/api/admin/returns", desc: "İade talepleri listesi, onayla/reddet (not ile), durum akışı — ReturnRequested → Approved/Rejected", badge: "Admin", color: "violet" as const },
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
            { key: "categories:list", ttl: "10 dakika", invalidate: "Kategori oluşturulunca/güncellenince/silinince", color: "teal" as const },
            { key: "dashboard:stats", ttl: "1 dakika", invalidate: "TTL sonunda otomatik", color: "blue" as const },
            { key: "product:slug:{slug}", ttl: "5 dakika", invalidate: "Ürün güncellenince", color: "teal" as const },
            { key: "cart:user:{userId}", ttl: "20 saniye", invalidate: "Sepet her mutasyonda", color: "violet" as const },
            { key: "cart:session:{sessionId}", ttl: "20 saniye", invalidate: "Sepet her mutasyonda", color: "violet" as const },
            { key: "visitor:stats:{days}", ttl: "5 dakika", invalidate: "TTL sonunda otomatik", color: "blue" as const },
            { key: "report:product-sales:{days}:{topN}", ttl: "10 dakika", invalidate: "TTL sonunda otomatik", color: "blue" as const },
            { key: "gh:docs:files (IMemoryCache)", ttl: "60 saniye", invalidate: "Manuel yenile / TTL — DocsController", color: "slate" as const },
            { key: "gh:docs:file:{name} (IMemoryCache)", ttl: "2 dakika", invalidate: "Manuel yenile / TTL — DocsController", color: "slate" as const },
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

      {/* Background Jobs */}
      <DocSection title="Arka Plan İşleri (Background Jobs)" icon={Activity} defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">
          <code className="bg-slate-100 px-1 rounded">JobBase</code> sınıfından türetilen zamanlanmış işler.
          <code className="bg-slate-100 px-1 rounded ml-1">IServiceStateManager</code> ile pause/resume/trigger destekler — Admin → Servisler sayfasından yönetilir.
        </p>
        <div className="space-y-3">
          {[
            { job: "ModuleHealthCheckJob", interval: "Saatlik", desc: "6 modülü kontrol eder (DB/Redis/RabbitMQ/Email/Telegram/API). Başarısız modül varsa Yönetim → Bildirimler&apos;de tanımlı e-posta adreslerine alert gönderir.", badge: "Sistem", color: "red" as const },
            { job: "ImportJobConsumer", interval: "Event-driven", desc: "MassTransit ImportJobQueued eventi alınca çalışır. 5.000+ satırlık Excel/REST aktarımını chunk&apos;lara bölerek async işler, import log kaydeder.", badge: "Dış Kaynak", color: "violet" as const },
            { job: "StockAlertConsumer", interval: "Event-driven", desc: "MassTransit StockAlert eventi alınca çalışır. Stok kritik eşiğin altına düştüğünde admin e-posta + Telegram bildirimi gönderir.", badge: "Stok", color: "amber" as const },
            { job: "OrderProcessingSaga", interval: "Event-driven", desc: "MassTransit Saga. Ödeme tamamlanınca kargo sürecini başlatır, OrderStatusChanged eventi yayınlar. DLQ: max 5 yeniden deneme, sonra dead-letter queue.", badge: "Sipariş", color: "blue" as const },
          ].map(j => (
            <div key={j.job} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
              <Badge label={j.badge} color={j.color} />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-mono font-semibold text-slate-800">{j.job}</p>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{j.interval}</span>
                </div>
                <p className="text-xs text-slate-500">{j.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-700">
          Admin → Servisler sayfasından her job&apos;u duraklat / devam ettir / manuel tetikle. Job çalışma geçmişi HealthRing grafiği ile izlenir.
        </div>
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
              { label: "ECOM_LICENSE", desc: "Lisans token — .env veya appsettings.Development.json \"License\" anahtarına tek satır, boşluksuz" },
              { label: "ECOM_PUBLIC_KEY", desc: "RSA-2048 SPKI DER base64 public key — .env ortam değişkeni (kaynak kodda saklanmaz)" },
              { label: "LICENSE_ACTIVATION_URL", desc: "Cloudflare Worker URL — boş bırakılırsa online aktivasyon devre dışı; prod ortamı için tavsiye edilir" },
              { label: "JWT anahtarı", desc: "Config'deki Jwt:Key kullanılmıyor — JWT imzalama anahtarı lisans payload'ından HMACSHA256 ile türetilir" },
              { label: "LicenseMiddleware", desc: "Her HTTP isteğinde RSA (1 dk cache) + online aktivasyon (5 dk cache) — geçersizde 503, /health bypass" },
              { label: "Private key", desc: "Sadece SuperAdmin'de saklanır, repoya GİRMEZ — yeni lisans üretmek için gerekir (Lisans Üretici bölümü)" },
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
              <p className="text-emerald-300">{'{"app":"Ecom","iss":"OCA1782","nbf":"2026-01-01","exp":"2028-12-31","host":"178.105.230.111"}'}</p>
              <p className="text-slate-500 text-[10px] mt-1">host alanı opsiyoneldir — girilirse token yalnızca o sunucuda çalışır</p>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { field: "app",   desc: "Uygulama adı — başka uygulamaların tokenini geçersiz kılar" },
                { field: "iss",   desc: "Lisans veren — izlenebilirlik için, doğrulamayı etkilemez" },
                { field: "nbf",   desc: "Geçerlilik başlangıcı (Not Before)" },
                { field: "exp",   desc: "Son kullanma tarihi (Expires)" },
                { field: "host?", desc: "Opsiyonel — girilirse token yalnızca bu hostname/IP'de çalışır" },
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
                  how: "LicenseValidator.Validate() — ECOM_PUBLIC_KEY env var'dan RSA public key, imza + nbf/exp + host kontrolü",
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
                    { s: "ECOM_PUBLIC_KEY eksik",           k: "1 — Startup",        http: "—",   d: "Process başlamaz (Exit 1) — env var tanımlı değil" },
                    { s: "Token eksik (config'de yok)",    k: "1 — Startup",        http: "—",   d: "Process başlamaz (Exit 1)" },
                    { s: "Token süresi dolmuş (exp geçti)", k: "1 — Startup",        http: "—",   d: "Process başlamaz (Exit 1)" },
                    { s: "İmza geçersiz (sahte token)",     k: "1 — Startup",        http: "—",   d: "Process başlamaz (Exit 1)" },
                    { s: "Host binding uyuşmazlığı",        k: "1 — Startup",        http: "—",   d: "Process başlamaz — token başka sunucu için üretilmiş" },
                    { s: "Online aktivasyon başarısız",     k: "1 — Startup",        http: "—",   d: "Process başlamaz — Cloudflare Worker 403 veya ulaşılamıyor" },
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

/* ─── Changelog Markdown Tab ─────────────────────────────────────────── */

function ChangelogMarkdownTab() {
  const [content, setContent] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const data = await api.get<{ content: string; lastModified: string }>(
        "/api/admin/docs/file?name=CHANGELOG.md"
      );
      setContent(data.content);
      setLastModified(data.lastModified);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
        <Clock size={14} className="text-teal-600" />
        <span className="text-sm font-semibold text-slate-700">Değişiklik Günlüğü</span>
        {lastModified && <span className="text-[10px] text-slate-400">{fmtDate(lastModified)}</span>}
        <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium ml-1">
          dotnet-ecom-docs/CHANGELOG.md
        </span>
        <button onClick={fetch} className={`ml-auto p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 transition ${loading ? "animate-spin" : ""}`}>
          <RefreshCw size={13} />
        </button>
      </div>
      <div className="px-5 py-4 max-h-[calc(100vh-380px)] overflow-y-auto">
        {loading && !content ? (
          <div className="text-center text-sm text-slate-400 py-8">Yükleniyor…</div>
        ) : error ? (
          <div className="text-center text-sm text-slate-400 py-8">
            <p>CHANGELOG.md yüklenemedi.</p>
            <p className="text-xs mt-1 text-slate-300">GitHub token yapılandırılmamış veya dotnet-ecom-docs repo erişilemiyor olabilir.</p>
          </div>
        ) : content ? renderMarkdown(content) : null}
      </div>
    </div>
  );
}

/* ─── Yenilikler Tab ─────────────────────────────────────────────────── */


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
        <ChangelogMarkdownTab />
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
