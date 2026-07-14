"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("products");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .single();
      if (!profile || profile.role !== "admin") {
        router.push("/");
        return;
      }
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

  const tabs = [
    { key: "products", label: "المنتجات" },
    { key: "clients", label: "الزبائن" },
    { key: "orders", label: "الطلبات" },
    { key: "invoices", label: "الفواتير" },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-brand-700">لوحة الإدارة</h1>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">
            تسجيل خروج
          </button>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                tab === t.key
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-5">
        {tab === "products" && <ProductsTab />}
        {tab === "clients" && <ClientsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "invoices" && <InvoicesTab />}
      </main>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", unit: "قطعة", base_price: "", stock_quantity: "" });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  async function save(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      unit: form.unit,
      base_price: parseFloat(form.base_price) || 0,
      stock_quantity: parseFloat(form.stock_quantity) || 0,
    };
    if (editingId) {
      await supabase.from("products").update(payload).eq("id", editingId);
    } else {
      await supabase.from("products").insert(payload);
    }
    setForm({ name: "", description: "", unit: "قطعة", base_price: "", stock_quantity: "" });
    setEditingId(null);
    load();
  }

  function edit(p) {
    setForm({
      name: p.name,
      description: p.description || "",
      unit: p.unit,
      base_price: p.base_price,
      stock_quantity: p.stock_quantity,
    });
    setEditingId(p.id);
  }

  async function toggleActive(p) {
    await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    load();
  }

  async function remove(id) {
    if (!confirm("متأكد تبي تحذف هذا المنتج؟")) return;
    await supabase.from("products").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-2 gap-3">
        <input
          className="col-span-2 border rounded-lg px-3 py-2 text-sm"
          placeholder="اسم المنتج"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="col-span-2 border rounded-lg px-3 py-2 text-sm"
          placeholder="وصف (اختياري)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="الوحدة (قطعة، كرتون...)"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
        />
        <input
          type="number"
          step="0.01"
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="السعر الأساسي"
          value={form.base_price}
          onChange={(e) => setForm({ ...form, base_price: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.01"
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="الكمية بالمخزون"
          value={form.stock_quantity}
          onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
          required
        />
        <button className="bg-brand-600 text-white rounded-lg py-2 text-sm font-medium">
          {editingId ? "حفظ التعديل" : "إضافة منتج"}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400 text-sm">جاري التحميل...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {products.length === 0 && (
            <p className="p-4 text-gray-400 text-sm">لا يوجد منتجات بعد</p>
          )}
          {products.map((p) => (
            <div key={p.id} className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {p.base_price} / {p.unit} · مخزون: {p.stock_quantity}
                  {!p.active && <span className="text-red-500"> · موقف</span>}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => edit(p)} className="text-xs text-brand-600">
                  تعديل
                </button>
                <button onClick={() => toggleActive(p)} className="text-xs text-gray-500">
                  {p.active ? "إيقاف" : "تفعيل"}
                </button>
                <button onClick={() => remove(p.id)} className="text-xs text-red-500">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientsTab() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [prices, setPrices] = useState({});
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: c } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("created_at", { ascending: false });
    const { data: p } = await supabase.from("products").select("*").eq("active", true);
    setClients(c || []);
    setProducts(p || []);
    setLoading(false);
  }

  async function approve(id) {
    await supabase.from("profiles").update({ approved: true }).eq("id", id);
    load();
  }

  async function openPrices(clientId) {
    if (openId === clientId) {
      setOpenId(null);
      return;
    }
    const { data } = await supabase
      .from("client_prices")
      .select("*")
      .eq("client_id", clientId);
    const map = {};
    (data || []).forEach((row) => {
      map[row.product_id] = row.price;
    });
    setPrices(map);
    setOpenId(clientId);
  }

  async function savePrice(clientId, productId, value) {
    const price = parseFloat(value);
    if (!price || price <= 0) return;
    await supabase
      .from("client_prices")
      .upsert({ client_id: clientId, product_id: productId, price }, { onConflict: "client_id,product_id" });
    setPrices({ ...prices, [productId]: price });
  }

  if (loading) return <p className="text-gray-400 text-sm">جاري التحميل...</p>;

  return (
    <div className="space-y-3">
      {clients.length === 0 && (
        <p className="text-gray-400 text-sm">لا يوجد زبائن مسجلين بعد</p>
      )}
      {clients.map((c) => (
        <div key={c.id} className="bg-white rounded-xl shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{c.full_name}</p>
              <p className="text-xs text-gray-500">{c.phone}</p>
            </div>
            <div className="flex gap-2 items-center">
              {!c.approved && (
                <button
                  onClick={() => approve(c.id)}
                  className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full"
                >
                  موافقة
                </button>
              )}
              {c.approved && (
                <span className="text-xs text-brand-600">مفعّل</span>
              )}
              <button
                onClick={() => openPrices(c.id)}
                className="text-xs text-gray-500 underline"
              >
                أسعار خاصة
              </button>
            </div>
          </div>
          {openId === c.id && (
            <div className="mt-3 border-t pt-3 space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {p.name} <span className="text-xs text-gray-400">(أساسي: {p.base_price})</span>
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={prices[p.id] || ""}
                    placeholder="سعر خاص"
                    onBlur={(e) => savePrice(c.id, p.id, e.target.value)}
                    className="w-28 border rounded-lg px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(full_name, phone), order_items(*)")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function updateStatus(order, status) {
    await supabase.from("orders").update({ status }).eq("id", order.id);
    if (status === "delivered") {
      const { data: existing } = await supabase
        .from("invoices")
        .select("id")
        .eq("order_id", order.id)
        .maybeSingle();
      if (!existing) {
        await supabase.from("invoices").insert({
          order_id: order.id,
          client_id: order.client_id,
          amount: order.total,
        });
      }
    }
    load();
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
    <div className="space-y-3">
      {orders.length === 0 && <p className="text-gray-400 text-sm">لا يوجد طلبات بعد</p>}
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-xl shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-sm">{o.profiles?.full_name}</p>
              <p className="text-xs text-gray-500">{o.profiles?.phone}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColor[o.status]}`}>
              {statusLabel[o.status]}
            </span>
          </div>
          <div className="text-xs text-gray-600 space-y-0.5 mb-2">
            {o.order_items?.map((it) => (
              <p key={it.id}>
                {it.product_name} × {it.quantity} = {it.subtotal}
              </p>
            ))}
          </div>
          <p className="text-sm font-bold mb-2">الإجمالي: {o.total}</p>
          <div className="flex gap-2 flex-wrap">
            {o.status === "pending" && (
              <button
                onClick={() => updateStatus(o, "confirmed")}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full"
              >
                تأكيد
              </button>
            )}
            {(o.status === "pending" || o.status === "confirmed") && (
              <button
                onClick={() => updateStatus(o, "delivered")}
                className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full"
              >
                تم التسليم
              </button>
            )}
            {o.status !== "cancelled" && o.status !== "delivered" && (
              <button
                onClick={() => updateStatus(o, "cancelled")}
                className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function InvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("*, profiles(full_name, phone)")
      .order("created_at", { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  }

  async function markPaid(id) {
    await supabase.from("invoices").update({ paid: true, paid_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  if (loading) return <p className="text-gray-400 text-sm">جاري التحميل...</p>;

  return (
    <div className="space-y-3">
      {invoices.length === 0 && <p className="text-gray-400 text-sm">لا يوجد فواتير بعد</p>}
      {invoices.map((inv) => (
        <div key={inv.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{inv.profiles?.full_name}</p>
            <p className="text-xs text-gray-500">{inv.amount} · {new Date(inv.created_at).toLocaleDateString("ar")}</p>
          </div>
          {inv.paid ? (
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">مدفوعة</span>
          ) : (
            <button
              onClick={() => markPaid(inv.id)}
              className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full"
            >
              تحديد كمدفوعة
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
