'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const navigation = [
  { name: 'Onboarding', href: '/app/onboarding', icon: '📝' },
  { name: 'Status', href: '/app/status', icon: '📊' },
  { name: 'WhatsApp', href: '/app/whatsapp', icon: '💬' },
  { name: 'Logs', href: '/app/logs', icon: '📋' },
];

export function PortalSidebar({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-primary-600 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className="text-xl font-bold text-white">
            Flow HQ
          </Link>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                        pathname === item.href
                          ? 'bg-primary-700 text-white'
                          : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white">
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500">
                  {user?.name?.[0] || 'U'}
                </div>
                <span className="sr-only">Your profile</span>
                <span aria-hidden="true">{user?.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full text-left rounded-md p-2 text-sm font-semibold text-primary-100 hover:bg-primary-700 hover:text-white"
              >
                Sign out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
