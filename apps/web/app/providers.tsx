/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      {children}
      <ProgressBar
        color="#ffffff"
        height="2px"
        options={{ showSpinner: false }}
        shallowRouting
      />
      <ToastContainer theme="dark" />
    </SessionProvider>
  );
};

export default Providers;
