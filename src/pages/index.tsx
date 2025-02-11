import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import axios from "axios";
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
} from "@mui/material";
import { Close } from "@mui/icons-material";

const QrScanner = dynamic(() => import("react-qr-scanner"), {
  ssr: false,
});

const IndexPage: React.FC = () => {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [scanning, setScanning] = useState(true);
  const scanningRef = useRef(false);
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("");

  const resetData = () => {
    setNama("");
    setKelas("");
  };

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
        });
        if (response.data.success) {
          setNama(response.data.nama); // Simpan nama
          setKelas(response.data.kelas); // Simpan kelas
          setDialogMessage(response.data.message);
          setDialogType("success");
        } else {
          resetData();
          setDialogMessage(
            response.data.message ||
              "Maaf, QR Code ini tidak dikenali. Pastikan Anda menggunakan QR Code yang benar."
          );
          setDialogType("error");
        }
      } catch (error: any) {
        resetData();
        console.error("Error during check-in:", error);
        setDialogMessage(
          "Terjadi kesalahan saat memproses check-in. Silakan coba lagi atau hubungi panitia."
        );
        setDialogType("error");
      } finally {
        setLoading(false);
        setTimeout(() => {
          setOpenDialog(false);
        }, 3000);
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
          />
        </Box>
      )}

      {nama && kelas && (
        <Box mt={2}>
          <Typography variant="body1">
            <strong>Nama:</strong> {nama}
          </Typography>
          <Typography variant="body1">
            <strong>Kelas:</strong> {kelas}
          </Typography>
        </Box>
      )}

      {!scanning && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRetryScan}
          style={{ marginTop: "10px" }}
        >
          Scan Lagi
        </Button>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/rekap")}
        style={{ marginTop: "10px" }}
      >
        Lihat Rekap Data
      </Button>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle
          style={{
            backgroundColor: loading
              ? "#2196F3"
              : dialogType === "success"
              ? "#4CAF50"
              : "#f44336",
            color: "#fff",
          }}
        >
          {loading
            ? "Memproses..."
            : dialogType === "success"
            ? "Sukses"
            : "Error"}
          <IconButton
            aria-label="close"
            onClick={() => setOpenDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: "white" }}
          >
            <Close style={{ color: "white" }} />
          </IconButton>
        </DialogTitle>

        <DialogContent
          style={{
            backgroundColor: loading
              ? "#2196F3"
              : dialogType === "success"
              ? "#4CAF50"
              : "#f44336",
            color: "#fff",
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography>{dialogMessage}</Typography>

              {/* Tampilkan Nama & Kelas jika berhasil */}
              {dialogType === "success" && (
                <Box mt={2}>
                  <Typography>
                    <strong>Nama:</strong> {nama}
                  </Typography>
                  <Typography>
                    <strong>Kelas:</strong> {kelas}
                  </Typography>
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
