import jsPDF from 'jspdf'
import { Inspection } from '../types'
import { supabase } from './supabase'

const BUCKET = 'inspection-photos'

function extractStoragePath(photoUrl: string): string | null {
  // URL format: https://xxx.supabase.co/storage/v1/object/public/inspection-photos/PATH
  const marker = `/object/public/${BUCKET}/`
  const idx = photoUrl.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(photoUrl.substring(idx + marker.length))
}

async function downloadImageAsDataUrl(photoUrl: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const path = extractStoragePath(photoUrl)
    if (!path) return null

    const { data, error } = await supabase.storage.from(BUCKET).download(path)
    if (error || !data) return null

    // Convert blob to data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(data)
    })

    // Get image dimensions
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => resolve({ width: 400, height: 300 }) // fallback
      img.src = dataUrl
    })

    return { dataUrl, ...dims }
  } catch {
    return null
  }
}

export async function generateInspectionReport(inspection: Inspection): Promise<jsPDF> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = 20

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > 270) {
      doc.addPage()
      y = 20
    }
  }

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Vehicle Inspection Report', pageWidth / 2, y, { align: 'center' })
  y += 10

  // Date
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, y, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  y += 10

  // Divider
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // Vehicle Info
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Vehicle Information', margin, y)
  y += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const vehicleFields = [
    ['Year', inspection.vehicleYear?.toString() || '-'],
    ['Make', inspection.vehicleMake],
    ['Model', inspection.vehicleModel],
    ['Trim', inspection.vehicleTrim || '-'],
    ['Color', inspection.vehicleColor || '-'],
    ['Mileage', inspection.vehicleMileage ? inspection.vehicleMileage.toLocaleString() + ' mi' : '-'],
    ['VIN', inspection.vehicleVin || '-'],
  ]

  for (const [label, value] of vehicleFields) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 30, y)
    y += 5.5
  }
  y += 5

  // Decision
  if (inspection.decision) {
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Decision', margin, y)
    y += 7

    doc.setFontSize(11)
    const decisionText = inspection.decision === 'interested' ? 'INTERESTED' : 'PASS'
    const decisionColor: [number, number, number] = inspection.decision === 'interested' ? [22, 163, 74] : [107, 114, 128]
    doc.setTextColor(...decisionColor)
    doc.setFont('helvetica', 'bold')
    doc.text(decisionText, margin, y)
    doc.setTextColor(0, 0, 0)
    y += 8
  }

  // Weighted Score
  const steps = inspection.steps || []
  const weightedEarned = steps.reduce(
    (acc, s) => acc + s.checklist.reduce((sum, c) => sum + (c.weight ?? 1) * c.rating, 0), 0
  )
  const weightedMax = steps.reduce(
    (acc, s) => acc + s.checklist.filter((c) => (c.weight ?? 1) > 0).reduce((sum, c) => sum + (c.weight ?? 1) * 5, 0), 0
  )

  if (weightedMax > 0) {
    const weightedPct = Math.round((weightedEarned / weightedMax) * 100)

    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Weighted Score', margin, y)
    y += 7

    doc.setFontSize(16)
    const scoreColor: [number, number, number] = weightedPct >= 70 ? [22, 163, 74] : weightedPct >= 40 ? [202, 138, 4] : [220, 38, 38]
    doc.setTextColor(...scoreColor)
    doc.text(`${weightedPct}%`, margin, y)
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`(${weightedEarned} / ${weightedMax} pts)`, margin + 22, y)
    doc.setTextColor(0, 0, 0)
    y += 8
  }

  // Known Issues
  if (inspection.knownIssues && inspection.knownIssues.length > 0) {
    addPageIfNeeded(30)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(`Known Issues (${inspection.knownIssues.length})`, margin, y)
    y += 7

    for (const issue of inspection.knownIssues) {
      addPageIfNeeded(20)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const severityColor: [number, number, number] =
        issue.severity === 'critical' ? [220, 38, 38] :
        issue.severity === 'high' ? [234, 88, 12] :
        issue.severity === 'medium' ? [202, 138, 4] : [107, 114, 128]
      doc.setTextColor(...severityColor)
      doc.text(`[${issue.severity.toUpperCase()}]`, margin, y)
      doc.setTextColor(0, 0, 0)
      doc.text(issue.title, margin + 25, y)
      y += 5

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const descLines = doc.splitTextToSize(issue.description, contentWidth - 5)
      for (const line of descLines) {
        addPageIfNeeded(5)
        doc.text(line, margin + 3, y)
        y += 4.5
      }
      y += 3
    }
  }

  // Customer Reports
  const customerReports = inspection.customerReports || []
  if (customerReports.length > 0) {
    addPageIfNeeded(30)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Customer Reports', margin, y)
    y += 7

    const reportLabels: Record<string, string> = {
      obd2: 'OBD II Report',
      carfax: 'CarFax Report',
      autocheck: 'AutoCheck Report',
    }

    for (const report of customerReports) {
      addPageIfNeeded(20)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(reportLabels[report.reportType] || report.reportType, margin, y)
      y += 5

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(`Source: ${report.fileName}`, margin + 3, y)
      doc.setTextColor(0, 0, 0)
      y += 5

      if (report.aiSummary) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        const summaryLines = doc.splitTextToSize(report.aiSummary, contentWidth - 5)
        for (const line of summaryLines) {
          addPageIfNeeded(4.5)
          doc.text(line, margin + 3, y)
          y += 4.5
        }
      } else {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(150, 150, 150)
        doc.text('Analysis not available', margin + 3, y)
        doc.setTextColor(0, 0, 0)
        y += 5
      }
      y += 4
    }
  }

  // Download all photos in parallel via Supabase Storage API (avoids CORS)
  const photoMap = new Map<string, { dataUrl: string; width: number; height: number }>()
  const fetchPromises: Promise<void>[] = []
  for (let si = 0; si < steps.length; si++) {
    const step = steps[si]
    if (step.stepNumber < 2 || !step.photos) continue
    for (const photo of step.photos) {
      if (photo.photoUrl) {
        const key = `${si}-${photo.photoOrder}`
        fetchPromises.push(
          downloadImageAsDataUrl(photo.photoUrl).then((result) => {
            if (result) {
              photoMap.set(key, result)
            }
          })
        )
      }
    }
  }
  await Promise.all(fetchPromises)

  // Step-by-step details
  for (let si = 0; si < steps.length; si++) {
    const step = steps[si]
    if (step.stepNumber < 2) continue

    addPageIfNeeded(25)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(step.stepName, margin, y)

    const statusText = step.status === 'completed' ? 'Completed' : step.status === 'skipped' ? 'Skipped' : 'Pending'
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(statusText, pageWidth - margin, y, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    y += 8

    // Checklist items
    for (const item of step.checklist) {
      addPageIfNeeded(6)
      doc.setFontSize(9)
      const checkMark = item.checked ? '[x]' : '[ ]'
      doc.setFont('helvetica', 'normal')
      doc.text(`${checkMark} ${item.item}`, margin + 3, y)

      if (item.weight > 1) {
        doc.setTextColor(22, 163, 74)
        doc.text('(High)', margin + 3 + doc.getTextWidth(`${checkMark} ${item.item}`) + 2, y)
        doc.setTextColor(0, 0, 0)
      }
      y += 5

      if (item.note) {
        addPageIfNeeded(5)
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        const noteLines = doc.splitTextToSize(`Note: ${item.note}`, contentWidth - 10)
        for (const line of noteLines) {
          doc.text(line, margin + 8, y)
          y += 4
        }
        doc.setTextColor(0, 0, 0)
      }
    }

    // Photos with images and AI analysis
    if (step.photos && step.photos.length > 0) {
      y += 3
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Photos', margin + 3, y)
      y += 6

      for (const photo of step.photos) {
        const imgData = photoMap.get(`${si}-${photo.photoOrder}`)

        if (imgData) {
          // Scale image to fit within content width, max height 80mm
          const maxW = contentWidth - 6
          const maxH = 80
          const aspect = imgData.width / imgData.height
          let imgWidth = maxW
          let imgHeight = imgWidth / aspect
          if (imgHeight > maxH) {
            imgHeight = maxH
            imgWidth = imgHeight * aspect
          }

          // Need space for image + AI text below it
          addPageIfNeeded(imgHeight + 20)

          try {
            doc.addImage(imgData.dataUrl, 'JPEG', margin + 3, y, imgWidth, imgHeight)
            y += imgHeight + 3
          } catch {
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(`[Photo ${photo.photoOrder} - could not embed]`, margin + 3, y)
            doc.setTextColor(0, 0, 0)
            y += 5
          }
        }

        if (photo.aiAnalysis) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          const verdictColor: [number, number, number] =
            photo.aiVerdict === 'ok' ? [22, 163, 74] :
            photo.aiVerdict === 'warning' ? [202, 138, 4] : [220, 38, 38]
          doc.setTextColor(...verdictColor)
          doc.text(`AI Verdict: ${(photo.aiVerdict || 'ok').toUpperCase()}`, margin + 3, y)
          doc.setTextColor(0, 0, 0)
          y += 5

          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          const analysisLines = doc.splitTextToSize(photo.aiAnalysis, contentWidth - 10)
          for (const line of analysisLines) {
            addPageIfNeeded(4)
            doc.text(line, margin + 6, y)
            y += 4
          }
          y += 3
        } else if (imgData) {
          // Photo without AI analysis - just add spacing
          y += 3
        }
      }
    }

    // Step notes
    if (step.notes) {
      addPageIfNeeded(10)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(80, 80, 80)
      const noteLines = doc.splitTextToSize(`Notes: ${step.notes}`, contentWidth - 5)
      for (const line of noteLines) {
        addPageIfNeeded(4)
        doc.text(line, margin + 3, y)
        y += 4.5
      }
      doc.setTextColor(0, 0, 0)
    }
    y += 3
  }

  // General notes
  if (inspection.notes) {
    addPageIfNeeded(20)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('General Notes', margin, y)
    y += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const noteLines = doc.splitTextToSize(inspection.notes, contentWidth)
    for (const line of noteLines) {
      addPageIfNeeded(5)
      doc.text(line, margin, y)
      y += 5
    }
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`AutoVet Inspection Report - Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' })
  }

  return doc
}
