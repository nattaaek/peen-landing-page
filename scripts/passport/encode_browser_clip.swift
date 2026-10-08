import Foundation
import AVFoundation
import AppKit
// Encodes actual browser screenshot frames. No mockup or synthetic video pixels.
let args = CommandLine.arguments
let folder = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])
let files = try FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys:nil).filter{$0.pathExtension == "jpg"}.sorted{$0.lastPathComponent < $1.lastPathComponent}
let width=1280, height=720, fps:Int32=5
let writer=try AVAssetWriter(outputURL:output,fileType:.mp4)
let input=AVAssetWriterInput(mediaType:.video,outputSettings:[AVVideoCodecKey:AVVideoCodecType.h264,AVVideoWidthKey:width,AVVideoHeightKey:height,AVVideoCompressionPropertiesKey:[AVVideoAverageBitRateKey:1800000]])
let adaptor=AVAssetWriterInputPixelBufferAdaptor(assetWriterInput:input,sourcePixelBufferAttributes:[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32ARGB,kCVPixelBufferWidthKey as String:width,kCVPixelBufferHeightKey as String:height])
writer.add(input); writer.startWriting(); writer.startSession(atSourceTime:.zero)
for (i,file) in files.enumerated(){
 while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval:0.01) }
 let image=NSImage(contentsOf:file)!; var rect=NSRect(origin:.zero,size:image.size); let cg=image.cgImage(forProposedRect:&rect,context:nil,hints:nil)!
 var pixel:CVPixelBuffer?; CVPixelBufferPoolCreatePixelBuffer(nil,adaptor.pixelBufferPool!,&pixel)
 let buffer=pixel!; CVPixelBufferLockBaseAddress(buffer,[])
 let context=CGContext(data:CVPixelBufferGetBaseAddress(buffer),width:width,height:height,bitsPerComponent:8,bytesPerRow:CVPixelBufferGetBytesPerRow(buffer),space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.noneSkipFirst.rawValue)!
 context.setFillColor(NSColor.white.cgColor);context.fill(CGRect(x:0,y:0,width:width,height:height))
 let ratio=min(CGFloat(width)/CGFloat(cg.width),CGFloat(height)/CGFloat(cg.height));let w=CGFloat(cg.width)*ratio,h=CGFloat(cg.height)*ratio
 context.draw(cg,in:CGRect(x:(CGFloat(width)-w)/2,y:(CGFloat(height)-h)/2,width:w,height:h));CVPixelBufferUnlockBaseAddress(buffer,[])
 guard adaptor.append(buffer,withPresentationTime:CMTime(value:Int64(i),timescale:fps)) else { fatalError("Frame append failed") }
}
input.markAsFinished();let semaphore=DispatchSemaphore(value:0);writer.finishWriting{semaphore.signal()};semaphore.wait()
guard writer.status == .completed else { fatalError("Video encoding failed: \(String(describing:writer.error))") }
print("\(files.count) actual browser frames; \(Double(files.count)/Double(fps)) seconds; \(try FileManager.default.attributesOfItem(atPath:output.path)[.size]!) bytes")
