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
    <div className="ui-panel p-4 space-y-5 sticky top-20">
      <h3 className="font-semibold text-gray-900">Filters</h3>

      {/* Favorites (logged in users) */}
      {user && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Saved</p>
          <button
            onClick={() => set('favoriteOnly', 'true')}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
              filters.favoriteOnly === 'true'
                ? 'border-felovy-ink bg-felovy-fill text-felovy-ink font-medium'
                : 'border-felovy-ink/25 text-gray-600 hover:border-felovy-ink bg-white'
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
              className={filters.locationType === t ? 'ui-chip-active' : 'ui-chip-inactive'}
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
              className={filters.salaryType === t ? 'ui-chip-active' : 'ui-chip-inactive'}
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
              className={`text-sm text-left px-2 py-1.5 rounded-lg border transition-all ${
                filters.industry === ind
                  ? 'border-felovy-ink bg-felovy-fill text-felovy-ink font-medium'
                  : 'border-transparent text-gray-600 hover:border-felovy-ink/30 hover:bg-felovy-light/40'
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
