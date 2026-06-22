'use strict';

function scoreLead(lead, callData) {
  callData = callData || {};
  let score = 0;
  if (lead.phone) score += 20;
  if (lead.email) score += 10;
  if (lead.company) score += 10;
  if (callData.duration > 60) score += 20;
  if (callData.duration > 180) score += 10;
  if (callData.interested) score += 15;
  if (callData.hasbudget) score += 15;
  if (callData.hastimeline) score += 10;
  return Math.min(score, 100);
}

function getLeadTier(score) {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

module.exports = { scoreLead, getLeadTier };
