"use client";

interface DocTypeIconProps {
  fileType: string;
  fileName: string;
  className?: string;
}

function getDocStyle(fileType: string, fileName: string): { bg: string; color: string; label: string } {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (fileType === "application/pdf" || ext === "pdf") {
    return { bg: "bg-red-100", color: "text-red-600", label: "PDF" };
  }
  if (
    fileType.includes("spreadsheet") ||
    fileType.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(ext)
  ) {
    return { bg: "bg-emerald-100", color: "text-emerald-600", label: ext.toUpperCase() };
  }
  if (
    fileType.includes("word") ||
    fileType.includes("document") ||
    ["doc", "docx"].includes(ext)
  ) {
    return { bg: "bg-blue-100", color: "text-blue-600", label: "DOC" };
  }
  if (fileType.startsWith("text/") || ["txt", "md", "rtf"].includes(ext)) {
    return { bg: "bg-gray-100", color: "text-gray-600", label: "TXT" };
  }
  return { bg: "bg-slate-100", color: "text-slate-500", label: ext.toUpperCase().slice(0, 3) || "FILE" };
}

export default function DocTypeIcon({ fileType, fileName, className = "w-10 h-10" }: DocTypeIconProps) {
  const style = getDocStyle(fileType, fileName);

  return (
    <div
      className={`${className} rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}
    >
      <span className={`text-[10px] font-bold tracking-wide ${style.color}`}>
        {style.label}
      </span>
    </div>
  );
}
