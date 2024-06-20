// app/api/v2/cron/inscribe/route.ts
import { addressReceivedMoneyInThisTx, pushBTCpmt } from "@/utils/inscribe";
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from 'fs/promises';
import path from 'path';
//@ts-ignore
import * as cryptoUtils from "@cmdcode/crypto-utils";
//@ts-ignore
import { Signer, Tx, Address } from "@cmdcode/tapscript";

import { ICreateInscription, IInscribeOrder } from "@/types";
import dbConnect from "@/lib/dbconnect";
import { FileData } from "@/models";

/**
 * Finds an order with the status "payment received" from the database.
 * @returns {Promise<IInscribeOrder | null>} A promise that resolves to the found order or null if not found.
 */
async function findOrder() {
  await dbConnect();
  const order = await FileData.findOne({ status: "payment received" }).limit(1);
  if (!order) {
    return { order: null, inscriptions: null };
  }
  return { order };
}

/**
 * Processes inscriptions for a given order.
 * @param {IInscribeOrder} order - The order containing the inscriptions.
 * @param {IFileSchema[]} inscriptions - An array of inscriptions.
 * @param {cryptoUtils.KeyPair} seckey - The secret key associated with the order.
 * @param {Uint8Array} pubkey - The public key associated with the inscriptions.
 * @returns {Promise<Object>} A promise that resolves to an object containing transaction details.
 */
async function processInscription(inscription: ICreateInscription) {
  const KeyPair = cryptoUtils.KeyPair;
  const seckey = new KeyPair(inscription.privkey);
  const pubkey = seckey.pub.rawX;
  const txinfo = await addressReceivedMoneyInThisTx(
    inscription.inscription_address,
    inscription.network
  );
  const ec = new TextEncoder();
  const [txid, vout, value] = txinfo;
  if (
    typeof txid !== "string" ||
    typeof vout !== "number" ||
    typeof value !== "number"
  ) {
    // Handle the case where any of the values are undefined.
    // You could throw an error or perform some other action based on your application's logic.
    throw new Error(
      "Failed to retrieve transaction details from the funding address."
    );
  }
  console.log({ inscription, txinfo });

  const data = Buffer.from(inscription.base64, "base64");

  console.log({ mimetype: inscription.file_type });

  const script = [
    pubkey,
    "OP_CHECKSIG",
    "OP_0",
    "OP_IF",
    ec.encode("ord"),
    "01",
    ec.encode(inscription.file_type),
    "OP_0",
     data,
      "OP_ENDIF"

  ];

  const redeemtx = Tx.create({
    vin: [
      {
        txid,
        vout,
        prevout: {
          value,
          scriptPubKey: Address.toScriptPubKey(inscription.inscription_address),
        },
        witness: [],
      },
    ],
    vout: [
      {
        value: 1000,
        scriptPubKey: Address.toScriptPubKey(inscription.ordinal_address),
      },
    ],
  });
  const sig = Signer.taproot.sign(seckey.raw, redeemtx, 0, {
    extension: inscription.leaf,
  });
  redeemtx.vin[0].witness = [sig, script, inscription.cblock];
  const rawtx = Tx.encode(redeemtx).hex;
saveRawTxAsJson(rawtx)

  async function saveRawTxAsJson(rawtx:any) {
    // Convert rawtx to JSON format
    const rawtxJson = JSON.stringify({ rawtx });
  
    // Define the file path and name
    const filePath = path.join(process.cwd(), 'rawtx.json');
  
    try {
      // Write the JSON data to a file
      await writeFile(filePath, rawtxJson, 'utf8');
      console.log('JSON file has been saved:', filePath);
    } catch (err) {
      console.error('Error writing JSON file:', err);
    }
  }

  
  console.log({ rawtx }, "INS TX");
  // throw Error("INS TEST");
  const txid_inscription = await pushBTCpmt(rawtx, inscription.network);

  console.log("INSCRIPTION TX BROADCASTED: ", txid_inscription);
  inscription.txid = txid_inscription;
  inscription.inscription_id = txid_inscription + "i" + "0";

  inscription.status = "inscribed";
  await (inscription as any).save();

  return inscription;
}

/**
 * GET handler for the inscribe route.
 * Processes the payment and creates transactions for the inscriptions.
 * @param {NextRequest} req - The incoming request object.
 * @returns {NextResponse} A Next.js response object with the transaction details or an error message.
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { order } = await findOrder();

    if (!order) {
      return NextResponse.json({
        message: "No Pending Orders Have received Payment",
      });
    }

    const inscription = await processInscription(order);
    console.log("Inscription Processed: ", inscription.inscription_id);
    console.log(inscription.txid);
    // Further actions can be taken with updatedInscription if needed
    return NextResponse.json({ inscription });
  } catch (error: any) {
    console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || "Error creating inscribe order" },
      { status: 500 }
    );
  }
}

// sign multiple inputs
// const redeemtx = Tx.create({
//   vin: [
//     {
//       txid,
//       vout,
//       prevout: {
//         value,
//         scriptPubKey: Address.toScriptPubKey(inscription.inscription_address),
//       },
//       witness: [],
//     },
//     {
//       txid: "20feb51dcc136d8db2b2d34f83d347a9d503d9f8a78916d0e7cfe16ad3028e2b",
//       vout: 0,
//       prevout: {
//         value: 14000,
//         scriptPubKey: Address.toScriptPubKey(inscription.inscription_address),
//       },
//       witness: [],
//     },
//   ],
//   vout: [
//     {
//       value: 5000,
//       scriptPubKey: Address.toScriptPubKey(inscription.receive_address),
//     },
//   ],
// });
// const sig = Signer.taproot.sign(seckey.raw, redeemtx, 0, {
//   extension: inscription.leaf,
// });
// redeemtx.vin[0].witness = [sig, script, inscription.cblock];
// const sig2 = Signer.taproot.sign(seckey.raw, redeemtx, 1, {
//   extension: inscription.leaf,
// });
//   redeemtx.vin[1].witness = [sig2, script, inscription.cblock];
// const rawtx = Tx.encode(redeemtx).hex;
// console.log({ rawtx }, "INS TX");
