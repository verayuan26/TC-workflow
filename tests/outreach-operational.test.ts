import assert from "node:assert/strict";
import test from "node:test";
import {normalizeEmail,normalizeName,normalizePhone,normalizeWebsite,progressForResult,reviewSubmission,validateLeadInput} from "../worker/outreach-domain";

const valid={item_ref:"RU8-TEST",company_name:"Тест Сервис",city:"Казань",website:"https://www.example.ru/path",email:"INFO@EXAMPLE.RU",phone:"+7 (999) 123-45-67",fit_reason:"公开维修业务",suggested_entry:"询问难采购零件",source_url:"https://example.ru/source",observed_at:"2026-09-12",evidence_limit:"测试线索；未联系"};

test("lead package preserves actionable source fields and normalizes identifiers",()=>{
  const value=validateLeadInput(valid);
  assert.equal(value.normalizedWebsite,"example.ru");assert.equal(value.normalizedEmail,"info@example.ru");assert.equal(value.normalizedPhone,"79991234567");
  assert.equal(normalizeName(" Тест-Сервис, "),normalizeName("тест сервис"));
});

test("thin leads remain candidates instead of being marked actionable",()=>{
  assert.throws(()=>validateLeadInput({...valid,website:"",email:"",phone:""}),/至少需要一种/);
  assert.throws(()=>validateLeadInput({...valid,evidence_limit:""}),/证据限制/);
});

test("contact result and handoff review stay separate",()=>{
  assert.equal(progressForResult("message_sent"),"attempted");
  assert.equal(progressForResult("willing_to_share"),"needs_details");
  const result=reviewSubmission({happened_at:"2026-09-14T10:00:00Z",channel:"phone",address_used:"+7",result:"willing_to_share",operator_summary:"愿意后续提供图纸",verification_level:"operator_statement"},0);
  assert.equal(result.decision,"needs_more");assert.deepEqual(result.missing,["下一步动作"]);
});

test("independently verified claims require a stored attachment",()=>{
  const event={happened_at:"2026-09-14T10:00:00Z",channel:"email",address_used:"test@example.ru",result:"message_sent",operator_summary:"已发送",verification_level:"independent"};
  assert.deepEqual(reviewSubmission(event,0).missing,["独立证据附件"]);
  assert.equal(reviewSubmission(event,1).decision,"pass");
});

test("normalizers do not turn invalid values into dedupe keys",()=>{
  assert.equal(normalizeWebsite("javascript:alert(1)"),"");assert.equal(normalizeEmail("not-mail"),"");assert.equal(normalizePhone("123"),"");
});
