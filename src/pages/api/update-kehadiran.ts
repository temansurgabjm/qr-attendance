import { google } from "googleapis";
import { JWT } from "google-auth-library";
import type { NextApiRequest, NextApiResponse } from "next";

const googleServiceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
const spreadsheetId = process.env.SPREADSHEET_ID!;

const auth = new JWT({
  email: googleServiceAccountEmail,
  key: googlePrivateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id, hadir } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  try {
    // Ambil semua ID dari kolom B (Kode Unik)
    const getValues = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Rekap Peserta!B2:B", // Mulai dari B2 untuk menghindari header
    });

    const ids = getValues.data.values?.flat() || [];
    const rowIndex = ids.indexOf(id);

    if (rowIndex === -1) {
      console.warn(`ID ${id} tidak ditemukan di Google Sheet.`);
      return res.status(404).json({ error: "ID not found" });
    }

    // Baris aktual dalam Google Sheets (B2 adalah baris pertama data)
    const actualRowIndex = rowIndex + 2;

    // Jika hadir, isi dengan timestamp, jika tidak hadir, kosongkan
    const now = new Date().toLocaleString("id-ID", { hour12: false }).replace(",", "");
    const values = hadir ? [[now]] : [[""]];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Rekap Peserta!G${actualRowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating Google Sheet:", error);
    return res.status(500).json({ error: "Failed to update attendance" });
  }
}
