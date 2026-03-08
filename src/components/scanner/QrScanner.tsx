import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, CheckCircle2 } from 'lucide-react';

interface QrScannerProps {
  onScan: (data: Record<string, string>) => void;
  onError?: (msg: string) => void;
  onManual?: () => void;
}

function parseQrData(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = raw.split(/[\n;,]+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim().toLowerCase().replace(/[\s_-]/g, '');
      const val = line.slice(idx + 1).trim();
      if (key.includes('name') || key === 'medicinename' || key === 'medicine') result.name = val;
      else if (key.includes('batch') || key === 'batchnumber') result.batchNumber = val;
      else if (key.includes('mfg') || key.includes('manufacturing') || key === 'mfgdate') result.manufacturingDate = val;
      else if (key.includes('exp') || key.includes('expiry') || key === 'expdate') result.expiryDate = val;
      else if (key.includes('qty') || key.includes('quantity')) result.quantity = val;
      else if (key.includes('dosage') || key.includes('dose')) result.dosage = val;
    }
  }
  // Try JSON format
  if (Object.keys(result).length === 0) {
    try {
      const json = JSON.parse(raw);
      if (json.name || json.medicineName || json.MedicineName) result.name = json.name || json.medicineName || json.MedicineName;
      if (json.batch || json.batchNumber || json.Batch) result.batchNumber = json.batch || json.batchNumber || json.Batch;
      if (json.mfg || json.manufacturingDate || json.MFG) result.manufacturingDate = json.mfg || json.manufacturingDate || json.MFG;
      if (json.exp || json.expiryDate || json.EXP) result.expiryDate = json.exp || json.expiryDate || json.EXP;
      if (json.quantity || json.qty) result.quantity = String(json.quantity || json.qty);
    } catch {}
  }
  if (Object.keys(result).length === 0) {
    result.name = raw.slice(0, 100);
  }
  return result;
}

export function QrScanner({ onScan, onError, onManual }: QrScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [detected, setDetected] = useState(false);
    const [error, setError] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const idRef = useRef(`qr-reader-${Math.random().toString(36).slice(2, 8)}`);
    const stoppingRef = useRef(false);

    const stopScanner = useCallback(async () => {
      if (stoppingRef.current) return;
      stoppingRef.current = true;
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          await scanner.stop();
          scanner.clear();
        } catch {}
        scannerRef.current = null;
      }
      setScanning(false);
      stoppingRef.current = false;
    }, []);

    const startScanner = useCallback(async () => {
      setError('');
      setDetected(false);

      // Ensure previous instance is cleaned up
      await stopScanner();

      // Small delay to let DOM settle
      await new Promise(r => setTimeout(r, 100));

      const elementId = idRef.current;
      const el = document.getElementById(elementId);
      if (!el) {
        setError('Scanner container not found.');
        return;
      }
      // Clear any leftover children
      el.innerHTML = '';

      try {
        const scanner = new Html5Qrcode(elementId, { verbose: false });
        scannerRef.current = scanner;
        setScanning(true);

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            setDetected(true);
            const parsed = parseQrData(decodedText);
            // Stop after a brief moment so user sees success state
            setTimeout(() => {
              stopScanner();
              onScan(parsed);
            }, 600);
          },
          () => {
            // Ignore per-frame failures — this is normal
          }
        );
      } catch (err: any) {
        setScanning(false);
        scannerRef.current = null;
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
    }, [stopScanner, onScan, onError]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        stopScanner();
      };
    }, [stopScanner]);

    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative w-full max-w-[280px]">
          <div
            id={idRef.current}
            ref={containerRef}
            className="w-full min-h-[280px] rounded-xl border-2 border-dashed border-muted-foreground/30 overflow-hidden bg-black/5"
          />
          {detected && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
              <div className="flex flex-col items-center gap-2 text-green-600">
                <CheckCircle2 className="h-10 w-10" />
                <p className="text-sm font-medium">QR code detected!</p>
              </div>
            </div>
          )}
        </div>

        {!scanning && !error && !detected && (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Place the medicine QR code inside the frame to scan.
            </p>
            <Button onClick={startScanner} className="gap-2">
              <Camera className="h-4 w-4" /> Open Camera
            </Button>
          </>
        )}

        {scanning && !detected && (
          <>
            <p className="text-sm text-muted-foreground text-center animate-pulse">
              Scanning... align QR code within the frame.
            </p>
            <Button variant="outline" onClick={stopScanner} className="gap-2">
              <CameraOff className="h-4 w-4" /> Stop Camera
            </Button>
          </>
        )}

        {error && (
          <div className="text-center space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={startScanner}>Try Again</Button>
              {onManual && (
                <Button variant="default" onClick={onManual}>Add Manually</Button>
              )}
            </div>
          </div>
        )}

        {!error && onManual && (
          <Button variant="ghost" size="sm" onClick={onManual} className="text-muted-foreground">
            QR not detected? Add Manually
          </Button>
        )}
      </div>
  );
}
