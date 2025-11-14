import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import SignInForm from '@/components/SignInForm';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  // If the user is already logged in, redirect them to the home page.
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/');
  }

  // Await searchParams in Next.js 15
  const params = await searchParams;

  // Otherwise, prepare the provider data and render the sign-in form.
  const providers = authOptions.providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
  }));

  return <SignInForm providers={providers} error={params.error} />;
}
