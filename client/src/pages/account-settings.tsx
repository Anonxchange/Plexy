import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { getCountryInfo, getCountryPhoneCode, getAllCountryNames, countries } from "@/lib/localization";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { createAccountChangeNotification } from "@/lib/notifications-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PhoneVerification } from "@/components/phone-verification";
import { PhoneLinkingDialog } from "@/components/phone-linking-dialog";
import { EmailLinkingDialog } from "@/components/email-linking-dialog";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Globe,
  Bell,
  Shield,
  Smartphone,
  Building2,
  Code,
  CheckCircle2,
  Link2,
  Info,
  Upload,
  HelpCircle,
  Menu,
  X,
  Wallet,
  Search,
  Check,
  ChevronsUpDown,
  Copy,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TwoFactorSetupDialog } from "@/components/two-factor-setup-dialog";
import { HardwareKeySetup } from "@/components/hardware-key-setup";
import { PasskeySetup } from "@/components/passkey-setup";
import { WithdrawalWhitelistDialog } from "@/components/withdrawal-whitelist-dialog";
import { IPWhitelistDialog } from "@/components/ip-whitelist-dialog";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import * as OTPAuth from "otpauth";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "localization", label: "Localization", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "payment", label: "Payment Accounts", icon: Building2 },
  { id: "developer", label: "Developer", icon: Code },
  { id: "verification", label: "Verification", icon: CheckCircle2 },
  { id: "connected", label: "Connected Apps & Websites", icon: Link2 },
  { id: "security-questions", label: "Security Questions", icon: Info },
];

export default function AccountSettings() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();

  // Parse section from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const sectionFromUrl = urlParams.get('section');
  const [activeSection, setActiveSection] = useState(sectionFromUrl || "profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nameDisplay, setNameDisplay] = useState("hide");
  const [phoneVerified, setPhoneVerified] = useState(true);
  const [showPhoneVerificationDialog, setShowPhoneVerificationDialog] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState("");
  const [pendingCountryCode, setPendingCountryCode] = useState("");
  // Email change states
  const [showEmailChangeDialog, setShowEmailChangeDialog] = useState(false);

  // Verification Data
  const [verificationLevel, setVerificationLevel] = useState(0);
  const [loadingVerification, setLoadingVerification] = useState(true);

  // Profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [countryCodeForPhone, setCountryCodeForPhone] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [country, setCountry] = useState(""); // Added state for country

  // Security settings
  const [smsAuth, setSmsAuth] = useState(false);
  const [appAuth, setAppAuth] = useState(false);
  const [emailAuth, setEmailAuth] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSMS2FADialog, setShowSMS2FADialog] = useState(false);
  const [showEmail2FADialog, setShowEmail2FADialog] = useState(false);
  const [smsVerificationCode, setSmsVerificationCode] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);

  // Delete account states
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Notification settings
  const [tradeUpdates, setTradeUpdates] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newOffers, setNewOffers] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Payment method dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showOnlineWalletDialog, setShowOnlineWalletDialog] = useState(false);
  const [showMobileMoneyDialog, setShowMobileMoneyDialog] = useState(false);
  const [bankDialogStep, setBankDialogStep] = useState(1);
  const [accountType, setAccountType] = useState("Personal");
  const [accountCountry, setAccountCountry] = useState("");
  const [accountCurrency, setAccountCurrency] = useState("");
  const [paymentBankName, setPaymentBankName] = useState("");
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentAccountName, setPaymentAccountName] = useState("");
  const [paymentBankCode, setPaymentBankCode] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [onlineWallets, setOnlineWallets] = useState<any[]>([]);
  const [mobileMoneyWallets, setMobileMoneyWallets] = useState<any[]>([]);

  // Online wallet fields
  const [walletProvider, setWalletProvider] = useState("");
  const [walletEmail, setWalletEmail] = useState("");
  const [walletUsername, setWalletUsername] = useState("");

  // Mobile money fields
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [mobileMoneyName, setMobileMoneyName] = useState("");

  

  // Hardware Security Key states
  const [hardwareKeys, setHardwareKeys] = useState<any[]>([]);
  const [loadingHardwareKeys, setLoadingHardwareKeys] = useState(true);
  const [showAddHardwareKeyDialog, setShowAddHardwareKeyDialog] = useState(false);
  const [hardwareKeyName, setHardwareKeyName] = useState("");


  // Online Wallet Providers
  const onlineWalletProviders = [
    "PayPal",
    "Venmo",
    "Cash App",
    "Zelle",
    "Wise (TransferWise)",
    "Revolut",
    "Skrill",
    "Neteller",
    "Perfect Money",
    "WebMoney",
    "Payoneer",
    "Apple Pay",
    "Google Pay",
    "Other"
  ];

  // Mobile Money Providers
  const mobileMoneyProviders = [
    "M-Pesa",
    "Airtel Money",
    "MTN Mobile Money",
    "Vodacom M-Pesa",
    "Orange Money",
    "Tigo Pesa",
    "GCash",
    "PayMaya",
    "Paytm",
    "PhonePe",
    "Alipay",
    "WeChat Pay",
    "Other"
  ];

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    } else if (user) {
      fetchProfileData();
      fetchVerificationLevel();
      fetchPaymentMethods();
      fetch2FAStatus();
      fetchHardwareKeys(); // Fetch hardware keys on component mount
    }
  }, [user, loading]);

  // Set country and currency from profile data
  useEffect(() => {
    if (profileData) {
      if (profileData.country) {
        // Only update if we don't have a country set yet
        if (!accountCountry) {
          setAccountCountry(profileData.country);
        }
      }

      // Set currency - prefer user's saved currency, then country's currency
      if (!currency) {
        if (profileData.preferred_currency) {
          setCurrency(profileData.preferred_currency);
        } else if (profileData.country) {
          const countryInfo = getCountryInfo(profileData.country);
          setCurrency(countryInfo.currencyCode);
        } else {
          // Default to USD only if no country is set
          setCurrency("USD");
        }
      }

      if (profileData.phone_number) {
        setPhone(profileData.phone_number);
      }
    }
  }, [profileData, currency]);

  // Load country from profile on mount
  useEffect(() => {
    if (user) {
      fetchProfileData();
      // Also try to load country from user metadata if not in profile
      if (!country && user.user_metadata?.country) {
        setCountry(user.user_metadata.country);
      }
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      // First get the latest auth user data
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (data) {
        setProfileData(data);
        console.log('Profile data loaded:', data);

        // Set 2FA status from profile data
        const hasSecret = !!data.two_factor_secret;
        const isAppAuthEnabled = data.two_factor_enabled === true || hasSecret;
        console.log('2FA from profile data:', {
          two_factor_enabled: data.two_factor_enabled,
          hasSecret,
          isAppAuthEnabled
        });
        setTwoFactorEnabled(isAppAuthEnabled);
        setAppAuth(isAppAuthEnabled);
        setSmsAuth(data.sms_two_factor_enabled === true);
        setEmailAuth(data.email_two_factor_enabled === true);

        // Only update fields if user is not currently editing them
        if (!isEditingUsername) {
          setUsername(data.username || '');
        }
        if (!isEditingBio) {
          setBio(data.bio || '');
        }

        // Set country and currency based on user's profile
        if (data.country) {
          setAccountCountry(data.country);
          const countryInfo = getCountryInfo(data.country);
          setAccountCurrency(countryInfo.currency);
          // Set phone code based on user's country if not editing
          if (!isEditingPhone) {
            setCountryCodeForPhone(countryInfo.phoneCode);
          }
        }

        // Load phone number - prioritize auth user phone, then profile phone_number
        // Only update if user is not currently editing the phone field
        if (!isEditingPhone) {
          const fullPhone = authUser?.phone || data.phone_number || data.phone || '';
          if (fullPhone) {
            // Try to extract country code from the phone number
            const userCountryCode = getCountryPhoneCode(data.country);
            const codes = [userCountryCode, '+234', '+1', '+44', '+91', '+254', '+233', '+27'];
            const matchedCode = codes.find(code => fullPhone.startsWith(code));
            if (matchedCode) {
              setCountryCodeForPhone(matchedCode);
              setPhone(fullPhone.replace(matchedCode, ''));
            } else {
              setPhone(fullPhone);
            }
          }
        }

        // Check phone verification from both auth and profile
        const isVerified = authUser?.phone_confirmed_at ? true : (data.phone_verified || false);
        setPhoneVerified(isVerified);
        setCurrency(data.preferred_currency?.toUpperCase() || 'USD');

        // Set country from profile if available
        if (data.country && !country) {
          setCountry(data.country);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchVerificationLevel = async () => {
    setLoadingVerification(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('verification_level')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.verification_level !== undefined) {
        setVerificationLevel(Number(data.verification_level));
      } else {
        setVerificationLevel(0); // Default to Level 0 if no record found
      }
    } catch (error) {
      console.error('Error fetching verification level:', error);
      setVerificationLevel(0); // Default to Level 0 on error
    } finally {
      setLoadingVerification(false);
    }
  };


  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      const allMethods = data || [];

      // Separate by payment type
      setPaymentMethods(allMethods.filter(m => m.payment_type === 'Bank Transfer'));
      setOnlineWallets(allMethods.filter(m => m.payment_type === 'Online Wallet'));
      setMobileMoneyWallets(allMethods.filter(m => m.payment_type === 'Mobile Money'));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  

  const fetch2FAStatus = async () => {
    // Must have valid user ID to query
    if (!user?.id) {
      console.log('fetch2FAStatus: No user ID available yet');
      return;
    }
    
    try {
      console.log('fetch2FAStatus: Querying for user ID:', user.id);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('two_factor_enabled, two_factor_secret, sms_two_factor_enabled, email_two_factor_enabled')
        .eq('id', user.id)
        .single();

      console.log('fetch2FAStatus: Query result:', { data, error });

      if (error) {
        // PGRST116 = no rows found, which is okay for new users
        if (error.code !== 'PGRST116') {
          throw error;
        }
        console.log('fetch2FAStatus: No profile found (new user)');
        return;
      }

      if (data) {
        // Check both the boolean flag AND if a secret exists (for legacy data)
        const hasSecret = !!data.two_factor_secret;
        const isAppAuthEnabled = data.two_factor_enabled === true || hasSecret;
        
        console.log('fetch2FAStatus: Setting 2FA state:', {
          hasSecret,
          two_factor_enabled: data.two_factor_enabled,
          isAppAuthEnabled,
          sms: data.sms_two_factor_enabled,
          email: data.email_two_factor_enabled
        });
        
        setTwoFactorEnabled(isAppAuthEnabled);
        setAppAuth(isAppAuthEnabled);
        setSmsAuth(data.sms_two_factor_enabled === true);
        setEmailAuth(data.email_two_factor_enabled === true);
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    }
  };

  const fetchHardwareKeys = async () => {
    setLoadingHardwareKeys(true);
    try {
      const { data, error } = await supabase
        .from('hardware_security_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHardwareKeys(data || []);
    } catch (error) {
      console.error('Error fetching hardware keys:', error);
    } finally {
      setLoadingHardwareKeys(false);
    }
  };

  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [showBackupPhrase, setShowBackupPhrase] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [isVerifyingBackupPassword, setIsVerifyingBackupPassword] = useState(false);

  const handleShowBackupPhrase = async () => {
    if (!backupPassword) {
      toast({
        title: "Password Required",
        description: "Please enter your account password to view your recovery phrase",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingBackupPassword(true);
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const wallets = nonCustodialWalletManager.getNonCustodialWallets(user.id);
      if (wallets.length === 0) {
        throw new Error("No non-custodial wallet found. Please create a wallet first.");
      }
      
      // Try to decrypt the mnemonic with the provided password
      const mnemonicPhrase = nonCustodialWalletManager.getWalletMnemonic(
        wallets[0].id,
        backupPassword,
        user.id
      );
      
      if (!mnemonicPhrase) {
        throw new Error("Failed to decrypt recovery phrase. Please check your password and try again.");
      }
      
      setMnemonic(mnemonicPhrase);
      setShowBackupPhrase(true);
      setBackupPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to access recovery phrase",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingBackupPassword(false);
    }
  };

  const handleSendSMSCode = async () => {
    if (!phone) {
      toast({
        title: "Phone Required",
        description: "Please add a phone number to your profile first",
        variant: "destructive",
      });
      return;
    }

    setSendingSMS(true);
    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code in database with expiry (5 minutes)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          sms_verification_code: code,
          sms_code_expires_at: expiresAt
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Send SMS via edge function
      const { error: smsError } = await supabase.functions.invoke('send-sms', {
        body: {
          phone: phone,
          code: code
        }
      });

      if (smsError) throw smsError;

      setSmsSent(true);
      toast({
        title: "Code Sent",
        description: `Verification code sent to ${phone}`,
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setSendingSMS(false);
    }
  };

  const handleEnableSMS2FA = async () => {
    try {
      // Verify the code
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('sms_verification_code, sms_code_expires_at')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData?.sms_verification_code) {
        throw new Error('No verification code found');
      }

      const expiresAt = new Date(profileData.sms_code_expires_at);
      if (expiresAt < new Date()) {
        throw new Error('Verification code has expired');
      }

      if (profileData.sms_verification_code !== smsVerificationCode) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect",
          variant: "destructive",
        });
        return;
      }

      // Enable SMS 2FA
      const { error } = await supabase
        .from('user_profiles')
        .update({
          sms_two_factor_enabled: true,
          sms_verification_code: null,
          sms_code_expires_at: null
        })
        .eq('id', user?.id);

      if (error) throw error;

      setSmsAuth(true);
      setShowSMS2FADialog(false);
      setSmsVerificationCode("");
      setSmsSent(false);

      // Create account change notification
      if (user?.id) {
        await createAccountChangeNotification(user.id, '2fa_enabled', { 
          method: 'SMS',
          timestamp: new Date().toISOString()
        });
      }

      toast({
        title: "SMS 2FA Enabled",
        description: "SMS two-factor authentication has been enabled",
      });
    } catch (error: any) {
      console.error('Error enabling SMS 2FA:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enable SMS 2FA",
        variant: "destructive",
      });
    }
  };

  const handleDisableSMS2FA = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          sms_two_factor_enabled: false
        })
        .eq('id', user?.id);

      if (error) throw error;

      setSmsAuth(false);

      // Create account change notification
      if (user?.id) {
        await createAccountChangeNotification(user.id, '2fa_disabled', { 
          method: 'SMS',
          timestamp: new Date().toISOString()
        });
      }

      toast({
        title: "SMS 2FA Disabled",
        description: "SMS two-factor authentication has been disabled",
      });
    } catch (error) {
      console.error('Error disabling SMS 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable SMS 2FA",
        variant: "destructive",
      });
    }
  };

  const handleSendEmailCode = async () => {
    if (!user?.email) {
      toast({
        title: "Email Required",
        description: "No email address associated with your account",
        variant: "destructive",
      });
      return;
    }

    setSendingEmailCode(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          email_verification_code: code,
          email_code_expires_at: expiresAt
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          email: user.email, 
          type: '2fa_setup',
          code: code 
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      setEmailCodeSent(true);
      toast({
        title: "Code Sent",
        description: `Verification code sent to ${user.email}`,
      });
    } catch (error) {
      console.error('Error sending email code:', error);
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setSendingEmailCode(false);
    }
  };

  const handleEnableEmail2FA = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('email_verification_code, email_code_expires_at')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData?.email_verification_code) {
        throw new Error('No verification code found');
      }

      const expiresAt = new Date(profileData.email_code_expires_at);
      if (expiresAt < new Date()) {
        throw new Error('Verification code has expired');
      }

      if (profileData.email_verification_code !== emailVerificationCode) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          email_two_factor_enabled: true,
          email_verification_code: null,
          email_code_expires_at: null
        })
        .eq('id', user?.id);

      if (error) throw error;

      setEmailAuth(true);
      setShowEmail2FADialog(false);
      setEmailVerificationCode("");
      setEmailCodeSent(false);

      toast({
        title: "Email 2FA Enabled",
        description: "Email two-factor authentication has been enabled",
      });
    } catch (error: any) {
      console.error('Error enabling Email 2FA:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enable Email 2FA",
        variant: "destructive",
      });
    }
  };

  const handleDisableEmail2FA = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          email_two_factor_enabled: false
        })
        .eq('id', user?.id);

      if (error) throw error;

      setEmailAuth(false);
      toast({
        title: "Email 2FA Disabled",
        description: "Email two-factor authentication has been disabled",
      });
    } catch (error) {
      console.error('Error disabling Email 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable Email 2FA",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE MY ACCOUNT' exactly to confirm",
        variant: "destructive",
      });
      return;
    }

    setDeletingAccount(true);
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          account_deletion_requested: true,
          account_deletion_requested_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      await supabase.auth.signOut();
      
      toast({
        title: "Deletion Request Submitted",
        description: "Your request has been submitted. Our support team will process it and you will receive a confirmation email.",
      });
      
      setLocation("/");
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      toast({
        title: "Error",
        description: "Failed to submit deletion request. Please contact support at support@pexly.com",
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText("");
    }
  };

  const handleDisable2FA = async () => {
    setDisabling2FA(true);
    try {
      // Verify the 2FA code first
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('two_factor_secret')
        .eq('id', user?.id)
        .single();

      if (profileError || !profileData?.two_factor_secret) {
        throw new Error('Failed to verify 2FA settings');
      }

      const totp = new OTPAuth.TOTP({
        issuer: "Pexly",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(profileData.two_factor_secret),
      });

      const isValid = totp.validate({ token: disable2FACode, window: 1 }) !== null;

      if (!isValid) {
        toast({
          title: "Invalid Code",
          description: "The authenticator code is incorrect. Please try again.",
          variant: "destructive",
        });
        setDisabling2FA(false);
        return;
      }

      // Disable 2FA immediately after successful verification
      const { error } = await supabase
        .from('user_profiles')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_backup_codes: null,
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Update states immediately
      setTwoFactorEnabled(false);
      setAppAuth(false);
      setShowDisable2FADialog(false);
      setDisable2FACode("");

      // Create account change notification
      if (user?.id) {
        await createAccountChangeNotification(user.id, '2fa_disabled', { 
          method: 'App',
          timestamp: new Date().toISOString()
        });
      }

      // Re-fetch to ensure states are in sync with database
      await fetch2FAStatus();

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been successfully disabled.",
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable 2FA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDisabling2FA(false);
    }
  };

  // Dedicated function to save just the currency without phone verification
  const handleSaveCurrency = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ preferred_currency: currency })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Preferred currency updated"
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      toast({
        title: "Error",
        description: "Failed to update currency",
        variant: "destructive"
      });
    }
  };

  

  const handleSaveProfile = async () => {
    try {
      // Get current auth user to check for phone
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const authPhone = authUser?.phone || '';

      // Check if phone number has changed
      const currentPhone = authPhone || profileData?.phone_number || '';
      const newPhone = phone.trim();
      const newFullPhoneNumber = countryCodeForPhone + newPhone;

      if (newFullPhoneNumber !== currentPhone && newPhone) {
        // Phone number changed - trigger OTP verification via dialog
        // The PhoneLinkingDialog will handle duplicate checks through Supabase Auth
        setPendingPhoneNumber(newPhone);
        setPendingCountryCode(countryCodeForPhone);
        setShowPhoneVerificationDialog(true);
        return;
      }

      const updateData: any = {
        username: username.trim(),
        bio: bio,
        preferred_currency: currency,
        country: country, // Save the selected country
      };

      // Sync phone from auth to profile if it exists
      if (authPhone) {
        updateData.phone_number = authPhone;
        updateData.phone_verified = authUser?.phone_confirmed_at ? true : false;
      } else if (newFullPhoneNumber === currentPhone) {
        updateData.phone_number = newFullPhoneNumber;
      }

      console.log("Saving profile with currency:", currency, "updateData:", updateData);

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) {
        console.error("Error saving profile:", error);
        throw error;
      }

      console.log("Profile saved successfully with currency:", currency);

      toast({
        title: "Success!",
        description: "Profile updated successfully"
      });

      fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Avatar uploaded successfully"
      });

      fetchProfileData();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Password updated successfully"
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const handleSavePaymentMethod = async () => {
    if (!paymentBankName || !paymentAccountNumber || !paymentAccountName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user?.id,
          payment_type: 'Bank Transfer',
          bank_name: paymentBankName,
          account_number: paymentAccountNumber,
          account_name: paymentAccountName,
          bank_code: paymentBankCode || null,
          bank_address: bankAddress || null,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Payment method added successfully"
      });

      setShowPaymentDialog(false);
      setBankDialogStep(1);
      setPaymentBankName("");
      setPaymentAccountNumber("");
      setPaymentAccountName("");
      setPaymentBankCode("");
      setCustomBankName("");
      setBankAddress("");
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      });
    }
  };

  const handleSaveOnlineWallet = async () => {
    if (!walletProvider || !walletEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user?.id,
          payment_type: 'Online Wallet',
          bank_name: walletProvider,
          account_number: walletEmail,
          account_name: walletUsername || walletEmail,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Online wallet added successfully"
      });

      setShowOnlineWalletDialog(false);
      setWalletProvider("");
      setWalletEmail("");
      setWalletUsername("");
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving online wallet:', error);
      toast({
        title: "Error",
        description: "Failed to save online wallet",
        variant: "destructive",
      });
    }
  };

  const handleSaveMobileMoneyWallet = async () => {
    if (!mobileMoneyProvider || !mobileMoneyNumber || !mobileMoneyName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user?.id,
          payment_type: 'Mobile Money',
          bank_name: mobileMoneyProvider,
          account_number: mobileMoneyNumber,
          account_name: mobileMoneyName,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Mobile money wallet added successfully"
      });

      setShowMobileMoneyDialog(false);
      setMobileMoneyProvider("");
      setMobileMoneyNumber("");
      setMobileMoneyName("");
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving mobile money wallet:', error);
      toast({
        title: "Error",
        description: "Failed to save mobile money wallet",
        variant: "destructive",
      });
    }
  };

  const handleAddHardwareKey = async () => {
    if (!hardwareKeyName) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your hardware security key.",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real application, you would use WebAuthn API here to register a new key.
      // For this example, we'll simulate adding a key with a placeholder.
      const newKey = {
        id: Math.random().toString(36).substring(2, 15), // Simulate a unique ID
        user_id: user?.id,
        name: hardwareKeyName,
        credential_id: null, // Placeholder for actual credential ID
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('hardware_security_keys')
        .insert(newKey);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Hardware security key added successfully.",
      });
      setHardwareKeyName("");
      setShowAddHardwareKeyDialog(false);
      fetchHardwareKeys();
    } catch (error) {
      console.error('Error adding hardware key:', error);
      toast({
        title: "Error",
        description: "Failed to add hardware security key.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveHardwareKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('hardware_security_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Hardware security key removed successfully.",
      });
      fetchHardwareKeys();
    } catch (error) {
      console.error('Error removing hardware key:', error);
      toast({
        title: "Error",
        description: "Failed to remove hardware security key.",
        variant: "destructive",
      });
    }
  };

  const SidebarContent = () => (
    <div className="p-4 space-y-2">
      {settingsSections.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === section.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </div>
  );

  const ProfileSection = () => (
    <div className="space-y-6">
      {/* UIID Section */}
      {profileData?.pexly_pay_id && (
        <div className="space-y-3">
          <Label className="text-lg font-semibold">UIID</Label>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-3 py-1.5 rounded font-mono text-sm font-semibold flex-1">
              {profileData.pexly_pay_id}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                navigator.clipboard.writeText(profileData.pexly_pay_id || '');
                toast({
                  title: "Copied!",
                  description: "UIID copied to clipboard"
                });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your unique identifier for Pexly Pay
          </p>
        </div>
      )}

      {/* Email and Verification */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Email Address</Label>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user?.email}</span>
            {profileData?.is_verified && verificationLevel >= 2 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                ID verified
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmailChangeDialog(true)}
          >
            Change Email
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Full Name</p>
          <p className="font-semibold">{profileData?.full_name || "Not set"}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
          <p className="font-semibold">{profileData?.date_of_birth || "Not set"}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Country</p>
          <p className="font-semibold">
            {profileData?.country ? (
              <span className="flex items-center gap-2">
                <span>{getCountryInfo(profileData.country).flag}</span>
                <span>{getCountryInfo(profileData.country).name}</span>
              </span>
            ) : "Not set"}
          </p>
        </div>
      </div>

      {/* Your Name */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-lg font-semibold">Your name</Label>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          How would you like others to see your name during trades?
        </p>

        <RadioGroup value={nameDisplay} onValueChange={setNameDisplay}>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="initial" id="initial" />
              <Label htmlFor="initial" className="font-normal cursor-pointer">
                First name and initial
              </Label>
            </div>
            {profileData?.full_name && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {(() => {
                  const names = profileData.full_name.split(' ');
                  if (names.length >= 2) {
                    return `${names[0]} ${names[names.length - 1].charAt(0)}.`;
                  }
                  return profileData.full_name;
                })()}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full" className="font-normal cursor-pointer">
                Full name
              </Label>
            </div>
            {profileData?.full_name && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {profileData.full_name}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hide" id="hide" />
              <Label htmlFor="hide" className="font-normal cursor-pointer">
                Hide fullname
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Preferred Currency */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Preferred currency</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="flex-1 justify-between"
              >
                {currency ? (
                  <>
                    {countries.find((c) => c.currencyCode === currency)?.flag}{" "}
                    {countries.find((c) => c.currencyCode === currency)?.name} - {currency}
                  </>
                ) : (
                  "Select currency..."
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search currency or country..." />
                <CommandEmpty>No currency found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {countries.map((country) => (
                    <CommandItem
                      key={`${country.code}-${country.currencyCode}`}
                      value={`${country.name} ${country.currency} ${country.currencyCode}`}
                      onSelect={() => {
                        setCurrency(country.currencyCode);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currency === country.currencyCode
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="mr-2">{country.flag}</span>
                      <span>{country.name} - {country.currency} ({country.currencyCode})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleSaveCurrency}
          >
            Save
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Select which currency your wallet will use
        </p>
      </div>

      {/* Profile Avatar */}
      <div className="flex justify-center py-6">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profileData?.avatar_url} alt="Profile" />
          <AvatarFallback className="bg-muted">
            <User className="h-16 w-16 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Username */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Username</Label>
        <div className="flex gap-2">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setIsEditingUsername(true)}
            onBlur={() => setIsEditingUsername(false)}
            className="flex-1"
          />
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleSaveProfile}
          >
            Save
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          You can change your username <span className="font-semibold">only once</span>
        </p>
      </div>

      {/* Upload Image */}
      <Label htmlFor="avatar-upload" className="cursor-pointer">
        <Button variant="outline" className="w-full justify-between h-14" disabled={uploadingAvatar}>
          <span>{uploadingAvatar ? "Uploading..." : "Upload image"}</span>
          <Upload className="h-5 w-5" />
        </Button>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
          disabled={uploadingAvatar}
        />
      </Label>
      <p className="text-sm text-muted-foreground">
        Upload a nice picture, preferably of yourself. If you upload any explicit or otherwise
        inappropriate image, we'll remove it immediately.
      </p>

      {/* Phone */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Phone</Label>
        <div className="space-y-2">
          <div className="space-y-2">
            <Label>Country Code</Label>
            <Select value={countryCodeForPhone} onValueChange={setCountryCodeForPhone}>
              <SelectTrigger className="w-full h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {countries.map((country) => (
                  <SelectItem key={country.phoneCode} value={country.phoneCode}>
                    <div className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name} ({country.phoneCode})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center px-3 py-2 border rounded-md bg-muted h-12">
              <span className="text-sm font-medium">{countryCodeForPhone}</span>
            </div>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setIsEditingPhone(true)}
              onBlur={() => setIsEditingPhone(false)}
              placeholder="1234567890"
              className="flex-1 h-12"
            />
            {phoneVerified && phone && (
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (phone.trim()) {
                  setPendingPhoneNumber(phone.trim());
                  setPendingCountryCode(countryCodeForPhone);
                  setShowPhoneVerificationDialog(true);
                } else {
                  toast({
                    title: "Error",
                    description: "Please enter a phone number",
                    variant: "destructive",
                  });
                }
              }}
            >
              {phoneVerified && phone ? "Change" : "Verify"}
            </Button>
          </div>
        </div>
        {phoneVerified && phone && (
          <p className="text-sm text-muted-foreground">
            ✓ Phone number verified
          </p>
        )}
        {!phoneVerified && phone && (
          <p className="text-sm text-orange-600 dark:text-orange-400">
            ⚠ Phone number needs verification
          </p>
        )}
      </div>

      {/* Reset Phone */}
      <div>
        <button className="text-primary hover:underline text-sm mb-3">
          Reset phone
        </button>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm">
                  You need to set answers to your security questions in case you have to reset or
                  change the phone number.
                </p>
                <button className="text-primary hover:underline text-sm">
                  Set answers
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bio */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Bio</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          onFocus={() => setIsEditingBio(true)}
          onBlur={() => setIsEditingBio(false)}
          placeholder="Your bio appears on your public profile"
          className="min-h-32 resize-none"
          maxLength={180}
        />
        <p className="text-sm text-muted-foreground">
          Maximum 3 lines and 180 characters ({bio.length}/180)
        </p>
      </div>

      {/* Phone Verification Dialog */}
      <PhoneLinkingDialog
        open={showPhoneVerificationDialog}
        onOpenChange={setShowPhoneVerificationDialog}
        phoneNumber={pendingPhoneNumber}
        countryCode={pendingCountryCode}
        userId={user?.id || ''}
        onSuccess={async () => {
          setPhoneVerified(true);
          // Fetch latest auth user data and sync to profile
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser?.phone) {
            await supabase
              .from('user_profiles')
              .update({
                phone_number: authUser.phone,
                phone_verified: true
              })
              .eq('id', user?.id);
          }
          fetchProfileData();
        }}
      />

      {/* Email Change Dialog */}
      <EmailLinkingDialog
        open={showEmailChangeDialog}
        onOpenChange={setShowEmailChangeDialog}
        currentEmail={user?.email}
        userId={user?.id || ''}
        onSuccess={() => {
          fetchProfileData();
        }}
      />
    </div>
  );

  const SecuritySection = () => {
    const [loginNotifications, setLoginNotifications] = useState(true);
    const [suspiciousActivity, setSuspiciousActivity] = useState(true);
    const [whitelistEnabled, setWhitelistEnabled] = useState(false);
    const [loadingWhitelist, setLoadingWhitelist] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [showWithdrawalWhitelistDialog, setShowWithdrawalWhitelistDialog] = useState(false);
    const [showIPWhitelistDialog, setShowIPWhitelistDialog] = useState(false);
    const [ipWhitelistEnabled, setIPWhitelistEnabled] = useState(false);
    const [ipRequireWithdrawals, setIPRequireWithdrawals] = useState(false);
    const [ipRequireTrades, setIPRequireTrades] = useState(false);
    const [ipRequireAPI, setIPRequireAPI] = useState(false);
    const [loadingIPWhitelist, setLoadingIPWhitelist] = useState(false);

    // Function to fetch whitelist status
    const fetchWhitelistStatus = async () => {
      setLoadingWhitelist(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('withdrawal_whitelist_enabled')
          .eq('id', user?.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching withdrawal whitelist status:', error);
          setWhitelistEnabled(false);
          return;
        }

        if (data) {
          setWhitelistEnabled(data.withdrawal_whitelist_enabled || false);
        } else {
          setWhitelistEnabled(false);
        }
      } catch (error) {
        console.error('Error fetching withdrawal whitelist status:', error);
        setWhitelistEnabled(false);
      } finally {
        setLoadingWhitelist(false);
      }
    };

    // Function to toggle whitelist status
    const toggleWhitelist = async () => {
      setLoadingWhitelist(true);
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ withdrawal_whitelist_enabled: !whitelistEnabled })
          .eq('id', user?.id);

        if (error) throw error;

        setWhitelistEnabled(!whitelistEnabled);
        toast({
          title: "Success!",
          description: `Withdrawal whitelist ${whitelistEnabled ? 'disabled' : 'enabled'} successfully.`,
        });
      } catch (error) {
        console.error('Error toggling withdrawal whitelist:', error);
        toast({
          title: "Error",
          description: "Failed to update withdrawal whitelist setting.",
          variant: "destructive",
        });
      } finally {
        setLoadingWhitelist(false);
      }
    };

    // Fetch status on mount
    useEffect(() => {
      if (user) {
        fetchWhitelistStatus();
      }
    }, [user]);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Security</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Manage your account security settings and preferences
          </p>
        </div>

        {/* Non-Custodial Wallet Backup removed from here */}

        {/* Two-Factor Authentication */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Two-Factor Authentication (2FA)</h4>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">SMS Authentication</p>
                    {smsAuth && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via SMS to your registered phone number
                  </p>
                </div>
                <Button
                  variant={smsAuth ? "outline" : "default"}
                  size="sm"
                  onClick={smsAuth ? handleDisableSMS2FA : () => setShowSMS2FADialog(true)}
                >
                  {smsAuth ? "Disable" : "Enable"}
                </Button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">Email Authentication</p>
                    {emailAuth && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via email to your registered email address
                  </p>
                </div>
                <Button
                  variant={emailAuth ? "outline" : "default"}
                  size="sm"
                  onClick={emailAuth ? handleDisableEmail2FA : () => setShowEmail2FADialog(true)}
                >
                  {emailAuth ? "Disable" : "Enable"}
                </Button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">Authenticator App</p>
                    {twoFactorEnabled && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use Google Authenticator, Authy, or similar apps for enhanced security
                  </p>
                </div>
                <Button
                  variant={twoFactorEnabled ? "outline" : "default"}
                  size="sm"
                  onClick={twoFactorEnabled ? () => setShowDisable2FADialog(true) : () => setShow2FADialog(true)}
                >
                  {twoFactorEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
              {show2FADialog && user?.email && (
                <TwoFactorSetupDialog
                  open={show2FADialog}
                  onOpenChange={(open) => {
                    setShow2FADialog(open);
                  }}
                  userEmail={user.email}
                  userId={user.id}
                  onSuccess={() => {
                    setTwoFactorEnabled(true);
                    setAppAuth(true);
                    // Refetch after a delay to ensure database write has propagated
                    setTimeout(() => {
                      fetch2FAStatus();
                    }, 500);
                  }}
                />
              )}

              {/* SMS 2FA Setup Dialog */}
              <Dialog open={showSMS2FADialog} onOpenChange={setShowSMS2FADialog}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Enable SMS Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      We'll send a verification code to your phone number
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {!phone ? (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                              Phone Number Required
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                              Please add and verify your phone number in the Profile section first
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : !smsSent ? (
                      <>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                We'll send a 6-digit verification code to <strong>{phone}</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleSendSMSCode}
                          disabled={sendingSMS}
                          className="w-full"
                        >
                          {sendingSMS ? "Sending..." : "Send Verification Code"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            Code sent to <strong>{phone}</strong>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sms-code">Enter Verification Code</Label>
                          <Input
                            id="sms-code"
                            type="text"
                            inputMode="numeric"
                            placeholder="000000"
                            maxLength={6}
                            value={smsVerificationCode}
                            onChange={(e) => setSmsVerificationCode(e.target.value.replace(/\D/g, ""))}
                            className="text-center text-2xl tracking-widest font-mono"
                          />
                          <p className="text-xs text-muted-foreground text-center">
                            Didn't receive the code?{" "}
                            <button
                              type="button"
                              onClick={() => {
                                setSmsSent(false);
                                setSmsVerificationCode("");
                                handleSendSMSCode();
                              }}
                              className="text-primary hover:underline"
                            >
                              Resend
                            </button>
                          </p>
                        </div>
                        <Button
                          onClick={handleEnableSMS2FA}
                          disabled={smsVerificationCode.length !== 6}
                          className="w-full"
                        >
                          Verify & Enable
                        </Button>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSMS2FADialog(false);
                        setSmsVerificationCode("");
                        setSmsSent(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Email 2FA Setup Dialog */}
              <Dialog open={showEmail2FADialog} onOpenChange={setShowEmail2FADialog}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Enable Email Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      We'll send a verification code to your email address
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {!user?.email ? (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                              Email Address Required
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                              Please add and verify your email address in the Profile section first
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : !emailCodeSent ? (
                      <>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                We'll send a 6-digit verification code to <strong>{user.email}</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleSendEmailCode}
                          disabled={sendingEmailCode}
                          className="w-full"
                        >
                          {sendingEmailCode ? "Sending..." : "Send Verification Code"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            Code sent to <strong>{user.email}</strong>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email-code">Enter Verification Code</Label>
                          <Input
                            id="email-code"
                            type="text"
                            inputMode="numeric"
                            placeholder="000000"
                            maxLength={6}
                            value={emailVerificationCode}
                            onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, ""))}
                            className="text-center text-2xl tracking-widest font-mono"
                          />
                          <p className="text-xs text-muted-foreground text-center">
                            Didn't receive the code?{" "}
                            <button
                              type="button"
                              onClick={() => {
                                setEmailCodeSent(false);
                                setEmailVerificationCode("");
                                handleSendEmailCode();
                              }}
                              className="text-primary hover:underline"
                            >
                              Resend
                            </button>
                          </p>
                        </div>
                        <Button
                          onClick={handleEnableEmail2FA}
                          disabled={emailVerificationCode.length !== 6}
                          className="w-full"
                        >
                          Verify & Enable
                        </Button>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEmail2FADialog(false);
                        setEmailVerificationCode("");
                        setEmailCodeSent(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Disable 2FA Verification Dialog */}
              <Dialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      Enter your authenticator code to confirm disabling 2FA
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                            Security Warning
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Disabling 2FA will make your account less secure. Make sure you understand the risks.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="disable-2fa-code">Enter Authenticator Code</Label>
                      <Input
                        id="disable-2fa-code"
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        value={disable2FACode}
                        onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, ""))}
                        className="text-center text-2xl tracking-widest font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Open your authenticator app and enter the 6-digit code for Pexly
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDisable2FADialog(false);
                        setDisable2FACode("");
                      }}
                      disabled={disabling2FA}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDisable2FA}
                      disabled={disable2FACode.length !== 6 || disabling2FA}
                    >
                      {disabling2FA ? "Disabling..." : "Disable 2FA"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {!smsAuth && !appAuth && !emailAuth && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                        Enable 2FA for Better Security
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        Two-factor authentication adds an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Whitelist removed */}
        <WithdrawalWhitelistDialog
          open={showWithdrawalWhitelistDialog}
          onOpenChange={setShowWithdrawalWhitelistDialog}
        />

        {/* IP Whitelist */}
        <div>
          <h4 className="text-lg font-semibold mb-4">IP Address Whitelist</h4>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Enable IP Whitelist</p>
                  <p className="text-sm text-muted-foreground">
                    Restrict account access to specific IP addresses for maximum security.
                  </p>
                </div>
                <Switch
                  checked={ipWhitelistEnabled}
                  onCheckedChange={setIPWhitelistEnabled}
                  disabled={loadingIPWhitelist}
                />
              </div>
              {ipWhitelistEnabled && (
                <>
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Require IP verification for:</p>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="ip-withdrawals"
                        checked={ipRequireWithdrawals}
                        onCheckedChange={setIPRequireWithdrawals}
                      />
                      <label htmlFor="ip-withdrawals" className="text-sm">Withdrawals</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="ip-trades"
                        checked={ipRequireTrades}
                        onCheckedChange={setIPRequireTrades}
                      />
                      <label htmlFor="ip-trades" className="text-sm">Trades</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="ip-api"
                        checked={ipRequireAPI}
                        onCheckedChange={setIPRequireAPI}
                      />
                      <label htmlFor="ip-api" className="text-sm">API access</label>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex gap-2 items-center">
                      <Info className="h-5 w-5 text-blue-500 shrink-0" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Make sure to add your current IP address before enabling restrictions.
                      </p>
                    </div>
                  </div>
                </>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowIPWhitelistDialog(true)}
              >
                Manage IP Whitelist
              </Button>
            </CardContent>
          </Card>
        </div>
        <IPWhitelistDialog
          open={showIPWhitelistDialog}
          onOpenChange={setShowIPWhitelistDialog}
        />

        {/* Non-Custodial Wallet Backup */}
        <Card className="border-destructive/20 shadow-sm overflow-hidden">
          <CardHeader className="bg-destructive/5 border-b border-destructive/10 py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Wallet Security</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your non-custodial wallet recovery phrase</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <h4 className="font-semibold mb-2">Backup Recovery Phrase</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Your recovery phrase is the only way to restore your wallet if you lose access to this device. 
                  Pexly does not store it.
                </p>
                
                {!showBackupPhrase ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Enter your password to securely view your recovery phrase. Your password is used only to decrypt your recovery phrase and is never stored.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="backup-password">Account Password</Label>
                      <Input
                        id="backup-password"
                        type="password"
                        value={backupPassword}
                        onChange={(e) => setBackupPassword(e.target.value)}
                        placeholder="Enter your account password"
                        disabled={isVerifyingBackupPassword}
                      />
                    </div>
                    <Button 
                      onClick={handleShowBackupPhrase} 
                      disabled={isVerifyingBackupPassword || !backupPassword}
                      variant="outline"
                    >
                      {isVerifyingBackupPassword ? "Verifying..." : "Show Recovery Phrase"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="p-4 bg-background border border-destructive/30 rounded-lg font-mono text-sm leading-relaxed text-destructive break-words">
                      {mnemonic}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowBackupPhrase(false)}
                      >
                        Hide Phrase
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(mnemonic);
                          toast({ title: "Copied to clipboard" });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Passkeys removed */}

        {/* Password Management */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Password</h4>
          <Card>
            <CardContent className="p-6">
              {!showPasswordChange ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">
                        Last changed: Never
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowPasswordChange(true)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleUpdatePassword}
                    >
                      Update Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Login Alerts & Notifications */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Security Alerts</h4>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Login Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone logs into your account
                  </p>
                </div>
                <Switch checked={loginNotifications} onCheckedChange={setLoginNotifications} />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex-1">
                  <p className="font-medium">Suspicious Activity Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts about unusual account activity
                  </p>
                </div>
                <Switch checked={suspiciousActivity} onCheckedChange={setSuspiciousActivity} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions removed */}

        {/* Delete Account Section */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h4>
          <Card className="border-destructive/50">
            <CardContent className="p-6 space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-destructive">
                      Delete Your Account
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submit a request to permanently delete your Pexly account. Our support team will review and process your request within 30 days.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Before requesting account deletion, please note:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>All your personal data, trading history, and wallet information will be permanently erased</li>
                  <li>Any pending trades or transactions will be cancelled</li>
                  <li>Your username will become available for other users</li>
                  <li>You will lose access to any funds remaining in your wallets - please withdraw all funds first</li>
                  <li>You can cancel this request by contacting support@pexly.com before processing</li>
                  <li>Once processed, deletion is irreversible and cannot be undone</li>
                </ul>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteAccountDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Request Account Deletion
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Request Account Deletion
              </DialogTitle>
              <DialogDescription>
                Submit a deletion request for our support team to review and process.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">
                      Final Warning
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By submitting this request, our support team will process the following actions:
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                      <li>All your personal information will be permanently removed</li>
                      <li>Your trading history will be deleted</li>
                      <li>Any pending transactions will be cancelled</li>
                      <li>Remaining balances will be forfeited - please withdraw first</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      You will be signed out immediately. To cancel, email support@pexly.com before your request is processed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-confirm">
                  Type <span className="font-mono font-bold text-destructive">DELETE MY ACCOUNT</span> to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  type="text"
                  placeholder="DELETE MY ACCOUNT"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteAccountDialog(false);
                  setDeleteConfirmText("");
                }}
                disabled={deletingAccount}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE MY ACCOUNT" || deletingAccount}
              >
                {deletingAccount ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Security Recommendations */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold">Security Recommendations</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Enable two-factor authentication for enhanced security
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Use a strong, unique password that you don't use elsewhere
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Regularly review your active devices and sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Keep your email and phone number up to date
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const LocalizationSection = () => {
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English (English)']);
    const [timezone, setTimezone] = useState('(GMT+01:00) Africa, Lagos - 10:25 PM');

    const availableLanguages = [
      'English (English)',
      'Spanish (Español)',
      'French (Français)',
      'German (Deutsch)',
      'Portuguese (Português)',
      'Chinese (中文)',
      'Japanese (日本語)',
      'Korean (한국어)',
      'Arabic (العربية)',
      'Hindi (हिन्दी)',
      'Russian (Русский)',
      'Italiano (Italiano)',
    ];

    const timezones = [
      '(GMT+01:00) Africa, Lagos - 10:25 PM',
      '(GMT+00:00) UTC - 09:25 PM',
      '(GMT-05:00) America, New York - 04:25 PM',
      '(GMT-08:00) America, Los Angeles - 01:25 PM',
      '(GMT+01:00) Europe, London - 09:25 PM',
      '(GMT+02:00) Europe, Paris - 10:25 PM',
      '(GMT+03:00) Europe, Moscow - 12:25 AM',
      '(GMT+08:00) Asia, Shanghai - 05:25 AM',
      '(GMT+09:00) Asia, Tokyo - 06:25 AM',
      '(GMT+05:30) Asia, Mumbai - 02:55 AM',
    ];

    const handleRemoveLanguage = (lang: string) => {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold mb-6">Account localization settings</h3>

          <div className="space-y-6">
            {/* Languages Section */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Languages</Label>

              {/* Selected Languages */}
              <div className="space-y-2">
                {selectedLanguages.map((lang, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center justify-between px-4 py-3 border border-primary/50 bg-primary/5 rounded-lg">
                      <span className="text-sm font-medium">{lang}</span>
                      {selectedLanguages.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLanguage(lang)}
                          className="h-auto p-1 hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                    >
                      <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Languages you can use while trading
              </p>

              {/* Add Language Select */}
              <Select
                onValueChange={(value) => {
                  if (!selectedLanguages.includes(value)) {
                    setSelectedLanguages([...selectedLanguages, value]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Add another language..." />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages
                    .filter(lang => !selectedLanguages.includes(lang))
                    .map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timezone Section */}
            <div className="space-y-3 pt-6 border-t">
              <Label className="text-base font-semibold">Your Time Zone</Label>

              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const NotificationsSection = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Trade Updates</p>
              <p className="text-sm text-muted-foreground">Notifications about your trades</p>
            </div>
            <Switch checked={tradeUpdates} onCheckedChange={setTradeUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Price Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified of price changes</p>
            </div>
            <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Offers</p>
              <p className="text-sm text-muted-foreground">Notifications about new trading offers</p>
            </div>
            <Switch checked={newOffers} onCheckedChange={setNewOffers} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">Promotional content and updates</p>
            </div>
            <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PaymentSection = () => (
    <div className="space-y-6">
      {/* Bank Accounts Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Bank Accounts</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add your bank account details below. You can share these details with your trade partner via trade chat, for bank transfer trades.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            onClick={() => setShowPaymentDialog(true)}
            className="bg-primary hover:bg-primary/90 mb-4"
          >
            <span className="mr-2">+</span> Add account
          </Button>

          {paymentMethods.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No bank accounts added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{method.account_name}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded">
                              {method.payment_type || 'Bank Transfer'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-normal">
                              {method.bank_name}
                            </Badge>
                            <span className="text-muted-foreground">{method.account_number}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('payment_methods')
                              .delete()
                              .eq('id', method.id);

                            if (error) throw error;

                            toast({
                              title: "Success!",
                              description: "Payment method removed"
                            });

                            fetchPaymentMethods();
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to remove payment method",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Online Wallets Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Online Wallets</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add your online wallets below.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            onClick={() => setShowOnlineWalletDialog(true)}
            className="bg-primary hover:bg-primary/90 mb-4"
          >
            <span className="mr-2">+</span> Add New
          </Button>

          {onlineWallets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No Online Wallets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {onlineWallets.map((wallet) => (
                <div key={wallet.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{wallet.bank_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{wallet.account_number}</p>
                        {wallet.account_name && wallet.account_name !== wallet.account_number && (
                          <p className="text-sm text-muted-foreground">@{wallet.account_name}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('payment_methods')
                            .delete()
                            .eq('id', wallet.id);

                          if (error) throw error;

                          toast({
                            title: "Success!",
                            description: "Online wallet removed"
                          });

                          fetchPaymentMethods();
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to remove online wallet",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Money Wallets Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Mobile Money Wallets</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add your Mobile Money wallets below.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            onClick={() => setShowMobileMoneyDialog(true)}
            className="bg-primary hover:bg-primary/90 mb-4"
          >
            <span className="mr-2">+</span> Add New
          </Button>

          {mobileMoneyWallets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Smartphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No Mobile Money Wallets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mobileMoneyWallets.map((wallet) => (
                <div key={wallet.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{wallet.bank_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{wallet.account_number}</p>
                        {wallet.account_name && (
                          <p className="text-sm text-muted-foreground">{wallet.account_name}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('payment_methods')
                            .delete()
                            .eq('id', wallet.id);

                          if (error) throw error;

                          toast({
                            title: "Success!",
                            description: "Mobile money wallet removed"
                          });

                          fetchPaymentMethods();
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to remove mobile money wallet",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Account Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        setShowPaymentDialog(open);
        if (!open) {
          setBankDialogStep(1);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add account</DialogTitle>
          </DialogHeader>

          {bankDialogStep === 1 ? (
            <div className="space-y-6 py-4">
              {/* Account Type */}
              <div className="space-y-3">
                <Label className="text-base">Account type</Label>
                <div className="space-y-2">
                  <button
                    onClick={() => setAccountType("Personal")}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      accountType === "Personal"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        accountType === "Personal" ? "border-primary" : "border-muted-foreground"
                      }`}>
                        {accountType === "Personal" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="font-medium">Personal</span>
                    </div>
                    <User className="h-6 w-6 text-primary" />
                  </button>

                  <button
                    onClick={() => setAccountType("Business")}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      accountType === "Business"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        accountType === "Business" ? "border-primary" : "border-muted-foreground"
                      }`}>
                        {accountType === "Business" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="font-medium">Business</span>
                    </div>
                    <Building2 className="h-6 w-6 text-primary" />
                  </button>
                </div>
              </div>

              {/* Bank Account Country */}
              <div className="space-y-2">
                <Label className="text-base">Bank account country</Label>
                <Select value={accountCountry} onValueChange={setAccountCountry}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                    <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                    <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                    <SelectItem value="South Africa">🇿🇦 South Africa</SelectItem>
                    <SelectItem value="Egypt">🇪🇬 Egypt</SelectItem>
                    <SelectItem value="Ethiopia">🇪🇹 Ethiopia</SelectItem>
                    <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
                    <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                    <SelectItem value="Morocco">🇲🇦 Morocco</SelectItem>
                    <SelectItem value="Algeria">🇩🇿 Algeria</SelectItem>
                    <SelectItem value="Senegal">🇸🇳 Senegal</SelectItem>
                    <SelectItem value="Ivory Coast">🇨🇮 Ivory Coast</SelectItem>
                    <SelectItem value="Cameroon">🇨🇲 Cameroon</SelectItem>
                    <SelectItem value="Rwanda">🇷🇼 Rwanda</SelectItem>
                    <SelectItem value="Zambia">🇿🇲 Zambia</SelectItem>
                    <SelectItem value="Zimbabwe">🇿🇼 Zimbabwe</SelectItem>
                    <SelectItem value="United States">🇺🇸 United States</SelectItem>
                    <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="Canada">🇨🇦 Canadian Dollar (CAD)</SelectItem>
                    <SelectItem value="Australia">🇦🇺 Australian Dollar (AUD)</SelectItem>
                    <SelectItem value="France">🇫🇷 France</SelectItem>
                    <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                    <SelectItem value="Spain">🇪🇸 Spain</SelectItem>
                    <SelectItem value="Italy">🇮🇹 Italy</SelectItem>
                    <SelectItem value="Netherlands">🇳🇱 Netherlands</SelectItem>
                    <SelectItem value="Belgium">🇧🇪 Belgium</SelectItem>
                    <SelectItem value="Switzerland">🇨🇭 Switzerland</SelectItem>
                    <SelectItem value="Sweden">🇸🇪 Sweden</SelectItem>
                    <SelectItem value="Norway">🇳🇴 Norway</SelectItem>
                    <SelectItem value="Denmark">🇩🇰 Denmark</SelectItem>
                    <SelectItem value="Poland">🇵🇱 Poland</SelectItem>
                    <SelectItem value="India">🇮🇳 India</SelectItem>
                    <SelectItem value="China">🇨🇳 China</SelectItem>
                    <SelectItem value="Japan">🇯🇵 Japan</SelectItem>
                    <SelectItem value="South Korea">🇰🇷 South Korea</SelectItem>
                    <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                    <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
                    <SelectItem value="Thailand">🇹🇭 Thailand</SelectItem>
                    <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                    <SelectItem value="Indonesia">🇮🇩 Indonesia</SelectItem>
                    <SelectItem value="Vietnam">🇻🇳 Vietnam</SelectItem>
                    <SelectItem value="Pakistan">🇵🇰 Pakistan</SelectItem>
                    <SelectItem value="Bangladesh">🇧🇩 Bangladesh</SelectItem>
                    <SelectItem value="Brazil">🇧🇷 Brazil</SelectItem>
                    <SelectItem value="Mexico">🇲🇽 Mexico</SelectItem>
                    <SelectItem value="Argentina">🇦🇷 Argentina</SelectItem>
                    <SelectItem value="Colombia">🇨🇴 Colombia</SelectItem>
                    <SelectItem value="Chile">🇨🇱 Chile</SelectItem>
                    <SelectItem value="Peru">🇵🇪 Peru</SelectItem>
                    <SelectItem value="UAE">🇦🇪 United Arab Emirates</SelectItem>
                    <SelectItem value="Saudi Arabia">🇸🇦 Saudi Arabia</SelectItem>
                    <SelectItem value="Turkey">🇹🇷 Turkey</SelectItem>
                    <SelectItem value="Israel">🇮🇱 Israel</SelectItem>
                    <SelectItem value="Other">🌍 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label className="text-base">Currency</Label>
                <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="Nigerian Naira">🇳🇬 Nigerian Naira (NGN)</SelectItem>
                    <SelectItem value="Ghanaian Cedi">🇬🇭 Ghanaian Cedi (GHS)</SelectItem>
                    <SelectItem value="Kenyan Shilling">🇰🇪 Kenyan Shilling (KES)</SelectItem>
                    <SelectItem value="South African Rand">🇿🇦 South African Rand (ZAR)</SelectItem>
                    <SelectItem value="Egyptian Pound">🇪🇬 Egyptian Pound (EGP)</SelectItem>
                    <SelectItem value="Ethiopian Birr">🇪🇹 Ethiopian Birr (ETB)</SelectItem>
                    <SelectItem value="Tanzanian Shilling">🇹🇿 Tanzanian Shilling (TZS)</SelectItem>
                    <SelectItem value="Ugandan Shilling">🇺🇬 Ugandan Shilling (UGX)</SelectItem>
                    <SelectItem value="Moroccan Dirham">🇲🇦 Moroccan Dirham (MAD)</SelectItem>
                    <SelectItem value="Algerian Dinar">🇩🇿 Algerian Dinar (DZD)</SelectItem>
                    <SelectItem value="West African CFA Franc">🇸🇳 West African CFA Franc (XOF)</SelectItem>
                    <SelectItem value="Rwandan Franc">🇷🇼 Rwandan Franc (RWF)</SelectItem>
                    <SelectItem value="Zambian Kwacha">🇿🇲 Zambian Kwacha (ZMW)</SelectItem>
                    <SelectItem value="US Dollar">🇺🇸 US Dollar (USD)</SelectItem>
                    <SelectItem value="Euro">🇪🇺 Euro (EUR)</SelectItem>
                    <SelectItem value="British Pound">🇬🇧 British Pound (GBP)</SelectItem>
                    <SelectItem value="Canadian Dollar">🇨🇦 Canadian Dollar (CAD)</SelectItem>
                    <SelectItem value="Australian Dollar">🇦🇺 Australian Dollar (AUD)</SelectItem>
                    <SelectItem value="Swiss Franc">🇨🇭 Swiss Franc (CHF)</SelectItem>
                    <SelectItem value="Swedish Krona">🇸🇪 Swedish Krona (SEK)</SelectItem>
                    <SelectItem value="Norwegian Krone">🇳🇴 Norwegian Krone (NOK)</SelectItem>
                    <SelectItem value="Danish Krone">🇩🇰 Danish Krone (DKK)</SelectItem>
                    <SelectItem value="Polish Zloty">🇵🇱 Polish Zloty (PLN)</SelectItem>
                    <SelectItem value="Japanese Yen">🇯🇵 Japanese Yen (JPY)</SelectItem>
                    <SelectItem value="Chinese Yuan">🇨🇳 Chinese Yuan (CNY)</SelectItem>
                    <SelectItem value="Indian Rupee">🇮🇳 Indian Rupee (INR)</SelectItem>
                    <SelectItem value="South Korean Won">🇰🇷 South Korean Won (KRW)</SelectItem>
                    <SelectItem value="Singapore Dollar">🇸🇬 Singapore Dollar (SGD)</SelectItem>
                    <SelectItem value="Hong Kong Dollar">🇭🇰 Hong Kong Dollar (HKD)</SelectItem>
                    <SelectItem value="Malaysian Ringgit">🇲🇾 Malaysian Ringgit (MYR)</SelectItem>
                    <SelectItem value="Thai Baht">🇹🇭 Thai Baht (THB)</SelectItem>
                    <SelectItem value="Philippine Peso">🇵🇭 Philippine Peso (PHP)</SelectItem>
                    <SelectItem value="Indonesian Rupiah">🇮🇩 Indonesian Rupiah (IDR)</SelectItem>
                    <SelectItem value="Vietnamese Dong">🇻🇳 Vietnamese Dong (VND)</SelectItem>
                    <SelectItem value="Pakistani Rupee">🇵🇰 Pakistani Rupee (PKR)</SelectItem>
                    <SelectItem value="Bangladeshi Taka">🇧🇩 Bangladeshi Taka (BDT)</SelectItem>
                    <SelectItem value="Brazilian Real">🇧🇷 Brazilian Real (BRL)</SelectItem>
                    <SelectItem value="Mexican Peso">🇲🇽 Mexican Peso (MXN)</SelectItem>
                    <SelectItem value="Argentine Peso">🇦🇷 Argentine Peso (ARS)</SelectItem>
                    <SelectItem value="Colombian Peso">🇨🇴 Colombian Peso (COP)</SelectItem>
                    <SelectItem value="Chilean Peso">🇨🇱 Chilean Peso (CLP)</SelectItem>
                    <SelectItem value="Peruvian Sol">🇵🇪 Peruvian Sol (PEN)</SelectItem>
                    <SelectItem value="UAE Dirham">🇦🇪 UAE Dirham (AED)</SelectItem>
                    <SelectItem value="Saudi Riyal">🇸🇦 Saudi Riyal (SAR)</SelectItem>
                    <SelectItem value="Turkish Lira">🇹🇷 Turkish Lira (TRY)</SelectItem>
                    <SelectItem value="Israeli Shekel">🇮🇱 Israeli Shekel (ILS)</SelectItem>
                    <SelectItem value="Russian Ruble">🇷🇺 Russian Ruble (RUB)</SelectItem>
                    <SelectItem value="Ukrainian Hryvnia">🇺🇦 Ukrainian Hryvnia (UAH)</SelectItem>
                    <SelectItem value="New Zealand Dollar">🇳🇿 New Zealand Dollar (NZD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              {/* Bank Name */}
              <div className="space-y-2">
                <Label htmlFor="bank-name" className="text-base">Bank name</Label>
                <input
                  id="bank-name"
                  type="text"
                  value={paymentBankName}
                  onChange={(e) => setPaymentBankName(e.target.value)}
                  placeholder="Enter bank name (e.g., Chase, GTBank, etc.)"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  autoComplete="off"
                />
              </div>

              {/* Account Holder's Name */}
              <div className="space-y-2">
                <Label htmlFor="account-holder-name" className="text-base">Account holder's name</Label>
                <input
                  id="account-holder-name"
                  type="text"
                  value={paymentAccountName}
                  onChange={(e) => setPaymentAccountName(e.target.value)}
                  placeholder="Enter account holder's name"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  autoComplete="name"
                />
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label htmlFor="account-number" className="text-base">Account number</Label>
                <input
                  id="account-number"
                  type="text"
                  value={paymentAccountNumber}
                  onChange={(e) => setPaymentAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  autoComplete="off"
                />
              </div>

              {/* Custom bank details - Optional */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Custom bank details</Label>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">Optional</span>
                </div>
                <Textarea
                  value={bankAddress}
                  onChange={(e) => setBankAddress(e.target.value)}
                  placeholder="Add any other bank account details here, if needed."
                  className="min-h-[100px] resize-none"
                />
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>Add any other bank account details here, if needed.</p>
                </div>
              </div>

              {/* International Transfer Details - Expandable */}
              <Accordion type="single" collapsible className="border rounded-lg">
                <AccordionItem value="international" className="border-0">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-base">International transfer details</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Info Banner */}
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm">
                            If you want to receive international payments, additional details about <span className="font-semibold">Account Holder</span> are necessary.
                          </p>
                        </div>
                      </div>

                      {/* Country of residency */}
                      <div className="space-y-2">
                        <Label>Country of residency</Label>
                        <Input
                          placeholder="Enter country"
                          className="h-12"
                        />
                      </div>

                      {/* State/Region */}
                      <div className="space-y-2">
                        <Label>State/Region</Label>
                        <Input
                          placeholder="Enter state or region"
                          className="h-12"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          placeholder="Enter city"
                          className="h-12"
                        />
                      </div>

                      {/* Zip Code */}
                      <div className="space-y-2">
                        <Label>Zip Code</Label>
                        <Input
                          placeholder="Enter zip code"
                          className="h-12"
                        />
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          placeholder="Enter address"
                          className="h-12"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-col gap-2">
            {bankDialogStep === 1 ? (
              <Button
                onClick={() => setBankDialogStep(2)}
                className="w-full h-12"
              >
                Next
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setBankDialogStep(1)}
                  className="w-full h-12 order-2 sm:order-2"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSavePaymentMethod}
                  className="w-full h-12 bg-primary hover:bg-primary/90 order-1 sm:order-1"
                >
                  Add account
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Online Wallet Dialog */}
      <Dialog open={showOnlineWalletDialog} onOpenChange={setShowOnlineWalletDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Online Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Wallet Provider *</Label>
              <Select value={walletProvider} onValueChange={setWalletProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet provider..." />
                </SelectTrigger>
                <SelectContent>
                  {onlineWalletProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-email">Email/Account ID *</Label>
              <Input
                id="wallet-email"
                type="email"
                value={walletEmail}
                onChange={(e) => setWalletEmail(e.target.value)}
                placeholder="e.g., user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-username">Username (Optional)</Label>
              <Input
                id="wallet-username"
                value={walletUsername}
                onChange={(e) => setWalletUsername(e.target.value)}
                placeholder="e.g., @username"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOnlineWalletDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOnlineWallet}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Money Wallet Dialog */}
      <Dialog open={showMobileMoneyDialog} onOpenChange={setShowMobileMoneyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Mobile Money Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mobile Money Provider *</Label>
              <Select value={mobileMoneyProvider} onValueChange={setMobileMoneyProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider..." />
                </SelectTrigger>
                <SelectContent>
                  {mobileMoneyProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-money-number">Mobile Number *</Label>
              <Input
                id="mobile-money-number"
                type="tel"
                value={mobileMoneyNumber}
                onChange={(e) => setMobileMoneyNumber(e.target.value)}
                placeholder="e.g., +1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-money-name">Account Name *</Label>
              <Input
                id="mobile-money-name"
                value={mobileMoneyName}
                onChange={(e) => setMobileMoneyName(e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMobileMoneyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMobileMoneyWallet}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Hardware Security Key Dialog */}
      <Dialog open={showAddHardwareKeyDialog} onOpenChange={setShowAddHardwareKeyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Hardware Security Key</DialogTitle>
            <DialogDescription>
              Register a new YubiKey or FIDO2 compliant security key for enhanced login security.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hardware-key-name">Key Name</Label>
              <Input
                id="hardware-key-name"
                value={hardwareKeyName}
                onChange={(e) => setHardwareKeyName(e.target.value)}
                placeholder="e.g., My Work YubiKey"
              />
              <p className="text-xs text-muted-foreground">
                Give your key a recognizable name.
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You will be prompted to insert and touch your security key to complete registration.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddHardwareKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHardwareKey}>
              Register Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  

  const ConnectedAppsSection = () => {
    const [connectedApps, setConnectedApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchConnectedApps = async () => {
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('connected_apps')
            .select('*')
            .eq('user_id', user.id)
            .order('last_used', { ascending: false });

          if (error) {
            console.error('Error fetching connected apps:', error);
          } else {
            setConnectedApps(data || []);
          }
        } catch (error) {
          console.error('Error fetching connected apps:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchConnectedApps();
    }, [user]);

    const handleDisconnect = async (appId: string) => {
      try {
        const { error } = await supabase
          .from('connected_apps')
          .delete()
          .eq('id', appId);

        if (error) {
          console.error('Error disconnecting app:', error);
        } else {
          setConnectedApps(connectedApps.filter(app => app.id !== appId));
        }
      } catch (error) {
        console.error('Error disconnecting app:', error);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold mb-4">Connected Apps & Websites</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Below you can find the complete list of apps and websites you've used Noones to sign in with.
            These apps and websites will automatically have access to parts of your information. In case you
            remove any of these, they will still have access to the information you shared with them previously,
            yet they can't collect anything new.
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        ) : connectedApps.length > 0 ? (
          <div className="space-y-3">
            {connectedApps.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {app.app_icon_url ? (
                        <img src={app.app_icon_url} alt={app.app_name} className="h-10 w-10 rounded" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <Link2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{app.app_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Connected {new Date(app.connected_at).toLocaleDateString()}
                        </p>
                        {app.scope && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Access: {app.scope}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(app.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <Link2 className="h-16 w-16 text-primary opacity-20" />
                  <HelpCircle className="h-8 w-8 text-primary absolute -bottom-1 -right-1" />
                </div>
                <p className="text-muted-foreground">
                  You haven't connected to any app or website
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm">
                  When you connect to apps or websites using your Noones account, they will appear here.
                  You can manage their access and revoke permissions at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const VerificationSection = () => (
    <div className="space-y-6">
      {/* Verification Status Card */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Account Verification</CardTitle>
            </div>
            <Badge variant={verificationLevel >= 2 ? "default" : "secondary"} className="text-xs">
              Level {verificationLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingVerification ? (
            <p className="text-sm text-muted-foreground">Loading verification status...</p>
          ) : (
            <div className="space-y-3">
              {verificationLevel === 0 && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                    Limited Access - Level 0
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                    You can invite friends and earn rewards, but cannot trade yet. Complete age verification to start trading.
                  </p>
                </div>
              )}

              {verificationLevel === 1 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    Basic Trading - Level 1
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    Daily limit: $1,000 | Lifetime: $10,000 | Cannot create offers
                  </p>
                </div>
              )}

              {verificationLevel === 2 && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">
                    Unlimited Trading - Level 2
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                    No daily/lifetime limits | Per-trade: $100,000
                  </p>
                </div>
              )}

              {verificationLevel === 3 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    VIP Status - Level 3
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                    Maximum per-trade: $1,000,000 | Priority support
                  </p>
                </div>
              )}

              <Button
                onClick={() => setLocation("/verification")}
                className="w-full"
                variant={verificationLevel >= 3 ? "outline" : "default"}
              >
                {verificationLevel >= 3 ? "View Verification Details" : "Upgrade Verification Level"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm">
                Increase your verification level to unlock higher trading limits and additional features.
              </p>
              <Button
                variant="ghost"
                className="h-auto p-0 text-primary hover:text-primary/90"
                onClick={() => setLocation('/verification')}
              >
                View Verification Levels →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection />;
      case "localization":
        return <LocalizationSection />;
      case "security":
        return <SecuritySection />;
      case "notifications":
        return <NotificationsSection />;
      case "payment":
        return <PaymentSection />;
      case "devices":
        setLocation('/devices');
        return null;
      case "verification":
        return <VerificationSection />;
      case "connected":
        return <ConnectedAppsSection />;
      case "developer":
        setLocation('/developer');
        return null;
      default:
        return (
          <Card>
            <CardContent className="p-12">
              <p className="text-muted-foreground">This section is coming soon</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Account</h1>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <SidebarContent />
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Account settings</h2>
                  {verificationLevel >= 2 && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      ID verified
                    </Badge>
                  )}
                </div>
                {renderSection()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}

