import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function FloatingContactButtons() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const handleToggle = () => {
    if (open) {
      setClosing(true);
      timeoutRef.current = setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 280);
    } else {
      setOpen(true);
      setClosing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setClosing(true);
        timeoutRef.current = setTimeout(() => {
          setOpen(false);
          setClosing(false);
        }, 280);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  const contacts = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      number: '+917015008916',
      href: 'https://wa.me/917015008916',
      color: '#25D366',
      shadow: 'rgba(37,211,102,0.65)',
      shadowHover: 'rgba(37,211,102,0.85)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.979 2.898a9.825 9.825 0 012.893 6.98c-.004 5.45-4.435 9.884-9.885 9.884m8.413-18.3A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.13 1.59 5.94L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
        </svg>
      ),
    },
    {
      id: 'messenger',
      label: 'Messenger',
      href: 'https://www.facebook.com/geeta.sharma223',
      color: '#0084FF',
      shadow: 'rgba(0,132,255,0.65)',
      shadowHover: 'rgba(0,132,255,0.85)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13"/>
        </svg>
      ),
    },
    {
      id: 'viber',
      label: 'Viber',
      number: '+639778559579',
      href: 'viber://chat?number=%2B639778559579',
      color: '#7360F2',
      shadow: 'rgba(115,96,242,0.65)',
      shadowHover: 'rgba(115,96,242,0.85)',
      icon: <MessageCircle className="w-5 h-5 text-white fill-white" />,
    },
  ];

  const handleViberClick = (e, number) => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      navigator.clipboard?.writeText(number).catch(() => {});
      alert(`Viber chat only works on mobile devices with the Viber app installed.\n\nViber Number: ${number}\n\n(Copied to clipboard if supported)`);
    }
  };

  const isVisible = open || closing;

  return (
    <div ref={containerRef} className="fixed bottom-24 right-5 z-50 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
      {isVisible && (
        <div className="flex flex-col items-end gap-3 mb-1">
          {contacts.map((contact, index) => (
            <a
              key={contact.id}
              href={contact.href}
              onClick={contact.id === 'viber' ? (e) => handleViberClick(e, contact.number) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-0 transition-all duration-300 hover:gap-2 ${closing ? 'animate-slide-down' : 'animate-slide-up'}`}
              style={{ animationDelay: closing ? `${(contacts.length - 1 - index) * 0.05}s` : `${index * 0.06}s` }}
              aria-label={`Chat on ${contact.label}`}
            >
              <span
                className="hidden group-hover:inline-block whitespace-nowrap text-white text-sm font-medium px-3 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                style={{ backgroundColor: contact.color }}
              >
                {contact.label}
              </span>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 lg:h-14 lg:w-14"
                style={{
                  backgroundColor: contact.color,
                  boxShadow: `0 4px 30px ${contact.shadow}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 6px 40px ${contact.shadowHover}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 30px ${contact.shadow}`; }}
              >
                {contact.icon}
              </div>
            </a>
          ))}
        </div>
      )}

      <button
        onClick={handleToggle}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 lg:h-14 lg:w-14 ${!isVisible ? 'animate-messenger-pulse' : ''}`}
        style={{
          backgroundColor: '#2563EB',
          boxShadow: '0 4px 30px rgba(37,99,235,0.55), 0 0 0 0 rgba(37,99,235,0.75)',
        }}
        aria-label="Contact options"
      >
        {isVisible ? (
          <X className="w-6 h-6 text-white lg:h-7 lg:w-7" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white lg:h-7 lg:w-7" />
        )}
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.25s ease-out both;
        }
        .animate-slide-down {
          animation: slideDown 0.2s ease-in both;
        }
        @keyframes messenger-pulse {
          0% {
            box-shadow: 0 4px 30px rgba(37,99,235,0.55), 0 0 0 0 rgba(37,99,235,0.7);
          }
          70% {
            box-shadow: 0 6px 40px rgba(37,99,235,0.65), 0 0 0 10px rgba(37,99,235,0);
          }
          100% {
            box-shadow: 0 4px 30px rgba(37,99,235,0.55), 0 0 0 0 rgba(37,99,235,0);
          }
        }
        .animate-messenger-pulse {
          animation: messenger-pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}
