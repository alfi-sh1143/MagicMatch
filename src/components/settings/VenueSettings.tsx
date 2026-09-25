import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Building,
  Monitor,
  Printer,
  Volume2,
  Camera,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { VenueConfig } from '../../types';
import { saveVenueConfig } from '../../services/venue/config';

interface VenueSettingsProps {
  config: VenueConfig;
  onConfigChange: (updated: VenueConfig) => void;
}

export const VenueSettings: React.FC<VenueSettingsProps> = ({ config, onConfigChange }) => {
  const [formData, setFormData] = useState<VenueConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (key: keyof VenueConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveVenueConfig(formData);
    onConfigChange(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-8 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase">
            Configuration Hub
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-neutral-100">
            Venue & Booth Configuration
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Persisted settings controlling kiosk timeouts, brand styling, hardware parameters, and privacy limits.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Saved to local venue storage</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Venue & Booth Identity */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="font-display text-base font-bold text-neutral-200 flex items-center gap-2">
            <Building className="w-4 h-4 text-rose-400" />
            <span>Identity & Location</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-neutral-400 uppercase">Venue Name</label>
              <input
                type="text"
                value={formData.venueName}
                onChange={(e) => handleChange('venueName', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:border-rose-400 outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 uppercase">Booth Name / Number</label>
              <input
                type="text"
                value={formData.boothName}
                onChange={(e) => handleChange('boothName', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:border-rose-400 outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 uppercase">City / Region</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:border-rose-400 outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 uppercase">Brand Accent Hex</label>
              <input
                type="text"
                value={formData.brandAccent}
                onChange={(e) => handleChange('brandAccent', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:border-rose-400 outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-neutral-400 uppercase">Welcome Headline / Attract Copy</label>
              <textarea
                rows={2}
                value={formData.welcomeMessage}
                onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:border-rose-400 outline-hidden resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Session & Timing */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="font-display text-base font-bold text-neutral-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Kiosk Timeouts & Touch Safeguards</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-neutral-400 uppercase">Session Inactivity Timeout (s)</label>
              <input
                type="number"
                min={30}
                max={600}
                value={formData.sessionTimeoutSec}
                onChange={(e) => handleChange('sessionTimeoutSec', parseInt(e.target.value) || 120)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:border-rose-400 outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 uppercase">Warning Countdown Duration (s)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={formData.inactivityWarningSec}
                onChange={(e) => handleChange('inactivityWarningSec', parseInt(e.target.value) || 20)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:border-rose-400 outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 uppercase">Operator Passcode (PIN)</label>
              <input
                type="password"
                maxLength={6}
                value={formData.operatorPin}
                onChange={(e) => handleChange('operatorPin', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:border-rose-400 outline-hidden tracking-widest"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Hardware & Feature Toggles */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="font-display text-base font-bold text-neutral-200 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-rose-400" />
            <span>Hardware & Functional Features</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
              <span className="text-neutral-300">Allow Simulated Demo Camera</span>
              <input
                type="checkbox"
                checked={formData.demoCameraAllowed}
                onChange={(e) => handleChange('demoCameraAllowed', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
              <span className="text-neutral-300">Enable Sound Effects</span>
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
              <span className="text-neutral-300">Thermal Strip Printing Enabled</span>
              <input
                type="checkbox"
                checked={formData.printEnabled}
                onChange={(e) => handleChange('printEnabled', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
              <span className="text-neutral-300">Contact Consent Program</span>
              <input
                type="checkbox"
                checked={formData.contactSharingEnabled}
                onChange={(e) => handleChange('contactSharingEnabled', e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
              <span className="text-neutral-300">Research & Component Breakdown Mode</span>
              <input
                type="checkbox"
                checked={formData.researchModeEnabled}
                onChange={(e) => handleChange('researchModeEnabled', e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded"
              />
            </label>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-300">Photo Retention Hours:</span>
              <select
                value={formData.photoRetentionHours}
                onChange={(e) => handleChange('photoRetentionHours', parseInt(e.target.value) || 0)}
                className="bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 rounded px-2 py-1 outline-hidden"
              >
                <option value={0}>0 (Delete immediately at session end)</option>
                <option value={1}>1 hour</option>
                <option value={4}>4 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl font-display font-bold text-sm text-neutral-950 bg-rose-400 hover:bg-rose-300 active:scale-95 shadow-lg shadow-rose-950/40 transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
