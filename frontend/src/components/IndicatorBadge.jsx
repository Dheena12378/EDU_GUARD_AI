/**
 * EDU CARD AI — Early Support Indicator Badge
 * Colour-blind safe (Emerald, Amber, Royal Purple) — NEVER uses red as a student label.
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function IndicatorBadge({ band = 'Low', showIcon = true, size = 'md' }) {
  const normalized = (band || 'Low').toLowerCase();

  let badgeClass = 'badge-low';
  let Icon = CheckCircle2;
  let label = 'Low Support Need';

  if (normalized === 'medium') {
    badgeClass = 'badge-medium';
    Icon = AlertCircle;
    label = 'Medium Support Need';
  } else if (normalized === 'high') {
    badgeClass = 'badge-high';
    Icon = Sparkles;
    label = 'High Support Need';
  } else if (normalized === 'standard') {
    badgeClass = 'badge-low';
    Icon = CheckCircle2;
    label = 'Standard Activity';
  }

  const iconSizes = { sm: 12, md: 14, lg: 16 };
  const iconSize = iconSizes[size] || 14;

  return (
    <span className={`badge-indicator ${badgeClass}`}>
      {showIcon && <Icon size={iconSize} />}
      <span>{label}</span>
    </span>
  );
}
