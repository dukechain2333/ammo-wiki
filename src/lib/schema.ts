// The shape of every file under data/. `npm run validate` and the build both check the data against
// these schemas, and `npm run schema` turns them into the JSON Schemas editors use for autocomplete.

import { z } from "zod";

/** Lowercase words or numbers joined by hyphens: "fed-xm193", "556-nato". */
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Text that YAML might read as a number (223, 0123) unless it is quoted. */
const text = () => z.string({ error: (i) => (i.input === undefined ? "required" : "must be text: put quotes around numbers, e.g. \"223\"") }).min(1);

const slug = (what: string) => z.string().regex(SLUG, `${what} must be lowercase letters and digits joined by hyphens`);

/** A [barrel length in, muzzle velocity fps] reading. */
const Reading = z.tuple([
  z.number().min(1, "barrel length is in inches").max(40, "barrel length is in inches"),
  z.number().min(300, "muzzle velocity is in fps").max(5000, "muzzle velocity is in fps"),
]);

export const InlineSourceSchema = z.strictObject({
  label: z.string().min(3).describe("What the source is: publisher, title and year, e.g. \"LuckyGunner .223/5.56 barrel length test (2026)\"."),
  url: z.url({ protocol: /^https?$/ }).optional().describe("Link to the source. Leave out only for print sources such as a field manual."),
});

export const SourceRefSchema = z.union([
  slug("A source id").describe("Id of a shared source in data/sources.yaml."),
  InlineSourceSchema,
]);

export const LoadSchema = z
  .strictObject({
    id: slug("id").describe("Same as the file name without .yaml. Never change it once merged: links use it."),
    caliber: slug("caliber").describe("Id of the caliber, which is also the folder name: 556-nato, 300-blk, 9mm-luger, 762x39, 308-win, 65-creedmoor."),
    brand: z.string().min(1).optional().describe("Maker, for factory loads. Leave out for generic and military-spec types such as M193."),
    name: z.string().min(3).describe("Full name, as the maker writes it plus the bullet weight and type."),
    short: z.string().min(3).max(32).describe("Compact name for tables and printed targets, 32 characters at most."),
    sku: z.array(text()).min(1).optional().describe("Product codes printed on the box, so a search for them finds the load."),
    standard: z.string().min(3).optional().describe("For a factory load that stands in for a common type (e.g. Federal Gold Medal 168 gr for \".308 168 gr match\"): that type's name."),
    sameAs: slug("sameAs").optional().describe("Id of the standard type this factory load is made to, e.g. m193 or m855."),
    weightGr: z.number().positive().max(1000).describe("Bullet weight, grains."),
    diameterIn: z.number().min(0.1).max(1).describe("Bullet diameter, inches."),
    bc: z.number().min(0.05).max(1.5).describe("Ballistic coefficient for the drag model below."),
    dragModel: z.enum(["G1", "G7"]).describe("Drag table the BC refers to."),
    platform: z.enum(["ar15", "ar10"]).describe("The upper the load is usually fired from; sets the default rail-to-bore height (ar15 for AR-15-size receivers, ar10 for AR-10-size)."),
    confidence: z.enum(["high", "medium", "low"]).describe("high: the load's own chronograph series across barrel lengths. medium: measured at a couple of lengths, a similar load's curve fills the rest. low: one reading or only the maker's rating."),
    mvByBarrel: z.array(Reading).min(1).describe("[barrel length in, muzzle velocity fps] pairs, shortest barrel first."),
    notes: z.string().min(1).optional().describe("How the numbers were measured or derived, and anything a reader should know about them."),
    sources: z.array(SourceRefSchema).min(1).describe("Where the numbers came from: ids from data/sources.yaml, or { label, url }."),
  })
  .superRefine((l, ctx) => {
    for (let i = 1; i < l.mvByBarrel.length; i++) {
      if (l.mvByBarrel[i][0] <= l.mvByBarrel[i - 1][0])
        ctx.addIssue({ code: "custom", path: ["mvByBarrel", i], message: "barrel lengths must be listed shortest first, each once" });
    }
    if (l.sameAs === l.id) ctx.addIssue({ code: "custom", path: ["sameAs"], message: "a load cannot be made to itself" });
  });

const Drawing = z
  .strictObject({
    caseLength: z.number().positive(),
    overallLength: z.number().positive(),
    base: z.number().positive(),
    shoulder: z.number().positive(),
    shoulderAt: z.number().positive(),
    neckAt: z.number().positive(),
    neck: z.number().positive(),
    bullet: z.number().positive(),
    shank: z.number().min(0).max(1).optional().describe("Share of the exposed bullet that is straight, 0 to 1."),
    ogive: z.number().min(0).max(1).optional().describe("Where the nose curve's control point sits, 0 to 1; higher is blunter."),
  })
  .describe("Cartridge outline in millimetres, measured from the case head, for the drawing on caliber pages.");

export const CaliberSchema = z.strictObject({
  id: slug("id").describe("Same as the file name, and the folder name under data/loads/."),
  name: z.string().min(2).describe("Full name, e.g. \"5.56 NATO / .223 Rem\"."),
  short: z.string().min(2).max(20).describe("Short name for chips and tables."),
  order: z.number().int().describe("Position in lists, smallest first."),
  aliases: z.array(text()).default([]).describe("Other names people search for."),
  bulletDiameterIn: z.number().min(0.1).max(1),
  barrelPresetsIn: z.array(z.number().min(1).max(40)).min(1).describe("Barrel lengths offered as quick picks, inches."),
  defaultBarrelIn: z.number().min(1).max(40).describe("Barrel length a load page opens with, inches."),
  tableRangeYd: z.number().int().min(50).max(2000).describe("Longest range of the trajectory table, yards."),
  description: z.string().min(1),
  drawing: Drawing,
});

export const SourcesFileSchema = z.record(slug("Source id"), InlineSourceSchema);

export type LoadFile = z.infer<typeof LoadSchema>;
export type CaliberFile = z.infer<typeof CaliberSchema>;
export type InlineSource = z.infer<typeof InlineSourceSchema>;
export type Confidence = LoadFile["confidence"];
export type DragModel = LoadFile["dragModel"];
export type Drawing = CaliberFile["drawing"];
