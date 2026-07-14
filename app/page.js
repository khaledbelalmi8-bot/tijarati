"use client";export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await redirectByRole(data.session.user.id);
    } else {
      setLoading(false);
    }
  }

  async function redirectByRole(userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, approved")
      .eq("id", userId)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }
    if (profile.role === "admin") {
      router.push("/admin");
    } else if (profile.approved) {
      router.push("/client");
    } else {
      setInfo("حسابك بانتظار موافقة الإدارة. تواصل مع التاجر لتفعيل حسابك.");
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setChecking(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("بيانات الدخول غير صحيحة");
      setChecking(false);
      return;
    }
    await redirectByRole(data.user.id);
    setChecking(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setChecking(true);
    if (!fullName || !phone) {
      setError("الرجاء تعبئة الاسم ورقم الهاتف");
      setChecking(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone },
      },
    });
    if (error) {
      setError(error.message);
      setChecking(false);
      return;
    }
    setInfo(
      "تم إنشاء حسابك بنجاح! بانتظار موافقة الإدارة قبل ما تقدر تطلب."
    );
    setChecking(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-brand-700 text-center mb-1">
          تجارتي
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          منصة إدارة تجارة الجملة
        </p>

        {info && (
          <div className="bg-brand-50 text-brand-700 text-sm rounded-lg p-3 mb-4 text-center">
            {info}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4 text-center">
            {error}
          </div>
        )}

        <div className="flex mb-5 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              mode === "login" ? "bg-white shadow text-brand-700" : "text-gray-500"
            }`}
            onClick={() => {
              setMode("login");
              setError("");
              setInfo("");
            }}
          >
            تسجيل الدخول
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              mode === "signup" ? "bg-white shadow text-brand-700" : "text-gray-500"
            }`}
            onClick={() => {
              setMode("signup");
              setError("");
              setInfo("");
            }}
          >
            حساب زبون جديد
          </button>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-3">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="الاسم الكامل"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
              <input
                type="tel"
                placeholder="رقم الهاتف"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={checking}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60"
          >
            {checking ? "جاري..." : mode === "login" ? "دخول" : "إنشاء حساب"}
          </button>
        </form>
      </div>
    </div>
  );
}
