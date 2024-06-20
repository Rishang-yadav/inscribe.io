import Image from "next/image";
import Homepage from "@/Views/Homepage/Index";
import FileUpload from "@/components/FileUpload";
export default function Home() {
  return (
    <div className="px-20 bg">
  <Homepage/>
<FileUpload/>
    </div>
  );
}
