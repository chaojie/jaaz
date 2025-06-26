import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCanvas } from '@/contexts/canvas'
import { cn } from '@/lib/utils'
import { Minus, Plus, MessageSquarePlus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { eventBus, TCanvasAddImagesToChatEvent } from '@/lib/event'
import { exportToCanvas } from "@excalidraw/excalidraw";

const CanvasViewMenu = () => {
  const { t } = useTranslation()
  const { excalidrawAPI } = useCanvas()
  const [currentZoom, setCurrentZoom] = useState<number>(100)

  const handleAddToChat = async () => {
    if (!excalidrawAPI) {
      return
    }
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || !elements.length) {
      return
    }
    const canvas = await exportToCanvas({
      elements:elements.filter((element) => !element.isDeleted ),
      appState: {
        exportWithDarkMode: false,
      },
      files: excalidrawAPI.getFiles()
    });
    const ctx = canvas.getContext("2d")
    /*ctx.font = "30px Virgil";
    ctx.strokeText("My custom text", 50, 60);*/
    var img:TCanvasAddImagesToChatEvent = [
      {
        fileId: '1',
        base64: canvas.toDataURL(),
        width: 350,
        height: 350,
      },
    ]

    eventBus.emit('Canvas::AddImagesToChat', img)
    
    excalidrawAPI?.updateScene({
      appState: { selectedElementIds: {} },
    })
  }

  const handleZoomChange = (zoom: number) => {
    excalidrawAPI?.updateScene({
      appState: {
        zoom: {
          // @ts-ignore
          value: zoom / 100,
        },
      },
    })
  }

  const handleZoomFit = () => {
    excalidrawAPI?.scrollToContent(undefined, {
      fitToContent: true,
      animate: true,
    })
  }

  excalidrawAPI?.onChange((_elements, appState, _files) => {
    const zoom = (appState.zoom.value * 100).toFixed(0)
    setCurrentZoom(Number(zoom))
  })

  return (
    <div
      className={cn(
        'absolute top-2 right-2 flex items-center gap-1 rounded-lg p-1 z-20 transition-all duration-300 select-none text-primary/70',
        'hover:bg-primary-foreground/55 hover:backdrop-blur-lg hover:text-primary'
      )}
    >
    <Button
        className="bg-primary-foreground"
      variant="ghost"
      onClick={() => handleAddToChat()}
    >
      <MessageSquarePlus />
      <label>{t('canvas:popbar.addToChat')}</label>
    </Button>
      <Button
        className="size-8"
        variant="ghost"
        size="icon"
        onClick={() => handleZoomChange(currentZoom - 10)}
      >
        <Minus />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="text-sm w-10 text-center">{currentZoom}%</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {[10, 50, 100, 150, 200].map((zoom) => (
            <DropdownMenuItem key={zoom} onClick={() => handleZoomChange(zoom)}>
              {zoom}%
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleZoomFit}>
            {t('canvas:tool.zoomFit')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        className="size-8"
        variant="ghost"
        size="icon"
        onClick={() => handleZoomChange(currentZoom + 10)}
      >
        <Plus />
      </Button>
    </div>
  )
}

export default CanvasViewMenu
