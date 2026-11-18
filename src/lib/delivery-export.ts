import { copyablePhone, detailedAddress, orderLineItems, shortOrderRef, type AdminOrder } from "@/lib/admin";

type Cell = string | number;

const HEADERS = ["المرجع", "اسم المستلم", "الهاتف", "المدينة", "العنوان", "الثمن", "المنتج", "ملاحظات"];

function productLabel(order: AdminOrder) {
  const pack = (order.pack_label || "").trim();
  if (pack) return pack;
  return orderLineItems(order)
    .map((line) => `${line.label} × ${line.qty}`)
    .join(" + ");
}

function deliveryNotes(order: AdminOrder) {
  const bits = [order.courier_notes, order.driver_comment].map((value) => (value || "").trim()).filter(Boolean);
  return [...new Set(bits)].join(" — ");
}

export function deliverySheetRows(orders: AdminOrder[]): Cell[][] {
  return [
    HEADERS,
    ...orders.map((order) => [
      shortOrderRef(order.order_id),
      (order.full_name || "").trim(),
      copyablePhone(order),
      (order.shipping_city || order.city || "").trim(),
      detailedAddress(order),
      Math.round((Number(order.total ?? order.total_price) || 0) * 100) / 100,
      productLabel(order),
      deliveryNotes(order),
    ]),
  ];
}

function xmlEscape(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function colLetter(index: number) {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function worksheetXml(rows: Cell[][]) {
  const lastCol = colLetter(Math.max(0, (rows[0]?.length || 1) - 1));
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          const ref = `${colLetter(colIndex)}${rowIndex + 1}`;
          const header = rowIndex === 0 ? ` s="1"` : "";
          if (typeof value === "number" && Number.isFinite(value)) {
            return `<c r="${ref}"${header}><v>${value}</v></c>`;
          }
          return `<c r="${ref}"${header} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(String(value ?? ""))}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCol}${Math.max(1, rows.length)}"/>
  <sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews>
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="2" width="24" customWidth="1"/>
    <col min="3" max="3" width="16" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="36" customWidth="1"/>
    <col min="6" max="6" width="12" customWidth="1"/>
    <col min="7" max="7" width="28" customWidth="1"/>
    <col min="8" max="8" width="32" customWidth="1"/>
  </cols>
  <sheetData>${body}</sheetData>
</worksheet>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const WORKBOOK = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Livraison" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function bytesOf(parts: Array<Uint8Array | number[]>) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function u16(value: number) {
  return Uint8Array.of(value & 255, (value >> 8) & 255);
}

function u32(value: number) {
  return Uint8Array.of(value & 255, (value >> 8) & 255, (value >> 16) & 255, (value >> 24) & 255);
}

function zipStore(files: { name: string; data: Uint8Array }[]) {
  const locals: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const time = (12 << 11) | (0 << 5);
  const date = ((2026 - 1980) << 9) | (11 << 5) | 18;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const local = bytesOf([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(time),
      u16(date),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      name,
      file.data,
    ]);
    locals.push(local);
    central.push(
      bytesOf([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(time),
        u16(date),
        u32(crc),
        u32(file.data.length),
        u32(file.data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]),
    );
    offset += local.length;
  }
  const directory = bytesOf(central);
  const end = bytesOf([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(directory.length),
    u32(offset),
    u16(0),
  ]);
  return bytesOf([...locals, directory, end]);
}

function textFile(name: string, xml: string) {
  return { name, data: new TextEncoder().encode(xml) };
}

export function buildDeliveryWorkbook(orders: AdminOrder[]) {
  const sheet = worksheetXml(deliverySheetRows(orders));
  return zipStore([
    textFile("[Content_Types].xml", CONTENT_TYPES),
    textFile("_rels/.rels", ROOT_RELS),
    textFile("xl/workbook.xml", WORKBOOK),
    textFile("xl/_rels/workbook.xml.rels", WORKBOOK_RELS),
    textFile("xl/styles.xml", STYLES),
    textFile("xl/worksheets/sheet1.xml", sheet),
  ]);
}

export function downloadDeliveryWorkbook(orders: AdminOrder[]) {
  const bytes = buildDeliveryWorkbook(orders);
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chifaglow-livraison-${stamp}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
