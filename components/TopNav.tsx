// Copyright (c) ZeroC, Inc. All rights reserved.

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaTwitter, FaGithub } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { SearchButton } from './SearchButton';

import lightLogo from '../public/images/icerpc-logo-light.svg';

export function TopNav() {
  const router = useRouter();
  return (
    <nav>
      <div className="nav-container">
        <div className="left-col">
          <Link href="/">
            <div className="image-container">
              <Image src={lightLogo} alt="Logo" />
            </div>
          </Link>
          <SearchButton />
        </div>
        <div className="right-col">
          <Link href="/" className="flex">
            <a className={router.pathname == '/' ? 'active' : ''}>Home</a>
          </Link>
          <Link href="/docs/slice" className="flex">
            <a
              className={
                router.pathname.startsWith('/docs/slice') ? 'active' : ''
              }
            >
              Slice
            </a>
          </Link>
          <Link href="/docs/rpc" className="flex">
            <a
              className={
                router.pathname.startsWith('/docs/rpc') ? 'active' : ''
              }
            >
              Remote Procedure Calls
            </a>
          </Link>
          <div className="icons">
            <a href="https://github.com/zeroc-ice">
              <FaGithub size={20} />
            </a>
            <a href="https://twitter.com/zeroc">
              <FaTwitter size={20} />
            </a>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          nav {
            top: 0;
            position: fixed;
            height: var(--nav-height);
            z-index: 100;
            display: flex;
            align-items: center;
            background: white;
            border-bottom: 1px solid var(--border-color);
            width: 100%;
            font-size: 14px;
          }

          nav :global(a) {
            text-decoration: none;
          }

          // Search button styles

          nav :global(.DocSearch-Button) {
            background: white;
            height: 30px;
            border-radius: 5px;
            width: 150px;
            color: gray;
            font-size: 12px;
            padding: 0;
            margin: 0;
            padding-right: 1rem;
            justify-content: cemter;
          }

          nav :global(.DocSearch-Button:hover) {
            box-shadow: none;
          }

          nav
            :global(.DocSearch-Button:hover)
            :global(.DocSearch-Button-Placeholder) {
            color: var(--primary-color);
          }

          nav :global(.DocSearch-Button:hover) :global(.DocSearch-Button-Keys) {
            border: 1px solid var(--primary-color);
          }

          nav :global(.DocSearch-Button:hover) :global(.DocSearch-Button-Key) {
            color: var(--primary-color);
          }

          nav :global(.DocSearch-Button-Key) {
            background: white;
            box-shadow: none;
            color: var(--docsearch-muted-color);
            padding: 0;
            margin: 0;
            width: 15px;
            height: 20px;
            transition: 0.3s;
            justify-content: center;
            align-items: center;
            font-family: Inter;
          }

          nav :global(.DocSearch-Button-Keys) {
            border: 1px solid var(--border-color);
            border-radius: 5px;
            background: white;
            color: gray;
            font-size: 12px;
            padding-top: 2px;
            display: flex;
            justify-content: center;
            transition: 0.3s;
          }

          nav :global(.DocSearch-Search-Icon) {
            margin-right: 5px;
            padding-right: 5px;
          }

          nav :global(.DocSearch-Button-Placeholder) {
            font-size: 10pt;
            color: gray;
            padding: 0;
            margin-right: 0.5rem;
          }

          .active {
            color: var(--primary-color);
            opacity: 1;
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 1.3rem;
            animation: fadeIn 0.4s;
          }

          .nav-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 1500px;
            margin: 0 auto;
            padding: 0 1rem;
          }

          .left-col {
            height: 50%;
            width: 100%;
            gap: 5px;
            display: flex;
            align-items: center;
          }

          .right-col {
            height: 50%;
            width: 100%;
            gap: 40px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 2rem;
            margin-right: 0px;
          }

          .right-col a {
            transition: 0.3s;
          }

          .right-col a:hover {
            color: var(--primary-color);
          }

          .image-container {
            display: flex;
            align-items: center;
            width: 100px;
          }

          .icons {
            display: flex;
            gap: 20px;
          }

          @keyframes fadeIn {
            0% {
              opacity: 0;
              text-decoration-thickness: 0px;
            }
            100% {
              opacity: 1;
              text-decoration-thickness: 2px;
            }
          }
        `}
      </style>
    </nav>
  );
}
