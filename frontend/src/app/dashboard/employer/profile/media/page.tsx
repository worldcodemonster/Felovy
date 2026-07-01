'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toaster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Employer } from '@/types';
import { ArrowLeft, Upload, Loader2, Save, X, ImagePlus, Film, Link2, Play } from 'lucide-react';

// ── Crop helpers ──────────────────────────────────────────────────────────────

function centerAspectCrop(w: number, h: number, aspect: number) {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h), w, h);
}

async function cropToBlob(img: HTMLImageElement, crop: PixelCrop, mimeType: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = img.naturalWidth  / img.width;
  const scaleY = img.naturalHeight / img.height;
  canvas.width  = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('crop failed')), mimeType)
  );
}

// ── CropModal ─────────────────────────────────────────────────────────────────

interface CropModalProps {
  src: string;
  aspect: number;
  onDone: (blob: Blob, preview: string) => void;
  onClose: () => void;
}

function CropModal({ src, aspect, onDone, onClose }: CropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  };

  const handleApply = async () => {
    if (!imgRef.current || !completedCrop) return;
    const blob = await cropToBlob(imgRef.current, completedCrop, 'image/jpeg');
    const preview = URL.createObjectURL(blob);
    onDone(blob, preview);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Crop Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-96 overflow-auto flex items-center justify-center bg-gray-50 rounded-xl">
          <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={aspect} minWidth={50}>
            <img ref={imgRef} src={src} onLoad={onImageLoad} className="max-w-full max-h-80 object-contain" />
          </ReactCrop>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="gradient" size="sm" onClick={handleApply} disabled={!completedCrop}>Apply Crop</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── FileUploadBox ─────────────────────────────────────────────────────────────

interface FileUploadBoxProps {
  label: string;
  hint?: string;
  preview?: string;
  existingUrl?: string;
  onFile: (file: File) => void;
  accept?: string;
  className?: string;
}

function FileUploadBox({ label, hint, preview, existingUrl, onFile, accept = 'image/*', className = '' }: FileUploadBoxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const img = preview || existingUrl;
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        className="mt-1 relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-felovy-red transition-colors group"
        onClick={() => ref.current?.click()}
        style={{ minHeight: 80 }}
      >
        {img ? (
          <img src={img} alt={label} className="w-full h-full object-cover max-h-40" />
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <ImagePlus className="h-8 w-8 mb-1 group-hover:text-felovy-red transition-colors" />
            <span className="text-xs">{hint ?? 'Click to upload'}</span>
          </div>
        )}
        {img && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="h-7 w-7 text-white" />
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ── MediaPage ─────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['employer-me'],
    queryFn: async () => {
      const res = await api.post('/employers/me', {});
      return res.json() as Promise<Employer>;
    },
  });

  // -- Logo (1:1) -----------------------------------------
  const [logoBlob,    setLogoBlob]    = useState<Blob>();
  const [logoPreview, setLogoPreview] = useState<string>();
  const [logoCropSrc, setLogoCropSrc] = useState<string>();

  // -- Brand (16:9) ----------------------------------------
  const [brandBlob,    setBrandBlob]    = useState<Blob>();
  const [brandPreview, setBrandPreview] = useState<string>();
  const [brandCropSrc, setBrandCropSrc] = useState<string>();

  // -- Contact photo (1:1) ---------------------------------
  const [contactBlob,    setContactBlob]    = useState<Blob>();
  const [contactPreview, setContactPreview] = useState<string>();
  const [contactCropSrc, setContactCropSrc] = useState<string>();

  // -- Ad images -------------------------------------------
  const [adBlobs,    setAdBlobs]    = useState<File[]>([]);
  const [adPreviews, setAdPreviews] = useState<string[]>([]);
  const adInputRef = useRef<HTMLInputElement>(null);

  // -- Video -----------------------------------------------
  const [videoType, setVideoType] = useState<'link' | 'upload'>('link');
  const [videoLink, setVideoLink] = useState('');
  const [videoFile, setVideoFile] = useState<File>();
  const videoRef = useRef<HTMLInputElement>(null);

  const handleAdFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - adBlobs.length;
    const toAdd = files.slice(0, remaining);
    setAdBlobs(prev => [...prev, ...toAdd]);
    setAdPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeAd = (i: number) => {
    setAdBlobs(prev => prev.filter((_, idx) => idx !== i));
    setAdPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      if (logoBlob)    fd.append('companyLogo',   logoBlob,    'logo.jpg');
      if (brandBlob)   fd.append('companyBrand',  brandBlob,   'brand.jpg');
      if (contactBlob) fd.append('contactPhoto',  contactBlob, 'contact.jpg');
      adBlobs.forEach((f, i) => fd.append('companyAdImages', f, `ad-${i}.jpg`));
      fd.append('introVideoType', videoType);
      if (videoType === 'link') fd.append('introVideoLink', videoLink);
      if (videoType === 'upload' && videoFile) fd.append('introVideo', videoFile);

      const res = await api.put('/employers/me/step3', fd);
      if (!res.ok) throw new Error((await res.json()).message || 'Save failed');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Media saved!' });
      qc.invalidateQueries({ queryKey: ['employer-me'] });
      router.push('/dashboard/employer/profile/id-verification');
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const existingAds: string[] = profile?.companyAdImages ?? [];

  return (
    <>
      {/* Crop modals */}
      {logoCropSrc && (
        <CropModal
          src={logoCropSrc}
          aspect={1}
          onDone={(blob, preview) => { setLogoBlob(blob); setLogoPreview(preview); setLogoCropSrc(undefined); }}
          onClose={() => setLogoCropSrc(undefined)}
        />
      )}
      {brandCropSrc && (
        <CropModal
          src={brandCropSrc}
          aspect={16 / 9}
          onDone={(blob, preview) => { setBrandBlob(blob); setBrandPreview(preview); setBrandCropSrc(undefined); }}
          onClose={() => setBrandCropSrc(undefined)}
        />
      )}
      {contactCropSrc && (
        <CropModal
          src={contactCropSrc}
          aspect={1}
          onDone={(blob, preview) => { setContactBlob(blob); setContactPreview(preview); setContactCropSrc(undefined); }}
          onClose={() => setContactCropSrc(undefined)}
        />
      )}

      <div className="space-y-4">
        {/* Logos & Brand */}
        <Card>
          <CardHeader><CardTitle>Company Visuals</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FileUploadBox
                label="Company Logo (1:1)"
                hint="Square logo • PNG or JPG"
                preview={logoPreview}
                existingUrl={profile?.companyLogoUrl}
                onFile={f => setLogoCropSrc(URL.createObjectURL(f))}
              />
              <FileUploadBox
                label="Brand / Banner Image (16:9)"
                hint="Wide banner • PNG or JPG"
                preview={brandPreview}
                existingUrl={profile?.companyBrandUrl}
                onFile={f => setBrandCropSrc(URL.createObjectURL(f))}
                className="sm:col-span-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ad Images */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ad / Portfolio Images</CardTitle>
              <span className="text-xs text-gray-400">{adBlobs.length + (adPreviews.length === 0 ? existingAds.length : 0)}/5</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {/* Show new previews OR existing if no new ones queued */}
              {(adPreviews.length > 0 ? adPreviews : existingAds).map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-gray-200 group">
                  <img src={src} alt={`Ad ${i + 1}`} className="w-full h-full object-cover" />
                  {adPreviews.length > 0 && (
                    <button
                      onClick={() => removeAd(i)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              ))}
              {(adPreviews.length > 0 ? adBlobs.length : existingAds.length) < 5 && (
                <button
                  onClick={() => adInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-felovy-red transition-colors group"
                >
                  <ImagePlus className="h-6 w-6 text-gray-300 group-hover:text-felovy-red transition-colors" />
                </button>
              )}
            </div>
            <input ref={adInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdFiles} />
            <p className="text-xs text-gray-400 mt-2">Upload up to 5 images showcasing your company or work environment.</p>
          </CardContent>
        </Card>

        {/* Contact Photo */}
        <Card>
          <CardHeader><CardTitle>Contact Person Photo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-gray-100 shrink-0 bg-gray-50 flex items-center justify-center">
                {contactPreview || profile?.contactPhotoUrl ? (
                  <img src={contactPreview ?? profile?.contactPhotoUrl} alt="Contact" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl text-gray-300">👤</span>
                )}
              </div>
              <div>
                <FileUploadBox
                  label="Upload Photo"
                  hint="Square photo • JPG or PNG"
                  onFile={f => setContactCropSrc(URL.createObjectURL(f))}
                  className="w-48"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intro Video */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Film className="h-4 w-4" /> Introduction Video</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {(['link', 'upload'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setVideoType(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${videoType === t ? 'border-felovy-red bg-felovy-light text-felovy-red' : 'border-gray-200 text-gray-600'}`}
                >
                  {t === 'link' ? <Link2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  {t === 'link' ? 'Paste Link' : 'Upload File'}
                </button>
              ))}
            </div>
            {videoType === 'link' ? (
              <div>
                <Input
                  value={videoLink}
                  onChange={e => setVideoLink(e.target.value)}
                  placeholder="YouTube, Vimeo, or any public video URL"
                />
                {profile?.introVideoUrl && !videoLink && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Play className="h-3 w-3" />
                    Current: <a href={profile.introVideoUrl} target="_blank" rel="noreferrer" className="text-felovy-red underline truncate max-w-xs">{profile.introVideoUrl}</a>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-felovy-red transition-colors"
                onClick={() => videoRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                {videoFile ? (
                  <p className="text-sm text-gray-700 font-medium">{videoFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">Click to upload video</p>
                    <p className="text-xs text-gray-400">MP4 recommended • Max 100 MB</p>
                  </>
                )}
                <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setVideoFile(f); }} />
              </div>
            )}
            <p className="text-xs text-amber-600">A short intro video helps developers understand your company culture.</p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/employer/profile/company-info')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button variant="gradient" onClick={() => save()} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save &amp; Continue</>}
          </Button>
        </div>
      </div>
    </>
  );
}
