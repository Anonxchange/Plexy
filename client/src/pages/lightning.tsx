import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { QRCodeSVG as QRCode } from "qrcode.react";

declare global {
  interface Window {
    Opennode?: any;
  }
}

export default function Lightning() {
  const { user, session } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"receive" | "send">("receive");
  const containerRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState("");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ lightning_invoice: string; amount: string } | null>(null);
  const [sendInvoice, setSendInvoice] = useState("");
  const [copied, setCopied] = useState(false);
  const [lightningBalance, setLightningBalance] = useState<string>("0.00");
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    // Load OpenNode script
    const script = document.createElement("script");
    script.src = "https://checkout.opennode.com/checkout.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    // Load Lightning balance on mount
    fetchLightningBalance();
    
    // Set up periodic refresh every 30 seconds to catch webhook updates
    const interval = setInterval(() => {
      fetchLightningBalance();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [session?.access_token]);

  const fetchLightningBalance = async () => {
    if (!session?.access_token) return;
    
    setLoadingBalance(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL not configured');
      
      // TODO: Fetch Lightning balance from OpenNode API
      // For now, showing placeholder balance
      setLightningBalance("0.00");
    } catch (error) {
      console.error('Error fetching Lightning balance:', error);
