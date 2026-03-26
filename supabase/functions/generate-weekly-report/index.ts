import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Determine week range (Monday to Sunday of last week, or accept custom)
    let weekStart: Date;
    let weekEnd: Date;

    try {
      const body = await req.json();
      if (body?.week_start && body?.week_end) {
        weekStart = new Date(body.week_start);
        weekEnd = new Date(body.week_end);
      } else {
        throw new Error("use default");
      }
    } catch {
      // Default: last completed week (Mon-Sun)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun
      const lastSunday = new Date(now);
      lastSunday.setDate(now.getDate() - (dayOfWeek === 0 ? 7 : dayOfWeek));
      lastSunday.setHours(23, 59, 59, 999);

      const lastMonday = new Date(lastSunday);
      lastMonday.setDate(lastSunday.getDate() - 6);
      lastMonday.setHours(0, 0, 0, 0);

      weekStart = lastMonday;
      weekEnd = lastSunday;
    }

    const fromISO = weekStart.toISOString();
    const toISO = weekEnd.toISOString();
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    // Previous week for comparison
    const prevStart = new Date(weekStart);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevEnd = new Date(weekEnd);
    prevEnd.setDate(prevEnd.getDate() - 7);
    const prevFromISO = prevStart.toISOString();
    const prevToISO = prevEnd.toISOString();

    // Fetch current week data
    const [paymentsRes, ordersRes, prevPaymentsRes, prevOrdersRes, orderItemsRes] =
      await Promise.all([
        supabase.from("payments").select("amount, method, created_at").gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("orders").select("id, total, status, created_at, guests").gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("payments").select("amount").gte("created_at", prevFromISO).lte("created_at", prevToISO),
        supabase.from("orders").select("id, total").gte("created_at", prevFromISO).lte("created_at", prevToISO),
        supabase.from("order_items").select("product_id, product_name, quantity, subtotal").gte("created_at", fromISO).lte("created_at", toISO),
      ]);

    const payments = paymentsRes.data || [];
    const orders = ordersRes.data || [];
    const prevPayments = prevPaymentsRes.data || [];
    const prevOrders = prevOrdersRes.data || [];
    const orderItems = orderItemsRes.data || [];

    // Sales summary
    const totalSales = payments.reduce((s, p) => s + p.amount, 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
    const totalGuests = orders.reduce((s, o) => s + (o.guests || 0), 0);

    // Previous week
    const prevTotalSales = prevPayments.reduce((s, p) => s + p.amount, 0);
    const prevTotalOrders = prevOrders.length;
    const salesChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales * 100) : 0;
    const ordersChange = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders * 100) : 0;

    // Payment methods breakdown
    const methodMap: Record<string, number> = {};
    payments.forEach((p) => {
      methodMap[p.method] = (methodMap[p.method] || 0) + p.amount;
    });
    const paymentMethods = Object.entries(methodMap).map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount);

    // Daily sales for trend
    const dailySales: Record<string, { sales: number; orders: number }> = {};
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      dailySales[key] = { sales: 0, orders: 0 };
    }
    payments.forEach((p) => {
      const key = p.created_at.split("T")[0];
      if (dailySales[key]) dailySales[key].sales += p.amount;
    });
    orders.forEach((o) => {
      const key = o.created_at.split("T")[0];
      if (dailySales[key]) dailySales[key].orders += 1;
    });
    const dailyTrend = Object.entries(dailySales).map(([date, data]) => ({ date, ...data }));

    // Top products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    orderItems.forEach((item) => {
      const cur = productSales.get(item.product_id) || { name: item.product_name, quantity: 0, revenue: 0 };
      cur.quantity += item.quantity;
      cur.revenue += item.subtotal;
      productSales.set(item.product_id, cur);
    });
    const topProducts = Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Category sales
    const productIds = [...new Set(orderItems.map((i) => i.product_id))];
    let categorySales: { name: string; revenue: number }[] = [];
    if (productIds.length > 0) {
      const { data: products } = await supabase.from("products").select("id, category_id").in("id", productIds);
      const categoryIds = [...new Set((products || []).map((p) => p.category_id).filter(Boolean))];
      const { data: categories } = categoryIds.length > 0
        ? await supabase.from("categories").select("id, name").in("id", categoryIds)
        : { data: [] };
      const catNameMap = new Map((categories || []).map((c) => [c.id, c.name]));
      const prodCatMap = new Map((products || []).map((p) => [p.id, p.category_id]));

      const catRevMap = new Map<string, number>();
      orderItems.forEach((item) => {
        const catId = prodCatMap.get(item.product_id);
        const catName = catId ? catNameMap.get(catId) || "Sin categoría" : "Sin categoría";
        catRevMap.set(catName, (catRevMap.get(catName) || 0) + item.subtotal);
      });
      categorySales = Array.from(catRevMap.entries()).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
    }

    const reportData = {
      totalSales,
      totalOrders,
      avgTicket,
      totalGuests,
      salesChange: Math.round(salesChange * 10) / 10,
      ordersChange: Math.round(ordersChange * 10) / 10,
      prevTotalSales,
      prevTotalOrders,
      paymentMethods,
      dailyTrend,
      topProducts,
      categorySales,
    };

    // Upsert report
    const { error } = await supabase.from("weekly_reports").upsert({
      week_start: weekStartStr,
      week_end: weekEndStr,
      report_data: reportData,
    }, { onConflict: "week_start" });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, week_start: weekStartStr, week_end: weekEndStr }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
