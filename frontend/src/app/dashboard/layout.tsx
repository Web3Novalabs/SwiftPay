import React from "react";
import DashboardNav from "./DashboardNav";
import MainGroupLinks from "./MainGroupLinks";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="relative min-h-screen bg-gradient-to-b from-[#030407] to-[#111827]  px-24 py-5 ">
          <div>
            <DashboardNav />
            <MainGroupLinks />
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
