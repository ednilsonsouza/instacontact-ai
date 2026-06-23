import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/store";
import { toCSV, toJSON, toXlsx, toNotionMarkdown } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";

  if (format === "json") {
    return new NextResponse(toJSON(job), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${job.id}.json"`,
      },
    });
  }
  if (format === "xlsx") {
    return new NextResponse(toXlsx(job), {
      headers: {
        "content-type": "application/vnd.ms-excel; charset=utf-8",
        "content-disposition": `attachment; filename="${job.id}.xls"`,
      },
    });
  }
  if (format === "notion") {
    return new NextResponse(toNotionMarkdown(job), {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="${job.id}.md"`,
      },
    });
  }
  return new NextResponse(toCSV(job), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${job.id}.csv"`,
    },
  });
}
