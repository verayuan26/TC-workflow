import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { WorkflowRole } from '../types/session';
import { roleFormalName as R } from '../config/roleDisplay';
import { useRoleDisplay } from '../context/RoleDisplayContext';

function buildRoleGuide(role: WorkflowRole): { title: string; steps: string[] } {
  switch (role) {
    case 'STRATEGY':
      return {
        title: `${R('STRATEGY')} · 演示路径`,
        steps: [
          '在「待处理」领取 AI 草稿 → 审核脚本通过',
          `视频类任务会转给${R('MEDIA')}；页面类转给${R('CONVERSION')}`,
          `在「待终审」审核成片 → 高风险内容送${R('VERA')}`,
          '在「待发布」确认渠道发布 → 「待复盘」关闭任务',
        ],
      };
    case 'MEDIA':
      return {
        title: `${R('MEDIA')} · 演示路径`,
        steps: [
          '在「待剪辑」打开任务，查看素材与脚本链接',
          `填写成片链接 → 提交交${R('STRATEGY')}终审`,
          '若被退回，在「返工」中重新提交',
        ],
      };
    case 'CONVERSION':
      return {
        title: `${R('CONVERSION')} · 演示路径`,
        steps: [
          '在「待确认链接」填写目标 URL 并确认',
          '发布前在「待配 UTM」填写追踪链接',
          `完成后任务交回${R('STRATEGY')}发布`,
        ],
      };
    case 'ADS':
      return {
        title: `${R('ADS')} · 演示路径`,
        steps: [
          `在「筹备中」选择广告任务 → 提交预算送${R('VERA')}`,
          `${R('VERA')}批准后 → 「投放中」确认广告上线`,
          '在「待复盘」填写数据概述 → 关闭投放周期',
        ],
      };
    case 'VERA':
      return {
        title: `${R('VERA')} · 演示路径`,
        steps: [
          '顶部统计卡片查看系统全局进展与各角色完成率',
          '在「全局概览」浏览全部任务，按状态筛选瓶颈',
          '在「待我审核」处理高风险内容与预算审批',
          '通过 / 退回 / 拦截，决策后任务自动流转',
        ],
      };
    case 'PM':
      return {
        title: `${R('PM')} · 演示路径`,
        steps: [
          '点击「发布任务」人工录入内容 / 广告 / 页面类任务',
          `在「AI 草稿」将任务派发给${R('STRATEGY')}`,
          '在「阻塞中」解除返工或拦截任务',
          '在「进行中」查看各线进度（只读）',
          '在「本周闭环」确认已完成任务',
        ],
      };
  }
}

export function RoleGuide({ role }: { role: WorkflowRole }) {
  useRoleDisplay();
  const [open, setOpen] = useState(true);
  const guide = buildRoleGuide(role);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 p-3 rounded-lg border border-surface-700/80 bg-surface-800/30 text-left hover:border-surface-600 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs text-surface-400">
          <Lightbulb size={14} className="text-gold-400" />
          {guide.title}
        </span>
        {open ? <ChevronUp size={14} className="text-surface-500" /> : <ChevronDown size={14} className="text-surface-500" />}
      </button>
      {open && (
        <ol className="mt-2 mb-2 pl-8 pr-3 py-2 space-y-1 list-decimal text-[11px] text-surface-500 leading-relaxed">
          {guide.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
