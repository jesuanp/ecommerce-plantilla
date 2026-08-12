import { useState } from 'react';
import { Upload, Check, FileText } from 'lucide-react';
import { ordersApi } from '../lib/api';

const MAX_MB = 5;
const ACCEPTED = 'image/jpeg,image/png,image/webp,application/pdf';

interface Props {
  orderId: string;
  onUploaded: () => void;
}

export default function PaymentProofUploader({ orderId, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB`);
      return;
    }
    setError('');
    setFile(f);
    setPreview(f.type === 'application/pdf' ? null : URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await ordersApi.uploadProof(orderId, file);
      onUploaded();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed, please try again');
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block border-2 border-dashed border-ink-200 rounded-xl p-6 text-center cursor-pointer hover:border-ink-400 transition-colors">
        <input type="file" accept={ACCEPTED} onChange={pick} className="hidden" />
        {preview ? (
          <img src={preview} alt="Proof preview" className="max-h-48 mx-auto rounded-lg" />
        ) : file ? (
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <FileText className="w-4 h-4" />
            {file.name}
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 mx-auto mb-2 text-ink-400" />
            <p className="text-sm text-ink-500">Click to select your proof of payment</p>
            <p className="text-xs text-ink-400 mt-1">JPG, PNG, WEBP or PDF · up to {MAX_MB}MB</p>
          </>
        )}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={upload}
        disabled={!file || uploading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {uploading ? 'Uploading…' : (
          <>
            <Check className="w-4 h-4" />
            Confirm order
          </>
        )}
      </button>
    </div>
  );
}