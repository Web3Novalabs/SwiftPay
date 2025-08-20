"use client";

import React, { useState } from "react";
// import UserBalance from "../components/UserBalance";
import WalletConnect from "../components/WalletConnect";
import logo from "../../../public/paymeshLogo.svg";
import Image from "next/image";
import settings from "../../../public/Gear.svg";

const DashboardNav = () => {
  return (
    <div className="">
      <div className="flex items-center justify-between">
        <div>
          <Image src={logo} alt="logo" className="" />
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center justify-center space-x-1 cursor-pointer gap-2 py-2.5 px-5 rounded-4xl bg-[#FFFFFF0D]">
            <Image src={settings} alt="settings" className="w-6 h-6" />
            <p className="text-[#E2E2E2] text-sm">Settings</p>
          </div>

          <WalletConnect />
        </div>
      </div>
    </div>
  );
};

export default DashboardNav;
