import { model, models } from "mongoose";
import { FileDataSchema } from "./FileData";
const FileData = models.FileData || model("FileData", FileDataSchema);

export{
    FileData
}