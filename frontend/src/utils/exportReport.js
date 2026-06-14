import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportReport(data) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // A4 width mm
  const margin = 14;
  const contentW = W - margin * 2;
  let y = margin;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const line = (offset = 2) => {
    pdf.setDrawColor(50, 50, 52);
    pdf.line(margin, y + offset, W - margin, y + offset);
    y += offset + 3;
  };

  const label = (text, size = 7, color = [120, 120, 125]) => {
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.setFont('helvetica', 'normal');
    pdf.text(text.toUpperCase(), margin, y);
    y += size * 0.45;
  };

  const heading = (text, size = 11, color = [250, 250, 250]) => {
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, margin, y);
    y += size * 0.55;
  };

  const row = (left, right, leftColor = [200, 200, 205], rightColor = [250, 250, 250]) => {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...leftColor);
    pdf.text(left, margin, y);
    pdf.setTextColor(...rightColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(right), W - margin, y, { align: 'right' });
    y += 5.5;
  };

  const badge = (text, x, yy, color) => {
    pdf.setFillColor(...color);
    pdf.roundedRect(x, yy - 3.5, text.length * 1.9 + 4, 5, 1.5, 1.5, 'F');
    pdf.setTextColor(10, 10, 10);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text.toUpperCase(), x + 2, yy);
  };

  // ── Header ───────────────────────────────────────────────────────────────
  pdf.setFillColor(13, 13, 15);
  pdf.rect(0, 0, W, 297, 'F');

  pdf.setFillColor(20, 20, 22);
  pdf.rect(0, 0, W, 28, 'F');

  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('AI DRUG DISCOVERY SIMULATOR  ·  LAB REPORT', margin, 10);

  pdf.setFontSize(16);
  pdf.setTextColor(250, 250, 250);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.molecule_name?.toUpperCase() || 'MOLECULE', margin, 20);

  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 105);
  pdf.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), W - margin, 20, { align: 'right' });

  if (data.molecular_formula) {
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 125);
    pdf.text(data.molecular_formula, margin + pdf.getTextWidth(data.molecule_name?.toUpperCase() || '') + 4, 20);
  }

  y = 36;

  // ── SMILES ───────────────────────────────────────────────────────────────
  label('SMILES Notation');
  y += 2;
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 155);
  pdf.setFont('courier', 'normal');
  const smilesLines = pdf.splitTextToSize(data.canonical_smiles || '', contentW);
  pdf.text(smilesLines, margin, y);
  y += smilesLines.length * 4 + 4;
  line();

  // ── Binding Affinity ─────────────────────────────────────────────────────
  heading('Binding Affinity');
  y += 2;
  const ba = data.binding_affinity || {};
  row('Predicted pKd', ba.pkd?.toFixed(2) ?? '—');
  row('Binding Strength', ba.binding_strength ?? '—');
  row('Confidence Interval', ba.confidence_interval ? `[${ba.confidence_interval[0]} – ${ba.confidence_interval[1]}]` : '—');
  row('Percentile Rank', ba.percentile_rank ? `${ba.percentile_rank.toFixed(1)}th` : '—');
  y += 1;
  line();

  // ── ADMET ─────────────────────────────────────────────────────────────────
  heading('ADMET Profile');
  y += 2;
  const admet = data.admet || {};
  row('Overall ADMET Score', `${(admet.overall_admet_score ?? 0).toFixed(1)} / 100`);
  row('Toxicity', admet.toxicity?.label ?? '—');
  row('Absorption', admet.absorption?.label ?? '—');
  row('Distribution', admet.distribution?.label ?? '—');
  row('Metabolism', admet.metabolism?.label ?? '—');
  row('Excretion', admet.excretion?.label ?? '—');
  y += 1;
  line();

  // ── Druggability ──────────────────────────────────────────────────────────
  heading('Druggability Assessment');
  y += 2;
  const drug = data.druggability || {};
  row('Druggability Score', `${drug.druggability_score ?? '—'} / 100`);
  row('Grade', drug.grade ?? '—');
  if (drug.interpretation) {
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 165);
    pdf.setFont('helvetica', 'italic');
    const interp = pdf.splitTextToSize(drug.interpretation, contentW);
    pdf.text(interp, margin, y);
    y += interp.length * 4.5 + 2;
  }
  if (drug.recommendation) {
    pdf.setFontSize(7.5);
    pdf.setTextColor(120, 120, 125);
    pdf.setFont('helvetica', 'normal');
    const rec = pdf.splitTextToSize(`Recommendation: ${drug.recommendation}`, contentW);
    pdf.text(rec, margin, y);
    y += rec.length * 4 + 2;
  }
  y += 1;
  line();

  // ── Molecular Properties ──────────────────────────────────────────────────
  heading('Molecular Properties');
  y += 2;
  const desc = data.descriptors || {};
  row('Molecular Weight', `${data.molecular_weight?.toFixed(2) ?? '—'} Da`);
  row('LogP (Lipophilicity)', desc.LogP?.toFixed(2) ?? '—');
  row('TPSA', desc.TPSA ? `${desc.TPSA.toFixed(1)} Å²` : '—');
  row('H-Bond Donors', desc.NumHDonors ?? '—');
  row('H-Bond Acceptors', desc.NumHAcceptors ?? '—');
  row('Rotatable Bonds', desc.NumRotatableBonds ?? '—');
  row('Aromatic Rings', desc.NumAromaticRings ?? '—');
  row('Lipinski Rule of Five', data.lipinski_pass ? 'Pass' : 'Fail');
  row('QED Score', data.qed_score?.toFixed(3) ?? '—');
  row('SA Score (Synthetic Accessibility)', data.sa_score?.toFixed(2) ?? '—');
  y += 1;
  line();

  // ── Failure Reasons ───────────────────────────────────────────────────────
  if (data.failure_reasons?.length > 0) {
    heading('Failure Analysis', 11, [239, 68, 68]);
    y += 2;
    data.failure_reasons.forEach(f => {
      pdf.setFontSize(8);
      pdf.setTextColor(220, 220, 225);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`• ${f.issue}`, margin, y);
      y += 4.5;
      pdf.setFontSize(7.5);
      pdf.setTextColor(150, 150, 155);
      pdf.setFont('helvetica', 'normal');
      const reason = pdf.splitTextToSize(f.reason, contentW - 4);
      pdf.text(reason, margin + 3, y);
      y += reason.length * 4;
      pdf.setTextColor(52, 211, 153);
      const fix = pdf.splitTextToSize(`Fix: ${f.fix}`, contentW - 4);
      pdf.text(fix, margin + 3, y);
      y += fix.length * 4 + 3;
    });
    line();
  }

  // ── AI Interpretation ─────────────────────────────────────────────────────
  if (data.ai_interpretation?.interpretation) {
    heading('AI Clinical Interpretation');
    y += 2;
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 165);
    pdf.setFont('helvetica', 'italic');
    const interp = pdf.splitTextToSize(data.ai_interpretation.interpretation, contentW);
    pdf.text(interp, margin, y);
    y += interp.length * 4.5 + 2;
    pdf.setFontSize(7);
    pdf.setTextColor(80, 80, 85);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Source: ${data.ai_interpretation.source ?? 'rule_based'} · Model: ${data.ai_interpretation.model ?? 'N/A'}`, margin, y);
    y += 6;
    line();
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  pdf.setFontSize(6.5);
  pdf.setTextColor(70, 70, 75);
  pdf.text('Generated by AI Drug Discovery Simulator  ·  For research purposes only  ·  Not for clinical use', W / 2, 290, { align: 'center' });

  pdf.save(`${data.molecule_name ?? 'molecule'}_lab_report.pdf`);
}
