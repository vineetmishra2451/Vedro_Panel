"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Sparkles,
  Flame,
  Droplets,
  ChefHat,
  Package,
  AlertCircle,
  ThumbsUp,
  CheckCircle2,
  Send,
  MessageSquare,
  User,
  Phone,
  MapPin,
  Mail,
  Heart,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { VedroLogo } from "@/components/shared/vedro-logo";

interface FeedbackFormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  city: string;
  overallQuality: string;
  naturalAroma: string;
  tasteAndFlavour: string;
  colourTexture: string;
  cookingPerformance: string;
  packagingQuality: string;
  issuesNoticed: string;
  issuesDetails: string;
  repurchaseRecommend: string;
  additionalComments: string;
}

interface QuestionConfig {
  id: string;
  field: keyof FeedbackFormState;
  questionNumber: number;
  title: string;
  subtitle?: string;
  icon: any;
  options: { label: string; description?: string }[];
}

const QUESTIONS: QuestionConfig[] = [
  {
    id: "q1",
    field: "overallQuality",
    questionNumber: 1,
    title: "How would you rate the overall quality of Vedro Mustard Oil?",
    subtitle: "Your general impression of our traditional cold-pressed kachi ghani mustard oil",
    icon: Award,
    options: [
      { label: "Excellent", description: "Top tier, pure & authentic" },
      { label: "Good", description: "Satisfied with the quality" },
      { label: "Average", description: "Meets basic expectations" },
      { label: "Poor", description: "Below expected quality" },
      { label: "Very Poor", description: "Unsatisfactory experience" },
    ],
  },
  {
    id: "q2",
    field: "naturalAroma",
    questionNumber: 2,
    title: "How satisfied are you with the natural aroma of our mustard oil?",
    subtitle: "The distinct, authentic pungency (jhal) and natural fragrance of fresh mustard seeds",
    icon: Sparkles,
    options: [
      { label: "Very Satisfied", description: "Rich, natural pungent aroma" },
      { label: "Satisfied", description: "Pleasant & authentic smell" },
      { label: "Neutral", description: "Neither strong nor weak" },
      { label: "Dissatisfied", description: "Lacking natural aroma" },
      { label: "Very Dissatisfied", description: "Unpleasant or unusual smell" },
    ],
  },
  {
    id: "q3",
    field: "tasteAndFlavour",
    questionNumber: 3,
    title: "How would you rate the taste and flavour of Vedro Mustard Oil in your food?",
    subtitle: "How well it enriches traditional curries, tadka, pickles, and everyday cooking",
    icon: Flame,
    options: [
      { label: "Excellent", description: "Rich, authentic traditional flavour" },
      { label: "Good", description: "Good taste, complements food well" },
      { label: "Average", description: "Standard taste, nothing distinctive" },
      { label: "Poor", description: "Weak flavour or slight off-taste" },
      { label: "Very Poor", description: "Unpleasant bitter or burnt taste" },
    ],
  },
  {
    id: "q4",
    field: "colourTexture",
    questionNumber: 4,
    title: "How satisfied are you with the oil's colour, texture, and consistency?",
    subtitle: "Golden-amber clarity, natural viscosity, and pure sediment-free appearance",
    icon: Droplets,
    options: [
      { label: "Very Satisfied", description: "Clear golden colour & perfect thickness" },
      { label: "Satisfied", description: "Natural appearance and good texture" },
      { label: "Neutral", description: "Standard appearance" },
      { label: "Dissatisfied", description: "Too dark, light, or cloudy" },
      { label: "Very Dissatisfied", description: "Heavy sediments or unusual texture" },
    ],
  },
  {
    id: "q5",
    field: "cookingPerformance",
    questionNumber: 5,
    title: "How would you rate the performance of Vedro Mustard Oil while cooking?",
    subtitle: "Heat tolerance, smoke point, and low oil absorption during frying and sautéing",
    icon: ChefHat,
    options: [
      { label: "Excellent", description: "High smoke point, low absorption" },
      { label: "Good", description: "Cooks evenly with good stability" },
      { label: "Average", description: "Standard cooking performance" },
      { label: "Poor", description: "Smoked too quickly or absorbed heavily" },
      { label: "Very Poor", description: "Frothed excessively or spoiled food" },
    ],
  },
  {
    id: "q6",
    field: "packagingQuality",
    questionNumber: 6,
    title: "How satisfied are you with Vedro's packaging and bottle quality?",
    subtitle: "Bottle durability, spill-proof cap seal, convenient pour spout, and design",
    icon: Package,
    options: [
      { label: "Very Satisfied", description: "Sturdy, leak-proof, easy to pour" },
      { label: "Satisfied", description: "Good quality bottle & secure seal" },
      { label: "Neutral", description: "Standard packaging" },
      { label: "Dissatisfied", description: "Difficult cap or minor leakage" },
      { label: "Very Dissatisfied", description: "Broken bottle or defective cap" },
    ],
  },
  {
    id: "q7",
    field: "issuesNoticed",
    questionNumber: 7,
    title: "Have you noticed any issues with the quality of our oil?",
    subtitle: "Please select if you experienced any issue, or choose 'No issues'",
    icon: AlertCircle,
    options: [
      { label: "No issues", description: "Everything was fresh, pure & perfect" },
      { label: "Aroma or taste", description: "Pungency or flavour was not as expected" },
      { label: "Colour or consistency", description: "Unusual thickness, colour, or sediments" },
      { label: "Packaging or leakage", description: "Damaged bottle, defective seal, or transit leak" },
      { label: "Other", description: "Another issue (please specify below)" },
    ],
  },
  {
    id: "q8",
    field: "repurchaseRecommend",
    questionNumber: 8,
    title: "How likely are you to purchase Vedro Mustard Oil again and recommend it to others?",
    subtitle: "Would you choose Vedro again or recommend it to your family, friends, and neighbours?",
    icon: ThumbsUp,
    options: [
      { label: "Definitely", description: "Will buy regularly & recommend warmly" },
      { label: "Probably", description: "Likely to purchase again" },
      { label: "Not Sure", description: "Might explore or compare" },
      { label: "Probably Not", description: "Unlikely to repurchase" },
      { label: "Definitely Not", description: "Will not purchase again" },
    ],
  },
];

export default function CustomerFeedbackPage() {
  const [form, setForm] = useState<FeedbackFormState>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    city: "",
    overallQuality: "",
    naturalAroma: "",
    tasteAndFlavour: "",
    colourTexture: "",
    cookingPerformance: "",
    packagingQuality: "",
    issuesNoticed: "",
    issuesDetails: "",
    repurchaseRecommend: "",
    additionalComments: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute number of questions answered out of 8
  const answeredCount = QUESTIONS.filter((q) => Boolean(form[q.field])).length;
  const progressPercent = Math.round((answeredCount / QUESTIONS.length) * 100);

  const handleSelectOption = (field: keyof FeedbackFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      // Reset issuesDetails if not "Other"
      ...(field === "issuesNoticed" && value !== "Other" ? { issuesDetails: "" } : {}),
    }));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify all 8 questions are answered
    const unanswered = QUESTIONS.filter((q) => !form[q.field]);
    if (unanswered.length > 0) {
      setErrorMessage(
        `Please answer all questions before submitting. Remaining: ${unanswered.length} question${
          unanswered.length > 1 ? "s" : ""
        }.`
      );
      // Smooth scroll to the first unanswered question
      const firstUnansweredEl = document.getElementById(unanswered[0].id);
      if (firstUnansweredEl) {
        firstUnansweredEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback. Please try again.");
      }

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "Failed to submit feedback. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      city: "",
      overallQuality: "",
      naturalAroma: "",
      tasteAndFlavour: "",
      colourTexture: "",
      cookingPerformance: "",
      packagingQuality: "",
      issuesNoticed: "",
      issuesDetails: "",
      repurchaseRecommend: "",
      additionalComments: "",
    });
    setIsSuccess(false);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FCFAF3] text-[#2A1B12] font-sans selection:bg-[#E4BF22]/30">
      {/* Top Brand Banner */}
      <header className="sticky top-0 z-30 bg-[#493020] text-[#FCFAF3] border-b border-[#3b2619] shadow-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="hover:opacity-95 transition-opacity inline-flex items-center">
            <VedroLogo variant="dark" size="sm" showTagline={false} />
          </Link>
          <div className="flex items-center gap-2 text-xs text-[#E8E2D5]/80 bg-[#3b2619] px-3 py-1.5 rounded-full border border-[#5a3a27]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E4BF22]" />
            <span className="font-medium hidden sm:inline">100% Cold-Pressed Purity</span>
            <span className="font-medium sm:hidden">Purity First</span>
          </div>
        </div>

        {/* Dynamic Progress Indicator */}
        {!isSuccess && (
          <div className="w-full bg-[#3b2619] h-1.5">
            <div
              className="bg-gradient-to-r from-[#E4BF22] to-[#f4cf36] h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isSuccess ? (
          /* Success Screen */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E2D5] shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E4BF22]/20 text-[#493020] border border-[#E4BF22]/30">
                <Heart className="w-3 h-3 text-[#493020] fill-[#493020]" /> Response Received
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#493020] tracking-tight">
                Thank You for Your Feedback!
              </h1>
              <p className="text-sm sm:text-base text-[#6B584C] max-w-lg mx-auto leading-relaxed">
                Your valuable insights help us maintain the uncompromising purity, aroma, and authentic kachi ghani tradition of <strong className="text-[#493020]">Vedro Mustard Oil</strong>.
              </p>
            </div>

            <div className="bg-[#FCFAF3] rounded-2xl p-5 border border-[#E8E2D5] max-w-md mx-auto text-left space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#77736A]">
                Our Promise to You
              </div>
              <p className="text-xs text-[#493020] leading-relaxed">
                Every drop of Vedro is cold-pressed at low temperatures to retain its natural antioxidants, authentic pungency, and vital nutrients. We review every customer response to ensure premium quality.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#493020] text-[#FCFAF3] font-bold text-sm hover:bg-[#3b2619] transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> Submit Another Response
              </button>
              <a
                href="https://wa.me/919999999999?text=Hi%20Vedro%20Team%2C%20I%20just%20submitted%20feedback%20for%20Vedro%20Mustard%20Oil!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FCFAF3] text-[#493020] border border-[#E8E2D5] font-semibold text-sm hover:bg-[#F3EFE6] transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Us <ExternalLink className="w-3.5 h-3.5 text-[#77736A]" />
              </a>
            </div>
          </div>
        ) : (
          /* Feedback Form */
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-[#493020] to-[#342217] rounded-3xl p-6 sm:p-10 text-[#FCFAF3] shadow-lg border border-[#3b2619] relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#E4BF22]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E4BF22]/20 text-[#E4BF22] border border-[#E4BF22]/30">
                  <Sparkles className="w-3.5 h-3.5" /> Customer Quality Survey
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                  Vedro Mustard Oil Feedback
                </h1>
                <p className="text-xs sm:text-sm text-[#E8E2D5]/90 max-w-xl leading-relaxed">
                  Help us serve you better. Please take 2 minutes to share your genuine experience with our cold-pressed mustard oil across quality, aroma, taste, and packaging.
                </p>
                <div className="pt-2 flex items-center gap-3 text-xs text-[#E8E2D5]/70">
                  <span className="font-semibold text-[#E4BF22]">{answeredCount} of 8 Questions Answered</span>
                  <span>•</span>
                  <span>Takes ~2 minutes</span>
                </div>
              </div>
            </div>

            {/* Optional Customer Contact Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#493020]">Your Details (Optional)</h2>
                  <p className="text-xs text-[#77736A]">
                    Leave your contact details if you would like our quality team to follow up with you.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#77736A] bg-[#FCFAF3] px-2.5 py-1 rounded-md border border-[#E8E2D5]">
                  Optional
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#493020] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#77736A]" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E4BF22] focus:bg-white transition-all text-[#2A1B12]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#493020] mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#77736A]" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E4BF22] focus:bg-white transition-all text-[#2A1B12]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#493020] mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#77736A]" /> City / Town
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Delhi, Lucknow, Kanpur"
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E4BF22] focus:bg-white transition-all text-[#2A1B12]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#493020] mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#77736A]" /> Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E4BF22] focus:bg-white transition-all text-[#2A1B12]"
                  />
                </div>
              </div>
            </div>

            {/* The 8 Specific Questions */}
            <div className="space-y-6">
              {QUESTIONS.map((q) => {
                const IconComponent = q.icon;
                const selectedVal = form[q.field];
                const isAnswered = Boolean(selectedVal);

                return (
                  <div
                    key={q.id}
                    id={q.id}
                    className={`bg-white rounded-3xl p-6 sm:p-8 border transition-all duration-200 shadow-sm ${
                      isAnswered
                        ? "border-[#E4BF22] ring-1 ring-[#E4BF22]/30"
                        : "border-[#E8E2D5] hover:border-[#D5CDBD]"
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3.5 mb-4">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isAnswered
                            ? "bg-[#E4BF22] text-[#493020]"
                            : "bg-[#FCFAF3] text-[#77736A] border border-[#E8E2D5]"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E4BF22] bg-[#493020] px-2 py-0.5 rounded-md">
                            Question {q.questionNumber}
                          </span>
                          {isAnswered && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Answered
                            </span>
                          )}
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-[#493020] leading-snug">
                          {q.title}
                        </h2>
                        {q.subtitle && (
                          <p className="text-xs text-[#77736A] leading-relaxed">
                            {q.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Radio Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {q.options.map((opt) => {
                        const isSelected = selectedVal === opt.label;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => handleSelectOption(q.field, opt.label)}
                            className={`flex items-start gap-3 text-left p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                              isSelected
                                ? "bg-[#FFFDF5] border-[#E4BF22] ring-2 ring-[#E4BF22] shadow-sm text-[#493020]"
                                : "bg-[#FCFAF3] border-[#E8E2D5] hover:bg-white hover:border-[#D5CDBD] text-[#2A1B12]"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isSelected
                                  ? "border-[#493020] bg-[#493020] text-white"
                                  : "border-[#B8AFA6] bg-white"
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-[#E4BF22]" />}
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-sm font-bold tracking-tight">
                                {opt.label}
                              </div>
                              {opt.description && (
                                <div className="text-xs text-[#77736A] leading-snug">
                                  {opt.description}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Specific detail text area for Q7 when "Other" is picked */}
                    {q.id === "q7" && form.issuesNoticed === "Other" && (
                      <div className="mt-4 pt-3 border-t border-[#F0EBE1] animate-in fade-in duration-200">
                        <label className="block text-xs font-bold text-[#493020] mb-1.5">
                          Please describe the issue in detail:
                        </label>
                        <textarea
                          rows={2}
                          value={form.issuesDetails}
                          onChange={(e) => setForm({ ...form, issuesDetails: e.target.value })}
                          placeholder="Tell us what you noticed so our team can resolve it..."
                          className="w-full px-3.5 py-2.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E4BF22] focus:bg-white transition-all text-[#2A1B12]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Optional Additional Comments */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#493020]">
                <MessageSquare className="w-4 h-4 text-[#77736A]" />
                Any Additional Suggestions or Comments? (Optional)
              </div>
              <p className="text-xs text-[#77736A]">
                Share any recipes, compliments, ideas for new bottle sizes, or thoughts on how we can improve.
              </p>
              <textarea
                rows={3}
                value={form.additionalComments}
                onChange={(e) => setForm({ ...form, additionalComments: e.target.value })}
                placeholder="Write your suggestions here..."
                className="w-full px-4 py-3 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E4BF22] focus:bg-white transition-all text-[#2A1B12]"
              />
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-sm animate-in fade-in duration-150">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Missing Responses</div>
                  <div className="text-xs text-rose-700">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Bottom Sticky Action Bar */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D5] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                <div className="w-10 h-10 rounded-2xl bg-[#FCFAF3] border border-[#E8E2D5] flex items-center justify-center font-bold text-sm text-[#493020]">
                  {answeredCount}/8
                </div>
                <div>
                  <div className="text-xs font-bold text-[#493020]">
                    {answeredCount === 8
                      ? "All questions answered! Ready to submit."
                      : `${8 - answeredCount} more questions needed`}
                  </div>
                  <div className="text-[11px] text-[#77736A]">
                    {answeredCount === 8 ? "Thank you for your valuable time" : "Please complete all 8 ratings"}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 ${
                  answeredCount === 8
                    ? "bg-[#E4BF22] text-[#493020] hover:bg-[#d8b418] cursor-pointer"
                    : "bg-[#493020] text-[#FCFAF3] hover:bg-[#3b2619] cursor-pointer"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-[#77736A] space-y-2 border-t border-[#E8E2D5] pt-6">
          <div className="flex items-center justify-center gap-2 font-medium text-[#493020]">
            <VedroLogo variant="light" size="xs" />
            <span>— Pure Cold-Pressed Mustard Oil</span>
          </div>
          <p>© 2026 Vedro Food Products. Crafted with authentic kachi ghani tradition.</p>
        </footer>
      </main>
    </div>
  );
}
