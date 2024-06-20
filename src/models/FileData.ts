import mongoose from "mongoose";

const { Schema } = mongoose;

export  const FileDataSchema = new Schema({
  base64: {
    type: String,
    required: true,
  },
  cardinal_address: {
    type: String,
    required: true,
  },
  cardinal_pubkey: {
    type: String,
    required: true,
  },
  ordinal_address: {
    type: String,
    required: true,
  },
  ordinal_pubkey: {
    type: String,
    required: true,
  },
  wallet: {
    type: String,
    required: true,
  },
  order_id: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  file_name:{
    type:String,
    required:true
  },
  privkey: {
    type: String,
    required: true,
  },
  file_type: {
    type: String,
    required: true,
  },
  file_size: {
    type: Number,
    required: true,
  },
  inscription_address: {
    type: String,
    required: true,
  },
  txid: {
    type: String,
    required: false,
  },
  leaf: {
    type: String,
    required: true,
  },
  tapkey: {
    type: String,
    required: true,
  },
  cblock: {
    type: String,
    required: true,
  },
  inscription_fee: {
    type: Number,
    required: true,
  },
  inscription_id: {
    type: String,
    required: false,
  },
  network: {
    type: String,
    enum: ['testnet', 'mainnet'],
    required: true,
  },
  fee_rate: {
    type: Number,
    required: true,
  },
});
