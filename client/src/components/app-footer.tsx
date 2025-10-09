import { Zap } from "lucide-react";
import { SiX, SiTelegram, SiFacebook, SiInstagram } from "react-icons/si";

export function AppFooter() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Pexly</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              The people-powered way to move money globally.
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover-elevate active-elevate-2 p-2 rounded-lg" data-testid="link-twitter">
                <SiX className="h-5 w-5 text-muted-foreground" />
              </a>
              <a href="#" className="hover-elevate active-elevate-2 p-2 rounded-lg" data-testid="link-telegram">
                <SiTelegram className="h-5 w-5 text-muted-foreground" />
              </a>
              <a href="#" className="hover-elevate active-elevate-2 p-2 rounded-lg" data-testid="link-facebook">
                <SiFacebook className="h-5 w-5 text-muted-foreground" />
              </a>
              <a href="#" className="hover-elevate active-elevate-2 p-2 rounded-lg" data-testid="link-instagram">
                <SiInstagram className="h-5 w-5 text-muted-foreground" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-buy-crypto">Buy Crypto</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-sell-crypto">Sell Crypto</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-wallet-footer">Wallet</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-api">API</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">About</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-careers">Careers</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-blog">Blog</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-support">Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-cookies">Cookie Policy</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-aml">AML Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2024 Pexly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}