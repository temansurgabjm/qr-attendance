// @ts-nocheck
import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import axios from "axios";
import { Container, Typography, Button, Dialog, DialogTitle, DialogContent, CircularProgress, Box, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useEffect } from "react";

const QrScanner = dynamic(() => import("react-qr-scanner"), {
  ssr: false,
});

const IndexPage: React.FC = () => {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState<"success" | "error" | "info">("info");
  const [scanning, setScanning] = useState(true);
  const scanningRef = useRef(false);
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("");
  const [sekolah, setSekolah] = useState("");

  const resetData = () => {
    setNama("");
    setKelas("");
    setSekolah("");
  };

  const [confirmCheckIn, setConfirmCheckIn] = useState(false);

  // Tambahkan useEffect untuk menutup dialog otomatis jika tipe "success"
  useEffect(() => {
    if (openDialog && dialogType === "success") {
      const timer = setTimeout(() => {
        setOpenDialog(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [openDialog, dialogType]);

  const handleScan = async (result: any) => {
    if (result && !scanningRef.current) {
      scanningRef.current = true;
      setScanResult(result?.text);
      setLoading(true);
      setOpenDialog(true);
      setScanning(false);

      try {
        const response = await axios.post("/api/check-in", {
          id: result?.text,
          confirm: confirmCheckIn, // Kirim konfirmasi jika sudah disetujui
        });

        if (response.data.alreadyCheckedIn && !confirmCheckIn) {
          setDialogMessage(response.data.message);
          setDialogType("info");
          setConfirmCheckIn(true);
          setLoading(false);
          return; // Jangan lanjutkan check-in sebelum konfirmasi
        }

        if (response.data.success) {
          setNama(response.data.nama);
          setKelas(response.data.kelas);
          setSekolah(response.data.sekolah);
          setDialogMessage(response.data.message);
          setDialogType("success");
          setConfirmCheckIn(false); // Reset konfirmasi
        } else {
          resetData();
          setDialogMessage(response.data.message);
          setDialogType("error");
        }
      } catch (error: any) {
        resetData();
        console.error("Error during check-in:", error);
        setDialogMessage("Terjadi kesalahan saat memproses check-in. Silakan coba lagi.");
        setDialogType("error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
  };

  const handleRetryScan = () => {
    resetData();
    setScanResult(null);
    scanningRef.current = false;
    setScanning(true);
  };

  const handleConfirmCheckIn = async () => {
    setLoading(true);
    setDialogMessage("Memproses check-in...");

    try {
      const response = await axios.post("/api/check-in", {
        id: scanResult,
        confirm: true, // Kirim konfirmasi check-in
      });

      if (response.data.success) {
        setNama(response.data.nama);
        setKelas(response.data.kelas);
        setSekolah(response.data.sekolah);
        setDialogMessage(response.data.message);
        setDialogType("success");

        setTimeout(() => {
          setOpenDialog(false); // Tutup dialog otomatis setelah sukses
        }, 3000);
      } else {
        setDialogMessage(response.data.message);
        setDialogType("error");
      }
    } catch (error) {
      console.error("Error saat lanjut check-in:", error);
      setDialogMessage("Terjadi kesalahan saat check-in. Silakan coba lagi.");
      setDialogType("error");
    } finally {
      setLoading(false);
      setConfirmCheckIn(false); // Reset konfirmasi setelah selesai
    }
  };

  return (
    <Container
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Halaman Scan QR Code
      </Typography>

      {scanning && (
        <Box
          style={{
            width: "100%",
            maxWidth: "400px",
            marginBottom: "20px",
            border: "2px solid #fff",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: "100%" }}
            constraints={{
              video: {
                facingMode: "environment", // Gunakan kamera belakang
              },
            }}
          />
        </Box>
      )}

      {nama && kelas && sekolah && (
        <Box mt={2}>
          <Typography variant="body1">
            <strong>Nama:</strong> {nama}
          </Typography>
          <Typography variant="body1">
            <strong>Sekolah:</strong> {sekolah}
          </Typography>
          <Typography variant="body1">
            <strong>Kelas:</strong> {kelas}
          </Typography>
        </Box>
      )}

      {!scanning && (
        <Button variant="contained" color="secondary" onClick={handleRetryScan} style={{ marginTop: "10px" }}>
          Scan Lagi
        </Button>
      )}

      <Button variant="contained" color="primary" onClick={() => router.push("/rekap")} style={{ marginTop: "10px" }}>
        Lihat Rekap Data
      </Button>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle
          style={{
            backgroundColor: loading ? "#2196F3" : dialogType === "success" ? "#4CAF50" : dialogType === "error" ? "#f44336" : "#FFC107",
            color: "#fff",
          }}
        >
          {loading ? "Memproses..." : dialogType === "success" ? "Sukses" : dialogType === "info" ? "Konfirmasi" : "Error"} {/* Tambahkan kondisi "info" agar tidak langsung "Error" */}
          <IconButton aria-label="close" onClick={() => setOpenDialog(false)} sx={{ position: "absolute", right: 8, top: 8, color: "white" }}>
            <Close style={{ color: "white" }} />
          </IconButton>
        </DialogTitle>

        <DialogContent style={{ backgroundColor: loading ? "#2196F3" : dialogType === "success" ? "#4CAF50" : dialogType === "error" ? "#f44336" : "#FFC107", color: "#fff" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography>{dialogMessage}</Typography>

              {dialogType === "success" && (
                <Box mt={2}>
                  <Typography>
                    <strong>Nama:</strong> {nama}
                  </Typography>
                  <Typography>
                    <strong>Sekolah:</strong> {sekolah}
                  </Typography>
                  <Typography>
                    <strong>Kelas:</strong> {kelas}
                  </Typography>
                </Box>
              )}

              {dialogType === "info" && confirmCheckIn && (
                <Box mt={2} display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleConfirmCheckIn} // Pakai fungsi baru
                    disabled={loading} // Disable tombol saat loading
                    style={{ marginRight: "10px" }}
                  >
                    {loading ? "Memproses..." : "Ya, lanjutkan check-in"}
                  </Button>
                  <Button variant="contained" color="secondary" onClick={() => setOpenDialog(false)} disabled={loading}>
                    Batal
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default IndexPage;
