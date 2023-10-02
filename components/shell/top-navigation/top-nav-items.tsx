'use client';

import { useMode } from 'context/state';
import TopNavigationItem from './top-navigation-item';
import { Mode } from 'types';

export const TopNavigationItems = () => {
  const { mode } = useMode();
  return [
    {
      name: 'Getting Started',
      href: '/getting-started'
    },
    {
      name: 'IceRPC',
      href: '/icerpc'
    },
    {
      name: 'Slice',
      href: mode === Mode.Slice1 ? '/slice1' : '/slice2'
    },
    {
      name: 'IceRPC for Ice users',
      href: '/icerpc-for-ice-users'
    },
    {
      name: 'API Reference',
      href: 'https://docs.icerpc.dev/api/csharp/index.html'
    }
  ].map((item) => (
    <TopNavigationItem key={item.href} name={item.name} href={item.href} />
  ));
};