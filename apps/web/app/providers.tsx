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
        height="4px"
        options={{
          showSpinner: false,
        }}
        shallowRouting
      />
      <ToastContainer theme="dark" />
    </SessionProvider>
  );
};

export default Providers;
