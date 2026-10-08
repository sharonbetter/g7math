import Foundation
import PDFKit
import AppKit

// Usage: render <pdf> <outDir> <startPage> <endPage> [scale]
// Renders each page to <outDir>/page_%04d.png (1-based, inclusive).

let args = CommandLine.arguments
guard args.count >= 5 else {
    FileHandle.standardError.write("usage: render <pdf> <outDir> <startPage> <endPage> [scale]\n".data(using: .utf8)!)
    exit(2)
}
let pdfPath = args[1]
let outDir = args[2]
let startPage = Int(args[3]) ?? 1
let endPage = Int(args[4]) ?? 1
let scale = args.count > 5 ? (Double(args[5]) ?? 1.5) : 1.5

try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
guard let doc = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else {
    FileHandle.standardError.write("cannot open pdf\n".data(using: .utf8)!)
    exit(1)
}
let last = min(endPage, doc.pageCount)
for n in startPage...max(startPage, last) {
    guard let page = doc.page(at: n - 1) else { continue }
    let b = page.bounds(for: .mediaBox)
    let w = Int(b.width * scale), h = Int(b.height * scale)
    guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h,
                                     bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                     isPlanar: false, colorSpaceName: .deviceRGB,
                                     bytesPerRow: 0, bitsPerPixel: 0),
          let ctx = NSGraphicsContext(bitmapImageRep: rep) else { continue }
    rep.size = NSSize(width: w, height: h)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = ctx
    ctx.cgContext.setFillColor(NSColor.white.cgColor)
    ctx.cgContext.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.cgContext.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: ctx.cgContext)
    NSGraphicsContext.restoreGraphicsState()
    if let data = rep.representation(using: .png, properties: [:]) {
        try? data.write(to: URL(fileURLWithPath: String(format: "%@/page_%04d.png", outDir, n)))
    }
    if n % 10 == 0 { FileHandle.standardError.write("rendered \(n)\n".data(using: .utf8)!) }
}
print("RENDERED \(startPage)-\(last)")
