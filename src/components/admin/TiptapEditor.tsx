"use client";

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { useRef, useCallback, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Undo, Redo, Heading1, Heading2, Heading3,
  Minus, Upload, ImageIcon, Loader2, Trash2,
} from "lucide-react";

// ── Resizable Image NodeView ──

function ResizableImageView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const onResize = useCallback(
    (e: React.MouseEvent, fromLeft: boolean) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startWidth = containerRef.current?.offsetWidth || 300;

      const onMove = (ev: MouseEvent) => {
        const diff = ev.clientX - startX;
        const newWidth = Math.max(60, startWidth + (fromLeft ? -diff : diff));
        updateAttributes({ width: `${newWidth}px` });
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [updateAttributes]
  );

  const align = (node.attrs.dataAlign as string) || "center";
  const marginClass =
    align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto";

  return (
    <NodeViewWrapper className="my-4" data-drag-handle>
      <div
        ref={containerRef}
        className={`relative group block ${marginClass}`}
        style={{ width: node.attrs.width || "100%", maxWidth: "100%" }}
      >
        {/* Image */}
        <img
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) || ""}
          className="w-full block rounded-md"
          draggable={false}
        />

        {/* Selected overlay + handles */}
        {selected && (
          <>
            {/* Border */}
            <div className="absolute inset-0 rounded-md ring-2 ring-[#2e2e2e] ring-offset-2 pointer-events-none" />

            {/* Corner resize handles */}
            {(
              [
                { pos: "tl", top: -5, left: -5, cursor: "nwse-resize", fromLeft: true },
                { pos: "tr", top: -5, right: -5, cursor: "nesw-resize", fromLeft: false },
                { pos: "bl", bottom: -5, left: -5, cursor: "nesw-resize", fromLeft: true },
                { pos: "br", bottom: -5, right: -5, cursor: "nwse-resize", fromLeft: false },
              ] as const
            ).map((h) => (
              <div
                key={h.pos}
                onMouseDown={(e) => onResize(e, h.fromLeft)}
                className="absolute w-3 h-3 bg-white border-2 border-[#2e2e2e] rounded-full z-10 hover:scale-125 transition-transform"
                style={{
                  cursor: h.cursor,
                  top: "top" in h ? h.top : undefined,
                  bottom: "bottom" in h ? h.bottom : undefined,
                  left: "left" in h ? h.left : undefined,
                  right: "right" in h ? h.right : undefined,
                }}
              />
            ))}

            {/* Right-edge resize bar */}
            <div
              onMouseDown={(e) => onResize(e, false)}
              className="absolute top-1/2 -right-2 -translate-y-1/2 w-1.5 h-10 bg-[#2e2e2e] rounded-full cursor-ew-resize z-10 opacity-60 hover:opacity-100 transition-opacity"
            />

            {/* Floating toolbar below image */}
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-0.5 bg-[#2e2e2e] text-white rounded-lg shadow-xl px-1.5 py-1 z-20">
              <ImgToolBtn onClick={() => updateAttributes({ dataAlign: "left" })} active={align === "left"} title="Levo">
                <AlignLeft size={15} />
              </ImgToolBtn>
              <ImgToolBtn onClick={() => updateAttributes({ dataAlign: "center" })} active={align === "center"} title="Centar">
                <AlignCenter size={15} />
              </ImgToolBtn>
              <ImgToolBtn onClick={() => updateAttributes({ dataAlign: "right" })} active={align === "right"} title="Desno">
                <AlignRight size={15} />
              </ImgToolBtn>

              <div className="w-px h-5 bg-white/20 mx-0.5" />

              <ImgToolBtn onClick={() => updateAttributes({ width: "50%" })} active={node.attrs.width === "50%"} title="50%">
                <span className="text-[11px] font-bold">50</span>
              </ImgToolBtn>
              <ImgToolBtn onClick={() => updateAttributes({ width: "75%" })} active={node.attrs.width === "75%"} title="75%">
                <span className="text-[11px] font-bold">75</span>
              </ImgToolBtn>
              <ImgToolBtn onClick={() => updateAttributes({ width: "100%" })} active={!node.attrs.width || node.attrs.width === "100%"} title="100%">
                <span className="text-[11px] font-bold">100</span>
              </ImgToolBtn>

              <div className="w-px h-5 bg-white/20 mx-0.5" />

              <ImgToolBtn onClick={() => deleteNode()} title="Obriši">
                <Trash2 size={15} className="text-red-400" />
              </ImgToolBtn>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

function ImgToolBtn({ onClick, active, children, title }: {
  onClick: () => void; active?: boolean; children: React.ReactNode; title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${active ? "bg-white/20" : "hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

// ── Custom Image Extension with resize NodeView ──

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.width || el.getAttribute("width") || null,
        renderHTML: (attrs: Record<string, string>) => {
          if (!attrs.width) return {};
          return { style: `width: ${attrs.width}` };
        },
      },
      dataAlign: {
        default: "center",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-align") || "center",
        renderHTML: (attrs: Record<string, string>) => ({ "data-align": attrs.dataAlign || "center" }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

// ── Main Editor Props ──

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: [
          "prose prose-stone prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6",
          "[&_h1]:text-[#2e2e2e] [&_h1]:font-serif [&_h1]:text-3xl [&_h1]:tracking-wide",
          "[&_h2]:text-[#2e2e2e] [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:tracking-wide",
          "[&_h3]:text-[#2e2e2e] [&_h3]:font-serif",
          "[&_p]:text-[#2e2e2e] [&_p]:leading-relaxed",
          "[&_a]:text-[#293133]/65 [&_a]:underline",
          "[&_hr]:border-[#D8CFBC]",
        ].join(" "),
      },
      handleDrop: (_view, event) => {
        if (event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImage(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) uploadImage(file);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        const url = json.data?.url || json.url;
        if (url) editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        console.error("Image upload failed:", err);
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { uploadImage(file); e.target.value = ""; }
  };

  const [linkModal, setLinkModal] = useState<{ open: boolean; url: string; text: string }>({
    open: false, url: "", text: "",
  });

  const openLinkModal = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    const existingAttrs = editor.getAttributes("link") as { href?: string };
    setLinkModal({
      open: true,
      url: existingAttrs.href || "",
      text: selectedText,
    });
  };

  const applyLink = () => {
    if (!editor) return;
    const { url, text } = linkModal;
    const trimmed = url.trim();
    if (!trimmed) { setLinkModal((s) => ({ ...s, open: false })); return; }
    const href = /^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const { from, to } = editor.state.selection;
    if (from === to && text.trim()) {
      // No selection + custom text: insert the text and link it
      editor.chain().focus().insertContent({ type: "text", text, marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkModal({ open: false, url: "", text: "" });
  };

  const removeLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkModal({ open: false, url: "", text: "" });
  };

  if (!editor) return null;

  const Btn = ({ onClick, isActive = false, children, title, disabled = false }: {
    onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string; disabled?: boolean;
  }) => (
    <button
      type="button" onClick={onClick} title={title} disabled={disabled}
      className={`p-2 rounded-md transition-colors ${
        isActive ? "bg-[#2e2e2e] text-white shadow-sm"
        : disabled ? "text-stone-300 cursor-not-allowed"
        : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
      }`}
    >{children}</button>
  );

  const Sep = () => <div className="w-px h-6 bg-stone-200 mx-0.5" />;

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden bg-white flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-stone-200 bg-stone-50/80 sticky top-0 z-10">
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="Naslov 1"><Heading1 size={18} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="Naslov 2"><Heading2 size={18} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="Naslov 3"><Heading3 size={18} /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Podebljano"><Bold size={18} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Kurziv"><Italic size={18} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Podvučeno"><UnderlineIcon size={18} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Precrtano"><Strikethrough size={18} /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Levo"><AlignLeft size={18} /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Centar"><AlignCenter size={18} /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Desno"><AlignRight size={18} /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Lista"><List size={18} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Numerisana lista"><ListOrdered size={18} /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linija"><Minus size={18} /></Btn>
        <Btn onClick={openLinkModal} isActive={editor.isActive("link")} title="Dodaj link"><LinkIcon size={18} /></Btn>
        <Btn onClick={() => fileInputRef.current?.click()} title="Dodaj sliku" disabled={uploading}>
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        </Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Poništi" disabled={!editor.can().undo()}><Undo size={18} /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Ponovi" disabled={!editor.can().redo()}><Redo size={18} /></Btn>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} className="hidden" />

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/50">
        <p className="text-[11px] text-stone-400 flex items-center gap-1.5">
          <ImageIcon size={12} />
          Prevucite sliku ili kliknite <Upload size={10} /> · Kliknite sliku za promenu veličine i pozicije
        </p>
      </div>

      {linkModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tiptap-link-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setLinkModal((s) => ({ ...s, open: false }))}
          />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-xl border border-stone-200">
            <div className="px-5 py-4 border-b border-stone-200">
              <h3 id="tiptap-link-modal-title" className="text-base font-semibold text-stone-900">Dodaj link</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="tiptap-link-url" className="block text-xs font-medium text-stone-600 mb-1.5">URL</label>
                <input
                  id="tiptap-link-url"
                  type="url"
                  value={linkModal.url}
                  onChange={(e) => setLinkModal((s) => ({ ...s, url: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
                  placeholder="https://example.com"
                  autoFocus
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
                />
              </div>
              {editor.state.selection.empty && (
                <div>
                  <label htmlFor="tiptap-link-text" className="block text-xs font-medium text-stone-600 mb-1.5">Tekst (opciono)</label>
                  <input
                    id="tiptap-link-text"
                    type="text"
                    value={linkModal.text}
                    onChange={(e) => setLinkModal((s) => ({ ...s, text: e.target.value }))}
                    placeholder="Tekst koji će biti prikazan"
                    className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
                  />
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-stone-200 flex items-center justify-between bg-stone-50/60">
              {editor.isActive("link") ? (
                <button type="button" onClick={removeLink} className="text-xs text-red-600 hover:text-red-700 font-medium">
                  Ukloni link
                </button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModal((s) => ({ ...s, open: false }))}
                  className="px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-md"
                >
                  Otkaži
                </button>
                <button
                  type="button"
                  onClick={applyLink}
                  disabled={!linkModal.url.trim()}
                  className="px-4 py-2 text-sm bg-[#2e2e2e] text-white rounded-md hover:bg-[#2b2c24] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sačuvaj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
