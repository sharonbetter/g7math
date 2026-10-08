import Foundation
import PDFKit
import Vision
import AppKit

// Usage: ocr <pdf> <outDir> [startPage] [endPage] [concurrency] [scale]
// Pages are 1-based inclusive. Writes <outDir>/page_%04d.txt

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: ocr <pdf> <outDir> [startPage] [endPage] [concurrency] [scale]\n".data(using: .utf8)!)
    exit(2)
}
let pdfPath = args[1]
let outDir = args[2]
let startPage = args.count > 3 ? (Int(args[3]) ?? 1) : 1
let concurrency = args.count > 5 ? (Int(args[5]) ?? 4) : 4
let scale = args.count > 6 ? (Double(args[6]) ?? 2.0) : 2.0

let fm = FileManager.default
try? fm.createDirectory(atPath: outDir, withIntermediateDirectories: true)

guard let probe = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else {
    FileHandle.standardError.write("cannot open pdf\n".data(using: .utf8)!)
    exit(1)
}
let total = probe.pageCount
let endPage = args.count > 4 ? (Int(args[4]) ?? total) : total
let first = max(1, startPage)
let last = min(total, endPage)

func ocrPage(_ pageNumber: Int, doc: PDFDocument) -> String {
    guard let page = doc.page(at: pageNumber - 1) else { return "" }
    let bounds = page.bounds(for: .mediaBox)
    let width = Int(bounds.width * scale)
    let height = Int(bounds.height * scale)
    guard width > 0, height > 0,
          let rep = NSBitmapImageRep(bitmapDataPlanes: nil,
                                     pixelsWide: width, pixelsHigh: height,
                                     bitsPerSample: 8, samplesPerPixel: 4,
                                     hasAlpha: true, isPlanar: false,
                                     colorSpaceName: .deviceRGB,
                                     bytesPerRow: 0, bitsPerPixel: 0) else { return "" }
    rep.size = NSSize(width: width, height: height)
    guard let ctx = NSGraphicsContext(bitmapImageRep: rep) else { return "" }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = ctx
    ctx.cgContext.setFillColor(NSColor.white.cgColor)
    ctx.cgContext.fill(CGRect(x: 0, y: 0, width: width, height: height))
    ctx.cgContext.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: ctx.cgContext)
    NSGraphicsContext.restoreGraphicsState()

    guard let cgImage = rep.cgImage else { return "" }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["zh-Hans", "en-US"]
    request.usesLanguageCorrection = true
    if #available(macOS 13.0, *) { request.revision = VNRecognizeTextRequestRevision3 }

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    do { try handler.perform([request]) } catch { return "" }
    guard let observations = request.results else { return "" }

    // Sort into reading order: group by vertical bands (lines), then left-to-right.
    struct Line { let box: CGRect; let text: String; let conf: Float }
    var lines: [Line] = []
    for obs in observations {
        guard let top = obs.topCandidates(1).first else { continue }
        lines.append(Line(box: obs.boundingBox, text: top.string, conf: top.confidence))
    }
    lines.sort { a, b in
        let ay = a.box.midY, by = b.box.midY
        if abs(ay - by) > (min(a.box.height, b.box.height) * 0.6) { return ay > by }
        return a.box.minX < b.box.minX
    }
    return lines.map { $0.text }.joined(separator: "\n")
}

let lock = NSLock()
var done = 0
let t0 = Date()

DispatchQueue.concurrentPerform(iterations: last - first + 1) { idx in
    let pageNumber = first + idx
    guard let doc = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else { return }
    let text = ocrPage(pageNumber, doc: doc)
    let outPath = String(format: "%@/page_%04d.txt", outDir, pageNumber)
    try? text.write(toFile: outPath, atomically: true, encoding: .utf8)
    lock.lock()
    done += 1
    if done % 10 == 0 || done == last - first + 1 {
        let el = Date().timeIntervalSince(t0)
        FileHandle.standardError.write("\(done)/\(last - first + 1) pages  \(String(format: "%.1f", el))s\n".data(using: .utf8)!)
    }
    lock.unlock()
}
print("DONE \(first)-\(last) of \(total) in \(String(format: "%.1f", Date().timeIntervalSince(t0)))s")
