import React from 'react';
import { User, ShieldCheck, Mail, Phone, MapPin, Building, Key, CheckCircle } from 'lucide-react';

export const AccountTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D]">
        <h2 className="text-xl font-bold text-black dark:text-white">Account & Profile Settings</h2>
        <p className="text-xs text-[#666666] dark:text-gray-400 mt-1">
          Review verified identity credentials, enterprise multi-factor authentication, and company details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D] text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#8D6CE6] to-[#D780D6] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
            SM
          </div>
          <h3 className="text-base font-bold text-black dark:text-white mt-3">Sesyla Micropeld</h3>
          <p className="text-xs text-[#888888] dark:text-gray-400">Principal Managing Director</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" /> Identity Verified (Level 3)
          </div>

          <div className="mt-6 pt-5 border-t border-[#F0F0F0] dark:border-[#28354D] text-left space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#666666] dark:text-gray-300">
              <Mail className="w-4 h-4 text-[#8D6CE6]" /> sesyla.m@example.com
            </div>
            <div className="flex items-center gap-2.5 text-[#666666] dark:text-gray-300">
              <Phone className="w-4 h-4 text-[#8D6CE6]" /> +1 (555) 234-8901
            </div>
            <div className="flex items-center gap-2.5 text-[#666666] dark:text-gray-300">
              <MapPin className="w-4 h-4 text-[#8D6CE6]" /> San Francisco, CA, USA
            </div>
          </div>
        </div>

        {/* Security & Organization Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D] space-y-4">
            <h4 className="text-[15px] font-bold text-black dark:text-white">Security & 2-Factor Authentication</h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#1A2234] border border-[#E0E0E0] dark:border-[#28354D] flex items-center justify-between">
                <div>
                  <div className="font-bold text-black dark:text-white">Hardware Key / WebAuthn</div>
                  <div className="text-[11px] text-[#888888]">YubiKey 5C NFC registered</div>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Active
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#FAFAFA] dark:bg-[#1A2234] border border-[#E0E0E0] dark:border-[#28354D] flex items-center justify-between">
                <div>
                  <div className="font-bold text-black dark:text-white">Authenticator App (TOTP)</div>
                  <div className="text-[11px] text-[#888888]">Google Authenticator / 1Password</div>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161D2D] rounded-[12px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E0E0E0]/60 dark:border-[#28354D]">
            <h4 className="text-[15px] font-bold text-black dark:text-white mb-3">Enterprise Regulatory Entity</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#888888]">Legal Entity Name:</span>
                <p className="font-semibold text-black dark:text-white mt-0.5">Finity Global Technologies LLC</p>
              </div>
              <div>
                <span className="text-[#888888]">FDIC Insured Custodian:</span>
                <p className="font-semibold text-black dark:text-white mt-0.5">Evolve Bank & Trust ($250k Coverage)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
