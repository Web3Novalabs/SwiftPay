import React from "react";
import paymesh_landing_bg from "../../../public/bg_Landing.png";
// import UserBalance from "../components/UserBalance";
import WalletConnect from "../components/WalletConnect";
import logo from "../../../public/paymeshLogo.svg";
import Image from "next/image";
import { LucideSettings } from "lucide-react";
import settings from "../../../public/Gear.svg";

const Page = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#030407] to-[#111827]  px-24 py-5">
      {/* <div
        className="bg-cover bg-center bg-no-repeat w-full h-full absolute top-0 left-0 -z-10"
        style={{
          backgroundImage: `url(${paymesh_landing_bg.src})`,
        }}
      /> */}

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

      <div>
        <h1 className="bg-gradient-to-r from-[#DFDFE0] to-[#0f1011] bg-clip-text py-6 text-transparent font-semibold text-[24px] sm:text-[34px]">
          Welcome to Paymesh
        </h1>

        <p className="text-[#8398AD] text-sm sm:text-base md:text-lg font-medium">
          Create a funding group, share a single deposit address, and
          automatically distribute funds to members.
        </p>
      </div>
    </div>
  );
};

export default Page;
