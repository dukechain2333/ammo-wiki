import { getLoad, getLoads } from "@/lib/data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getLoads().map((l) => ({ id: l.id }));
}

export async function GET(_req: Request, { params }: RouteContext<"/api/loads/[id]">) {
  const { id } = await params;
  const l = getLoad(id);
  if (!l) return Response.json({ error: "not found" }, { status: 404 });
  const { file: _file, ...load } = l;
  return Response.json(load);
}
