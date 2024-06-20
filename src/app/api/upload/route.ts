import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import { FileData } from "@/models";
import { ICreateInscription, IDoc, IDocProcessed } from "@/types";
//@ts-ignore
import mime from "mime-types";
import { Tap, Script, Address, Signer, Tx } from "@cmdcode/tapscript";
import * as cryptoUtils from "@cmdcode/crypto-utils";
// Middleware to handle multipart/form-data
const parseForm = async (req: NextRequest) => {
  const formData = await req.formData();
  const file = formData.get("base64");
  return { file, formData };
};

export async function POST(req: NextRequest) {
  console.log("************upload api called********");
  try {
    // Parse form data
    const { file, formData } = await parseForm(req);
    console.log("Parsed file:", file);

    await dbConnect();
    console.log("Database connected");
    const base64 = formData.get("base64")?.toString();
    const file_name = formData.get("file_name")?.toString();
    const cardinal_address = formData.get("cardinal_address")?.toString();
    const cardinal_pubkey = formData.get("cardinal_pubkey")?.toString();
    const ordinal_address = formData.get("ordinal_address")?.toString();
    const ordinal_pubkey = formData.get("ordinal_pubkey")?.toString();
    const wallet = formData.get("wallet")?.toString();
    const order_id = formData.get("order_id")?.toString();

    if (
      !file_name ||
      !base64 ||
      !cardinal_address ||
      !cardinal_pubkey ||
      !ordinal_address ||
      !ordinal_pubkey ||
      !wallet ||
      !order_id
    ) {
      throw Error("Items missing");
    }

    let doc = {
      file_name,
      base64,
      cardinal_address,
      cardinal_pubkey,
      ordinal_address,
      ordinal_pubkey,
      wallet,
      order_id,
      status: "payment pending",
      fee_rate: 20,
    };

    console.log({ doc });

    const newDoc = await processFile(doc, "testnet");
console.log(newDoc)

    const inscription = await processInscription(
      newDoc,
      "testnet"
    );

    await FileData.create(inscription);
    console.log("File saved to database");

    return NextResponse.json({ message: "File uploaded successfully" });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Failed to upload file", error: error.message },
      { status: 500 }
    );
  }
}

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const PREFIX = 160;

async function processFile(
  doc: IDoc,
  network: "testnet" | "mainnet"
): Promise<ICreateInscription> {
  const file_name = doc.file_name;
  const mimeType = mime.lookup(file_name) || "application/octet-stream";
  const contentType = mime.contentType(file_name);

  let file_type = mimeType;
  if (mimeType.includes("text") && typeof contentType === "string") {
    file_type = contentType.split(" ").join("");
  }
  const file_size =
    (doc.base64.length * 3) / 4 -
    (doc.base64.endsWith("==") ? 2 : doc.base64.endsWith("=") ? 1 : 0);

  if (file_size > MAX_FILE_SIZE) {
    throw new Error(`File at index  exceeds the 3MB size limit`);
  }
  const base64 = doc.base64.split(",")[1];

  return {
    ...doc,
    privkey: "",
    ordinal_address: doc.ordinal_address,
    file_type: file_type,
    base64,
    file_size: file_size,
    inscription_address: "",
    txid: "",
    leaf: "",
    tapkey: "",
    cblock: "",
    inscription_fee: 0,
    inscription_id: "",
    network: network,
    status: "payment pending",
    fee_rate: doc.fee_rate,
  };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte: number) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

async function generatePrivateKey() {
  let isValid = false;
  let privkey;
  while (!isValid) {
    privkey = bytesToHex(cryptoUtils.Noble.utils.randomPrivateKey());
    const KeyPair = cryptoUtils.KeyPair;
    let seckey = new KeyPair(privkey);
    let pubkey = seckey.pub.rawX;
    const init_script = [pubkey, "OP_CHECKSIG"];
    let init_leaf = await Tap.tree.getLeaf(Script.encode(init_script));
    let [init_tapkey, init_cblock] = await Tap.getPubKey(pubkey, {
      target: init_leaf,
    });
    /**
     * This is to test IF the tx COULD fail.
     * This is most likely happening due to an incompatible key being generated.
     */
    const test_redeemtx = Tx.create({
      vin: [
        {
          txid: "a99d1112bcb35845fd44e703ef2c611f0360dd2bb28927625dbc13eab58cd968",
          vout: 0,
          prevout: {
            value: 10000,
            scriptPubKey: ["OP_1", init_tapkey],
          },
        },
      ],
      vout: [
        {
          value: 8000,
          scriptPubKey: ["OP_1", init_tapkey],
        },
      ],
    });
    const test_sig = await Signer.taproot.sign(seckey.raw, test_redeemtx, 0, {
      extension: init_leaf,
    });
    test_redeemtx.vin[0].witness = [test_sig.hex, init_script, init_cblock];
    isValid = await Signer.taproot.verify(test_redeemtx, 0, { pubkey });
    if (!isValid) {
      console.log("Invalid key generated, retrying...");
    } else {
      console.log({ privkey });
    }
  }
  if (!privkey) {
    throw Error("No privkey was generated");
  }
  return privkey;
}

async function processInscription(newDoc: IDocProcessed, network: "testnet" | "mainnet") {
  const ec = new TextEncoder();
  // let total_fee = 0;
  // Loop through all files
  const privkey = await generatePrivateKey();
  // Generate pubkey and seckey from privkey
  const KeyPair = cryptoUtils.KeyPair;
  const seckey = new KeyPair(privkey);
  const pubkey = seckey.pub.rawX;
  console.log({
    fee_rate:newDoc.fee_rate,
    data:newDoc.base64,
  });
  if(!newDoc.file_name){
    throw Error("File Name is missing")
  }
  // generate mimetype, plain if not present
  const mimeType = mime.lookup(newDoc.file_name);
  const contentType = mime.contentType(newDoc.file_name);

  let file_type = mimeType;
  if (mimeType && mimeType.includes("text") && typeof contentType === "string") {
    file_type = contentType.split(" ").join("");
  } // generate metaprotocol as we are creating CBRC
  // const metaprotocol = `cbrc-20:${file.op.toLowerCase()}:${file.tick
  //   .trim()
  //   .toLowerCase()}=${file.amt}`;
  // data can be whats shared by the frontend as base64
  const data = Buffer.from(newDoc.base64, "base64");

  if(!file_type){
    throw Error("Filetype not present")
  }
  // console.log({ metaprotocol, mimetype });
  // create the script using our derived info
  const script = [
    pubkey,
    "OP_CHECKSIG",
    "OP_0",
    "OP_IF",
    ec.encode("ord"),
    "01",
    ec.encode(file_type),
    // "07",
    // ec.encode(metaprotocol),
    "OP_0",
    data,
    "OP_ENDIF",
  ];
  // create leaf and tapkey and cblock
  const leaf = Tap.tree.getLeaf(Script.encode(script));
  const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: leaf });
  // Generated our Inscription Address
  //@ts-ignore
  let inscriptionAddress = Address.p2tr.encode(tapkey, network);
  console.debug("Inscription address: ", inscriptionAddress);
  console.debug("Tapkey:", tapkey);
  console.log(mimeType);
  // 6674960
  let txsize = PREFIX + Math.floor(data.length);
 
  let inscription_fee = newDoc.fee_rate * txsize * 3.5;
 newDoc.inscription_fee = inscription_fee;
  // total_fee += inscription_fee;
  console.log({ txsize, inscription_fee });
  const inscription = {
    ...newDoc,
    order_id:newDoc.order_id,
    privkey,
    leaf: leaf,
    tapkey: tapkey,
    cblock: cblock,
    inscription_address: inscriptionAddress,
    txsize: txsize,
    fee_rate:newDoc.fee_rate,
    network
  }

  return inscription
}
