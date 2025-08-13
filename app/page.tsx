"use client"
import TopNav from "@/components/top-nav"
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"

interface UploadedFile {
  file: File
  url: string
  id: string
}

interface MusicTrack {
  id: string
  name: string
  url: string
  displayName: string
  duration: string
}

const predefinedTracks: MusicTrack[] = [
  {
    id: "intergallactic_janet",
    name: "intergallactic_janet.mp3",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/intergallactic_janet-Y6LXYEWgV9z8aqxE8i79uVVjUV2DPZ.mp3",
    displayName: "Intergalactic Janet",
    duration: "3:24",
  },
  {
    id: "daisies",
    name: "daisies.mp3",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/daisies-R6Kd5aD3csZbxX28zHxrBdwdVdpNSu.mp3",
    displayName: "Daisies",
    duration: "2:47",
  },
  {
    id: "letdown",
    name: "letdown.mp3",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/letdown-6pMehsrxesdu89DaNlq0Vo7CCZDLoz.mp3",
    displayName: "Letdown",
    duration: "4:12",
  },
  {
    id: "punkrocker",
    name: "punkrocker.mp3",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/punkrocker-1S443dzUTXjMzkf8TDOtvBsQGMgaiH.mp3",
    displayName: "Punk Rocker",
    duration: "3:08",
  },
]

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const demoFileInputRef = useRef<HTMLInputElement>(null)
  const musicFileInputRef = useRef<HTMLInputElement>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [demoVideos, setDemoVideos] = useState<UploadedFile[]>([])
  const [customMusicFiles, setCustomMusicFiles] = useState<UploadedFile[]>([])
  const [currentTab, setCurrentTab] = useState<"backgrounds" | "text" | "demo" | "music" | "export">("backgrounds")
  const [textContent, setTextContent] = useState("")
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0)
  const [textPosition, setTextPosition] = useState<"top" | "middle" | "bottom">("middle")
  const [textSize, setTextSize] = useState<"small" | "medium" | "large" | "extra-large">("medium")
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [exportPercent, setExportPercent] = useState<number>(0)

  const TARGET_WIDTH = 1080
  const TARGET_HEIGHT = 1920
  const TARGET_FPS = 30

  async function ensureFfmpegLoaded() {
    if (ffmpegRef.current) return ffmpegRef.current
    const ffmpeg = new FFmpeg()
    // Optional: logs could be wired to UI
    // ffmpeg.on("log", ({ message }) => console.log(message))
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    })
    ffmpegRef.current = ffmpeg
    return ffmpeg
  }

  function getCanvasFont(): string {
    switch (textSize) {
      case "small":
        return "700 40px Arial, Helvetica, sans-serif"
      case "large":
        return "700 72px Arial, Helvetica, sans-serif"
      case "extra-large":
        return "800 96px Arial, Helvetica, sans-serif"
      default:
        return "700 56px Arial, Helvetica, sans-serif"
    }
  }

  function getStrokePx(): number {
    switch (textSize) {
      case "small":
        return 6
      case "large":
        return 8
      case "extra-large":
        return 10
      default:
        return 7
    }
  }

  function wrapTextToLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/)
    const lines: string[] = []
    let current = ""
    for (const word of words) {
      const test = current ? current + " " + word : word
      const w = ctx.measureText(test).width
      if (w > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
    return lines
  }

  async function renderOverlayPng(text: string): Promise<Uint8Array> {
    const canvas = document.createElement("canvas")
    canvas.width = TARGET_WIDTH
    canvas.height = TARGET_HEIGHT
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)
    ctx.font = getCanvasFont()
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    const maxTextWidth = Math.floor(TARGET_WIDTH * 0.8)
    const lines = wrapTextToLines(ctx, text, maxTextWidth)
    const fontSizeMatch = ctx.font.match(/(\d+)px/)
    const fontPx = fontSizeMatch ? fontSizeMatch[1] : "56"
    const lineHeight = parseInt(fontPx) * 1.25
    let centerY = TARGET_HEIGHT / 2
    if (textPosition === "top") centerY = 200
    if (textPosition === "bottom") centerY = TARGET_HEIGHT - 200
    const totalHeight = lines.length * lineHeight
    const startY = centerY - totalHeight / 2
    ctx.lineJoin = "round"
    ctx.lineWidth = getStrokePx()
    ctx.strokeStyle = "black"
    ctx.fillStyle = "white"
    lines.forEach((line, idx) => {
      const y = startY + idx * lineHeight
      ctx.strokeText(line, TARGET_WIDTH / 2, y)
      ctx.fillText(line, TARGET_WIDTH / 2, y)
    })
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), "image/png"))
    const buf = new Uint8Array(await blob.arrayBuffer())
    return buf
  }

  async function resolveSelectedMusicBytes(): Promise<{ bytes: Uint8Array; ext: string } | null> {
    if (!selectedTrack) return null
    const predefined = predefinedTracks.find((t) => t.id === selectedTrack)
    if (predefined) {
      const res = await fetch(predefined.url)
      const ab = await res.arrayBuffer()
      return { bytes: new Uint8Array(ab), ext: "mp3" }
    }
    const custom = customMusicFiles.find((m) => m.id === selectedTrack)
    if (custom) {
      const bytes = await fetchFile(custom.file)
      const ext = custom.file.name.split(".").pop() || "mp3"
      return { bytes: bytes as Uint8Array, ext }
    }
    return null
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleDemoFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFile: UploadedFile = {
      file: files[0], // Only take the first file
      url: URL.createObjectURL(files[0]),
      id: Math.random().toString(36).substr(2, 9),
    }

    // Clean up existing demo video URLs
    demoVideos.forEach((video) => URL.revokeObjectURL(video.url))

    setDemoVideos([newFile]) // Replace with single video
  }

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const removeDemoFile = (id: string) => {
    setDemoVideos((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const goToPreviousBackground = () => {
    setCurrentBackgroundIndex((prev) => (prev > 0 ? prev - 1 : uploadedFiles.length - 1))
  }

  const goToNextBackground = () => {
    setCurrentBackgroundIndex((prev) => (prev < uploadedFiles.length - 1 ? prev + 1 : 0))
  }

  const getTextPositionClasses = () => {
    switch (textPosition) {
      case "top":
        return "items-start pt-20"
      case "bottom":
        return "items-end pb-20"
      default:
        return "items-center"
    }
  }

  const getTextSizeClasses = () => {
    switch (textSize) {
      case "small":
        return "text-xs"
      case "large":
        return "text-lg"
      case "extra-large":
        return "text-2xl"
      default:
        return "text-sm"
    }
  }

  const getStrokeWidth = () => {
    switch (textSize) {
      case "small":
        return "2px"
      case "large":
        return "3px"
      case "extra-large":
        return "4px"
      default:
        return "2.5px"
    }
  }

  const handleTrackSelect = (trackId: string) => {
    setSelectedTrack(trackId)
  }

  const handlePlayPause = (trackId: string, audioElement: HTMLAudioElement) => {
    if (currentlyPlaying === trackId) {
      audioElement.pause()
      setCurrentlyPlaying(null)
    } else {
      // Pause any currently playing track
      const allAudio = document.querySelectorAll("audio")
      allAudio.forEach((audio) => audio.pause())

      audioElement.play()
      setCurrentlyPlaying(trackId)
    }
  }

  const handleMusicFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }))

    setCustomMusicFiles((prev) => [...prev, ...newFiles])
  }

  const removeCustomMusicFile = (id: string) => {
    setCustomMusicFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const handleExport = async () => {
    if (uploadedFiles.length === 0) return
    if (demoVideos.length === 0) return
    setIsExporting(true)
    setExportPercent(0)
    setExportMessage("Preparing encoder...")
    try {
      const ffmpeg = await ensureFfmpegLoaded()
      const music = await resolveSelectedMusicBytes()
      const overlayPng = textContent ? await renderOverlayPng(textContent) : null

      const videoBackgrounds = uploadedFiles.filter((f) => f.file.type.startsWith("video/"))
      const skipped = uploadedFiles.length - videoBackgrounds.length
      if (skipped > 0) {
        console.warn(`Skipping ${skipped} non-video background(s).`)
      }

      const total = videoBackgrounds.length
      let index = 0
      let currentIndexForProgress = 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ffmpeg.on("progress", (p: any) => {
        const ratio = typeof p?.progress === "number" ? p.progress : 0
        if (total > 0) {
          setExportPercent(Math.min(99, Math.floor(((currentIndexForProgress - 1) + ratio) / total * 100)))
        }
      })
      for (const bg of videoBackgrounds) {
        index += 1
        currentIndexForProgress = index
        setExportMessage(`Processing ${index}/${total}...`)
        setExportPercent(Math.floor(((index - 1) / total) * 100))

        // Clean per-iteration files if they exist
        const cleanup = async () => {
          for (const f of ["bg.mp4", "demo.mp4", music ? `music.${music.ext}` : null, overlayPng ? "overlay.png" : null, "out.mp4"]) {
            if (!f) continue
            try {
              await ffmpeg.deleteFile(f)
            } catch {}
          }
        }
        await cleanup()

        await ffmpeg.writeFile("bg.mp4", (await fetchFile(bg.file)) as Uint8Array)
        await ffmpeg.writeFile("demo.mp4", (await fetchFile(demoVideos[0].file)) as Uint8Array)
        if (music) {
          // Clone to avoid reusing a detached buffer between iterations
          const musicClone = new Uint8Array(music.bytes)
          await ffmpeg.writeFile(`music.${music.ext}`, musicClone)
        }
        if (overlayPng) {
          const overlayClone = new Uint8Array(overlayPng)
          await ffmpeg.writeFile("overlay.png", overlayClone)
        }

        // Per-clip progress handled by global listener above

        const inputs: string[] = ["-i", "bg.mp4", "-i", "demo.mp4"]
        if (music) inputs.push("-stream_loop", "-1", "-i", `music.${music.ext}`)
        if (overlayPng) inputs.push("-i", "overlay.png")

        const overlayIndex = overlayPng ? (music ? 3 : 2) : null
        const yExpr = textPosition === "top" ? "120" : textPosition === "bottom" ? "main_h-overlay_h-120" : "(main_h-overlay_h)/2"
        const overlayClause = overlayIndex !== null
          ? `[vcat][${overlayIndex}:v]overlay=(main_w-overlay_w)/2:${yExpr}:format=auto,format=yuv420p[vout]`
          : `[vcat]format=yuv420p[vout]`
        const filter = `
          [0:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=decrease,pad=${TARGET_WIDTH}:${TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${TARGET_FPS}[v0];
          [1:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=decrease,pad=${TARGET_WIDTH}:${TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${TARGET_FPS}[v1];
          [v0][v1]concat=n=2:v=1:a=0[vcat];
          ${overlayClause}
        `.replace(/\n/g, "")

        const baseArgs = [
          ...inputs,
          "-filter_complex",
          filter,
          "-map",
          "[vout]",
          ...(music ? ["-map", "2:a"] : []),
          ...(music ? ["-shortest"] : []),
          "-pix_fmt",
          "yuv420p",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          ...(music ? ["-c:a", "aac", "-b:a", "192k"] as const : []),
          "out.mp4",
        ] as string[]

        async function runWithFallback() {
          try {
            await ffmpeg.exec(baseArgs)
          } catch (e) {
            console.warn("libx264 not available, retrying with mpeg4", e)
            const alt = baseArgs.map((a) => a)
            const cvi = alt.indexOf("libx264")
            if (cvi !== -1) alt[cvi] = "mpeg4"
            await ffmpeg.exec(alt)
          }
        }

        await runWithFallback()

        const data = (await ffmpeg.readFile("out.mp4")) as Uint8Array
        const blob = new Blob([data], { type: "video/mp4" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        const baseName = (bg.file.name || `background_${index}`).replace(/\.[^/.]+$/, "")
        a.href = url
        a.download = `${baseName}_export.mp4`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)

        await cleanup()
        setExportPercent(Math.floor((index / total) * 100))
      }

      setExportMessage("Done! Downloads should start automatically.")
      setExportPercent(100)
    } catch (err) {
      console.error(err)
      setExportMessage("Export failed. See console for details.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        uploadedFiles={uploadedFiles}
        demoVideos={demoVideos}
        selectedMusic={selectedTrack}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {currentTab === "backgrounds" && (
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Bulk Import Backgrounds</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {/* Uploaded files */}
              {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} className="relative group">
                  <div className="w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-100">
                    {uploadedFile.file.type.startsWith("video/") ? (
                      <video
                        src={uploadedFile.url}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={uploadedFile.url || "/placeholder.svg"}
                        alt="Uploaded background"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Upload button */}
              <div
                className="w-full aspect-[9/16] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        )}

        {currentTab === "text" && (
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Add Text</h1>
            <div className="flex gap-8 max-w-6xl mx-auto">
              {/* Text input section */}
              <div className="flex-1">
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Enter your text here..."
                  className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg resize-none focus:border-gray-500 focus:outline-none text-gray-900"
                />
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Text Position</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTextPosition("top")}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        textPosition === "top"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Top
                    </button>
                    <button
                      onClick={() => setTextPosition("middle")}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        textPosition === "middle"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Middle
                    </button>
                    <button
                      onClick={() => setTextPosition("bottom")}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        textPosition === "bottom"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Bottom
                    </button>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Text Size</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTextSize("small")}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        textSize === "small"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Small
                    </button>
                    <button
                      onClick={() => setTextSize("medium")}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        textSize === "medium"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setTextSize("large")}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        textSize === "large"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Large
                    </button>
                    <button
                      onClick={() => setTextSize("extra-large")}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        textSize === "extra-large"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Extra Large
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview pane */}
              <div className="w-64">
                <div className="w-full aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden relative">
                  {/* Background preview */}
                  {uploadedFiles.length > 0 &&
                    uploadedFiles[currentBackgroundIndex] &&
                    (uploadedFiles[currentBackgroundIndex].file.type.startsWith("video/") ? (
                      <video
                        src={uploadedFiles[currentBackgroundIndex].url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                      />
                    ) : (
                      <img
                        src={uploadedFiles[currentBackgroundIndex].url || "/placeholder.svg"}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                      />
                    ))}

                  {/* Text overlay */}
                  {textContent && (
                    <div className={`absolute inset-0 flex justify-center p-4 ${getTextPositionClasses()}`}>
                      <p
                        className={`text-center leading-tight break-words max-w-[80%] ${getTextSizeClasses()}`}
                        style={{
                          fontFamily: 'Proxima Nova, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontWeight: 600,
                          color: "white",
                          WebkitTextStroke: `${getStrokeWidth()} black`,
                          WebkitTextFillColor: "white",
                          paintOrder: "stroke fill",
                        }}
                      >
                        {textContent}
                      </p>
                    </div>
                  )}

                  {/* Placeholder when no background */}
                  {uploadedFiles.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-500 text-sm">No background selected</p>
                    </div>
                  )}
                </div>

                {uploadedFiles.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button
                      onClick={goToPreviousBackground}
                      className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>

                    <span className="text-sm text-gray-600 font-medium">
                      {currentBackgroundIndex + 1}/{uploadedFiles.length}
                    </span>

                    <button
                      onClick={goToNextBackground}
                      className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === "demo" && (
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Upload Demo Video</h1>

            <div className="flex flex-col items-center justify-center">
              {demoVideos.length === 0 ? (
                <div
                  className="w-64 aspect-[9/16] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => demoFileInputRef.current?.click()}
                >
                  <Plus className="h-12 w-12 text-gray-400" />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-64 aspect-[9/16] rounded-lg overflow-hidden bg-gray-100 mb-4">
                    <video
                      src={demoVideos[0].url}
                      className="w-full h-full object-cover"
                      controls
                      muted
                      preload="metadata"
                    />
                  </div>
                  <button
                    onClick={() => demoFileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Change Video
                  </button>
                </div>
              )}
            </div>

            <input
              ref={demoFileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleDemoFileSelect(e.target.files)}
            />
          </div>
        )}

        {currentTab === "music" && (
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Add Music</h1>
            <div className="max-w-2xl mx-auto">
              <div className="space-y-4">
                {predefinedTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTrack === track.id
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => handleTrackSelect(track.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const audio = document.getElementById(`audio-${track.id}`) as HTMLAudioElement
                            handlePlayPause(track.id, audio)
                          }}
                          className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
                        >
                          {currentlyPlaying === track.id ? "⏸" : "▶"}
                        </button>
                        <div>
                          <h3 className="font-medium text-gray-900">{track.displayName}</h3>
                          <p className="text-sm text-gray-500">{track.duration}</p>
                        </div>
                      </div>
                    </div>
                    <audio
                      id={`audio-${track.id}`}
                      src={track.url}
                      onEnded={() => setCurrentlyPlaying(null)}
                      preload="metadata"
                    />
                  </div>
                ))}

                {customMusicFiles.map((musicFile) => (
                  <div
                    key={musicFile.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTrack === musicFile.id
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => handleTrackSelect(musicFile.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const audio = document.getElementById(`audio-${musicFile.id}`) as HTMLAudioElement
                            handlePlayPause(musicFile.id, audio)
                          }}
                          className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
                        >
                          {currentlyPlaying === musicFile.id ? "⏸" : "▶"}
                        </button>
                        <div>
                          <h3 className="font-medium text-gray-900">{musicFile.file.name}</h3>
                          <p className="text-sm text-gray-500">--:--</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCustomMusicFile(musicFile.id)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <audio
                      id={`audio-${musicFile.id}`}
                      src={musicFile.url}
                      onEnded={() => setCurrentlyPlaying(null)}
                      preload="metadata"
                    />
                  </div>
                ))}

                <div
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => musicFileInputRef.current?.click()}
                >
                  <div className="flex items-center justify-center gap-4">
                    <Plus className="h-8 w-8 text-gray-400" />
                    <div className="text-center">
                      <h3 className="font-medium text-gray-700">Upload Custom Music</h3>
                      <p className="text-sm text-gray-500">Click to browse audio files</p>
                    </div>
                  </div>
                </div>

                <input
                  ref={musicFileInputRef}
                  type="file"
                  multiple
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleMusicFileSelect(e.target.files)}
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === "export" && (
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Export Your Videos</h1>
            <div className="max-w-2xl mx-auto">
              {isExporting ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Exporting Your Videos</h2>
                  <p className="text-gray-600 mb-4">Please wait while we process your videos...</p>
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-gray-900 h-2 rounded-full transition-all"
                      style={{ width: `${exportPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">
                    This may take a few minutes depending on video length and quality.
                  </p>
                  {exportMessage && (
                    <p className="text-xs text-gray-500 mt-1">{exportMessage}</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Summary</h2>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Background Videos:</span>
                        <span className="font-medium">{uploadedFiles.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Demo Video:</span>
                        <span className="font-medium">{demoVideos.length > 0 ? "Added" : "None"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Text Content:</span>
                        <span className="font-medium">{textContent ? "Added" : "None"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Music Track:</span>
                        <span className="font-medium">{selectedTrack ? "Selected" : "None"}</span>
                      </div>
                      <div className="flex justify-between border-t pt-3 mt-3">
                        <span className="font-semibold">Total Videos to Export:</span>
                        <span className="font-semibold">{uploadedFiles.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleExport}
                      className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Export All Videos
                    </button>
                    <p className="text-sm text-gray-500 mt-3">
                      This will create {uploadedFiles.length} video{uploadedFiles.length !== 1 ? "s" : ""} combining
                      your backgrounds, demo video, text, and music.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
