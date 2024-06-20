//find out data with status pending 
//then find out the inscription address linked tt this data 
//then check balance of this address using mempool.space api 
//then after getting balance match that balance with the inscription fee of this data.
//if balance and inscription fee is equal then update the status from pending to payment recieved.


// app/api/process-pending-inscriptions/route.js

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import { FileData } from "@/models";
import axios from "axios";

const MEMPOOL_API_URL = "https://mempool.space/testnet/api";

async function getBalance(address:any) {
    try {
      const response = await axios.get(`${MEMPOOL_API_URL}/address/${address}`);
      const data = response.data;
      return data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    } catch (error) {
      console.error("Error fetching balance:", error);
      throw new Error("Failed to fetch balance");
    }
  }

export async function GET(req:NextRequest ,res:NextResponse) {
  try {
    await dbConnect();

    // Find a single document with status "payment pending"
    const pendingDoc = await FileData.findOne({ status: "payment pending" });

    console.log("Pending document:", pendingDoc);


    if (!pendingDoc) {
      return NextResponse.json({ message: "No pending documents found" });
    }

    const balance = await getBalance(pendingDoc.inscription_address);

    console.log({balance, fee: pendingDoc.inscription_fee})

    if (balance >= pendingDoc.inscription_fee) {
      await FileData.updateOne(
        { _id: pendingDoc._id },
        { $set: { status: "payment received" } }
      );
      return NextResponse.json({ message: "Payment received and status updated", order_id: pendingDoc.order_id });
    } else {
      return NextResponse.json({ message: "Insufficient balance for payment", order_id: pendingDoc.order_id });
    }
  } catch (error:any) {
    console.error("Error processing inscriptions:", error);
    return NextResponse.json(
      { message: "Failed to process inscriptions", error: error.message },
      { status: 500 }
    );
  }
}
