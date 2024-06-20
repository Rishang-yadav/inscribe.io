import React from "react";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import { IoWallet } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { FiCopy } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import { FaDiscord } from "react-icons/fa";
import {Popover} from "@mui/material";
import {shortenString} from "../../../utils"

const InnerMenu = ({ anchorEl, open, onClose, disconnect }:any) => {
  const walletDetails = useWalletAddress();
  const dispatch = useDispatch();
  const balanceData = useSelector((state:any) => state.general.balanceData);

  const resetWalletDetails = () => {
    // Resetting the balance data in redux store
    // dispatch(setBalanceData(null));
    // Clearing the localStorage
    Object.entries(localStorage).forEach(([key]) => {
      if (key.startsWith("walletBalance-")) localStorage.removeItem(key);
    });
  };

  if(!walletDetails){
    return <></>
  }

  return (
    <Popover
        anchorEl={anchorEl}
        onClose={onClose}
        open={open}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
       
    <div className="p-4 bg-black min-w-[300px]  max-w-[400px] ">
      <div className="flex flex-wrap text-white ">
        <div className="p-6 rounded-lg w-80">
          <div className="flex flex-wrap items-center py-4">
            <div className="uppercase font-bold text-sm flex gap-1">
              <IoWallet />
            </div>
            <p className="pl-2"> {shortenString(walletDetails.cardinal_address ?? "", 5)}</p>
          </div>
          {
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <img
                  src="/assets/images/bitcoin.png"
                  alt="BTC Wallet"
                  className="w-4 h-4 mr-2"
                />
                <div>
                  <p className="text-sm">BTC Wallet</p>
                  <p className="text-xs text-gray-400">
                    { shortenString(walletDetails.cardinal_address,5)}
                  </p>
                  {/* <p className="text-sm">{balanceData.balance} BTC</p>
                  <p className="text-xs text-gray-400">0.00 USD</p> */}
                </div>
                <div
                  className="cursor-pointer"
                  // onClick={() => {
                  //   copy(walletDetails?.cardinal_address + "");
                  //   dispatch(
                  //     addNotification({
                  //       id: new Date().valueOf(),
                  //       message: "Address Copied",
                  //       open: true,
                  //       severity: "success",
                  //     })
                  //   );
                  // }}
                >
                  <FiCopy className="ml-2 hover:text-green-600 transition-all" />
                </div>
              </div>
            </div>
          }
          <div className="mb-6">
            <div className="flex items-center">
            
                <img
                  src="https://ordinalnovus.com/static-assets/images/ord.png "
                  alt="Ordinals Wallet"
                  className="w-4 h-4 mr-2"
                />
              
              <div>
                <p className="text-sm">Ordinals Wallet</p>
                <p className="text-xs text-gray-400">
                  { shortenString(walletDetails.ordinal_address,5)}
                </p>
              </div>
              <div
                className="cursor-pointer"
                // onClick={() => {
                //   copy(walletDetails?.ordinal_address + "");
                //   dispatch(
                //     addNotification({
                //       id: new Date().valueOf(),
                //       message: "Address Copied",
                //       open: true,
                //       severity: "success",
                //     })
                //   );
                // }}
              >
                <FiCopy className="ml-2 hover:text-green-600 transition-all" />
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <button
              className=" bg-primary  bg-opacity-[70%] hover:bg-opacity-[100] text-white p-2  rounded justify-center"
              onClick={() => {
                disconnect();
                resetWalletDetails();
                onClose();
              }}
            >
              Disconnect
            </button>
          </div>
          <div className="mt-4 flex flex-row gap-4 justify-center">
            <button className=" p-2 hover:bg-primary bg-accent_dark">
              <a
                href="https://x.com/ordinalNovus"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaXTwitter />
              </a>
            </button>

            <button className=" p-2 hover:bg-primary bg-accent_dark">
              <a
                href="https://discord.gg/Wuy45UfxsG"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaDiscord />
              </a>
            </button>
          </div>
        </div>
      </div>
    </div>
    </Popover>
  );
};

export default InnerMenu;
