import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';

interface QrScannerProps {
  onScan: (data: Record<string, string>) => void;
  onError?: (msg: string) => void;
  onManual?: () => void;
}

function parseQrData(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  // Try key:value format first
  const lines = raw.split(/[\n;,]+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim().toLowerCase();
      const val = line.slice(idx + 1).trim();
      if (key.includes('name') || key === 'medicinename' || key === 'medicine') result.name = val;
      else if (key.includes('batch') || key === 'batchnumber') result.batchNumber = val;
      else if (key.includes('mfg') || key.includes('manufacturing') || key === 'mfgdate') result.manufacturingDate = val;
      else if (key.includes('exp') || key.includes('expiry') || key === 'expdate') result.expiryDate = val;
      else if (key.includes('qty') || key.includes('quantity')) result.quantity = val;
      else if (key.includes('dosage') || key.includes('dose')) result.dosage = val;
    }
  }
  // If nothing parsed, treat whole string as medicine name
  if (Object.keys(result).length === 0) {
    result.name = raw.slice(0, 100);
  }
  return result;
}

export function QrScanner({ onScan, onError, onManual }: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-container';

  const startScanner = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          const parsed = parseQrData(decodedText);
          stopScanner();
          onScan(parsed);
        },
        () => {} // ignore scan failures
      );
    } catch (err: any) {
      setScanning(false);
      const msg = err?.message || String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Camera access required to scan QR code.');
      } else if (msg.includes('NotFound') || msg.includes('Requested device not found')) {
        setError('No camera found on this device.');
      } else {
        setError('Could not start camera: ' + msg);
      }
      onError?.(msg);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div
        id={containerId}
        className="w-full max-w-[280px] min-h-[280px] rounded-xl border-2 border-dashed border-muted-foreground/30 overflow-hidden bg-black/5"
      />

      {!scanning && !error && (
        <>
          <p className="text-sm text-muted-foreground text-center">
            Align QR code within the frame to scan medicine.
          </p>
          <Button onClick={startScanner} className="gap-2">
            <Camera className="h-4 w-4" /> Open Camera
          </Button>
        </>
      )}

      {scanning && (
        <Button variant="outline" onClick={stopScanner} className="gap-2">
          <CameraOff className="h-4 w-4" /> Stop Camera
        </Button>
      )}

      {error && (
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={startScanner}>Try Again</Button>
        </div>
      )}

      {onManual && (
        <Button variant="ghost" size="sm" onClick={onManual} className="text-muted-foreground">
          Add Medicine Manually
        </Button>
      )}
    </div>
  );
}
