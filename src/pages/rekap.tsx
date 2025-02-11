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
  Chip,
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

  return (
    <Container style={{ padding: '20px' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Rekap Data Peserta
      </Typography>

      <Box display="flex" justifyContent="space-around" mb={3}>
        <Typography variant="h5" fontWeight="bold">Total Peserta: {totalParticipants}</Typography>
        <Typography variant="h5" fontWeight="bold" color="green">Hadir: {totalHadir}</Typography>
        <Typography variant="h5" fontWeight="bold" color="red">Tidak Hadir: {totalTidakHadir}</Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} style={{ marginTop: '20px', overflowX: 'auto' }}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Sekolah</TableCell>
                <TableCell>Kelas</TableCell>
                <TableCell>No WA</TableCell>
                <TableCell>Hadir</TableCell>
                <TableCell>Screenshot</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.nama}</TableCell>
                  <TableCell>{row.sekolah}</TableCell>
                  <TableCell>{row.kelas}</TableCell>
                  <TableCell>
                    <a href={`https://wa.me/${row.noWa}`} target="_blank" rel="noopener noreferrer">
                      {row.noWa}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.hadir ? 'Hadir' : 'Belum Hadir'}
                      color={row.hadir ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    {row.screenshot && (
                      <a href={row.screenshot} target="_blank" rel="noopener noreferrer">
                        <img src={row.screenshot} alt="Screenshot" width="50" height="50" style={{ borderRadius: '5px' }} />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Button variant="contained" color="primary" onClick={() => router.push('/')} style={{ marginTop: '20px' }}>
        Kembali ke Scan QR
      </Button>
    </Container>
  );
};

export default RekapPage;
