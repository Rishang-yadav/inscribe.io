import axios from "axios";




export const addressReceivedMoneyInThisTx = async (
    address: string,
    network: string
  ) => {
    let txid, vout, amt, input_address, vsize;
  
    const url =
      process.env.NEXT_PUBLIC_NETWORK === "testnet"
        ? `https://mempool.space/testnet/api/address/${address}/txs`
        : `https://mempool-api.ordinalnovus.com/address/${address}/txs`;
    let { data } = await axios.get(url);
    let json = data;
    // console.dir(json, { depth: null });
  
    json.forEach(function (tx: {
      vin: any;
      weight: number;
      vout: { scriptpubkey_address: string; value: any }[];
      txid: any;
    }) {
      const vins = tx.vin;
      vsize = tx.weight / 4;
      input_address = null; // This will store the first encountered address
  
      for (let vin of vins) {
        // Store the first address encountered
        if (!input_address) {
          input_address = vin.prevout.scriptpubkey_address;
        }
  
        // If we find a v0_p2wpkh address, return it immediately
        if (vin.prevout.scriptpubkey_type === "v0_p2wpkh") {
          input_address = vin.prevout.scriptpubkey_address;
        }
      }
      tx.vout.forEach(function (
        output: { scriptpubkey_address: string; value: any },
        index: any
      ) {
        if (output.scriptpubkey_address === address) {
          txid = tx.txid;
          vout = index;
          amt = output.value;
        }
      });
    });
  
    return [txid, vout, amt, input_address, vsize];
  };


  export async function pushBTCpmt(rawtx: string, network: string) {
    const url =
      process.env.NEXT_PUBLIC_NETWORK === "testnet" || network === "testnet"
        ? `https://mempool.space/testnet/api/tx`
        : `https://mempool-api.ordinalnovus.com/tx`;
    try {
      const response = await axios.post(url, rawtx);
      return response.data; // or response.data.txid if the txid is in the data object
    } catch (error) {
      throw error; // Rethrow the error to handle it in the caller function
    }
  }