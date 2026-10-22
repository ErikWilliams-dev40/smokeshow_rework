import Link from 'next/link'
import { publicRoutes } from '@/content/seo/routes'
export const primaryLinks = [
  { path: '/wholesale-products', label: 'Wholesale products' },
  { path: '/blog', label: 'Smoke Signals' },
  { path: '/wholesale', label: 'Get the Wholesale Menu' },
] as const
export function PublicLinks({ policies = false }: { policies?: boolean }) {
  const links = policies
    ? [
        ...primaryLinks,
        ...publicRoutes.filter(
          (route) => !primaryLinks.some((link) => link.path === route.path),
        ),
      ]
    : primaryLinks
  return (
    <>
      {links.map((link) => (
        <Link key={link.path} href={link.path}>
          {link.label}
        </Link>
      ))}
    </>
  )
}
