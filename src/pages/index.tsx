import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import axios from 'axios';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Box,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';

const QrScanner = dynamic(() => import('react-qr-scanner'), {
  ssr: false,
});

const IndexPage: React.FC = () => {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<'success' | 'error' | 'info'>('info');
  const qrRef = useRef<any>(null);

  const handleScan = async (result: any) => {
    if (result) {
      setScanResult(result?.text);
      setLoading(true);
      setOpenDialog(true);

      try {
        // Ambil screenshot dari elemen body
        const canvas = await html2canvas(document.body, { useCORS: true, allowTaint: true });
        const imageData = canvas.toDataURL('image/png'); // Konversi ke Base64

        // Kirim data ke API
        const response = await axios.post('/api/check-in', {
          id: result?.text,
          screenshot: imageData, // Kirim screenshot ke API
        });

        if (response.data.success) {
          setDialogMessage(response.data.message);
          setDialogType('success');
        } else {
          setDialogMessage(response.data.message || 'Maaf, QR Code ini tidak dikenali. Pastikan Anda menggunakan QR Code yang benar.');
          setDialogType('error');
        }
      } catch (error: any) {
        console.error('Error during check-in:', error);
        setDialogMessage('Terjadi kesalahan saat memproses check-in. Silakan coba lagi atau hubungi panitia.');
        setDialogType('error');
      } finally {
        setLoading(false);
        setTimeout(() => {
          setOpenDialog(false);
          setScanResult(null);
        }, 3000);
      }
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    Swal.fire({
      title: 'Error',
      text: 'Gagal mengakses kamera. Pastikan izin kamera diberikan.',
      icon: 'error',
    });
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center',
  };

  const qrBoxStyle = {
    width: '100%',
    maxWidth: '400px',
    marginBottom: '20px',
    border: '2px solid #fff',
    borderRadius: '10px',
    overflow: 'hidden',
  };

  const dialogStyle = {
    ...(dialogType === 'success' ? { backgroundColor: '#4CAF50', color: '#fff' } : { backgroundColor: '#f44336', color: '#fff' }),
  };

  return (
    <Container style={containerStyle}>
      <Typography variant="h4" component="h1" gutterBottom>
        Halaman Scan QR Code
      </Typography>

      <Box style={qrBoxStyle}>
        <QrScanner
          ref={qrRef}
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={{ width: '100%' }}
        />
      </Box>

      {scanResult && (
        <Typography variant="body1" gutterBottom>
          Hasil Scan: {scanResult}
        </Typography>
      )}

      <Button variant="contained" color="primary" onClick={() => router.push('/rekap')}>
        Lihat Rekap Data
      </Button>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle style={dialogStyle}>
          {loading ? 'Memproses...' : dialogType === 'success' ? 'Sukses' : 'Error'}
          <IconButton
            aria-label="close"
            onClick={() => setOpenDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
            }}
          >
            <Close style={{ color: 'white' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent style={dialogStyle}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center">
              <CircularProgress />
            </Box>
          ) : (
            <Typography>{dialogMessage}</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default IndexPage;
