'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import { X, Loader2, CheckCircle2, Send } from 'lucide-react';

interface Props {
  jobId: string;
  onClose: () => void;
  onApplied?: () => void;
}

export function JobApplyModal({ jobId, onClose, onApplied }: Props) {
  const [coverLetter, setCoverLetter] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['developer-me'],
    queryFn: async () => {
      const res = await api.post('/developers/me', {});
      return res.json() as Promise<Developer>;
    },
  });

  const { mutate: apply, isPending } = useMutation({
    mutationFn: () =>
      api.post(`/applications/jobs/${jobId}/apply`, { coverLetter }),
    onSuccess: () => {
      setSubmitted(true);
      onApplied?.();
    },
    onError: async () => {
      toast({ title: 'Already applied or profile not verified', variant: 'destructive' });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-gray-900 text-lg">Apply for this Position</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Application Sent!</h3>
                <p className="text-gray-500 text-sm mb-6">The employer will reach out to you if interested.</p>
                <Button variant="outline" onClick={onClose}>Close</Button>
              </motion.div>
            ) : profileLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-felovy-red" />
              </div>
            ) : (
              <motion.div key="form" className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Your Profile</p>
                  <p className="font-semibold text-gray-900">{profile?.fullName || 'Name not set'}</p>
                  <p className="text-sm text-gray-500">{profile?.title || 'Title not set'}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile?.skills.slice(0, 5).map(s => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                    {(profile?.skills.length || 0) > 5 && (
                      <Badge variant="outline" className="text-xs">+{(profile?.skills.length || 0) - 5}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">This information is auto-filled from your profile.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Tell the employer why you're a great fit..."
                    rows={5}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-felovy-red"
                  />
                </div>

                {!profile?.isVerified && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    Your profile needs to be verified before you can apply. Complete all profile steps.
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button
                    variant="gradient"
                    className="flex-1 gap-2"
                    onClick={() => apply()}
                    disabled={isPending || !profile?.isVerified}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit Application
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
