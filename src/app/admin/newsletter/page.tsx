"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { generateEmailPreview, extractBodyContent, isFullEmailHtml, defaultEmailOptions, extractBodyBgImage } from "@/lib/email-preview";
import type { EmailTemplateOptions } from "@/lib/email-preview";

// Per-template default email options. Adding a new branded template? Add it
// here so the editor and the campaign send pipeline pick up the same defaults.
function templateDefaultOptions(templateName: string, body: string): Partial<EmailTemplateOptions> {
  switch (templateName) {
    case 'Akcije':
      return { headerBgImage: '/hero.png' };
    case 'Info':
      return { bodyBgImage: extractBodyBgImage(body) || '/newsletter-info-bg.png' };
    default:
      return {};
  }
}
import {
  Search,
  Download,
  Mail,
  X,
  Users,
  Send,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Loader2,
  FileText,
  ArrowLeft,
  Save,
  Settings2,
  ChevronDown,
} from "lucide-react";

const TiptapEditor = dynamic(() => import("@/components/admin/TiptapEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-stone-200 rounded-lg p-16 flex items-center justify-center bg-white">
      <Loader2 size={24} className="animate-spin text-[#837A64]" />
    </div>
  ),
});

type Tab = "templates" | "subscribers" | "campaigns";

interface Campaign {
  id: string;
  title: string;
  subject: string;
  segment: "b2b" | "b2c";
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  sentAt: string | null;
  sentCount: number;
  createdAt: string;
}

// ── Types ──

interface Template {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  htmlContent: string;
  thumbnail: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Subscriber {
  id: string;
  email: string;
  segment: "b2b" | "b2c";
  isSubscribed: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

interface Stats {
  totalActive: number;
  b2bCount: number;
  b2cCount: number;
}

// ── Component ──

export default function NewsletterPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    description: "",
    htmlContent: "",
  });
  const [templateSaving, setTemplateSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Template | null>(null);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editorBodyContent, setEditorBodyContent] = useState("");
  const [emailOptions, setEmailOptions] = useState<EmailTemplateOptions>({ ...defaultEmailOptions });
  const [showEmailSettings, setShowEmailSettings] = useState(false);

  // Subscribers state
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<Stats>({ totalActive: 0, b2bCount: 0, b2cCount: 0 });
  const [loading, setLoading] = useState(false);
  const limit = 20;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Send-from-template state
  const [sendSegment, setSendSegment] = useState<"all" | "b2b" | "b2c">("all");
  const [sendSubject, setSendSubject] = useState("");
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [inlineTestEmail, setInlineTestEmail] = useState("");
  const [inlineTestSending, setInlineTestSending] = useState(false);
  const [inlineTestResult, setInlineTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [bodyBgUploading, setBodyBgUploading] = useState(false);
  const bodyBgFileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch functions ──

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch("/api/newsletter/templates");
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const fetchSubscribers = useCallback(async (searchVal: string, segmentVal: string, pageVal: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: searchVal, segment: segmentVal, page: String(pageVal), limit: String(limit) });
      const res = await fetch(`/api/newsletter?${params}`);
      const json = await res.json();
      if (json.success) {
        setSubscribers(json.data.subscribers);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error("Failed to fetch subscribers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/newsletter/stats");
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch("/api/newsletter/campaigns?limit=50");
      const json = await res.json();
      if (json.success) setCampaigns(json.data.campaigns);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  // ── Effects ──

  useEffect(() => {
    fetchTemplates();
    fetchStats();
  }, [fetchTemplates, fetchStats]);

  useEffect(() => {
    if (activeTab === "campaigns") fetchCampaigns();
  }, [activeTab, fetchCampaigns]);

  useEffect(() => {
    if (activeTab === "subscribers") {
      fetchSubscribers(search, segmentFilter, page);
      fetchStats();
    }
  }, [activeTab, page, segmentFilter, fetchSubscribers, fetchStats]); // search omitted — handleSearchChange debounces and fetches directly

  // Cleanup search timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // Auto-seed defaults if no templates exist
  const seedingRef = useRef(false);
  useEffect(() => {
    if (!templatesLoading && templates.length === 0 && !seedingRef.current) {
      seedingRef.current = true;
      setSeeding(true);
      fetch("/api/newsletter/templates/seed", { method: "POST" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) fetchTemplates();
        })
        .catch(console.error)
        .finally(() => setSeeding(false));
    }
  }, [templatesLoading, templates.length, fetchTemplates]);

  // ── Derived: live email preview from editor body ──

  const emailPreviewHtml = useMemo(() => {
    if (!editorBodyContent) return "";
    return generateEmailPreview(editorBodyContent, emailOptions);
  }, [editorBodyContent, emailOptions]);

  // Subscriber count for selected send segment
  const sendRecipientCount = useMemo(() => {
    if (sendSegment === "all") return stats.totalActive;
    if (sendSegment === "b2b") return stats.b2bCount;
    return stats.b2cCount;
  }, [sendSegment, stats]);

  // ── Template handlers ──

  const openTemplateEditor = (template: Template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      description: template.description || "",
      htmlContent: template.htmlContent,
    });
    // Extract body content from legacy full-email HTML, or use as-is
    const body = isFullEmailHtml(template.htmlContent)
      ? extractBodyContent(template.htmlContent)
      : template.htmlContent;
    setEditorBodyContent(body);
    setEmailOptions({
      ...defaultEmailOptions,
      ...templateDefaultOptions(template.name, body),
    });
    setShowEmailSettings(false);
    setSendSubject(template.subject);
    setSendSegment("all");
    setSendResult(null);
    fetchStats();
  };

  const closeTemplateEditor = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", subject: "", description: "", htmlContent: "" });
    setEditorBodyContent("");
    setEmailOptions({ ...defaultEmailOptions });
    setShowEmailSettings(false);
    setSendSubject("");
    setSendSegment("all");
    setSendResult(null);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    setTemplateSaving(true);
    try {
      // Save the body content — the full email HTML is generated on demand
      const res = await fetch(`/api/newsletter/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateForm.name,
          subject: templateForm.subject,
          description: templateForm.description,
          htmlContent: editorBodyContent,
        }),
      });
      if (res.ok) {
        await fetchTemplates();
        closeTemplateEditor();
      }
    } catch (err) {
      console.error("Failed to save template:", err);
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const res = await fetch(`/api/newsletter/templates/${template.id}/duplicate`, { method: "POST" });
      if (res.ok) fetchTemplates();
    } catch (err) {
      console.error("Failed to duplicate template:", err);
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    try {
      const res = await fetch(`/api/newsletter/templates/${template.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTemplates();
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.subject.trim()) return;
    setTemplateSaving(true);
    try {
      const res = await fetch("/api/newsletter/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateForm.name,
          subject: templateForm.subject,
          description: templateForm.description,
          htmlContent: templateForm.htmlContent || "<p>Vaš sadržaj ovde...</p>",
        }),
      });
      if (res.ok) {
        await fetchTemplates();
        setShowNewTemplateModal(false);
        setTemplateForm({ name: "", subject: "", description: "", htmlContent: "" });
      }
    } catch (err) {
      console.error("Failed to create template:", err);
    } finally {
      setTemplateSaving(false);
    }
  };

  // ── Subscriber handlers ──

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      fetchSubscribers(value, segmentFilter, 1);
    }, 300);
  };

  const handleSegmentChange = (value: string) => {
    setSegmentFilter(value);
    setPage(1);
  };

  const handleDeleteSubscriber = async (id: string) => {
    try {
      const res = await fetch(`/api/newsletter/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSubscribers(search, segmentFilter, page);
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to delete subscriber:", err);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ search: "", segment: "all", page: "1", limit: "10000" });
      const res = await fetch(`/api/newsletter?${params}`);
      const json = await res.json();
      if (!json.success) return;
      const rows = [[t("newsletter.email"), t("newsletter.segment"), t("newsletter.status"), t("newsletter.subscribeDate"), t("newsletter.unsubscribed")]];
      for (const sub of json.data.subscribers) {
        rows.push([sub.email, sub.segment.toUpperCase(), sub.isSubscribed ? t("newsletter.active") : t("newsletter.unsubscribed"), new Date(sub.subscribedAt).toLocaleDateString("sr-RS"), sub.unsubscribedAt ? new Date(sub.unsubscribedAt).toLocaleDateString("sr-RS") : ""]);
      }
      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pretplatnici.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export:", err);
    }
  };

  // ── Send from template ──

  const handleSendFromTemplate = async () => {
    if (!editingTemplate || !sendSubject.trim() || !editorBodyContent.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      // 1. Save template changes
      await fetch(`/api/newsletter/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateForm.name,
          subject: sendSubject,
          description: templateForm.description,
          htmlContent: editorBodyContent,
        }),
      });
      // 2. Create campaign from template
      const createRes = await fetch("/api/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${templateForm.name} — ${new Date().toLocaleDateString("sr-RS")}`,
          subject: sendSubject,
          content: editorBodyContent,
          segment: sendSegment,
          emailOptions,
        }),
      });
      const createJson = await createRes.json();
      if (!createJson.success) throw new Error("Failed to create campaign");
      // 3. Send it
      const sendRes = await fetch(`/api/newsletter/campaigns/${createJson.data.id}/send`, { method: "POST" });
      const sendJson = await sendRes.json();
      if (sendJson.success) {
        setSendResult({ ok: true, msg: `Email uspešno poslat na ${sendJson.data.sentCount || sendRecipientCount} primaoca!` });
        setShowSendConfirm(false);
      } else {
        setSendResult({ ok: false, msg: sendJson.error || "Greška pri slanju" });
      }
    } catch (err) {
      console.error("Send failed:", err);
      setSendResult({ ok: false, msg: "Greška pri slanju emaila" });
    } finally {
      setSending(false);
    }
  };

  const handleBodyBgUpload = async (file: File) => {
    setBodyBgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setEmailOptions({ ...emailOptions, bodyBgImage: json.data.url });
      } else {
        alert(json.error || "Otpremanje slike nije uspelo");
      }
    } catch {
      alert("Greška pri otpremanju slike");
    } finally {
      setBodyBgUploading(false);
      if (bodyBgFileInputRef.current) bodyBgFileInputRef.current.value = "";
    }
  };

  const handleSendInlineTest = async () => {
    if (!inlineTestEmail.trim() || !editorBodyContent.trim()) return;
    setInlineTestSending(true);
    setInlineTestResult(null);
    try {
      const res = await fetch("/api/newsletter/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inlineTestEmail.trim(),
          subject: sendSubject || templateForm.name || "Test",
          html: editorBodyContent,
          options: emailOptions,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInlineTestResult({ ok: true, msg: `Test email poslat na ${inlineTestEmail.trim()}` });
      } else {
        setInlineTestResult({ ok: false, msg: json.error || "Greška pri slanju" });
      }
    } catch {
      setInlineTestResult({ ok: false, msg: "Greška pri povezivanju sa serverom" });
    } finally {
      setInlineTestSending(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/newsletter/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: testEmail.trim() }) });
      const json = await res.json();
      if (json.success) setTestResult({ ok: true, msg: `Test email poslat na ${testEmail}` });
      else setTestResult({ ok: false, msg: json.error || "Greška pri slanju" });
    } catch {
      setTestResult({ ok: false, msg: "Greška pri povezivanju sa serverom" });
    } finally {
      setTestSending(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const tabs: { id: Tab; label: string }[] = [
    { id: "templates", label: "Šabloni" },
    { id: "campaigns", label: "Poslate kampanje" },
    { id: "subscribers", label: t("newsletter.subscribers") },
  ];

  // ── Template Editor View ──

  if (editingTemplate) {
    return (
      <div>
        {/* Header bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={closeTemplateEditor} className="p-2.5 hover:bg-stone-100 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-[#837A64]" />
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                className="font-serif text-xl lg:text-2xl font-bold text-black bg-transparent border-0 border-b border-transparent hover:border-stone-300 focus:border-[#837A64] focus:outline-none w-full pb-0.5 transition-colors"
                placeholder="Naziv šablona..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={closeTemplateEditor}
              className="px-5 py-2.5 text-sm font-medium text-[#837A64] hover:text-black hover:bg-stone-100 rounded-lg transition-colors"
            >
              Otkaži
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={templateSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#837A64] hover:bg-[#6a624f] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 shadow-sm"
            >
              {templateSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Sačuvaj
            </button>
          </div>
        </div>

        {/* Subject & description row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-[#837A64] uppercase tracking-wider mb-1">Predmet emaila (Subject)</label>
            <input
              type="text"
              value={templateForm.subject}
              onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none transition-colors"
              placeholder="Subject line za email..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#837A64] uppercase tracking-wider mb-1">Opis šablona (opciono)</label>
            <input
              type="text"
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none transition-colors"
              placeholder="Kratak opis..."
            />
          </div>
        </div>

        {/* Header & Footer settings */}
        <div className="mb-6">
          <button
            onClick={() => setShowEmailSettings(!showEmailSettings)}
            className="flex items-center gap-2 text-sm font-medium text-[#837A64] hover:text-black transition-colors"
          >
            <Settings2 size={16} />
            Podešavanja zaglavlja i podnožja
            <ChevronDown size={14} className={`transition-transform ${showEmailSettings ? "rotate-180" : ""}`} />
          </button>

          {showEmailSettings && (
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 bg-white border border-stone-200 rounded-lg">
              {/* Header settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#837A64] uppercase tracking-wider">Zaglavlje (Header)</h4>
                <div>
                  <label className="block text-xs text-[#837A64] mb-1">Naslov</label>
                  <input
                    type="text"
                    value={emailOptions.headerTitle || ""}
                    onChange={(e) => setEmailOptions({ ...emailOptions, headerTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none"
                    placeholder="ALTAMODA"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#837A64] mb-1">Podnaslov</label>
                  <input
                    type="text"
                    value={emailOptions.headerSubtitle || ""}
                    onChange={(e) => setEmailOptions({ ...emailOptions, headerSubtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none"
                    placeholder="Heritage"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#837A64] mb-1">Boja pozadine</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={emailOptions.headerBg || "#2e2e2e"}
                      onChange={(e) => setEmailOptions({ ...emailOptions, headerBg: e.target.value })}
                      className="w-9 h-9 rounded border border-stone-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={emailOptions.headerBg || "#2e2e2e"}
                      onChange={(e) => setEmailOptions({ ...emailOptions, headerBg: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-mono focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#837A64] mb-1">Logo slika (opciono — zamenjuje tekst)</label>
                  <input
                    type="text"
                    value={emailOptions.headerImage || ""}
                    onChange={(e) => setEmailOptions({ ...emailOptions, headerImage: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none"
                    placeholder="https://... URL logo slike"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#837A64] mb-1">Pozadinska slika zaglavlja (opciono)</label>
                  <input
                    type="text"
                    value={emailOptions.headerBgImage || ""}
                    onChange={(e) => setEmailOptions({ ...emailOptions, headerBgImage: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none"
                    placeholder="/hero.png ili https://... URL slike"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#837A64] mb-1">Pozadinska slika tela emaila (za Info šablon, opciono)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={emailOptions.bodyBgImage || ""}
                      onChange={(e) => setEmailOptions({ ...emailOptions, bodyBgImage: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none"
                      placeholder="https://... URL slike ili otpremi"
                    />
                    <input
                      ref={bodyBgFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBodyBgUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => bodyBgFileInputRef.current?.click()}
                      disabled={bodyBgUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#837A64] text-[#837A64] hover:bg-[#837A64] hover:text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {bodyBgUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      {bodyBgUploading ? "Otprema..." : "Otpremi sliku"}
                    </button>
                  </div>
                  {emailOptions.bodyBgImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={emailOptions.bodyBgImage}
                        alt="Pregled"
                        className="w-16 h-16 object-cover rounded border border-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => setEmailOptions({ ...emailOptions, bodyBgImage: "" })}
                        className="text-xs text-[#837A64] hover:text-red-600 underline"
                      >
                        Ukloni
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#837A64] uppercase tracking-wider">Podnožje (Footer)</h4>
                <div>
                  <label className="block text-xs text-[#837A64] mb-1">Tekst podnožja</label>
                  <input
                    type="text"
                    value={emailOptions.footerText || ""}
                    onChange={(e) => setEmailOptions({ ...emailOptions, footerText: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none"
                    placeholder="Altamoda Heritage"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#837A64] mb-1">Copyright</label>
                  <input
                    type="text"
                    value={emailOptions.footerCopyright || ""}
                    onChange={(e) => setEmailOptions({ ...emailOptions, footerCopyright: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none"
                    placeholder="© 2026 · Sva prava zadrzana"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Send section */}
        <div className="mb-6 p-4 bg-white border border-stone-200 rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-4">
              <label className="block text-xs font-medium text-[#837A64] uppercase tracking-wider mb-1">Predmet emaila (Subject)</label>
              <input
                type="text"
                value={sendSubject}
                onChange={(e) => setSendSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#2e2e2e] focus:ring-1 focus:ring-[#2e2e2e]/20 focus:outline-none transition-colors"
                placeholder="Subject line za email..."
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-[#837A64] uppercase tracking-wider mb-1">Publika</label>
              <select
                value={sendSegment}
                onChange={(e) => setSendSegment(e.target.value as "all" | "b2b" | "b2c")}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#2e2e2e] focus:ring-1 focus:ring-[#2e2e2e]/20 focus:outline-none transition-colors"
              >
                <option value="all">Svi pretplatnici</option>
                <option value="b2c">B2C — Krajnji kupci</option>
                <option value="b2b">B2B — Poslovni klijenti</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                <Users size={16} className="text-[#837A64]" />
                <span className="text-sm font-semibold text-[#2e2e2e]">{sendRecipientCount}</span>
                <span className="text-xs text-[#837A64]">prim.</span>
              </div>
            </div>
            <div className="lg:col-span-3">
              <button
                onClick={() => setShowSendConfirm(true)}
                disabled={sending || !sendSubject.trim() || !editorBodyContent.trim() || sendRecipientCount === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2e2e2e] hover:bg-black text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 shadow-sm"
              >
                <Send size={16} />
                Pošalji newsletter
              </button>
            </div>
          </div>
          {sendResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${sendResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {sendResult.msg}
            </div>
          )}

          {/* Inline test send — sends current template content to a single address */}
          <div className="mt-3 pt-3 border-t border-stone-200">
            <label className="block text-xs font-medium text-[#837A64] uppercase tracking-wider mb-1">
              Pošalji test verziju ovog šablona
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={inlineTestEmail}
                onChange={(e) => setInlineTestEmail(e.target.value)}
                placeholder="vasa.adresa@primer.com"
                className="flex-1 px-3.5 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:border-[#837A64] focus:ring-1 focus:ring-[#837A64]/20 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleSendInlineTest()}
              />
              <button
                onClick={handleSendInlineTest}
                disabled={inlineTestSending || !inlineTestEmail.trim() || !editorBodyContent.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#837A64] text-[#837A64] hover:bg-[#837A64] hover:text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {inlineTestSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {inlineTestSending ? "Slanje..." : "Pošalji test"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-[#837A64]">
              Šalje trenutni sadržaj šablona na navedenu adresu (sa prefiksom &quot;[TEST]&quot; u predmetu). Koristi se za proveru pre slanja svim pretplatnicima.
            </p>
            {inlineTestResult && (
              <div className={`mt-2 p-2.5 rounded-lg text-xs ${inlineTestResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {inlineTestResult.msg}
              </div>
            )}
          </div>
        </div>

        {/* Send Confirmation Modal */}
        {showSendConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSendConfirm(false)}>
            <div className="bg-white rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-stone-200">
                <h2 className="font-serif text-xl font-bold text-black">Potvrda slanja</h2>
                <button onClick={() => setShowSendConfirm(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-[#2e2e2e]">
                  Da li ste sigurni da želite da pošaljete <strong>&quot;{sendSubject}&quot;</strong> na{" "}
                  <strong>{sendRecipientCount}</strong>{" "}
                  {sendSegment === "all" ? "pretplatnika" : `${sendSegment.toUpperCase()} pretplatnika`}?
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-200">
                <button onClick={() => setShowSendConfirm(false)} className="px-5 py-2.5 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors">
                  Otkaži
                </button>
                <button
                  onClick={handleSendFromTemplate}
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2e2e2e] text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors disabled:opacity-40"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? "Slanje..." : "Potvrdi i pošalji"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editor + Preview side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: WYSIWYG Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[#837A64] uppercase tracking-wider">Editor</h3>
              <span className="text-[10px] text-[#837A64]">Pišite tekst, dodajte slike i formatirajte sadržaj</span>
            </div>
            <TiptapEditor
              content={editorBodyContent}
              onChange={setEditorBodyContent}
            />
          </div>

          {/* Right: Live Email Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[#837A64] uppercase tracking-wider">Pregled emaila</h3>
              <span className="text-[10px] font-semibold text-[#837A64] bg-[#837A64]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Uživo
              </span>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden sticky top-6">
              <div className="p-4 bg-stone-50/50">
                <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm mx-auto" style={{ maxWidth: 620 }}>
                  <iframe
                    srcDoc={emailPreviewHtml}
                    className="w-full border-0"
                    style={{ minHeight: 1000 }}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Page ──

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-black">{t("newsletter.title")}</h1>
          <p className="text-[#837A64] mt-1">{t("newsletter.subtitle")}</p>
        </div>
        <button
          onClick={() => { setShowTestModal(true); setTestResult(null); setTestEmail(""); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#837A64] hover:bg-[#6a624f] text-white text-sm font-medium rounded-sm transition-colors"
        >
          <Send className="w-4 h-4" /> Pošalji test email
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-sm p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white text-black shadow-sm" : "text-[#837A64] hover:text-[#2e2e2e]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Templates Tab ═══ */}
      {activeTab === "templates" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#837A64]">Upravljajte email šablonima za vaše newsletter kampanje.</p>
          </div>

          {templatesLoading || seeding ? (
            <div className="bg-white rounded-sm border border-stone-200 p-12 flex flex-col items-center justify-center">
              <Loader2 size={28} className="animate-spin text-[#837A64] mb-3" />
              <span className="text-[#837A64] text-sm">{seeding ? "Kreiranje podrazumevanih šablona..." : "Učitavanje šablona..."}</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-sm border border-stone-200 p-12 text-center">
              <FileText size={40} className="mx-auto text-[#837A64] mb-3" />
              <p className="text-[#837A64]">Nema šablona. Kliknite &quot;Novi šablon&quot; da kreirate prvi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="group bg-white border border-stone-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all duration-200"
                >
                  {/* Preview thumbnail */}
                  <div
                    className="relative h-52 bg-stone-50 border-b border-stone-100 overflow-hidden cursor-pointer"
                    onClick={() => openTemplateEditor(template)}
                  >
                    <iframe
                      srcDoc={generateEmailPreview(template.htmlContent, {
                        ...defaultEmailOptions,
                        ...templateDefaultOptions(template.name, template.htmlContent),
                      })}
                      className="w-[600px] h-[600px] border-0 pointer-events-none"
                      style={{ transform: "scale(0.38)", transformOrigin: "top left" }}
                      title={template.name}
                      sandbox="allow-same-origin"
                      tabIndex={-1}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30 pointer-events-none" />
                    {template.isDefault && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-[#837A64]/90 text-white text-[10px] font-semibold rounded-full uppercase tracking-wider backdrop-blur-sm">
                        Podrazumevani
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm text-[#2e2e2e] text-xs font-semibold px-4 py-2 rounded-full shadow-sm">
                        Uredi šablon
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-black text-sm mb-0.5">{template.name}</h3>
                    {template.description && (
                      <p className="text-xs text-[#837A64] mb-2.5 line-clamp-2">{template.description}</p>
                    )}
                    <p className="text-xs text-[#837A64] mb-3">
                      Poslednja izmena: {new Date(template.updatedAt).toLocaleDateString("sr-RS")}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openTemplateEditor(template)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#837A64] text-white rounded-lg text-xs font-semibold hover:bg-[#6a624f] transition-colors"
                      >
                        <Pencil size={13} /> Uredi
                      </button>
                      {!template.isDefault && (
                        <button
                          onClick={() => setShowDeleteConfirm(template)}
                          className="inline-flex items-center justify-center px-3 py-2 border border-stone-200 rounded-lg text-xs text-red-400 hover:border-red-300 hover:text-red-600 transition-colors"
                          title="Obriši"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Campaigns Tab ═══ */}
      {activeTab === "campaigns" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#837A64]">Pregled svih poslatih i tekućih newsletter kampanja.</p>
            <button
              onClick={fetchCampaigns}
              className="text-xs text-[#837A64] hover:text-black underline"
            >
              Osveži
            </button>
          </div>

          <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-100 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">Naslov</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">Predmet</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">Segment</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">Poslato</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignsLoading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[#837A64]">Učitavanje...</td></tr>
                  ) : campaigns.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[#837A64]">Još nema poslatih kampanja.</td></tr>
                  ) : (
                    campaigns.map((c) => {
                      const statusColor: Record<Campaign["status"], string> = {
                        draft: "bg-stone-100 text-stone-700",
                        scheduled: "bg-blue-100 text-blue-700",
                        sending: "bg-amber-100 text-amber-700",
                        sent: "bg-green-100 text-green-700",
                        failed: "bg-red-100 text-red-700",
                      };
                      const statusLabel: Record<Campaign["status"], string> = {
                        draft: "Skica",
                        scheduled: "Zakazano",
                        sending: "U toku",
                        sent: "Poslato",
                        failed: "Neuspelo",
                      };
                      return (
                        <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                          <td className="px-4 py-3 text-[#2e2e2e] font-medium">{c.title}</td>
                          <td className="px-4 py-3 text-[#837A64]">{c.subject}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs uppercase tracking-wider text-[#837A64]">{c.segment}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor[c.status]}`}>
                              {statusLabel[c.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#837A64]">{c.sentCount}</td>
                          <td className="px-4 py-3 text-[#837A64] text-xs">
                            {c.sentAt
                              ? new Date(c.sentAt).toLocaleString("sr-RS")
                              : new Date(c.createdAt).toLocaleString("sr-RS")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Subscribers Tab ═══ */}
      {activeTab === "subscribers" && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-sm border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#837A64] uppercase tracking-wider">{t("newsletter.totalActive")}</p>
                  <p className="text-2xl font-bold text-black mt-1">{stats.totalActive}</p>
                </div>
                <div className="w-10 h-10 rounded-sm bg-black/10 flex items-center justify-center">
                  <Users size={20} className="text-secondary" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-sm border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#837A64] uppercase tracking-wider">{t("newsletter.b2bSubscribers")}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.b2bCount}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">B2B</span>
              </div>
            </div>
            <div className="bg-white rounded-sm border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#837A64] uppercase tracking-wider">{t("newsletter.b2cSubscribers")}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.b2cCount}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">B2C</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-sm border border-stone-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#837A64]" />
                <input type="text" placeholder={t("newsletter.searchPlaceholder")} value={search} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none" />
              </div>
              <select value={segmentFilter} onChange={(e) => handleSegmentChange(e.target.value)} className="px-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none">
                <option value="all">{t("newsletter.allSegments")}</option>
                <option value="b2b">B2B</option>
                <option value="b2c">B2C</option>
              </select>
              <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-sm text-sm font-medium hover:bg-stone-100 transition-colors">
                <Download size={16} /> {t("newsletter.exportSubscribers")}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-100 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">{t("newsletter.email")}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">{t("newsletter.segment")}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">{t("newsletter.subscribeDate")}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">{t("newsletter.status")}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#837A64]">{t("newsletter.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[#837A64]">{t("newsletter.loading")}</td></tr>
                  ) : subscribers.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[#837A64]">{t("newsletter.noSubscribers")}</td></tr>
                  ) : (
                    subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-stone-100 hover:bg-stone-100 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-secondary" />
                            <span className="text-[#2e2e2e]">{sub.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.segment === "b2b" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {sub.segment.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#837A64]">{new Date(sub.subscribedAt).toLocaleDateString("sr-RS")}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.isSubscribed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {sub.isSubscribed ? t("newsletter.active") : t("newsletter.unsubscribed")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteSubscriber(sub.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors" title={t("newsletter.delete")}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200">
                <span className="text-sm text-[#837A64]">{t("newsletter.pageOf")} {page} {t("newsletter.of")} {totalPages} ({total} {t("newsletter.totalLabel")})</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-stone-200 rounded-sm hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 border border-stone-200 rounded-sm hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Modals ═══ */}

      {/* New Template Modal */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewTemplateModal(false)}>
          <div className="bg-white rounded-sm w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="font-serif text-xl font-bold text-black">Novi šablon</h2>
              <button onClick={() => setShowNewTemplateModal(false)} className="p-1 hover:bg-stone-100 rounded-sm"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2e2e2e] mb-1">Naziv šablona</label>
                <input type="text" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} className="w-full px-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none" placeholder="npr. Letnja Akcija" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2e2e2e] mb-1">Subject (predmet emaila)</label>
                <input type="text" value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} className="w-full px-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none" placeholder="Subject line za email..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2e2e2e] mb-1">Opis (opciono)</label>
                <input type="text" value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} className="w-full px-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none" placeholder="Kratak opis šablona..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-200">
              <button onClick={() => setShowNewTemplateModal(false)} className="px-5 py-2.5 border border-stone-200 rounded-sm text-sm font-medium hover:bg-stone-100 transition-colors">Otkaži</button>
              <button onClick={handleCreateTemplate} disabled={!templateForm.name.trim() || !templateForm.subject.trim() || templateSaving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-sm text-sm font-medium hover:bg-[#837A64] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {templateSaving && <Loader2 size={16} className="animate-spin" />}
                Kreiraj šablon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-sm w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="font-serif text-xl font-bold text-black">Brisanje šablona</h2>
              <button onClick={() => setShowDeleteConfirm(null)} className="p-1 hover:bg-stone-100 rounded-sm"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#2e2e2e]">Da li ste sigurni da želite da obrišete šablon &quot;{showDeleteConfirm.name}&quot;? Ova akcija se ne može poništiti.</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-200">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-5 py-2.5 border border-stone-200 rounded-sm text-sm font-medium hover:bg-stone-100 transition-colors">Otkaži</button>
              <button onClick={() => handleDeleteTemplate(showDeleteConfirm)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-sm text-sm font-medium hover:bg-red-700 transition-colors">
                <Trash2 size={16} /> Obriši
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTestModal(false)}>
          <div className="bg-white rounded-sm max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Pošalji test email</h3>
              <button onClick={() => setShowTestModal(false)} className="text-[#837A64] hover:text-black"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-[#837A64] mb-4">Unesite email adresu na koju želite da pošaljete probni newsletter email.</p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="vasa@email.com"
              className="w-full border border-stone-200 rounded-sm px-4 py-2.5 text-sm focus:border-black focus:outline-none mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
            />
            {testResult && (
              <div className={`p-3 rounded-sm text-sm mb-4 ${testResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {testResult.msg}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowTestModal(false)} className="flex-1 px-4 py-2.5 border border-stone-200 text-[#837A64] rounded-sm text-sm font-medium hover:bg-stone-50 transition-colors">Otkaži</button>
              <button onClick={handleSendTest} disabled={testSending || !testEmail.trim()} className="flex-1 px-4 py-2.5 bg-[#837A64] hover:bg-[#6a624f] text-white rounded-sm text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {testSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Slanje...</> : <><Send className="w-4 h-4" /> Pošalji</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
