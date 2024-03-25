import { Schema, model } from "mongoose";

const codeSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  initCode: {
    type: String,
    required: true,
    unique: true,
  },
  solutionCode: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model("Code", codeSchema);
