"use client";export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ClientPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [tab, setTab] = useState("catalog");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, approved")
        .eq("id", data.session.user.id)
        .single();
      if (!profile || profile.role !== "client" || !profile.approved) {
        router.push("/");
        return;
      }
      setUserId(data.session.user.id);
      setReady(true);
    })();
    // eslint-disable-next-line
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-brand-700">تجارتي</h1>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">
            تسجيل خروج
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-2">
          <button
            onClick={() => setTab("catalog")}
            className={`px-4 py-1.5 rounded-full text-sm ${
              tab === "catalog" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            الكتالوج
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`px-4 py-1.5 rounded-full text-sm ${
              tab === "orders" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            طلباتي وفواتيري
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-5">
        {tab === "catalog" && <CatalogTab userId={userId} />}
        {tab === "orders" && <MyOrdersTab userId={userId} />}
      </main>
    </div>
  );
}

function CatalogTab({ userId }) {
  const [products, setProducts] = useState([]);
  const [priceMap, setPriceMap] = useState({});
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (userId) load();
    // eslint-disable-next-line
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data: p } = await supabase.from("products").select("*").eq("active", true).order("name");
    const { data: cp } = await supabase.from("client_prices").select("*").eq("client_id", userId);
    const map = {};
    (cp || []).forEach((row) => {
      map[row.product_id] = row.price;
    });
    setPriceMap(map);
    setProducts(p || []);
    setLoading(false);
  }

  function priceFor(p) {
    return priceMap[p.id] ?? p.base_price;
  }

  function setQty(productId, qty) {
    setCart({ ...cart, [productId]: qty });
  }

  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0);
  const total = cartItems.reduce((sum, [pid, qty]) => {
    const p = products.find((x) => x.id === pid);
    return sum + (p ? priceFor(p) * qty : 0);
  }, 0);

  async function submitOrder() {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({ client_id: userId, total, status: "pending" })
      .select()
      .single();

    if (error) {
      setMsg("صار خطأ، حاول مرة ثانية");
      setSubmitting(false);
      return;
    }

    const items = cartItems.map(([pid, qty]) => {
      const p = products.find((x) => x.id === pid);
      const unitPrice = priceFor(p);
      return {
        order_id: order.id,
        product_id: pid,
        product_name: p.name,
        quantity: qty,
        unit_price: unitPrice,
        subtotal: unitPrice * qty,
      };
    });
    await supabase.from("order_items").insert(items);

    setCart({});
    setMsg("تم إرسال طلبك بنجاح ✅");
    setSubmitting(false);
    setTimeout(() => setMsg(""), 4000);
  }

  if (loading) return <p className="text-gray-400 text-sm">جاري التحميل...</p>;

  return (
    <div className="space-y-3 pb-24">
      {msg && (
        <div className="bg-brand-50 text-brand-700 text-sm rounded-lg p-3 text-center">{msg}</div>
      )}
      {products.length === 0 && <p className="text-gray-400 text-sm">لا يوجد منتجات متاحة حالياً</p>}
      {products.map((p) => (
        <div key={p.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{p.name}</p>
            <p className="text-xs text-gray-500">
              {priceFor(p)} / {p.unit} · متوفر: {p.stock_quantity}
            </p>
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={cart[p.id] || ""}
            onChange={(e) => setQty(p.id, parseFloat(e.target.value) || 0)}
            className="w-20 border rounded-lg px-2 py-1.5 text-sm text-center"
          />
        </div>
      ))}

      {cartItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)] p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{cartItems.length} صنف</p>
              <p className="font-bold">{total.toFixed(2)}</p>
            </div>
            <button
              onClick={submitOrder}
              disabled={submitting}
              className="bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MyOrdersTab({ userId }) {
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) load();
    // eslint-disable-next-line
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data: o } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });
    const { data: inv } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });
    setOrders(o || []);
    setInvoices(inv || []);
    setLoading(false);
  }

  const statusLabel = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    delivered: "تم التسليم",
    cancelled: "ملغي",
  };
  const statusColor = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  if (loading) return <p className="text-gray-400 text-sm">جاري التحميل...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-sm mb-2">طلباتي</h2>
        <div className="space-y-2">
          {orders.length === 0 && <p className="text-gray-400 text-sm">لا يوجد طلبات بعد</p>}
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-xl shadow-sm p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">
                  {new Date(o.created_at).toLocaleDateString("ar")}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[o.status]}`}>
                  {statusLabel[o.status]}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-0.5">
                {o.order_items?.map((it) => (
                  <p key={it.id}>
                    {it.product_name} × {it.quantity}
                  </p>
                ))}
              </div>
              <p className="text-sm font-bold mt-1">الإجمالي: {o.total}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-bold text-sm mb-2">فواتيري</h2>
        <div className="space-y-2">
          {invoices.length === 0 && <p className="text-gray-400 text-sm">لا يوجد فواتير بعد</p>}
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {new Date(inv.created_at).toLocaleDateString("ar")}
              </p>
              <p className="text-sm font-bold">{inv.amount}</p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  inv.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {inv.paid ? "مدفوعة" : "غير مدفوعة"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
