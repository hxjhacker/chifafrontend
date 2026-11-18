import * as XLSX from "xlsx";
import { copyablePhone, detailedAddress, orderLineItems, type AdminOrder } from "@/lib/admin";

const COLUMNS = ["Destinataire", "Telephone", "Ville", "Adresse", "Produit Ref", "Qte", "Prix", "Erreur"] as const;

function productRef(order: AdminOrder) {
  const pack = (order.pack_label || "").trim();
  if (pack) return pack;
  const code = (order.product_code || "").trim();
  if (code) return code;
  return orderLineItems(order)
    .map((line) => line.label)
    .filter(Boolean)
    .join(" + ");
}

function quantity(order: AdminOrder) {
  const lines = orderLineItems(order);
  const total = lines.reduce((sum, line) => sum + (Number(line.qty) || 0), 0);
  return Math.max(1, total || Number(order.tier_qty || order.primary_qty) || 1);
}

function deliveryRows(orders: AdminOrder[]) {
  return orders.map((order) => ({
    Destinataire: (order.full_name || "").trim(),
    Telephone: copyablePhone(order),
    Ville: (order.shipping_city || order.city || "").trim(),
    Adresse: detailedAddress(order),
    "Produit Ref": productRef(order),
    Qte: quantity(order),
    Prix: Math.round((Number(order.total ?? order.total_price) || 0) * 100) / 100,
    Erreur: "",
  }));
}

function keepPhonesAsText(sheet: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  for (let row = range.s.r + 1; row <= range.e.r; row += 1) {
    const address = XLSX.utils.encode_cell({ r: row, c: 1 });
    const cell = sheet[address];
    if (!cell) continue;
    cell.t = "s";
    cell.v = String(cell.v ?? "");
    cell.z = "@";
  }
}

export function exportOrdersForDelivery(orders: AdminOrder[], filename?: string) {
  const sheet = XLSX.utils.json_to_sheet(deliveryRows(orders), { header: [...COLUMNS] });
  keepPhonesAsText(sheet);
  sheet["!cols"] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 36 },
    { wch: 28 },
    { wch: 8 },
    { wch: 10 },
    { wch: 16 },
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Livraison");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, filename || `chifaglow-livraison-${stamp}.xlsx`);
}
