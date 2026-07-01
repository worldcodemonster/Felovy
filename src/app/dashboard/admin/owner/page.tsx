import { redirect } from 'next/navigation';

export default function AdminOwnerRedirect() {
  redirect('/dashboard/owner');
}
