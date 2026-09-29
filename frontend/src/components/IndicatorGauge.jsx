/**
 * EDU CARD AI — Interactive Circular Support Gauge
 * Visualizes calibrated probability across Low, Medium, and High bands
 * Color-blind safe: Emerald (0-30%), Amber (30-60%), Royal Purple (60-100%)
 */

import React from 'react';
import { Sparkles, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function IndicatorGauge({ probability = 0.15, band = 'Low', size = 220 }) {
  // Clamp probability between 0 and 1
  const p = Math.max(0, Math.min(1, probability));
  const percentage = Math.round(p * 100);

  // Gauge calculations for SVG arc
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Semi-circle or 240-degree arc: let's do a 240-degree speedometer arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * p);

  let bandColor = '#10B981'; // Emerald (Low)
  let bandLabel = 'Low Support Need';
  let bandDesc = 'Engagement patterns are steady and aligned with baseline.';
  let Icon = CheckCircle2;

  if (p >= 0.60 || band === 'High') {
    bandColor = '#8B5CF6'; // Royal Purple (High)
    bandLabel = 'Priority Support Recommended';
    bandDesc = 'Noticeable divergence from personal baseline detected. A friendly check-in is suggested.';
    Icon = Sparkles;
  } else if (p >= 0.30 || band === 'Medium') {
    bandColor = '#F59E0B'; // Amber (Medium)
    bandLabel = 'Proactive Check-in Recommended';
    bandDesc = 'Mild engagement softness detected over recent weeks.';
    Icon = AlertCircle;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        textAlign: 'center',
      }}
    >
      <div style={{ position: 'relative', width: `${size}px`, height: `${size * 0.78}px`, margin: '0 auto' }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(135deg)', overflow: 'visible' }}
        >
          {/* Background Arc: Low Zone (0 - 30%) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(16, 185, 129, 0.2)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength * 0.30} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
          />

          {/* Background Arc: Medium Zone (30% - 60%) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(245, 158, 11, 0.2)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength * 0.30} ${circumference}`}
            strokeDashoffset={-(arcLength * 0.30)}
          />

          {/* Background Arc: High Zone (60% - 100%) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength * 0.40} ${circumference}`}
            strokeDashoffset={-(arcLength * 0.60)}
            strokeLinecap="round"
          />

          {/* Active Value Progress Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bandColor}
            strokeWidth={strokeWidth + 2}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
              filter: `drop-shadow(0 0 8px ${bandColor}80)`,
            }}
          />
        </svg>

        {/* Center Content readout */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Support Index
          </span>
          <span
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              color: bandColor,
              lineHeight: 1,
              margin: '4px 0',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {percentage}%
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: '12px',
              backgroundColor: `${bandColor}20`,
              color: bandColor,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Icon size={12} />
            <span>{band}</span>
          </span>
        </div>
      </div>

      {/* Legend & Zones */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          marginTop: '6px',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          0–30% Low
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
          30–60% Med
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
          60–100% High
        </span>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '280px' }}>
        {bandDesc}
      </p>
    </div>
  );
}
