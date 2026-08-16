import { WhatsappIcon } from "./ui/whatsapp-icon";
import { useLocation } from "react-router-dom";

const FloatingWhatsApp = () => {
  const location = useLocation();

  // Hide on admin pages to prevent clashing with admin UI
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <a
      href="https://wa.me/61494754851?text=Hi%20Scalvea%2C%20I%20would%20like%20to%20know%20more%20about%20your%20premium%20hair%20care%20products."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[84px] lg:bottom-6 right-4 lg:right-6 z-[99] flex items-center justify-center w-[52px] h-[52px] lg:w-14 lg:h-14 bg-[#111111] text-white rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:bg-[#222222] hover:scale-105 hover:-translate-y-1 transition-all duration-300"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsappIcon className="w-6 h-6 lg:w-7 lg:h-7" />
    </a>
  );
};

export default FloatingWhatsApp;
