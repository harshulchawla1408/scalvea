import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg tracking-[0.2em] uppercase">Scalvea</h3>
            <p className="text-xs leading-relaxed opacity-60 tracking-wide">
              Nothing To Hide. Science-backed hair growth solutions formulated with transparency and clinical precision.
            </p>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h4 className="text-xs tracking-[0.15em] uppercase">Shop</h4>
            <div className="flex flex-col space-y-2">
              <Link to="/shop" className="text-xs opacity-60 hover:opacity-100 transition-opacity">All Products</Link>
              <Link to="/shop?category=Serums" className="text-xs opacity-60 hover:opacity-100 transition-opacity">Serums</Link>
              <Link to="/shop?category=Sprays" className="text-xs opacity-60 hover:opacity-100 transition-opacity">Sprays</Link>
            </div>
          </div>

          {/* Help */}
          <div className="space-y-4">
            <h4 className="text-xs tracking-[0.15em] uppercase">Help</h4>
            <div className="flex flex-col space-y-2">
              <Link to="/contact" className="text-xs opacity-60 hover:opacity-100 transition-opacity">Contact Us</Link>
              <Link to="/shipping-policy" className="text-xs opacity-60 hover:opacity-100 transition-opacity">Shipping Policy</Link>
              <Link to="/returns-policy" className="text-xs opacity-60 hover:opacity-100 transition-opacity">Returns & Refunds</Link>
              <Link to="/privacy-policy" className="text-xs opacity-60 hover:opacity-100 transition-opacity">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-xs opacity-60 hover:opacity-100 transition-opacity">Terms of Service</Link>
              <Link to="/faq" className="text-xs opacity-60 hover:opacity-100 transition-opacity">FAQ</Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-xs tracking-[0.15em] uppercase">Contact</h4>
            <div className="flex flex-col space-y-2 text-xs opacity-60">
              <p>263 Heaths Rd, Werribee</p>
              <p>VIC 3030, Australia</p>
              <a href="tel:+61460309333" className="hover:opacity-100 transition-opacity">
                +61 460 309 333
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 px-6 lg:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[10px] tracking-[0.1em] uppercase opacity-40">
          © {new Date().getFullYear()} Scalvea. All rights reserved.
        </p>
        <p className="text-[10px] tracking-[0.15em] uppercase opacity-40">
          Nothing To Hide
        </p>
      </div>
    </footer>
  );
};

export default Footer;
