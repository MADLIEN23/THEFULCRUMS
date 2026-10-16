import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScannerView({ onToolDetected, onCancel }) {
  const [scannerActive, setScannerActive] = useState(false);
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState('');
  const html5QrCodeRef = useRef(null);

  const parseToolId = (decodedText) => {
    // Check if the decoded string contains a full URL e.g. http://localhost:5173/tools/TL-1001
    const urlMatch = decodedText.match(/\/tools\/([A-Za-z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase();
    }
    // Check if it's a direct Tool ID e.g. TL-1001
    const directMatch = decodedText.match(/TL-\d+/i);
    if (directMatch) {
      return directMatch[0].toUpperCase();
    }
    return decodedText.trim().toUpperCase();
  };

  const handleScanSuccess = (decodedText) => {
    const toolId = parseToolId(decodedText);
    stopScanner();
    onToolDetected(toolId);
  };

  const startCamera = async () => {
    setError(null);
    setInfo('Requesting camera permissions...');

    try {
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const qrCode = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = qrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      };

      await qrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame scan error callback (ignored during active scanning)
        }
      );

      setScannerActive(true);
      setInfo('Align the tool QR code within the targeting box.');
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Unable to access video camera. You can scan an image file or enter the Tool ID manually below.');
      setScannerActive(false);
      setInfo('');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
    }
    setScannerActive(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setInfo('Processing QR code image...');

    try {
      const qrCode = new Html5Qrcode('qr-reader-container');
      const result = await qrCode.scanFile(file, true);
      handleScanSuccess(result);
    } catch (err) {
      console.error('Image scan error:', err);
      setError('No legible QR code found in the selected image. Please try another image or enter the ID manually.');
      setInfo('');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    onToolDetected(manualId.trim().toUpperCase());
  };

  useEffect(() => {
    return () => {
      // Clean up camera stream when component unmounts
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">QR Asset Code Scanner</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Scan tool barcode label to open live status, timeline, and actions.
            </p>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onCancel();
            }}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md border border-slate-700 transition"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {info && !error && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-md">
              {info}
            </div>
          )}

          {/* Scanner Viewport */}
          <div className="border border-slate-300 rounded-md bg-slate-950 p-4 min-h-[300px] flex flex-col items-center justify-center relative">
            <div id="qr-reader-container" className="w-full max-w-[320px] rounded overflow-hidden"></div>

            {!scannerActive && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-md mx-auto flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-300">Camera Scanner Inactive</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Click below to activate laptop camera or mobile lens</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition shadow-sm"
                >
                  Activate Live Camera
                </button>
              </div>
            )}

            {scannerActive && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={stopScanner}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700"
                >
                  Stop Camera Stream
                </button>
              </div>
            )}
          </div>

          {/* Alternative Scan Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            {/* Image File Upload */}
            <div className="border border-slate-200 rounded-md p-4 bg-slate-50">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Scan From QR Image File
              </span>
              <p className="text-xs text-slate-500 mb-3">
                Upload a photo or screenshot of a tool QR label
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            {/* Direct Tool ID Key-in */}
            <div className="border border-slate-200 rounded-md p-4 bg-slate-50">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Manual Tool ID Entry
              </span>
              <p className="text-xs text-slate-500 mb-3">
                Enter asset code directly (e.g. TL-1001)
              </p>
              <form onSubmit={handleManualSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="TL-1001"
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition"
                >
                  Open
                </button>
              </form>
            </div>
          </div>

          {/* Quick Select Preset Tools for Hackathon Demo */}
          <div className="bg-slate-100 rounded-md p-3 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-2">
              Fast Demo Jump (Click any tool to simulate scan)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['TL-1001', 'TL-1002', 'TL-1003', 'TL-1004', 'TL-1005', 'TL-1006', 'TL-1007', 'TL-1008', 'TL-1009', 'TL-1010'].map(id => (
                <button
                  key={id}
                  onClick={() => onToolDetected(id)}
                  className="bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-800 text-xs font-mono font-medium px-2.5 py-1 rounded border border-slate-300 transition"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
