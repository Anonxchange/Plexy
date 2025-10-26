import { Zap, Apple, Smartphone } from "lucide-react";
import { SiX, SiTelegram, SiFacebook, SiInstagram, SiLinkedin, SiYoutube } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function AppFooter() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 lg:mb-12 pb-6 lg:pb-8 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-white">plexy</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-sm text-gray-400 sm:mr-2">Download App:</span>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="bg-transparent border-gray-700 hover:bg-gray-800">
                <Apple className="h-4 w-4 mr-1" />
                iOS
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent border-gray-700 hover:bg-gray-800">
                <Smartphone className="h-4 w-4 mr-1" />
                Android
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8 mb-8 lg:mb-12">
          <div>
            <h3 className="font-semibold text-white mb-4">Trade crypto</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-white transition-colors">Buy Bitcoin</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Buy Ethereum</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Buy Tether</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Buy USDC</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Trade crypto</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-white transition-colors">Sell Bitcoin</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Sell Ethereum</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Sell Tether</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Sell USDC</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">About Plexu</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-white transition-colors">About us</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Reviews</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Useful links</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-white transition-colors">Plexu Wallet</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Support</a></li>
              <li><Link href="/bitcoin-calculator" className="text-sm hover:text-white transition-colors">Bitcoin Calculator</Link></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Peer-to-Peer Market Prices</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-white transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Vendor Reminder</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">AML Policy</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Privacy Notice</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Restricted Countries</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">VIP Program T&C</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 lg:gap-4 mb-6 lg:mb-8">
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors">
            <SiX className="h-4 w-4 text-black" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors">
            <SiLinkedin className="h-4 w-4 text-black" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors">
            <SiTelegram className="h-4 w-4 text-black" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors">
            <SiInstagram className="h-4 w-4 text-black" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors">
            <SiFacebook className="h-4 w-4 text-black" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors">
            <SiYoutube className="h-4 w-4 text-black" />
          </a>
        </div>

        <div className="text-xs text-gray-500 leading-relaxed mb-4 lg:mb-6 px-2">
          <p className="text-center sm:text-left">"PLEXY" is a registered trademark of Plexy, Inc. Copyright © 2024 Plexy, Inc. All Rights Reserved. Plexy Inc. has no relationship to MoneyGram, Western Union, Payoneer, WorldRemit, Paxum, PayPal, Amazon, OkPay, Payza, Walmart, Reloadit, Perfect Money, WebMoney, Google Wallet, BlueBird, Serve, Square Cash, NetSpend, Chase QuickPay, Skrill, Vanilla, MyVanilla, OneVanilla, Neteller, Venmo, Apple, ChimpChange or any other payment method. We make no claims about being supported by or supporting these services. Their respective wordmarks and trademarks belong to them alone.</p>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Copyright 2024 Plexy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}