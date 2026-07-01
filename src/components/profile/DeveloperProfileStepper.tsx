'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import { CheckCircle2, Upload, Camera, Loader2, Plus, X } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { n: 1, label: 'Credentials', desc: 'Email & Password' },
  { n: 2, label: 'Personal Info', desc: 'Skills & Experience' },
  { n: 3, label: 'Media', desc: 'Photo & Video' },
  { n: 4, label: 'ID Verification', desc: 'Government ID' },
];

interface Props { currentStep: number; }

export function DeveloperProfileStepper({ currentStep }: Props) {
  return (
    <div>
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s.n < currentStep ? 'bg-green-500 text-white' :
                s.n === currentStep ? 'bg-felovy-red text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {s.n < currentStep ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center hidden sm:block">{s.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${s.n < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">
          Step {currentStep}: {steps[currentStep - 1]?.desc}
        </p>
        <Link href="/dashboard/developer/profile">
          <Button variant="gradient" size="sm">
            Continue Profile Setup →
          </Button>
        </Link>
      </div>
    </div>
  );
}
