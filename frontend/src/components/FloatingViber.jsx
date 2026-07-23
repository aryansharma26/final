import { MessageCircle } from 'lucide-react';

export default function FloatingViber() {
  const viberNumber = '+639778559579';
  const viberLink = `viber://chat?number=${encodeURIComponent(viberNumber)}`;

  const handleClick = (e) => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      navigator.clipboard?.writeText(viberNumber).catch(() => {});
      alert(`Viber chat only works on mobile devices with the Viber app installed.\n\nViber Number: ${viberNumber}\n\n(Copied to clipboard if supported)`);
    }
  };

  return (
    <a
      href={viberLink}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-24 right-5 z-50 flex items-center lg:bottom-6 lg:right-6"
      aria-label="Chat on Viber"
    >
      <span className="pointer-events-none absolute right-14 whitespace-nowrap bg-[#7360F2] text-white text-sm font-medium px-3 py-2 rounded-full shadow-lg opacity-0 transition-all duration-200 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 lg:right-16">
        Chat on Viber
      </span>
      <div
        className="w-12 h-12 rounded-full bg-[#7360F2] flex items-center justify-center shadow-[0_4px_30px_rgba(115,96,242,0.65)] hover:shadow-[0_6px_40px_rgba(115,96,242,0.85)] hover:scale-105 transition-transform duration-200 lg:h-14 lg:w-14"
      >
        <MessageCircle className="w-6 h-6 text-white fill-white lg:h-7 lg:w-7" />
      </div>
    </a>
  );
}
