import supabase from "./supabase";

function raise(error) {
  if (error) throw new Error(error.message);
}

// Dashboard

export const getDashboardStats = async () => {
  const [unitsRes, residentsRes, paymentsRes] = await Promise.all([
    supabase.from("units").select("status"),
    supabase.from("residents").select("status"),
    supabase.from("payments").select("status, amount"),
  ]);
  raise(unitsRes.error);
  raise(residentsRes.error);
  raise(paymentsRes.error);

  const units = unitsRes.data;
  const residents = residentsRes.data;
  const payments = paymentsRes.data;

  return {
    total_units: units.length,
    occupied_units: units.filter((u) => u.status === "occupied").length,
    vacant_units: units.filter((u) => u.status === "vacant").length,
    total_residents: residents.filter((r) => r.status === "active").length,
    pending_payments: payments.filter((p) => p.status === "pending").length,
    overdue_payments: payments.filter((p) => p.status === "overdue").length,
    total_collected: payments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + parseFloat(p.amount), 0),
    total_pending_amount: payments
      .filter((p) => p.status === "pending" || p.status === "overdue")
      .reduce((s, p) => s + parseFloat(p.amount), 0),
  };
};

// Units

export const getUnits = async () => {
  const { data, error } = await supabase
    .from("units")
    .select("*, residents(id, status)")
    .order("floor")
    .order("number");
  raise(error);
  return data.map((u) => ({
    ...u,
    resident_count: (u.residents || []).filter((r) => r.status === "active").length,
    residents: undefined,
  }));
};

export const createUnit = async (data) => {
  const { data: result, error } = await supabase
    .from("units")
    .insert(data)
    .select()
    .single();
  raise(error);
  return result;
};

export const updateUnit = async (id, data) => {
  const { data: result, error } = await supabase
    .from("units")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  raise(error);
  return result;
};

export const deleteUnit = async (id) => {
  const { error } = await supabase.from("units").delete().eq("id", id);
  raise(error);
};

// Residents

export const getResidents = async () => {
  const { data, error } = await supabase
    .from("residents")
    .select("*, units(number)")
    .order("last_name")
    .order("first_name");
  raise(error);
  return data.map((r) => ({
    ...r,
    unit: r.unit_id,
    unit_number: r.units?.number ?? null,
    units: undefined,
  }));
};

export const createResident = async (data) => {
  const { data: result, error } = await supabase
    .from("residents")
    .insert({
      unit_id: data.unit || null,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      move_in_date: data.move_in_date,
      move_out_date: data.move_out_date || null,
      status: data.status,
    })
    .select()
    .single();
  raise(error);
  return result;
};

export const updateResident = async (id, data) => {
  const { data: result, error } = await supabase
    .from("residents")
    .update({
      unit_id: data.unit || null,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      move_in_date: data.move_in_date,
      move_out_date: data.move_out_date || null,
      status: data.status,
    })
    .eq("id", id)
    .select()
    .single();
  raise(error);
  return result;
};

export const deleteResident = async (id) => {
  const { error } = await supabase.from("residents").delete().eq("id", id);
  raise(error);
};

// Payments

export const getPayments = async () => {
  const { data, error } = await supabase
    .from("payments")
    .select("*, residents(first_name, last_name, units(number))")
    .order("due_date", { ascending: false });
  raise(error);
  return data.map((p) => ({
    ...p,
    resident: p.resident_id,
    resident_name: p.residents
      ? `${p.residents.first_name} ${p.residents.last_name}`
      : "",
    unit_number: p.residents?.units?.number ?? null,
    residents: undefined,
  }));
};

export const createPayment = async (data) => {
  const { data: result, error } = await supabase
    .from("payments")
    .insert({
      resident_id: data.resident,
      payment_type: data.payment_type,
      amount: data.amount,
      due_date: data.due_date,
      status: data.status,
      notes: data.notes || "",
    })
    .select()
    .single();
  raise(error);
  return result;
};

export const deletePayment = async (id) => {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  raise(error);
};

export const markPaymentPaid = async (id) => {
  const today = new Date().toISOString().split("T")[0];
  const { data: result, error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_date: today })
    .eq("id", id)
    .select()
    .single();
  raise(error);
  return result;
};
