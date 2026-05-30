import { site } from "@/lib/site";
import { WhatsApp } from "@/components/icons";

export default function WhatsAppFloat() {
  return (
    <a
      href={site.whatsappHref}
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp"
      className="fixed bottom-5 end-5 z-50 w-14 h-14 rounded-full bg-[#25D366] grid place-items-center shadow-2xl hover:scale-110 transition"
    >
      <WhatsApp className="w-7 h-7 text-white" />
    </a>
  );
}
