'use client';

import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';

const LOCATION_TYPES = ['REMOTE', 'HYBRID', 'ONSITE'];
const SALARY_TYPES = ['HOURLY', 'MONTHLY', 'YEARLY'];
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'E-commerce',
  'Gaming', 'AI/ML', 'Blockchain', 'Security', 'Data',
];

interface Props {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

export function JobFilters({ filters, onChange }: Props) {
  const { user } = useAuthStore();
  const set = (key: string, value: string) =>
    onChange({ ...filters, [key]: filters[key] === value ? '' : value });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-5 sticky top-20">
      <h3 className="font-semibold text-gray-900">Filters</h3>

      {/* Favorites (logged in users) */}
      {user && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Saved</p>
          <button
            onClick={() => set('favoriteOnly', 'true')}
            className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
              filters.favoriteOnly === 'true'
                ? 'bg-felovy-light text-felovy-red font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ♥ Favorite Jobs
          </button>
        </div>
      )}

      {/* Location type */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Location</p>
        <div className="flex flex-wrap gap-1.5">
          {LOCATION_TYPES.map(t => (
            <button
              key={t}
              onClick={() => set('locationType', t)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all border ${
                filters.locationType === t
                  ? 'bg-felovy-red text-white border-felovy-red'
                  : 'border-gray-200 text-gray-600 hover:border-felovy-light'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Salary type */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Pay Period</p>
        <div className="flex flex-wrap gap-1.5">
          {SALARY_TYPES.map(t => (
            <button
              key={t}
              onClick={() => set('salaryType', t)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all border ${
                filters.salaryType === t
                  ? 'bg-felovy-red text-white border-felovy-red'
                  : 'border-gray-200 text-gray-600 hover:border-felovy-light'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Industry */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Industry</p>
        <div className="flex flex-col gap-1">
          {INDUSTRIES.map(ind => (
            <button
              key={ind}
              onClick={() => set('industry', ind)}
              className={`text-sm text-left px-2 py-1 rounded-lg transition-all ${
                filters.industry === ind
                  ? 'bg-felovy-light text-felovy-red font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {Object.values(filters).some(Boolean) && (
        <button
          onClick={() => onChange({})}
          className="text-sm text-felovy-red hover:underline w-full text-left"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
