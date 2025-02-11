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

const updateGoogleSheet = async (id: string, screenshotUrl: string): Promise<boolean> => {
  try {
    const auth = new JWT({
      email: googleServiceAccountEmail,
      key: googlePrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const getValues = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Rekap Peserta!B:B',
    });

    const ids = getValues.data.values?.map((row) => row[0]) || [];
    const rowIndex = ids.indexOf(id);
    if (rowIndex === -1) return false;

    const now = new Date().toLocaleString('id-ID');

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Rekap Peserta!G${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[now]] },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Rekap Peserta!I${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[screenshotUrl]] },
    });

    return true;
  } catch (error) {
    console.error('Error updating Google Sheet:', error);
    return false;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id, screenshot } = req.body;

  if (!id || !screenshot) {
    return res.status(400).json({ success: false, message: 'ID and screenshot are required' });
  }

  try {
    const screenshotUrl = await uploadScreenshotToDrive(screenshot);
    if (!screenshotUrl) {
      return res.status(500).json({ success: false, message: 'Failed to upload screenshot' });
    }

    const isUpdated = await updateGoogleSheet(id, screenshotUrl);

    if (isUpdated) {
      return res.status(200).json({ success: true, message: 'Check-in successful' });
    } else {
      return res.status(404).json({ success: false, message: 'ID not found' });
    }
  } catch (error) {
    console.error('Error during check-in process:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
