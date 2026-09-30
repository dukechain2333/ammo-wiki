import { getCalibers, getLoads } from "@/lib/data";

export const dynamic = "force-static";

/** The whole dataset as JSON, for other tools (zero-targets, spreadsheets, scripts). */
export function GET() {
  return Response.json({
    license: "CC BY-SA 4.0",
    calibers: getCalibers().map(({ file: _file, ...c }) => c),
    loads: getLoads().map(({ file: _file, ...l }) => l),
  });
}
