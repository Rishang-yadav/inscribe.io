"use client";
import React from "react";
import { ConnectMultiButton } from "bitcoin-wallet-adapter";
import InnerMenu from "./InnerMenu";

const WalletAdapter = () => {
  return (
    <div>
      <ConnectMultiButton
        // walletImageClass="w-[30px] rounded-xl"
        walletLabelClass="text-lg text-white capitalize tracking-wider "
        modalContentClass = "bg-red-500"
        modalContainerClass = "bg-primary "
        walletItemClass=" w-full bg-primary cursor-pointer border-transparent rounded-xl mb-4 hover:border-green-500 transition-all"
        headingClass="text-white text-3xl pb-12 font-bold text-center flex flex-wrap items-center justify-around"
        buttonClassname="bg-primary  bg-opacity-[60%] hover:bg-opacity-[100%] py-4 px-4 rounded-lg text-white font-medium flex items_center justify-center"
        InnerMenu={InnerMenu } // component to show a menu when wallet is connected
        // icon="/assets/azuki2.png"
        // iconClass="w-[100px] rounded-xl pb-2"
        // balance={1000}
        // className=" border border-accent_dark bg-red-500"
   
      />
    </div>
  );
};

export default WalletAdapter;
