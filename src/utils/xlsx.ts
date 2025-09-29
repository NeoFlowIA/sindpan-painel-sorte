const MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const encoder = new TextEncoder();

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc >>>= 1;
      }
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function columnIndexToLetter(index: number): string {
  let current = index + 1;
  let result = "";

  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }

  return result;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeXmlAttribute(value: string): string {
  return escapeXml(value);
}

function createSheetXml(rows: string[][]): string {
  if (rows.length === 0) {
    return (
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>'
    );
  }

  const rowXml = rows
    .map((cells, rowIndex) => {
      const cellXml = cells
        .map((value, cellIndex) => {
          const cellRef = `${columnIndexToLetter(cellIndex)}${rowIndex + 1}`;
          const escapedValue = escapeXml(value);
          return `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${escapedValue}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowIndex + 1}">${cellXml}</row>`;
    })
    .join("");

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${rowXml}</sheetData>` +
    '</worksheet>'
  );
}

const INVALID_SHEET_NAME_CHARS = new Set(["\\", "/", "*", "?", ":", "[", "]"]);

function sanitizeSheetName(name: string): string {
  const cleaned = name
    .split("")
    .filter((char) => !INVALID_SHEET_NAME_CHARS.has(char))
    .join("")
    .trim();
  const safe = cleaned.length > 0 ? cleaned : "Sheet1";
  return safe.slice(0, 31);
}

function ensureXlsxExtension(filename: string): string {
  return filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function createZip(entries: ZipEntry[]): Uint8Array {
  const fileParts: Uint8Array[] = [];
  const centralDirectoryParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    fileParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralDirectoryParts.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const centralDirectorySize = centralDirectoryParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralDirectorySize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  const totalSize = offset + centralDirectorySize + endRecord.length;
  const output = new Uint8Array(totalSize);
  let pointer = 0;

  for (const part of fileParts) {
    output.set(part, pointer);
    pointer += part.length;
  }

  for (const part of centralDirectoryParts) {
    output.set(part, pointer);
    pointer += part.length;
  }

  output.set(endRecord, pointer);

  return output;
}

function toUint8Array(content: string): Uint8Array {
  return encoder.encode(content);
}

export function exportToXLSX(filename: string, sheetName: string, rows: string[][]): void {
  const safeFileName = ensureXlsxExtension(filename);
  const sanitizedSheetName = sanitizeSheetName(sheetName);
  const normalizedRows = rows.map(row => row.map(cell => (cell ?? "").toString()));
  const sheetXml = createSheetXml(normalizedRows);
  const workbookXml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets>' +
    `<sheet name="${escapeXmlAttribute(sanitizedSheetName)}" sheetId="1" r:id="rId1"/>` +
    '</sheets>' +
    '</workbook>';
  const contentTypesXml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>';
  const rootRelsXml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';
  const workbookRelsXml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';
  const stylesXml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts>' +
    '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  const zipData = createZip([
    { name: "[Content_Types].xml", data: toUint8Array(contentTypesXml) },
    { name: "_rels/.rels", data: toUint8Array(rootRelsXml) },
    { name: "xl/workbook.xml", data: toUint8Array(workbookXml) },
    { name: "xl/_rels/workbook.xml.rels", data: toUint8Array(workbookRelsXml) },
    { name: "xl/styles.xml", data: toUint8Array(stylesXml) },
    { name: "xl/worksheets/sheet1.xml", data: toUint8Array(sheetXml) }
  ]);

  const blob = new Blob([zipData], { type: MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
