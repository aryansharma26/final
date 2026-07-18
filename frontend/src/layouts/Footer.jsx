import { Link } from 'react-router-dom';
import { Facebook, X, Instagram, Youtube, Linkedin, Mail, Phone, MapPin, CreditCard, Shield, Truck, Heart } from 'lucide-react';

import logo from '../assets/logo.png';
const Footer = () => {
  const getLinkRoute = (link) => {
    const routeMap = {
      'About Us': '/about',
      'Careers': '/about',
      'Blog': '/about',
      'Press': '/about',
      'Partners': '/about',
      'Contact Us': '/about',
      'FAQs': '/about',
      'Shipping Info': '/shipping-policy',
      'Returns': '/refund-policy',
      'Order Tracking': '/orders',
      'Privacy Policy': '/privacy',
      'Terms of Service': '/terms',
      'Cookie Policy': '/privacy',
      'Refund Policy': '/refund-policy',
      'Disclaimer': '/terms',
      'Doctor Consultation': '/doctors',
      'Lab Tests': '/about',
      'Health Articles': '/about',
      'Insurance': '/about',
      'Corporate Wellness': '/about',
    };
    return routeMap[link] || '/';
  };

  const footerLinks = {
    'Company': ['About Us', 'Careers', 'Blog', 'Press', 'Partners'],
    'Support': ['Contact Us', 'FAQs', 'Shipping Info', 'Returns', 'Order Tracking'],
    'Policies': ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy', 'Disclaimer'],
    'Services': ['Doctor Consultation', 'Lab Tests', 'Health Articles', 'Insurance', 'Corporate Wellness'],
  };

  return (
    <footer className="bg-white text-gray-800">
      {/* Features bar */}
      <div className="border-b border-gray-200">
        <div className="container-custom py-3.5 sm:py-8">
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-brand" />
              </div>
              <div>
                <p className="text-gray-900 font-medium text-xs sm:text-sm">100% Genuine</p>
                <p className="text-[11px] leading-tight text-gray-500 sm:text-xs">Certified products only</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                <Truck className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-brand" />
              </div>
              <div>
                <p className="text-gray-900 font-medium text-xs sm:text-sm">Free Shipping</p>
                <p className="text-xs text-gray-500">On orders above ₱500</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-brand" />
              </div>
              <div>
                <p className="text-gray-900 font-medium text-xs sm:text-sm">Secure Payment</p>
                <p className="text-[11px] leading-tight text-gray-500 sm:text-xs">Encrypted transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                <Heart className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-brand" />
              </div>
              <div>
                <p className="text-gray-900 font-medium text-xs sm:text-sm">Dedicated Support</p>
                <p className="text-[11px] leading-tight text-gray-500 sm:text-xs">Always here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-custom py-3 sm:py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3 md:gap-8 lg:grid-cols-6">
          {/* Brand column */}
           <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="pressable flex items-center gap-2.5 -mb-3 sm:mb-4">
              <div className="w-52 h-auto sm:w-60">
                <img src={logo} alt="Capsandpills" className="w-full h-full object-contain" />
              </div>
              
            </Link>
            <p className="text-xs leading-relaxed text-gray-600 mb-3 max-w-xs sm:text-sm sm:mb-4">
              Your trusted online pharmacy for genuine medicines, healthcare products, and wellness solutions delivered to your doorstep.
            </p>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600 sm:text-sm">
                <Phone className="w-4 h-4 text-brand" />
                <span>+63 2 8123 4567</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 sm:text-sm">
                <Mail className="w-4 h-4 text-brand" />
                <span>support@capsandpills.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 sm:text-sm">
                <MapPin className="w-4 h-4 text-brand" />
                <span>Las Piñas, Philippines</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-gray-900 font-semibold text-sm mb-2 sm:mb-4">{title}</h4>
              <ul className="space-y-1.5 sm:space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      to={getLinkRoute(link)}
                      className="pressable text-xs text-gray-600 hover:text-brand transition-colors sm:text-sm"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="container-custom pt-6 pb-[90px] lg:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Capsandpills. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Follow us:</span>
              <div className="flex items-center gap-3">
                <a href="https://www.facebook.com/capsandpills" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-100 hover:bg-brand rounded-full flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4 text-gray-700 hover:text-white" />
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-100 hover:bg-brand rounded-full flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-gray-700 hover:text-white" />
                </a>
                <a href="https://www.instagram.com/capsandpills/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-100 hover:bg-brand rounded-full flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4 text-gray-700 hover:text-white" />
                </a>
                <a href="https://www.youtube.com/@Capsandpills" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-100 hover:bg-brand rounded-full flex items-center justify-center transition-colors">
                  <Youtube className="w-4 h-4 text-gray-700 hover:text-white" />
                </a>
                <a href="https://linkedin.com/company/capsandpills" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-100 hover:bg-brand rounded-full flex items-center justify-center transition-colors">
                  <Linkedin className="w-4 h-4 text-gray-700 hover:text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
