// // app/api/v2/inscribe/create-cbrc-order/route.ts
// import { NextRequest, NextResponse } from "next/server";
// //@ts-ignore
// import mime from "mime-types";
// import { v4 as uuidv4 } from "uuid";
// import * as cryptoUtils from "@cmdcode/crypto-utils";
// import { Tap, Script, Address, Signer, Tx } from "@cmdcode/tapscript";
// import { ICreateInscription, IInscribeOrder } from "@/types";
// import { CreateInscription, Inscribe } from "@/models";
// import dbConnect from "@/lib/dbConnect";
// import { CustomError } from "@/utils";
// import {
//   bytesToHex,
//   generateUnsignedPsbtForInscription,
//   satsToDollars,
// } from "@/utils/Inscribe";
// const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
// const BASE_SIZE = 160;
// const PADDING = 1000;
// const PREFIX = 160;
// const MINIMUM_FEE = 5000;
// export async function POST(req: NextRequest) {
//   try {
//     let {
//       files,
//       network = "mainnet",
//       receive_address,
//       fee_rate,
//       webhook_url,
//       referrer,
//       referral_fee,
//       referral_fee_percent,
//       metaprotocol,
//       wallet,
//       payment_address,
//       publickey,
//     } = await req.json();
//     const order_id = uuidv4();
//     if (referrer && !referral_fee && !referral_fee_percent) {
//       throw new CustomError(
//         "Referral address has been used. Please provide referral_fee.",
//         400
//       );
//     }
//     if (!receive_address || !fee_rate) {
//       throw new CustomError("Fee or address missing", 400);
//     }
//     let fileInfoArray = await processFiles({
//       files,
//       receive_address,
//       metaprotocol,
//       network,
//       fee_rate,
//       webhook_url,
//     });
//     const inscriptions: ICreateInscription[] = await processInscriptions(
//       order_id,
//       fileInfoArray,
//       network,
//       fee_rate
//     );
//     let total_fees = calculateTotalFees(inscriptions, fee_rate);
//     if (referrer)
//       referral_fee = calculateReferralFee(
//         total_fees,
//         referral_fee,
//         referral_fee_percent
//       );
//     else referral_fee = 0;
//     let service_fee = calculateServiceFee(total_fees, referral_fee);
//     const data: IInscribeOrder = {
//       order_id,
//       receive_address,
//       chain_fee: total_fees,
//       service_fee,
//       referral_fee,
//       referrer,
//       txid: "",
//       psbt: "",
//       status: "payment pending",
//     };
//     const { psbt } = await generateUnsignedPsbtForInscription(
//       payment_address,
//       publickey,
//       fee_rate,
//       wallet,
//       inscriptions,
//       data
//     );
//     console.log({ psbt });
//     data.psbt = psbt;
//     await dbConnect();
//     // Create the document
//     const newDocument = await Inscribe.create(data);
//     // Retrieve the ObjectId of the newly created document
//     const object_id = newDocument._id;
//     // Update the array with new ObjectIds
//     const bulkOperations = inscriptions.map((inscription) => {
//       inscription.order = object_id;
//       return {
//         insertOne: {
//           document: inscription,
//         },
//       };
//     });
//     // Perform the bulk write
//     await CreateInscription.bulkWrite(bulkOperations);
//     clearInscriptionData(inscriptions);
//     const final_response = await constructResponse(
//       inscriptions,
//       total_fees,
//       service_fee,
//       referral_fee,
//       psbt
//     );
//     return NextResponse.json(final_response);
//   } catch (error: any) {
//     console.error("Catch Error: ", error);
//     const status = error?.status || 500;
//     const message = error.message || "Error creating inscribe order";
//     return NextResponse.json({ message }, { status });
//   }
// }

// async function generatePrivateKey() {
//   let isValid = false;
//   let privkey;
//   while (!isValid) {
//     privkey = bytesToHex(cryptoUtils.Noble.utils.randomPrivateKey());
//     const KeyPair = cryptoUtils.KeyPair;
//     let seckey = new KeyPair(privkey);
//     let pubkey = seckey.pub.rawX;
//     const init_script = [pubkey, "OP_CHECKSIG"];
//     let init_leaf = await Tap.tree.getLeaf(Script.encode(init_script));
//     let [init_tapkey, init_cblock] = await Tap.getPubKey(pubkey, {
//       target: init_leaf,
//     });
//     /**
//      * This is to test IF the tx COULD fail.
//      * This is most likely happening due to an incompatible key being generated.
//      */
//     const test_redeemtx = Tx.create({
//       vin: [
//         {
//           txid: "a99d1112bcb35845fd44e703ef2c611f0360dd2bb28927625dbc13eab58cd968",
//           vout: 0,
//           prevout: {
//             value: 10000,
//             scriptPubKey: ["OP_1", init_tapkey],
//           },
//         },
//       ],
//       vout: [
//         {
//           value: 8000,
//           scriptPubKey: ["OP_1", init_tapkey],
//         },
//       ],
//     });
//     const test_sig = await Signer.taproot.sign(seckey.raw, test_redeemtx, 0, {
//       extension: init_leaf,
//     });
//     test_redeemtx.vin[0].witness = [test_sig.hex, init_script, init_cblock];
//     isValid = await Signer.taproot.verify(test_redeemtx, 0, { pubkey });
//     if (!isValid) {
//       console.log("Invalid key generated, retrying...");
//     } else {
//       console.log({ privkey });
//     }
//   }
//   if (!privkey) {
//     throw Error("No privkey was generated");
//   }
//   return privkey;
// }

// async function processFiles({
//   files,
//   receive_address,
//   metaprotocol,
//   network,
//   fee_rate,
//   webhook_url,
// }: {
//   files: any[];
//   receive_address: string;
//   metaprotocol: "none" | "cbrc";
//   network: "testnet" | "mainnet";
//   fee_rate: number;
//   webhook_url: string;
// }): Promise<ICreateInscription[]> {
//   const fileInfoPromises = files.map(async (f, index) => {
//     const { file, dataURL } = f;
//     const { type, size, name } = file;
//     if (size > MAX_FILE_SIZE) {
//       throw new Error(`File at index ${index} exceeds the 3MB size limit`);
//     }
//     const base64_data = dataURL.split(",")[1];
//     if (
//       metaprotocol === "cbrc" &&
//       (!f.tick || !f.amt || isNaN(Number(f.amt)) || !f.op)
//     ) {
//       console.log({ f });
//       throw Error("CBRC Inscription needs Tick, OP and AMT in files");
//     }
//     return {
//       order_id: "",
//       privkey: "",
//       receive_address,
//       file_type: type.includes("text")
//         ? mime.contentType(name).split(" ").join("")
//         : mime.lookup(name).split(" ").join(""),
//       file_name: name,
//       base64_data,
//       file_size: size,
//       inscription_address: "",
//       txid: "",
//       leaf: "",
//       tapkey: "",
//       cblock: "",
//       inscription_fee: 0,
//       inscription_id: "",
//       metaprotocol,
//       network,
//       status: "payment pending",
//       webhook_url,
//       fee_rate,
//       ...(metaprotocol === "cbrc" && {
//         tick: f.tick,
//         op: f.op,
//         amt: f.amt,
//       }),
//     };
//   });
//   //@ts-ignore
//   return Promise.all(fileInfoPromises);
// }

// async function processInscriptions(
//   order_id: string,
//   fileInfoArray: ICreateInscription[],
//   network: "testnet" | "mainnet",
//   fee_rate: number
// ) {
//   const ec = new TextEncoder();
//   let inscriptions: any = [];
//   let total_fee = 0;
//   // Loop through all files
//   await Promise.all(
//     fileInfoArray.map(async (file: any) => {
//       const privkey = await generatePrivateKey();
//       // Generate pubkey and seckey from privkey
//       const KeyPair = cryptoUtils.KeyPair;
//       const seckey = new KeyPair(privkey);
//       const pubkey = seckey.pub.rawX;
//       console.log({
//         fee_rate,
//         data: file.base64_data,
//       });
//       // generate mimetype, plain if not present
//       const mimetype = file.file_type || "text/plain;charset=utf-8";
//       // generate metaprotocol as we are creating CBRC
//       // const metaprotocol = `cbrc-20:${file.op.toLowerCase()}:${file.tick
//       //   .trim()
//       //   .toLowerCase()}=${file.amt}`;
//       // data can be whats shared by the frontend as base64
//       const data = Buffer.from(file.base64_data, "base64");
//       // console.log({ metaprotocol, mimetype });
//       // create the script using our derived info
//       const script = [
//         pubkey,
//         "OP_CHECKSIG",
//         "OP_0",
//         "OP_IF",
//         ec.encode("ord"),
//         "01",
//         ec.encode(mimetype),
//         // "07",
//         // ec.encode(metaprotocol),
//         "OP_0",
//         data,
//         "OP_ENDIF",
//       ];
//       // create leaf and tapkey and cblock
//       const leaf = Tap.tree.getLeaf(Script.encode(script));
//       const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: leaf });
//       // Generated our Inscription Address
//       //@ts-ignore
//       let inscriptionAddress = Address.p2tr.encode(tapkey, network);
//       console.debug("Inscription address: ", inscriptionAddress);
//       console.debug("Tapkey:", tapkey);
//       console.log(file.file_type);
//       let txsize = PREFIX + Math.floor(data.length / 4);
//       let inscription_fee = fee_rate * txsize;
//       file.inscription_fee = inscription_fee;
//       total_fee += inscription_fee;
//       console.log({ txsize, fee_rate, inscription_fee });
//       inscriptions.push({
//         ...file,
//         order_id,
//         privkey,
//         leaf: leaf,
//         tapkey: tapkey,
//         cblock: cblock,
//         inscription_address: inscriptionAddress,
//         txsize: txsize,
//         fee_rate: fee_rate,
//       });
//     })
//   );
//   return inscriptions;
// }

// function calculateTotalFees(inscriptions: any[], fee_rate: number) {
//   let total_fee = inscriptions.reduce(
//     (acc, ins) => acc + ins.inscription_fee,
//     0
//   );
//   return total_fee;
//   return (
//     total_fee +
//     (69 + inscriptions.length) * fee_rate +
//     BASE_SIZE * inscriptions.length +
//     PADDING * inscriptions.length
//   );
// }

// function calculateReferralFee(
//   total_fees: number,
//   referral_fee: number | undefined,
//   referral_fee_percent: number | undefined
// ) {
//   referral_fee =
//     referral_fee ||
//     (referral_fee_percent && total_fees * (referral_fee_percent / 100)) ||
//     0;
//   if (referral_fee < MINIMUM_FEE) referral_fee = MINIMUM_FEE;
//   return referral_fee;
// }

// function calculateServiceFee(total_fees: number, referral_fee: number) {
//   let service_fee = Math.ceil((total_fees + referral_fee) * 0.05);
//   if (service_fee < MINIMUM_FEE) service_fee = MINIMUM_FEE;
//   return service_fee;
// }

// function clearInscriptionData(inscriptions: any[]) {
//   inscriptions.forEach((inscription: any) => {
//     delete inscription.base64_data;
//     delete inscription.file_name;
//     delete inscription.privkey;
//   });
// }

// async function constructResponse(
//   inscriptions: any[],
//   total_fees: number,
//   service_fee: number,
//   referral_fee: number | undefined,
//   psbt: string
// ) {
//   return {
//     inscriptions: inscriptions,
//     chain_fee: total_fees,
//     service_fee: service_fee,
//     referral_fee: referral_fee,
//     total_fee: total_fees + service_fee + (referral_fee || 0),
//     total_fees_in_dollars: await satsToDollars(
//       total_fees + service_fee + (referral_fee || 0)
//     ),
//     psbt,
//   };
// }