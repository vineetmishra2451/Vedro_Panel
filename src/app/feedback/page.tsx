"use client";

import React, { useState, useEffect } from "react";
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
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
  User,
  Phone,
  MapPin,
  Mail,
  Heart,
  RefreshCw,
  ExternalLink,
  MessageSquare,
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
  options: { key: string; label: string; description?: string }[];
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
      { key: "1", label: "Excellent", description: "Top tier, pure & authentic" },
      { key: "2", label: "Good", description: "Satisfied with the quality" },
      { key: "3", label: "Average", description: "Meets basic expectations" },
      { key: "4", label: "Poor", description: "Below expected quality" },
      { key: "5", label: "Very Poor", description: "Unsatisfactory experience" },
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
      { key: "1", label: "Very Satisfied", description: "Rich, natural pungent aroma" },
      { key: "2", label: "Satisfied", description: "Pleasant & authentic smell" },
      { key: "3", label: "Neutral", description: "Neither strong nor weak" },
      { key: "4", label: "Dissatisfied", description: "Lacking natural aroma" },
      { key: "5", label: "Very Dissatisfied", description: "Unpleasant or unusual smell" },
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
      { key: "1", label: "Excellent", description: "Rich, authentic traditional flavour" },
      { key: "2", label: "Good", description: "Good taste, complements food well" },
      { key: "3", label: "Average", description: "Standard taste, nothing distinctive" },
      { key: "4", label: "Poor", description: "Weak flavour or slight off-taste" },
      { key: "5", label: "Very Poor", description: "Unpleasant bitter or burnt taste" },
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
      { key: "1", label: "Very Satisfied", description: "Clear golden colour & perfect thickness" },
      { key: "2", label: "Satisfied", description: "Natural appearance and good texture" },
      { key: "3", label: "Neutral", description: "Standard appearance" },
      { key: "4", label: "Dissatisfied", description: "Too dark, light, or cloudy" },
      { key: "5", label: "Very Dissatisfied", description: "Heavy sediments or unusual texture" },
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
      { key: "1", label: "Excellent", description: "High smoke point, low absorption" },
      { key: "2", label: "Good", description: "Cooks evenly with good stability" },
      { key: "3", label: "Average", description: "Standard cooking performance" },
      { key: "4", label: "Poor", description: "Smoked too quickly or absorbed heavily" },
      { key: "5", label: "Very Poor", description: "Frothed excessively or spoiled food" },
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
      { key: "1", label: "Very Satisfied", description: "Sturdy, leak-proof, easy to pour" },
      { key: "2", label: "Satisfied", description: "Good quality bottle & secure seal" },
      { key: "3", label: "Neutral", description: "Standard packaging" },
      { key: "4", label: "Dissatisfied", description: "Difficult cap or minor leakage" },
      { key: "5", label: "Very Dissatisfied", description: "Broken bottle or defective cap" },
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
      { key: "1", label: "No issues", description: "Everything was fresh, pure & perfect" },
      { key: "2", label: "Aroma or taste", description: "Pungency or flavour was not as expected" },
      { key: "3", label: "Colour or consistency", description: "Unusual thickness, colour, or sediments" },
      { key: "4", label: "Packaging or leakage", description: "Damaged bottle, defective seal, or transit leak" },
      { key: "5", label: "Other", description: "Another issue (please specify details)" },
    ],
  },
  {
    id: "q8",
    field: "repurchaseRecommend",
    questionNumber: 8,
    title: "How likely are you to purchase Vedro Mustard Oil again and recommend it to others?",
    subtitle: "Would you choose Vedro again or recommend it to family and friends?",
    icon: ThumbsUp,
    options: [
      { key: "1", label: "Definitely", description: "Will buy regularly & recommend warmly" },
      { key: "2", label: "Probably", description: "Likely to purchase again" },
      { key: "3", label: "Not Sure", description: "Might explore or compare" },
      { key: "4", label: "Probably Not", description: "Unlikely to repurchase" },
      { key: "5", label: "Definitely Not", description: "Will not purchase again" },
    ],
  },
];

// Step count: 8 Questions (steps 0 to 7) + 1 Contact/Optional Step (step 8)
const TOTAL_QUESTION_STEPS = QUESTIONS.length;
const TOTAL_STEPS = TOTAL_QUESTION_STEPS + 1;

export default function CustomerFeedbackPage() {
  const [currentStep, setCurrentStep] = useState(0); // 0 to 8
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

  const isFinalContactStep = currentStep === TOTAL_QUESTION_STEPS;
  const currentQuestion = !isFinalContactStep ? QUESTIONS[currentStep] : null;

  // Calculate overall answered questions
  const answeredCount = QUESTIONS.filter((q) => Boolean(form[q.field])).length;
  const progressPercent = Math.round(((currentStep + (isFinalContactStep ? 1 : 0)) / TOTAL_STEPS) * 100);

  // Auto-advance helper on option select
  const handleSelectOption = (field: keyof FeedbackFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "issuesNoticed" && value !== "Other" ? { issuesDetails: "" } : {}),
    }));
    setErrorMessage(null);

    // If selecting "Other" on question 7, don't auto-advance so customer can type details
    if (field === "issuesNoticed" && value === "Other") {
      return;
    }

    // Auto-advance to next step smoothly after 300ms
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }, 280);
  };

  const handleNext = () => {
    if (currentQuestion && !form[currentQuestion.field]) {
      setErrorMessage("Please select an answer to proceed.");
      return;
    }
    setErrorMessage(null);
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Keyboard shortcut listener (1-5 to pick option, Enter to proceed, Esc/Left to go back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (!isFinalContactStep && currentQuestion) {
        if (["1", "2", "3", "4", "5"].includes(e.key)) {
          const index = parseInt(e.key) - 1;
          const opt = currentQuestion.options[index];
          if (opt) {
            handleSelectOption(currentQuestion.field, opt.label);
          }
        }
      }

      if (e.key === "Enter" && !isFinalContactStep && currentQuestion && form[currentQuestion.field]) {
        handleNext();
      }

      if (e.key === "ArrowLeft" && currentStep > 0) {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, currentQuestion, form, isFinalContactStep]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Verify all 8 questions are answered
    const unanswered = QUESTIONS.filter((q) => !form[q.field]);
    if (unanswered.length > 0) {
      setErrorMessage(`Please answer question ${unanswered[0].questionNumber} before submitting.`);
      const idx = QUESTIONS.findIndex((q) => q.id === unanswered[0].id);
      if (idx !== -1) setCurrentStep(idx);
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
    setCurrentStep(0);
    setIsSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF3] text-[#2A1B12] flex flex-col font-sans selection:bg-[#E4BF22]/30">
      {/* 1. Slim Top Progress Bar */}
      <div className="w-full bg-[#E8E2D5]/50 h-1.5 fixed top-0 left-0 right-0 z-50">
        <div
          className="bg-gradient-to-r from-[#E4BF22] to-[#493020] h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. Minimal Navigation Header */}
      <header className="w-full max-w-2xl mx-auto px-5 sm:px-8 pt-6 pb-2 flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <VedroLogo variant="light" size="sm" showTagline={false} />
        </Link>

        {!isSuccess && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#77736A] tracking-wider uppercase">
              {isFinalContactStep ? "Final Details" : `Step ${currentStep + 1} of ${TOTAL_STEPS}`}
            </span>
            <div className="w-2 h-2 rounded-full bg-[#E4BF22]" />
          </div>
        )}
      </header>

      {/* 3. Main Stage */}
      <main className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto px-5 sm:px-8 py-6">
        {isSuccess ? (
          /* Success Screen */
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 py-8">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E4BF22]/20 text-[#493020]">
                <Heart className="w-3.5 h-3.5 fill-[#493020]" /> Response Saved
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#493020] tracking-tight">
                Thank You for Your Feedback!
              </h1>
              <p className="text-sm text-[#77736A] max-w-md mx-auto leading-relaxed">
                Your response directly guides our extraction and quality standards to ensure 100% authentic kachi ghani purity.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#493020] text-[#FCFAF3] font-bold text-sm hover:bg-[#3b2619] transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> Submit Another Response
              </button>
              <a
                href="https://wa.me/919999999999?text=Hi%20Vedro%20Team%2C%20I%20just%20submitted%20feedback%20for%20Vedro%20Mustard%20Oil!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#493020] border border-[#E8E2D5] font-semibold text-sm hover:bg-[#F3EFE6] transition-all"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Us <ExternalLink className="w-3 h-3 text-[#77736A]" />
              </a>
            </div>
          </div>
        ) : !isFinalContactStep && currentQuestion ? (
          /* Single Question Step */
          <div
            key={currentQuestion.id}
            className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-250 ease-out"
          >
            {/* Question Heading */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E4BF22] bg-[#493020] px-2.5 py-1 rounded-md tracking-wider uppercase">
                Question {currentQuestion.questionNumber} of 8
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#493020] tracking-tight leading-snug">
                {currentQuestion.title}
              </h1>
              {currentQuestion.subtitle && (
                <p className="text-xs sm:text-sm text-[#77736A] leading-relaxed">
                  {currentQuestion.subtitle}
                </p>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-2.5 pt-1">
              {currentQuestion.options.map((opt) => {
                const isSelected = form[currentQuestion.field] === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.field, opt.label)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? "bg-[#FFFDF5] border-[#E4BF22] ring-2 ring-[#E4BF22] shadow-sm text-[#493020]"
                        : "bg-white border-[#E8E2D5] hover:border-[#D5CDBD] hover:bg-[#FCFAF3] text-[#2A1B12]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? "bg-[#493020] text-white border-[#493020]"
                            : "bg-[#FCFAF3] text-[#77736A] border-[#E8E2D5]"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold tracking-tight">{opt.label}</div>
                        {opt.description && (
                          <div className="text-xs text-[#77736A]">{opt.description}</div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "border-[#493020] bg-[#493020] text-white"
                          : "border-[#D5CDBD] bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#E4BF22]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Input for Q7 "Other" */}
            {currentQuestion.id === "q7" && form.issuesNoticed === "Other" && (
              <div className="pt-2 animate-in fade-in duration-200 space-y-1.5">
                <label className="block text-xs font-bold text-[#493020]">
                  Please describe what you noticed:
                </label>
                <textarea
                  rows={2}
                  value={form.issuesDetails}
                  onChange={(e) => setForm({ ...form, issuesDetails: e.target.value })}
                  placeholder="Share details so our quality team can address it..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E4BF22] transition-all text-[#2A1B12]"
                />
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <p className="text-xs font-semibold text-rose-600 animate-in fade-in">
                {errorMessage}
              </p>
            )}

            {/* Navigation Buttons for this step */}
            <div className="pt-4 flex items-center justify-between border-t border-[#E8E2D5]">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#77736A] hover:text-[#493020] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-[11px] text-[#77736A]">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E8E2D5] text-[10px] font-mono">1-5</kbd> to select
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!form[currentQuestion.field]}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#493020] text-[#FCFAF3] hover:bg-[#3b2619] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 9: Final Contact Details & Comments */
          <form
            onSubmit={handleSubmit}
            className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-250 ease-out"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#E4BF22] bg-[#493020] px-2.5 py-1 rounded-md tracking-wider uppercase">
                Final Step • Optional
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#493020] tracking-tight">
                Almost Done! Would you like to share your details?
              </h1>
              <p className="text-xs sm:text-sm text-[#77736A]">
                You can submit anonymously, or leave your phone/name if you’d like our quality team to follow up.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D5] shadow-xs space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#493020] mb-1 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-[#77736A]" /> Name
                  </label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3 py-2 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#E4BF22] focus:bg-white text-[#2A1B12]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#493020] mb-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#77736A]" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#E4BF22] focus:bg-white text-[#2A1B12]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#493020] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#77736A]" /> City
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Delhi, Lucknow"
                    className="w-full px-3 py-2 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#E4BF22] focus:bg-white text-[#2A1B12]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#493020] mb-1 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-[#77736A]" /> Email
                  </label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full px-3 py-2 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#E4BF22] focus:bg-white text-[#2A1B12]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#493020] mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-[#77736A]" /> Additional Comments or Suggestions
                </label>
                <textarea
                  rows={2}
                  value={form.additionalComments}
                  onChange={(e) => setForm({ ...form, additionalComments: e.target.value })}
                  placeholder="Tell us what you loved or how we can improve..."
                  className="w-full px-3 py-2 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#E4BF22] focus:bg-white text-[#2A1B12]"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-xs font-semibold text-rose-600 animate-in fade-in">
                {errorMessage}
              </p>
            )}

            {/* Submit & Back Action Bar */}
            <div className="pt-4 flex items-center justify-between border-t border-[#E8E2D5]">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#77736A] hover:text-[#493020] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-[#E4BF22] text-[#493020] hover:bg-[#d8b418] disabled:opacity-50 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* 4. Minimal Footer */}
      <footer className="w-full max-w-2xl mx-auto px-5 sm:px-8 py-4 text-center text-[11px] text-[#77736A]">
        <span>© 2026 Vedro Food Products • Pure Cold-Pressed Mustard Oil</span>
      </footer>
    </div>
  );
}
