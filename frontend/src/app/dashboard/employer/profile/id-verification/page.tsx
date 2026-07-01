'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toaster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Employer } from '@/types';
import { ArrowLeft, Upload, Loader2, Save, ShieldCheck, FileText, CheckCircle2, Download } from 'lucide-react';

async function downloadUrl(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank');
  }
}

export default function IdVerificationPage() {
  const router = useRouter();
  const qc    = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['employer-me'],
    queryFn: async () => {
      const res = await api.post('/employers/me', {});
      return res.json() as Promise<Employer>;
    },
  });

  const [idFile,     setIdFile]     = useState<File>();
  const [idPreview,  setIdPreview]  = useState<string>();
  const [idFileName, setIdFileName] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setIdFile(f);
    setIdFileName(f.name);
    if (f.type.startsWith('image/')) {
      setIdPreview(URL.createObjectURL(f));
    } else {
      setIdPreview(undefined);
    }
  };

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      if (!idFile) throw new Error('Please select a file');
      const fd = new FormData();
      fd.append('idCard', idFile);
      const res = await api.put('/employers/me/step4', fd);
      if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'ID card uploaded!', description: 'Our team will review it shortly.' });
      qc.invalidateQueries({ queryKey: ['employer-me'] });
      router.push('/dashboard/employer');
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const alreadyUploaded = Boolean(profile?.idCardUrl);
  const isVerified      = Boolean(profile?.isVerified);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-felovy-red" /> Business Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isVerified && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700">Your business is verified</p>
              <p className="text-xs text-green-600">You can re-upload your ID card if needed.</p>
            </div>
          </div>
        )}

        {alreadyUploaded && !isVerified && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <Loader2 className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Under review</p>
              <p className="text-xs text-amber-600">Your business ID card has been submitted and is being reviewed.</p>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Upload Business ID Card</p>
          <p className="text-xs text-gray-500 mb-4">
            Upload a government-issued business registration document, company ID, or national ID of the owner.
            Accepted formats: JPG, PNG, PDF. Max 10 MB.
          </p>

          {/* Current uploaded preview */}
          {alreadyUploaded && !idPreview && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Currently uploaded:</p>
              {profile?.idCardUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="relative inline-block group">
                  <img
                    src={profile.idCardUrl}
                    alt="Uploaded ID card"
                    className="rounded-xl max-h-56 object-contain ring-1 ring-gray-200"
                  />
                  <button
                    onClick={() => downloadUrl(profile.idCardUrl!, 'business-id-card.jpg')}
                    className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <a
                    href={profile?.idCardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-felovy-red hover:bg-felovy-light transition-colors"
                  >
                    <FileText className="h-4 w-4" /> View document
                  </a>
                  <button
                    onClick={() => downloadUrl(profile!.idCardUrl!, 'business-id-card.pdf')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                </div>
              )}
            </div>
          )}

          {/* New file preview */}
          {idPreview && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Selected file preview:</p>
              <img
                src={idPreview}
                alt="ID card preview"
                className="rounded-xl max-h-56 object-contain ring-2 ring-felovy-red/30"
              />
            </div>
          )}

          {idFileName && !idPreview && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <FileText className="h-5 w-5 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 truncate">{idFileName}</span>
            </div>
          )}

          {/* Upload dropzone */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-felovy-red transition-colors group"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3 group-hover:text-felovy-red transition-colors" />
            <p className="text-sm font-medium text-gray-600">
              {idFileName ? 'Click to change file' : 'Click to upload your business ID'}
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF • Max 10 MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/employer/profile/media')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button variant="gradient" onClick={() => submit()} disabled={isPending || !idFile} className="gap-2">
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
              : <><Save className="h-4 w-4" /> Submit for Verification</>
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
