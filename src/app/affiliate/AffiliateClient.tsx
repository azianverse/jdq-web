'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Clock3,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Building2,
  HelpCircle,
  Lock,
  ChevronDown,
  RotateCcw,
  AlertCircle,
  XCircle,
  Save,
  Check,
  Compass,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/lib/auth';
import { triggerCelebration } from '@/components/CelebrationEffects';
import {
  fetchAffiliateOptions,
  fetchAffiliateDraft,
  saveAffiliateDraft,
  deleteAffiliateDraft,
  submitAffiliateApplication,
  resubmitAffiliateApplication,
  fetchMyAffiliateApplication,
  AffiliateApplicationModel,
  AffiliateOptionsModel,
  AffiliateDraftModel
} from '@/lib/api';

const DEFAULT_CATEGORIES = [
  { id: 'dining', label: 'Dining & Native Delicacies', description: 'Restaurants, seafood grills, and local delicacies' },
  { id: 'hospitality', label: 'Lodging & Hospitality', description: 'Resorts, homestays, and beachfront cottages' },
  { id: 'souvenirs', label: 'Handicrafts & Pasalubong', description: 'Local weaving, crafts, and keepsakes' },
  { id: 'activities', label: 'Tours & Coastal Activities', description: 'Boatmen, surf rentals, and guided heritage trails' },
  { id: 'wellness', label: 'Eco-Farm & Agritourism', description: 'Salt farms, orchards, and farm-to-table stops' },
];

const DEFAULT_MUNICIPALITIES = [
  'Alaminos City', 'Bolinao', 'Dagupan City', 'Lingayen', 'San Carlos City', 'Urdaneta City',
  'Calasiao', 'Manaoag', 'Dasol', 'Burgos', 'Anda', 'Binmaley', 'Sual', 'Infanta', 'Agno',
  'Mabini', 'Bani', 'San Fabian', 'Mangaldan', 'Bayambang', 'Rosales', 'Tayug'
];

const DEFAULT_GOALS = [
  { id: 'quest_stop', label: 'Host a Quest Checkpoint', description: 'Feature as a waypoint in cultural or eco trails' },
  { id: 'voucher_perk', label: 'Offer In-Store Traveler Perks', description: 'Provide exclusive discount vouchers for quest completers' },
  { id: 'storytelling', label: 'Cultural & Heritage Storytelling', description: 'Share historical lore and authentic craftsmanship' },
  { id: 'event_sponsor', label: 'Community Eco-Raid Co-Host', description: 'Partner on beach cleanups and environmental events' },
];

export function AffiliateClient() {
  const { user } = useAuth();

  // Catalog Options
  const [options, setOptions] = useState<AffiliateOptionsModel | null>(null);

  // Existing Application & Workspace info
  const [existingApp, setExistingApp] = useState<AffiliateApplicationModel | null>(null);
  const [merchantWorkspace, setMerchantWorkspace] = useState<{ id: string; name: string; role: string; is_published: boolean } | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Wizard Flow state (1: Business Info, 2: Location, 3: Contact, 4: Participation, 5: Review & Submit)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastDraftRevision, setLastDraftRevision] = useState<number>(1);

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('dining');
  const [municipality, setMunicipality] = useState('Alaminos City');
  const [businessAddress, setBusinessAddress] = useState('');
  const [gpsLat, setGpsLat] = useState<string>('');
  const [gpsLng, setGpsLng] = useState<string>('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'email' | 'phone' | 'sms'>('email');
  const [sponsorshipGoals, setSponsorshipGoals] = useState<string[]>(['quest_stop']);
  const [proposalDetails, setProposalDetails] = useState('');
  const [agreedDeclaration, setAgreedDeclaration] = useState(false);

  // UI helpers
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Load initial options & application status
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadingInitial(true);
        // Load options
        try {
          const opt = await fetchAffiliateOptions();
          if (isMounted) setOptions(opt);
        } catch {
          // fallback defaults remain
        }

        // Load applicant application
        if (user) {
          try {
            const { data, merchant } = await fetchMyAffiliateApplication();
            if (isMounted) {
              setExistingApp(data);
              setMerchantWorkspace(merchant);

              // Pre-fill user contact info if available
              if (!contactName && user.displayName) setContactName(user.displayName);
              if (!contactEmail && user.email) setContactEmail(user.email);

              // If applicant has draft and no active application
              if (!data || data.status === 'rejected') {
                const draft = await fetchAffiliateDraft();
                if (draft && draft.draft_data) {
                  populateFromDraft(draft);
                }
              } else if (data.status === 'needs_changes') {
                // Pre-populate fields from existing application for resubmission
                populateFromApplication(data);
              }
            }
          } catch {}
        }
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [user]);

  const populateFromDraft = (draft: AffiliateDraftModel) => {
    const d = draft.draft_data;
    if (d.businessName) setBusinessName(d.businessName);
    if (d.category) setCategory(d.category);
    if (d.municipality) setMunicipality(d.municipality);
    if (d.businessAddress) setBusinessAddress(d.businessAddress);
    if (d.gpsLat !== undefined) setGpsLat(d.gpsLat ? String(d.gpsLat) : '');
    if (d.gpsLng !== undefined) setGpsLng(d.gpsLng ? String(d.gpsLng) : '');
    if (d.contactName) setContactName(d.contactName);
    if (d.contactEmail) setContactEmail(d.contactEmail);
    if (d.contactPhone) setContactPhone(d.contactPhone);
    if (d.preferredContactMethod) setPreferredContactMethod(d.preferredContactMethod);
    if (d.sponsorshipGoals) setSponsorshipGoals(d.sponsorshipGoals);
    if (d.proposalDetails) setProposalDetails(d.proposalDetails);
    if (draft.current_step) setCurrentStep(draft.current_step);
    if (draft.revision) setLastDraftRevision(draft.revision);
  };

  const populateFromApplication = (app: AffiliateApplicationModel) => {
    setBusinessName(app.business_name);
    setCategory(app.category);
    setMunicipality(app.municipality);
    setBusinessAddress(app.business_address || '');
    setGpsLat(app.gps_lat ? String(app.gps_lat) : '');
    setGpsLng(app.gps_lng ? String(app.gps_lng) : '');
    setContactName(app.contact_name);
    setContactEmail(app.contact_email);
    setContactPhone(app.contact_phone);
    if (app.preferred_contact_method) setPreferredContactMethod(app.preferred_contact_method as any);
    setSponsorshipGoals(app.sponsorship_goals || ['quest_stop']);
    setProposalDetails(app.proposal_details || '');
  };

  // Auto-save draft on step transition
  const handleSaveDraft = async (step: number = currentStep) => {
    if (!user) return;
    try {
      setAutoSaveStatus('saving');
      const draftPayload = {
        businessName,
        category,
        municipality,
        businessAddress,
        gpsLat: gpsLat ? parseFloat(gpsLat) : null,
        gpsLng: gpsLng ? parseFloat(gpsLng) : null,
        contactName,
        contactEmail,
        contactPhone,
        preferredContactMethod,
        sponsorshipGoals,
        proposalDetails,
      };

      const res = await saveAffiliateDraft({
        draft_data: draftPayload,
        current_step: step,
      });
      setLastDraftRevision(res.revision);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
    }
  };

  const nextStep = () => {
    setFormError('');
    // Step-specific validations
    if (currentStep === 1) {
      if (!businessName.trim() || businessName.trim().length < 2) {
        setFormError('Please enter a valid business or establishment name (at least 2 characters).');
        return;
      }
    } else if (currentStep === 2) {
      if (!municipality.trim()) {
        setFormError('Please select your Pangasinan municipality.');
        return;
      }
    } else if (currentStep === 3) {
      if (!contactName.trim() || contactName.trim().length < 2) {
        setFormError('Please enter the owner or representative contact name.');
        return;
      }
      if (!contactEmail.trim() || !contactEmail.includes('@')) {
        setFormError('Please provide a valid contact email.');
        return;
      }
      if (!contactPhone.trim() || contactPhone.trim().length < 7) {
        setFormError('Please provide a valid contact phone number.');
        return;
      }
    } else if (currentStep === 4) {
      if (sponsorshipGoals.length === 0) {
        setFormError('Please select at least one participation interest.');
        return;
      }
    }

    const next = Math.min(5, currentStep + 1);
    setCurrentStep(next);
    void handleSaveDraft(next);
  };

  const prevStep = () => {
    setFormError('');
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
    void handleSaveDraft(prev);
  };

  const toggleGoal = (id: string) => {
    setSponsorshipGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleSubmitApplication = async () => {
    if (!agreedDeclaration) {
      setFormError('Please read and confirm the sovereign tourism declaration before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const payload = {
        business_name: businessName.trim(),
        category,
        municipality,
        business_address: businessAddress.trim() || undefined,
        gps_lat: gpsLat ? parseFloat(gpsLat) : null,
        gps_lng: gpsLng ? parseFloat(gpsLng) : null,
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        preferred_contact_method: preferredContactMethod,
        sponsorship_goals: sponsorshipGoals,
        proposal_details: proposalDetails.trim() || undefined,
        declaration_version: '1.0',
      };

      let result: AffiliateApplicationModel;
      if (existingApp && existingApp.status === 'needs_changes') {
        result = await resubmitAffiliateApplication(existingApp.id, payload);
      } else {
        result = await submitAffiliateApplication(payload);
      }

      setExistingApp(result);
      setIsWizardOpen(false);
      triggerCelebration({ type: 'poppers', playAudio: true });
    } catch (err: any) {
      setFormError(err.message || 'Submission failed. Please check your network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryList = options?.categories || DEFAULT_CATEGORIES;
  const municipalityList = options?.municipalities || DEFAULT_MUNICIPALITIES;
  const goalList = options?.sponsorship_goals || DEFAULT_GOALS;

  return (
    <Navigation>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb & Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2D6A4F] mb-1">
            <Store size={14} /> JuanDerQuest Partner Network
          </div>
          <h1 className="text-3xl font-extrabold text-[#1B4332] tracking-tight">
            Merchant & Partner Affiliation
          </h1>
          <p className="text-sm text-[#555] max-w-2xl mt-1">
            Showcase your Pangasinan restaurant, resort, pasalubong store, or coastal tour to thousands of cultural adventurers.
          </p>
        </div>

        {/* Existing Application / Approved Status Banner */}
        {existingApp && (
          <div className="mb-8 p-6 bg-white rounded-2xl border border-[#D5C4AC] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#777]">Application Reference</span>
                  <span className="text-xs bg-[#E9E8E4] px-2 py-0.5 rounded font-mono text-[#444]">{existingApp.id}</span>
                  <span className="text-xs text-[#888]">v{existingApp.version || 1}</span>
                </div>
                <h3 className="text-xl font-bold text-[#1B4332] mt-1">{existingApp.business_name}</h3>
                <div className="flex items-center gap-3 text-xs text-[#666] mt-1">
                  <span>{existingApp.municipality}, Pangasinan</span>
                  <span>•</span>
                  <span className="capitalize">{existingApp.category}</span>
                </div>
              </div>

              {/* Status pill & CTA */}
              <div className="flex items-center gap-3">
                {existingApp.status === 'approved' && (
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 bg-[#DCFCE7] text-[#166534] font-bold rounded-full text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Approved Partner
                    </span>
                    <Link
                      href="/merchant"
                      className="mt-2 text-xs font-bold text-[#2D6A4F] hover:underline flex items-center gap-1"
                    >
                      Open Merchant Dashboard <ArrowRight size={12} />
                    </Link>
                  </div>
                )}

                {existingApp.status === 'received' && (
                  <span className="px-3 py-1 bg-[#DBEAFE] text-[#1E40AF] font-bold rounded-full text-xs flex items-center gap-1.5">
                    <Clock3 size={14} /> Received & In Queue
                  </span>
                )}

                {existingApp.status === 'in_review' && (
                  <span className="px-3 py-1 bg-[#FEF3C7] text-[#92400E] font-bold rounded-full text-xs flex items-center gap-1.5">
                    <Compass size={14} /> In Review by LGU Tourism
                  </span>
                )}

                {existingApp.status === 'needs_changes' && (
                  <button
                    onClick={() => {
                      populateFromApplication(existingApp);
                      setIsWizardOpen(true);
                    }}
                    className="px-4 py-2 bg-[#FFB703] text-[#6B4B00] font-bold rounded-xl text-xs hover:bg-[#FCA311] transition-all flex items-center gap-1.5"
                  >
                    <AlertCircle size={14} /> Resubmit Requested Revisions
                  </button>
                )}

                {existingApp.status === 'rejected' && (
                  <button
                    onClick={() => setIsWizardOpen(true)}
                    className="px-4 py-2 bg-[#E9E8E4] text-[#333] font-bold rounded-xl text-xs hover:bg-[#DDD] transition-all"
                  >
                    Start New Application
                  </button>
                )}
              </div>
            </div>

            {/* Applicant Feedback Notification */}
            {existingApp.status === 'needs_changes' && existingApp.applicant_feedback && (
              <div className="mt-4 p-4 bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl text-xs text-[#9A3412]">
                <strong className="block font-bold mb-1">Feedback from Tourism Moderation:</strong>
                {existingApp.applicant_feedback}
              </div>
            )}

            {existingApp.status === 'approved' && merchantWorkspace && (
              <div className="mt-4 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center justify-between">
                <span className="text-xs text-[#166534] font-medium">
                  Your dedicated merchant showcase workspace is active. Manage your profile, products, and contact info.
                </span>
                <Link
                  href="/merchant"
                  className="px-3 py-1.5 bg-[#1B4332] text-white rounded-lg text-xs font-bold hover:bg-[#2D6A4F] transition-all"
                >
                  Manage Merchant Space
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Hero & CTA (If no active application or when closed) */}
        {!isWizardOpen && (!existingApp || existingApp.status === 'rejected') && (
          <div className="bg-white rounded-3xl p-8 border border-[#D5C4AC] mb-8 relative overflow-hidden shadow-sm">
            <div className="max-w-2xl">
              <span className="px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] text-xs font-bold rounded-full uppercase tracking-wider inline-block mb-3">
                Zero Listing Fees • Sovereign Discovery
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] leading-tight mb-3">
                Join the Network of Verified Pangasinan Tourist Establishments
              </h2>
              <p className="text-sm text-[#555] leading-relaxed mb-6">
                Connect directly with travelers visiting local destinations. Whether you offer freshly grilled Dagupan bangus, beachfront stays in Bolinao, or boat rides at Hundred Islands, JuanDerQuest brings respectful foot traffic to your doors.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="px-6 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
                >
                  Start Guided Application <ArrowRight size={16} />
                </button>
                <span className="text-xs text-[#777]">Takes less than 3 minutes • Instant draft auto-save</span>
              </div>
            </div>
          </div>
        )}

        {/* Modern 5-Step Guided Application Modal/Panel */}
        {isWizardOpen && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C9BDA8] shadow-lg mb-8 transition-all">
            {/* Wizard Header & Progress Bar */}
            <div className="border-b border-[#E8E4DC] pb-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">
                    Step {currentStep} of 5
                  </span>
                  <h3 className="text-xl font-bold text-[#1B4332]">
                    {currentStep === 1 && 'Business Information'}
                    {currentStep === 2 && 'Location & Geography'}
                    {currentStep === 3 && 'Contact & Representative'}
                    {currentStep === 4 && 'Participation Interests'}
                    {currentStep === 5 && 'Review & Sovereign Declaration'}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {autoSaveStatus === 'saving' && (
                    <span className="text-xs text-[#888] flex items-center gap-1">
                      <Save size={12} className="animate-spin" /> Saving draft...
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <span className="text-xs text-[#2D6A4F] flex items-center gap-1 font-medium">
                      <Check size={12} /> Draft saved
                    </span>
                  )}
                  <button
                    onClick={() => setIsWizardOpen(false)}
                    className="text-xs text-[#777] hover:text-[#1B1C1A] px-2 py-1 rounded"
                  >
                    Close & Resume Later
                  </button>
                </div>
              </div>

              {/* Progress Steps Indicator */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-2 rounded-full transition-all ${
                      s <= currentStep ? 'bg-[#2D6A4F]' : 'bg-[#E9E8E4]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#333] mb-1">
                    Official Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bonuan Waterfront Bangus Grill"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5C4AC] bg-[#FAF9F5] text-sm focus:outline-none focus:border-[#2D6A4F]"
                  />
                  <span className="text-[11px] text-[#777] mt-1 block">
                    Use your registered business name or local brand known to tourists.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#333] mb-1">
                    Primary Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoryList.map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          category === cat.id
                            ? 'border-[#2D6A4F] bg-[#F0FDF4]'
                            : 'border-[#E0D8CA] bg-[#FAF9F5] hover:border-[#BBB]'
                        }`}
                      >
                        <div className="font-bold text-xs text-[#1B4332]">{cat.label}</div>
                        <div className="text-[11px] text-[#666] mt-0.5">{cat.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location & Geography */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#333] mb-1">
                    Pangasinan Municipality or City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5C4AC] bg-[#FAF9F5] text-sm focus:outline-none focus:border-[#2D6A4F]"
                  >
                    {municipalityList.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#333] mb-1">
                    Physical Street Address / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Stall #14 Lucap Wharf Boardwalk, near Hundred Islands Ferry"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5C4AC] bg-[#FAF9F5] text-sm focus:outline-none focus:border-[#2D6A4F]"
                  />
                  <span className="text-[11px] text-[#777] mt-1 block">
                    Helps travelers find you on foot or via sovereign routing.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#333] mb-1">
                      Latitude (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 16.0425"
                      value={gpsLat}
                      onChange={(e) => setGpsLat(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-[#D5C4AC] bg-[#FAF9F5] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#333] mb-1">
                      Longitude (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 120.3340"
                      value={gpsLng}
                      onChange={(e) => setGpsLng(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-[#D5C4AC] bg-[#FAF9F5] text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact & Representative */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#333] mb-1">
                    Owner / Authorized Representative Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Maria Elena Santos"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5C4AC] bg-[#FAF9F5] text-sm focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#333] mb-1">
                      Business Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g., inquiries@islandgrill.ph"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5C4AC] bg-[#FAF9F5] text-sm focus:outline-none focus:border-[#2D6A4F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#333] mb-1">
                      Mobile / Telephone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g., +63 917 123 4567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5C4AC] bg-[#FAF9F5] text-sm focus:outline-none focus:border-[#2D6A4F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#333] mb-1">
                    Preferred Contact Method
                  </label>
                  <div className="flex gap-4">
                    {(['email', 'phone', 'sms'] as const).map((method) => (
                      <label key={method} className="flex items-center gap-2 text-xs text-[#444] cursor-pointer">
                        <input
                          type="radio"
                          name="contactMethod"
                          checked={preferredContactMethod === method}
                          onChange={() => setPreferredContactMethod(method)}
                          className="accent-[#2D6A4F]"
                        />
                        <span className="capitalize">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Participation Interests */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#333] mb-2">
                    How would you like to participate in JuanDerQuest? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {goalList.map((g) => {
                      const isSelected = sponsorshipGoals.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => toggleGoal(g.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#2D6A4F] bg-[#F0FDF4]'
                              : 'border-[#E0D8CA] bg-[#FAF9F5] hover:border-[#BBB]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="accent-[#2D6A4F]"
                            />
                            <span className="font-bold text-xs text-[#1B4332]">{g.label}</span>
                          </div>
                          <p className="text-[11px] text-[#666] mt-1 ml-5">{g.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#333] mb-1">
                    Special Offers, Delicacies, or Ideas for Travelers (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., We offer free sampling of freshly cooked Calasiao puto for adventurers logging a GPS check-in."
                    value={proposalDetails}
                    onChange={(e) => setProposalDetails(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5C4AC] bg-[#FAF9F5] text-sm focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review & Declaration */}
            {currentStep === 5 && (
              <div className="space-y-5">
                {/* Summary Card */}
                <div className="p-4 bg-[#FBF9F5] border border-[#E0D8CA] rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between border-b border-[#E8E4DC] pb-2">
                    <span className="text-[#777]">Business:</span>
                    <strong className="text-[#1B4332]">{businessName} ({category})</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#E8E4DC] pb-2">
                    <span className="text-[#777]">Location:</span>
                    <span>{municipality}, Pangasinan {businessAddress ? `• ${businessAddress}` : ''}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E8E4DC] pb-2">
                    <span className="text-[#777]">Contact:</span>
                    <span>{contactName} ({contactEmail} / {contactPhone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777]">Interests:</span>
                    <span>{sponsorshipGoals.join(', ')}</span>
                  </div>
                </div>

                {/* Declaration Checkbox */}
                <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="declaration"
                    checked={agreedDeclaration}
                    onChange={(e) => setAgreedDeclaration(e.target.checked)}
                    className="accent-[#2D6A4F] mt-1"
                  />
                  <label htmlFor="declaration" className="text-xs text-[#166534] leading-relaxed cursor-pointer">
                    <strong>Sovereign Tourism Declaration:</strong> I confirm that this establishment operates legally in Pangasinan, and that the submitted information is accurate. I understand that JuanDerQuest provides non-speculative, community-verified traveler discovery without monetary listing fees or upfront token commitments.
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-[#E8E4DC] pt-6 mt-8">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 rounded-xl border border-[#D5C4AC] bg-white text-xs font-bold text-[#555] hover:bg-[#F5F5F5] flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              ) : <div />}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={submitting || !agreedDeclaration}
                  className="px-8 py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Official Application'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Informational Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white rounded-2xl border border-[#E0D8CA]">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32] mb-4">
              <Building2 size={20} />
            </div>
            <h4 className="font-bold text-[#1B4332] text-sm mb-2">Dedicated Merchant Showcase</h4>
            <p className="text-xs text-[#666] leading-relaxed">
              Approved merchants receive a dedicated workspace to manage business details, showcase specialty products, and control public contacts.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#E0D8CA]">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#92400E] mb-4">
              <MapPin size={20} />
            </div>
            <h4 className="font-bold text-[#1B4332] text-sm mb-2">Turn-by-Turn Discovery</h4>
            <p className="text-xs text-[#666] leading-relaxed">
              Your location is integrated into our sovereign Valhalla routing engine, helping eco-tourists discover your shop along scenic Pangasinan trails.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#E0D8CA]">
            <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center text-[#1E40AF] mb-4">
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-bold text-[#1B4332] text-sm mb-2">Civic Proof & Trust</h4>
            <p className="text-xs text-[#666] leading-relaxed">
              All applications are moderated by accredited tourism evaluators to ensure authentic local experiences without spam or paid placement inflation.
            </p>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
