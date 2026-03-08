import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, CheckCircle2 } from 'lucide-react';

interface QrScannerProps {
  onScan: (data: Record<string, string>) => void;
  onError?: (msg: string) => void;
  onManual?: () => void;
}

function parseQrData(raw: string): { data: Record<string, string>; structured: boolean } {
  const data: Record<string, string> = {};
  const lines = raw
    .split(/[\n;,]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx < 1) continue;

    const key = line.slice(0, idx).trim().toLowerCase().replace(/[\s_-]/g, '');
    const value = line.slice(idx + 1).trim();

    if (!value) continue;

    if (key === 'medicinename' || key === 'medicine' || key.includes('name')) data.name = value;
    else if (key === 'batch' || key === 'batchnumber' || key.includes('batch')) data.batchNumber = value;
    else if (key === 'mfg' || key === 'mfgdate' || key.includes('manufacturing')) data.manufacturingDate = value;
    else if (key === 'exp' || key === 'expdate' || key.includes('expiry')) data.expiryDate = value;
    else if (key === 'quantity' || key === 'qty') data.quantity = value;
    else if (key === 'dosage' || key === 'dose') data.dosage = value;
  }

  if (Object.keys(data).length === 0) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.MedicineName || parsed.medicineName || parsed.name) data.name = parsed.MedicineName || parsed.medicineName || parsed.name;
      if (parsed.Batch || parsed.batch || parsed.batchNumber) data.batchNumber = parsed.Batch || parsed.batch || parsed.batchNumber;
      if (parsed.MFG || parsed.mfg || parsed.manufacturingDate) data.manufacturingDate = parsed.MFG || parsed.mfg || parsed.manufacturingDate;
      if (parsed.EXP || parsed.exp || parsed.expiryDate) data.expiryDate = parsed.EXP || parsed.exp || parsed.expiryDate;
      if (parsed.quantity || parsed.qty) data.quantity = String(parsed.quantity || parsed.qty);
      if (parsed.dosage || parsed.dose) data.dosage = String(parsed.dosage || parsed.dose);
    } catch {
      // ignore non-JSON
    }
  }

  const structured = Boolean(data.name || data.batchNumber || data.manufacturingDate || data.expiryDate);
  return { data, structured };
}

export function QrScanner({ onScan, onError, onManual }: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Place the medicine QR code inside the frame to scan.');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const idRef = useRef(`qr-reader-${Math.random().toString(36).slice(2, 10)}`);

  const clearScanTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const stopScanner = useCallback(async () => {
    clearScanTimeout();

    if (!scannerRef.current) {
      setScanning(false);
      return;
    }

    try {
      await scannerRef.current.stop();
    } catch {
      // scanner may already be stopped
    }

    try {
      await scannerRef.current.clear();
    } catch {
      // ignore clear errors
    }

    scannerRef.current = null;
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError('');
    setMessage('Place the medicine QR code inside the frame to scan.');
    hasScannedRef.current = false;

    await stopScanner();

    const scanner = new Html5Qrcode(idRef.current);
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1,
    };

    const onSuccess = async (decodedText: string) => {
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;

      const parsed = parseQrData(decodedText);

      if (!parsed.structured) {
        setError('Medicine details not found in QR code.');
        setMessage('QR not detected. Try again or add medicine manually.');
        await stopScanner();
        onError?.('Medicine details not found in QR code.');
        onManual?.();
        return;
      }

      setMessage('QR code scanned successfully.');
      await stopScanner();
      onScan(parsed.data);
    };

    const onFailure = () => {
      // expected during frame processing
    };

    try {
      setScanning(true);

      try {
        await scanner.start({ facingMode: { exact: 'environment' } }, config, onSuccess, onFailure);
      } catch {
        try {
          await scanner.start({ facingMode: 'environment' }, config, onSuccess, onFailure);
        } catch {
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras.length) throw new Error('No camera found on this device.');
          await scanner.start({ deviceId: { exact: cameras[0].id } }, config, onSuccess, onFailure);
        }
      }

      timeoutRef.current = window.setTimeout(() => {
        setMessage('QR not detected. Try again or add medicine manually.');
      }, 7000);
    } catch (err: any) {
      setScanning(false);
      const msg = err?.message || String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Camera access required to scan QR code.');
      } else {
        setError(msg || 'Unable to start scanner.');
      }
      onError?.(msg);
    }
  }, [onError, onManual, onScan, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative w-full max-w-[300px]">
        <div
          id={idRef.current}
          className="w-full min-h-[300px] rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/30"
        />
        <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-primary/70" />
      </div>

      <p className="text-sm text-muted-foreground text-center">{message}</p>

      {!scanning ? (
        <Button onClick={startScanner} className="gap-2">
          <Camera className="h-4 w-4" /> Open Camera
        </Button>
      ) : (
        <Button variant="outline" onClick={stopScanner} className="gap-2">
          <CameraOff className="h-4 w-4" /> Stop Camera
        </Button>
      )}

      {!error && message === 'QR code scanned successfully.' && (
        <p className="text-sm text-primary inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> QR code scanned successfully.
        </p>
      )}

      {error && (
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={startScanner}>Try Again</Button>
            {onManual && <Button onClick={onManual}>Add Manually</Button>}
          </div>
        </div>
      )}

      {!error && onManual && (
        <Button variant="ghost" size="sm" onClick={onManual} className="text-muted-foreground">
          Add Medicine Manually
        </Button>
      )}
    </div>
  );
}
