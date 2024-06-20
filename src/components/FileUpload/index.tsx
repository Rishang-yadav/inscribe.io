"use client";

import React, { useState, ChangeEvent, FormEvent, useRef, useCallback } from "react";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { useWalletAddress } from "bitcoin-wallet-adapter";

export default function FileUpload() {
  const walletDetails = useWalletAddress();
  const [base64, setBase64] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = useCallback(
    (e:any) => {
      const file = e.target.files?.[0];
      if (file) {
        console.log({file})
        setFileName(file.name); // Store the file name
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          const target = event.target as FileReader;
          if (target && target.result) {
            const result = target.result as string;
            // console.log("Result Output", result);
            setBase64(result);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [],
  )
  

  const handleSubmit = useCallback(
   async (e:any) => {
      e.preventDefault();
      if (selectedFile) {
        const formData = new FormData();
        formData.append("base64", base64);
        formData.append(
          "cardinal_address",
          walletDetails?.cardinal_address ?? ""
        );
        formData.append("file_name", fileName); // Append the file name
        formData.append("cardinal_pubkey", walletDetails?.cardinal_pubkey ?? "");
        formData.append("ordinal_address", walletDetails?.ordinal_address ?? "");
        formData.append("ordinal_pubkey", walletDetails?.ordinal_pubkey ?? "");
        formData.append("wallet", walletDetails?.wallet ?? "");
        formData.append("order_id", uuidv4());
        formData.append("status", "pending");
  
        try {
          const res = await axios.post("/api/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          console.log("form data", res.data);
          console.log({message: res.data.message})
          setMessage(res.data.message);
          setBase64("");
          setSelectedFile(null);
          setFileName("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          setMessage("Failed to upload image");
        }
      }
    },
    [walletDetails, fileName, base64],
  )
  

  console.log({walletDetails})

  return (
    <div className="">
      {walletDetails ? (
        <div className=" flex justify-center ">
         <div className="bg-primary w-full rounded-lg lg:w-4/12 h-[60vh]" >
         <h2 className="text-center text-white  font-semibold text-2xl py-6">
            Upload Image
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="py-6 flex  flex-wrap justify-center items-center">
              <input
                className="py-3  text-white font-medium "
                type="file"
                onChange={handleImageChange}
                ref={fileInputRef}
                required
              />
              <br />
              <br />
              {base64 && (
                <img
                  src={base64}
                  alt="Image Preview"
                  style={{ maxWidth: "300px" }}
                />
              )}
              <br />
              <br />
            </div>
            <div className="flex justify-center">
              <button
                className="text-white bg-yellow-600 rounded-md h-[40px] font-semibold bg-accent_dark flex items-center py-4 px-4"
                type="submit"
              >
                Upload
              </button>
            </div>
          </form>
          {message && <p className="py-4 text-center">{message}</p>}
         </div>
        </div>
      ) : (
        <div className="text-center text-white font-semibold text-2xl py-6">
          <p className="bg-red-600 py-2 ">Please connect your wallet to continue.</p>
        </div>
      )}
    </div>
  );
}
