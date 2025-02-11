import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
})

const sheets = google.sheets({ version: 'v4', auth })
const SPREADSHEET_ID = process.env.SPREADSHEET_ID

export async function getAttendanceData() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Rekap Peserta!A2:I',
    })

    const rows = response.data.values || []
    return rows.map(row => ({
      id: row[1],
      nama: row[2],
      sekolah: row[3],
      kelas: row[4],
      noWa: row[5],
      hadir: Boolean(row[6]),
      qrCode: row[7],
      screenshot: row[8],
    }))
  } catch (error) {
    console.error('Error fetching data:', error)
    return []
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await getAttendanceData();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data' });
  }
}
