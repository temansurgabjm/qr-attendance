import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Box,
} from '@mui/material';

interface Participant {
  id: string;
  nama: string;
  sekolah: string;
  kelas: string;
  noWa: string;
  hadir: boolean;
  qrCode: string;
  screenshot: string;
}

const RekapPage: React.FC = () => {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/rekap-data');
        setParticipants(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalParticipants = participants.length;
  const totalHadir = participants.filter(p => p.hadir).length;
  const totalTidakHadir = totalParticipants - totalHadir;

  const containerStyle = {
    padding: '20px',
  };

  const tableContainerStyle = {
    marginTop: '20px',
  };

  return (
    <Container style={containerStyle}>
      <Typography variant="h4" component="h1" gutterBottom>
        Rekap Data Peserta
      </Typography>

      <Box display="flex" justifyContent="space-around" mb={2}>
        <Typography>Total Peserta: {totalParticipants}</Typography>
        <Typography>Hadir: {totalHadir}</Typography>
        <Typography>Tidak Hadir: {totalTidakHadir}</Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} style={tableContainerStyle}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Sekolah</TableCell>
                <TableCell>Kelas</TableCell>
                <TableCell>No WA</TableCell>
                <TableCell>Hadir</TableCell>
                <TableCell>Screenshot</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.nama}</TableCell>
                  <TableCell>{row.sekolah}</TableCell>
                  <TableCell>{row.kelas}</TableCell>
                  <TableCell>{row.noWa}</TableCell>
                  <TableCell>{row.hadir ? 'Hadir' : 'Belum Hadir'}</TableCell>
                  <TableCell>
                    {row.screenshot && (
                      <a href={row.screenshot} target="_blank" rel="noopener noreferrer">
                        Lihat Gambar
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Button variant="contained" color="primary" onClick={() => router.push('/')}>
        Kembali ke Scan QR
      </Button>
    </Container>
  );
};

export default RekapPage;
