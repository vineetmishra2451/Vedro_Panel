import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startPerf, withPerfHeaders } from "@/lib/perf";

const DEFAULT_COMPANY_ID = "vedro-company-main";

export async function POST(req: Request) {
  const perf = startPerf("POST_CUSTOMER_FEEDBACK", req);
  try {
    const body = await req.json();

    const {
      customerName,
      customerPhone,
      customerEmail,
      city,
      overallQuality,
      naturalAroma,
      tasteAndFlavour,
      colourTexture,
      cookingPerformance,
      packagingQuality,
      issuesNoticed,
      issuesDetails,
      repurchaseRecommend,
      additionalComments,
      source = "WEB_FORM",
    } = body;

    // Validate that the core 8 questions are answered
    if (
      !overallQuality ||
      !naturalAroma ||
      !tasteAndFlavour ||
      !colourTexture ||
      !cookingPerformance ||
      !packagingQuality ||
      !issuesNoticed ||
      !repurchaseRecommend
    ) {
      return withPerfHeaders(
        NextResponse.json(
          {
            error: "Please answer all 8 quality and satisfaction questions before submitting.",
          },
          { status: 400 }
        ),
        perf,
        400
      );
    }

    const trimmedName = (customerName || "").trim();
    const trimmedPhone = (customerPhone || "").trim();

    // 1. Create the feedback entry in DB
    const feedback = await perf.step("create_feedback", () =>
      prisma.customerFeedback.create({
        data: {
          companyId: DEFAULT_COMPANY_ID,
          customerName: trimmedName || null,
          customerPhone: trimmedPhone || null,
          customerEmail: (customerEmail || "").trim() || null,
          city: (city || "").trim() || null,
          overallQuality: String(overallQuality).trim(),
          naturalAroma: String(naturalAroma).trim(),
          tasteAndFlavour: String(tasteAndFlavour).trim(),
          colourTexture: String(colourTexture).trim(),
          cookingPerformance: String(cookingPerformance).trim(),
          packagingQuality: String(packagingQuality).trim(),
          issuesNoticed: String(issuesNoticed).trim(),
          issuesDetails: (issuesDetails || "").trim() || null,
          repurchaseRecommend: String(repurchaseRecommend).trim(),
          additionalComments: (additionalComments || "").trim() || null,
          source,
        },
      })
    );

    // 2. If customer phone or name was provided, link or update Customer record asynchronously
    if (trimmedPhone || trimmedName) {
      (async () => {
        try {
          const existingCust = await prisma.customer.findFirst({
            where: {
              companyId: DEFAULT_COMPANY_ID,
              OR: [
                ...(trimmedPhone ? [{ phone: trimmedPhone }] : []),
                ...(trimmedName ? [{ name: { equals: trimmedName, mode: "insensitive" } }] : []),
              ],
            },
            select: { id: true, notes: true },
          });

          const feedbackTag = `[Feedback ${new Date().toLocaleDateString("en-IN")}: Quality=${overallQuality}, Repurchase=${repurchaseRecommend}]`;

          if (existingCust) {
            const updatedNotes = existingCust.notes
              ? `${existingCust.notes}\n${feedbackTag}`
              : feedbackTag;
            await prisma.customer.update({
              where: { id: existingCust.id },
              data: {
                notes: updatedNotes,
                ...(city ? { city: city.trim() } : {}),
                ...(customerEmail ? { email: customerEmail.trim() } : {}),
              },
            });
          } else if (trimmedPhone) {
            await prisma.customer.create({
              data: {
                companyId: DEFAULT_COMPANY_ID,
                name: trimmedName || "Valued Customer",
                phone: trimmedPhone,
                email: (customerEmail || "").trim() || null,
                city: (city || "").trim() || null,
                source: "Customer Feedback Form",
                orderCount: 0,
                totalSpentPaise: 0,
                notes: feedbackTag,
              },
            });
          }
        } catch (err) {
          console.warn("[Feedback] Background customer link skipped:", err);
        }
      })();
    }

    const res = NextResponse.json({
      success: true,
      id: feedback.id,
      message: "Thank you for sharing your feedback with Vedro! Your response helps us maintain the purest quality.",
    });

    return withPerfHeaders(res, perf, 201);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to submit feedback. Please try again." }, { status: 500 }),
      perf,
      500
    );
  }
}

export async function GET(req: Request) {
  const perf = startPerf("GET_CUSTOMER_FEEDBACK", req);
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "50");
    const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(1, limitParam), 200);

    const [totalCount, feedbacks] = await perf.step("db_queries", () =>
      Promise.all([
        prisma.customerFeedback.count({
          where: { companyId: DEFAULT_COMPANY_ID },
        }),
        prisma.customerFeedback.findMany({
          where: { companyId: DEFAULT_COMPANY_ID },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
      ])
    );

    // Compute key summary metrics
    let excellentOrGood = 0;
    let definitelyOrProbably = 0;
    const issueCounts: Record<string, number> = {};
    const aromaCounts: Record<string, number> = {};

    for (const f of feedbacks) {
      if (f.overallQuality === "Excellent" || f.overallQuality === "Good") {
        excellentOrGood++;
      }
      if (f.repurchaseRecommend === "Definitely" || f.repurchaseRecommend === "Probably") {
        definitelyOrProbably++;
      }
      issueCounts[f.issuesNoticed] = (issueCounts[f.issuesNoticed] || 0) + 1;
      aromaCounts[f.naturalAroma] = (aromaCounts[f.naturalAroma] || 0) + 1;
    }

    const sampleSize = feedbacks.length || 1;
    const csatPercent = Math.round((excellentOrGood / sampleSize) * 100);
    const loyaltyPercent = Math.round((definitelyOrProbably / sampleSize) * 100);

    const res = NextResponse.json({
      totalCount,
      feedbacks,
      metrics: {
        totalResponses: totalCount,
        csatPercent,
        loyaltyPercent,
        issueCounts,
        aromaCounts,
      },
    });

    return withPerfHeaders(res, perf, 200);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 }),
      perf,
      500
    );
  }
}
