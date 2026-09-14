export type LeadInput = Record<string, unknown>;

export const clean = (value: unknown, max = 5000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export function normalizeName(value: unknown) {
  return clean(value, 300)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\s.,，。'"«»()（）-]/g, "");
}

export function normalizeWebsite(value: unknown) {
  const raw = clean(value, 500);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.hostname.toLocaleLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizeEmail(value: unknown) {
  const email = clean(value, 320).toLocaleLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function normalizePhone(value: unknown) {
  const digits = clean(value, 100).replace(/\D/g, "");
  return digits.length >= 7 ? digits : "";
}

export function validateLeadInput(value: LeadInput) {
  const itemRef = clean(value.item_ref, 100);
  const companyName = clean(value.company_name, 300);
  const city = clean(value.city, 200);
  const website = clean(value.website, 500);
  const email = clean(value.email, 320);
  const phone = clean(value.phone, 100);
  const fitReason = clean(value.fit_reason);
  const suggestedEntry = clean(value.suggested_entry);
  const sourceUrl = clean(value.source_url, 1000);
  const observedAt = clean(value.observed_at, 40);
  const evidenceLimit = clean(value.evidence_limit);
  if (!/^[A-Z0-9_-]{3,100}$/.test(itemRef)) throw new Error("item_ref 无效");
  if (!companyName || !city || !fitReason || !suggestedEntry)
    throw new Error(`${itemRef}: 企业、城市、适配理由和建议切入点必填`);
  if (!website && !email && !phone) throw new Error(`${itemRef}: 至少需要一种可执行联系渠道`);
  if (website && !normalizeWebsite(website)) throw new Error(`${itemRef}: 官网格式无效`);
  if (email && !normalizeEmail(email)) throw new Error(`${itemRef}: 邮箱格式无效`);
  if (phone && !normalizePhone(phone)) throw new Error(`${itemRef}: 电话格式无效`);
  if (!sourceUrl || !/^https?:\/\//.test(sourceUrl)) throw new Error(`${itemRef}: 来源页无效`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt)) throw new Error(`${itemRef}: 核查日期无效`);
  if (!evidenceLimit) throw new Error(`${itemRef}: 证据限制必填`);
  return {
    itemRef,
    companyName,
    canonicalName: normalizeName(companyName),
    city,
    website,
    normalizedWebsite: normalizeWebsite(website),
    email,
    normalizedEmail: normalizeEmail(email),
    phone,
    normalizedPhone: normalizePhone(phone),
    contactName: clean(value.contact_name, 300),
    contactRole: clean(value.contact_role, 500),
    contactRoleStatus: clean(value.contact_role_status, 20) || "suggested",
    fitReason,
    suggestedEntry,
    sourceUrl,
    sourceType: clean(value.source_type, 100) || "owner_supplied",
    observedAt,
    evidenceLimit,
    russianDraft: clean(value.russian_draft),
    chineseTranslation: clean(value.chinese_translation),
    deliveryRequirements: clean(value.delivery_requirements),
    priorityHint: clean(value.priority_hint, 100),
  };
}

export function progressForResult(result: string) {
  if (["unreachable", "bounced", "message_sent"].includes(result)) return "attempted";
  if (result === "contact_found") return "connected";
  if (result === "willing_to_share") return "needs_details";
  if (result === "no_current_need") return "paused";
  if (result === "not_fit") return "not_fit";
  if (result === "do_not_contact") return "do_not_contact";
  throw new Error("联系结果无效");
}

export function reviewSubmission(value: Record<string, unknown>, verifiedAttachmentCount: number) {
  const missing: string[] = [];
  for (const [field, label] of [
    ["happened_at", "实际发生时间"],
    ["channel", "联系渠道"],
    ["address_used", "实际联系方式"],
    ["result", "联系结果"],
    ["operator_summary", "书面纪要"],
  ] as const) if (!clean(value[field])) missing.push(label);
  const result = clean(value.result, 50);
  try { progressForResult(result); } catch { missing.push("有效联系结果"); }
  if (result === "willing_to_share" && !clean(value.next_action)) missing.push("下一步动作");
  if (clean(value.verification_level) === "independent" && verifiedAttachmentCount < 1)
    missing.push("独立证据附件");
  return { decision: missing.length ? "needs_more" as const : "pass" as const, missing };
}
