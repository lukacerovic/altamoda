"use client";

import { useState } from "react";
import {
  User, Eye, EyeOff, Mail, Lock, Building2,
} from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [registerType, setRegisterType] = useState<"b2c" | "b2b">("b2c");

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <div className="max-w-lg mx-auto px-4 py-12 md:py-20">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button onClick={() => setActiveTab("login")} className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === "login" ? "text-[#8c4a5a] border-b-2 border-[#8c4a5a]" : "text-gray-400 hover:text-gray-600"}`}>Prijava</button>
            <button onClick={() => setActiveTab("register")} className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === "register" ? "text-[#8c4a5a] border-b-2 border-[#8c4a5a]" : "text-gray-400 hover:text-gray-600"}`}>Registracija</button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === "login" ? (
              /* LOGIN FORM */
              <div>
                <h2 className="text-2xl font-bold text-[#2d2d2d] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Dobrodosli nazad</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email adresa</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" placeholder="vas@email.com" className="w-full border border-gray-200 rounded pl-10 pr-4 py-3 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lozinka</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword ? "text" : "password"} placeholder="Unesite lozinku" className="w-full border border-gray-200 rounded pl-10 pr-10 py-3 text-sm" />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#8c4a5a] focus:ring-[#8c4a5a]" /> Zapamti me
                    </label>
                    <a href="#" className="text-sm text-[#8c4a5a] hover:text-[#6e3848]">Zaboravili ste lozinku?</a>
                  </div>
                  <button className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded font-medium transition-colors">Prijavite se</button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">ili se prijavite putem</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Social login */}
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                </div>
              </div>
            ) : (
              /* REGISTER FORM */
              <div>
                <h2 className="text-2xl font-bold text-[#2d2d2d] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Kreirajte nalog</h2>

                {/* B2C / B2B toggle */}
                <div className="flex gap-2 mb-6">
                  <button onClick={() => setRegisterType("b2c")} className={`flex-1 py-2.5 rounded text-sm font-medium transition-colors ${registerType === "b2c" ? "bg-[#8c4a5a] text-white" : "border border-gray-200 text-gray-600 hover:border-[#8c4a5a]"}`}>
                    <User className="w-4 h-4 inline mr-1" /> Kupac
                  </button>
                  <button onClick={() => setRegisterType("b2b")} className={`flex-1 py-2.5 rounded text-sm font-medium transition-colors ${registerType === "b2b" ? "bg-[#8c4a5a] text-white" : "border border-gray-200 text-gray-600 hover:border-[#8c4a5a]"}`}>
                    <Building2 className="w-4 h-4 inline mr-1" /> Salon / B2B
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Ime</label>
                      <input type="text" placeholder="Vase ime" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Prezime</label>
                      <input type="text" placeholder="Vase prezime" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email adresa</label>
                    <input type="email" placeholder="vas@email.com" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                    <input type="tel" placeholder="+381 6x xxx xxxx" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                  </div>

                  {registerType === "b2b" && (
                    <>
                      <div className="border-t border-gray-100 pt-4">
                        <h3 className="text-sm font-semibold text-[#2d2d2d] mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-[#8c4a5a]" /> Podaci o salonu</h3>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Naziv salona</label>
                        <input type="text" placeholder="Naziv vaseg salona" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">PIB</label>
                        <input type="text" placeholder="Poreski identifikacioni broj" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Maticni broj</label>
                        <input type="text" placeholder="Maticni broj firme" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresa salona</label>
                        <input type="text" placeholder="Ulica i broj, grad" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lozinka</label>
                    <input type="password" placeholder="Minimum 8 karaktera" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Potvrdite lozinku</label>
                    <input type="password" placeholder="Ponovite lozinku" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                  </div>

                  <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#8c4a5a] focus:ring-[#8c4a5a] mt-0.5" />
                    <span>Slazem se sa <a href="#" className="text-[#8c4a5a] hover:underline">uslovima koriscenja</a> i <a href="#" className="text-[#8c4a5a] hover:underline">politikom privatnosti</a></span>
                  </label>

                  <button className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded font-medium transition-colors">
                    {registerType === "b2b" ? "Posaljite zahtev za B2B nalog" : "Registrujte se"}
                  </button>

                  {registerType === "b2b" && (
                    <p className="text-xs text-gray-400 text-center">Vas B2B zahtev ce biti pregledan u roku od 24h. Bice vam dodeljen licni menadzer.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
