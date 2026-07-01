import { redirect } from 'next/navigation';

export default function OwnerDashboardRoot() {
  redirect('/dashboard/owner/developers');
}
