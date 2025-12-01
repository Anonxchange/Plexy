import React, { useState } from "react";
import {
  Home,
  MessageSquare,
  HelpCircle,
  Search,
  X,
  ChevronRight,
} from "lucide-react";

const SupportInterface = () => {
  const [currentView, setCurrentView] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  const HomeView = () => (
    <div className="flex flex-col h-full relative">
      {/* Lime Green Header Section - Fixed */}
      <div className="bg-gradient-to-b from-[#B4F22E] to-[#A8D61F] px-6 pt-6 pb-32">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-black text-3xl font-bold">Pexly</h1>
          <button className="text-black">
            <X size={28} />
          </button>
        </div>

        <div className="flex gap-3 mb-8">
          <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center">
            <div className="text-2xl">🎮</div>
          </div>
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
            <div className="text-2xl">👤</div>
          </div>
          <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center">
            <div className="text-2xl">🤖</div>
          </div>
        </div>

        <div className="text-black">
          <div className="text-right text-lg mb-1">Trader User</div>
          <div className="text-4xl font-bold mb-2">Hi</div>
          <div className="text-lg">(Greeting)</div>
          <div className="text-3xl font-bold mt-4">How can we help you today?</div>
        </div>
      </div>

      {/* Gradient Fade Effect */}
      <div className="absolute top-[420px] left-0 right-0 h-12 bg-gradient-to-b from-[#A8D61F] to-transparent pointer-events-none z-10"></div>

      {/* Scrollable Content Area - Overlapping */}
      <div className="flex-1 -mt-24 relative z-20 overflow-auto">
        <div className="px-6 pb-24">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex justify-between items-center shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
            <div>
              <div className="font-semibold text-gray-900">Ask a question</div>
              <div className="text-gray-500 text-sm">We are here to help.</div>
            </div>
            <div className="bg-blue-600 p-2 rounded-lg">
              <MessageSquare className="text-white" size={24} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4 bg-white rounded-xl p-3">
              <Search className="text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for help"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-700"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 px-2 rounded">
                <span className="text-gray-700 text-sm">
                  How to create a Pexly account
                </span>
                <ChevronRight className="text-[#B4F22E]" size={20} />
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 px-2 rounded">
                <span className="text-gray-700 text-sm">How to buy crypto on P2P</span>
                <ChevronRight className="text-[#B4F22E]" size={20} />
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 px-2 rounded">
                <span className="text-gray-700 text-sm">
                  Understanding escrow system
                </span>
                <ChevronRight className="text-[#B4F22E]" size={20} />
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 px-2 rounded">
                <span className="text-gray-700 text-sm">
                  How to enable two-factor authentication
                </span>
                <ChevronRight className="text-[#B4F22E]" size={20} />
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 px-2 rounded">
                <span className="text-gray-700 text-sm">
                  Understanding trading fees
                </span>
                <ChevronRight className="text-[#B4F22E]" size={20} />
              </div>
              <div className="flex justify-between items-center py-3 cursor-pointer hover:bg-gray-100 px-2 rounded">
                <span className="text-gray-700 text-sm">
                  How to verify your account
                </span>
                <ChevronRight className="text-[#B4F22E]" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const HelpView = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Help center</h1>
          <button onClick={() => setCurrentView("home")}>
            <X size={28} className="text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-3">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search for help"
            className="flex-1 bg-transparent outline-none text-gray-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-1">
          {[
            {
              title: "Get Started",
              description: "Get started with secure trading",
            },
            {
              title: "Account - Security & Privacy",
              description: "Your privacy. Our priority.",
            },
            {
              title: "Wallet & Bank Transfer",
              description: "Pexly wallet and bank transfer tips",
            },
            {
              title: "Swap - Buy & Sell Crypto",
              description: "Buy & sell crypto instantly with Swap",
            },
            {
              title: "P2P Trading Guide",
              description: "Complete guide to P2P trading on Pexly",
              highlight: true,
            },
            {
              title: "Gift Cards & Rewards",
              description: "Earn and redeem rewards",
              highlight: true,
            },
            {
              title: "Referral Program - Event",
              description: "Earn crypto by inviting friends",
            },
            {
              title: "Other Knowledge",
              description: "Explore crypto & blockchain tips",
            },
          ].map((item, index) => (
            <div key={index} className="py-4 border-b border-gray-100">
              <div className="flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div>
                  <div
                    className={`mb-1 ${
                      item.highlight
                        ? "font-semibold text-[#B4F22E]"
                        : "font-semibold text-gray-900"
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-gray-500 text-sm">{item.description}</div>
                </div>
                <ChevronRight
                  className={item.highlight ? "text-[#B4F22E]" : "text-gray-400"}
                  size={24}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const MessagesView = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <button onClick={() => setCurrentView("home")}>
            <X size={28} className="text-gray-600" />
          </button>
        </div>

        <div className="flex gap-6">
          <button className="text-[#B4F22E] font-semibold border-b-2 border-[#B4F22E] pb-2">
            Open
          </button>
          <button className="text-gray-500 font-semibold pb-2">Done</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-gray-200 p-6 rounded-2xl mb-4">
          <MessageSquare size={32} className="text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-2">Messages</div>
        <div className="text-gray-500 mb-8">No messages yet</div>
        <button className="bg-[#B4F22E] text-black font-semibold px-8 py-4 rounded-full flex items-center gap-2 hover:bg-[#A8D61F] transition-colors shadow-lg">
          Send us a message
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen max-w-md mx-auto bg-white flex flex-col">
      <div className="flex-1 overflow-hidden">
        {currentView === "home" && <HomeView />}
        {currentView === "help" && <HelpView />}
        {currentView === "messages" && <MessagesView />}
      </div>

      <div className="border-t border-gray-200 bg-white">
        <div className="flex justify-around items-center py-3">
          <button
            onClick={() => setCurrentView("home")}
            className="flex flex-col items-center gap-1"
          >
            <Home
              size={24}
              className={
                currentView === "home" ? "text-[#B4F22E]" : "text-gray-600"
              }
            />
            <span
              className={`text-xs ${
                currentView === "home"
                  ? "text-[#B4F22E] font-semibold"
                  : "text-gray-600"
              }`}
            >
              Home
            </span>
          </button>
          <button
            onClick={() => setCurrentView("messages")}
            className="flex flex-col items-center gap-1"
          >
            <MessageSquare
              size={24}
              className={
                currentView === "messages" ? "text-[#B4F22E]" : "text-gray-600"
              }
            />
            <span
              className={`text-xs ${
                currentView === "messages"
                  ? "text-[#B4F22E] font-semibold"
                  : "text-gray-600"
              }`}
            >
              Messages
            </span>
          </button>
          <button
            onClick={() => setCurrentView("help")}
            className="flex flex-col items-center gap-1"
          >
            <HelpCircle
              size={24}
              className={
                currentView === "help" ? "text-[#B4F22E]" : "text-gray-600"
              }
            />
            <span
              className={`text-xs ${
                currentView === "help"
                  ? "text-[#B4F22E] font-semibold"
                  : "text-gray-600"
              }`}
            >
              Help
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportInterface;
