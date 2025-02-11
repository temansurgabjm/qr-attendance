import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

const spreadsheetId = process.env.SPREADSHEET_ID;
const googleServiceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

const generateRandomFilename = () => `${uuidv4()}.png`;

const uploadScreenshotToDrive = async (imageBase64: string): Promise<string | null> => {
  try {
    const auth = new JWT({
      email: googleServiceAccountEmail,
      key: googlePrivateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const filename = generateRandomFilename();
    const buffer = Buffer.from(imageBase64.split(',')[1], 'base64');
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [googleDriveFolderId],
      },
      media: {
        mimeType: 'image/png',
        body: stream, // Menggunakan stream agar kompatibel dengan Google Drive API
      },
    });

    const fileId = response.data.id;
    if (!fileId) return null;

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const fileInfo = await drive.files.get({
      fileId,
      fields: 'webViewLink',
    });

    return fileInfo.data.webViewLink || null;
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    return null;
  }
};

const updateGoogleSheet = async (id: string): Promise<boolean> => {
  try {
    const auth = new JWT({
      email: googleServiceAccountEmail,
      key: googlePrivateKey.replace(/\\n/g, '\n'), // Fix masalah format key
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Ambil semua ID dari kolom B (Kode Unik)
    const getValues = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Rekap Peserta!B2:B', // Mulai dari B2 untuk menghindari header
    });

    const ids = getValues.data.values?.flat() || []; // Ambil semua ID di kolom B
    const rowIndex = ids.indexOf(id);

    if (rowIndex === -1) {
      console.warn(`ID ${id} tidak ditemukan di Google Sheet.`);
      return false;
    }

    const now = new Date().toLocaleString('id-ID', { hour12: false }).replace(',', ''); 

    // Karena data dimulai dari B2, kita perlu menyesuaikan index baris
    const actualRowIndex = rowIndex + 2; // +2 karena B2 adalah baris pertama dari data

    // Update hanya kolom "Hadir" (G)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Rekap Peserta!G${actualRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[now]] },
    });

    console.log(`Berhasil update Google Sheet untuk ID ${id}`);
    return true;
  } catch (error) {
    console.error('Error updating Google Sheet:', error);
    return false;
  }
};

const getParticipantData = async (id: string): Promise<{ nama: string; kelas: string } | null> => {
  try {
    const auth = new JWT({
      email: googleServiceAccountEmail,
      key: googlePrivateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Ambil semua data dari Google Sheet
    const getValues = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Rekap Peserta!B2:E', // B = ID, C = Nama, D = Sekolah, E = Kelas
    });

    const rows = getValues.data.values || [];

    // Cari baris dengan ID yang sesuai
    const row = rows.find((row) => row[0] === id);
    if (!row) return null;

    return { nama: row[1], kelas: row[3] }; // Nama ada di C, Kelas ada di E
  } catch (error) {
    console.error('Error fetching participant data:', error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID is required' });
  }

  try {
    const participant = await getParticipantData(id);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'ID not found' });
    }

    const isUpdated = await updateGoogleSheet(id);

    return res.status(200).json({
      success: true,
      message: 'Check-in successful',
      nama: participant.nama,
      kelas: participant.kelas,
    });
  } catch (error) {
    console.error('Error during check-in process:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
