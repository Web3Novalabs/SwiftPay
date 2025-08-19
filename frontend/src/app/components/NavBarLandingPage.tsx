import React, { useState } from "react";
import Link from "next/link";

const NavItems = [
  {
    name: "Home",
    link: "/",
  },

  {
    name: "Launch App",
    link: "/launch-app",
  },
  {
    name: "Waitlist",
    link: "/waitlist",
  },
];

const NavBarLandingPage = () => {
  const [active, setActive] = useState("Home");

  return (
    <div className="flex fixed bottom-0 left-0 w-full bg-[#0A1223] items-center justify-center gap-2 sm:gap-3 md:gap-5 mt-20">
      <ul className="flex items-center space-x-4 gap-2 sm:gap-3 md:gap-5 p-2 sm:p-3">
        {NavItems.map((item, i) => {
          if (item.name === "Launch App") {
            return (
              <li
                key={i}
                className="border-gradient !py-1.5 sm:!py-2 md:!py-2.5 !px-4 sm:!px-6 md:!px-7 cursor-pointer text-xs sm:text-sm md:text-base"
              >
                {item.name}
              </li>
            );
          }

          return (
            <li
              key={i}
              className={`cursor-pointer text-white !py-1 !px-2 sm:!px-3 md:!px-4 transition-all text-xs sm:text-sm md:text-base ${
                active === item.name ? "border-b-2 border-[#E2E2E2]" : ""
              }`}
              onClick={() => setActive(item.name)}
            >
              <Link href={item.link}>{item.name}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NavBarLandingPage;
