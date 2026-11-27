'use client';

import React from 'react';
import Link from 'next/link';
import { useAreaHref } from '@/lib/use-area-href';

type AreaLinkProps = React.ComponentProps<typeof Link>;

/**
 * Thay thế `next/link` cho các trang dùng chung giữa /admin và /partner:
 * link viết dạng `/admin/...` tự đổi sang `/partner/...` khi đang ở khu đối tác.
 */
const AreaLink = React.forwardRef<HTMLAnchorElement, AreaLinkProps>(function AreaLink(
  { href, ...props },
  ref,
) {
  const areaHref = useAreaHref();
  return <Link ref={ref} href={typeof href === 'string' ? areaHref(href) : href} {...props} />;
});

export default AreaLink;
