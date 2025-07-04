import { saveCanvas } from '@/api/canvas'
import { useCanvas } from '@/contexts/canvas'
import useDebounce from '@/hooks/use-debounce'
import { useTheme } from '@/hooks/use-theme'
import { eventBus } from '@/lib/event'
import * as ISocket from '@/types/socket'
import { CanvasData } from '@/types/types'
import { Excalidraw, exportToCanvas } from '@excalidraw/excalidraw'
import {
  ExcalidrawImageElement,
  OrderedExcalidrawElement,
  Theme,
} from '@excalidraw/excalidraw/element/types'
import '@excalidraw/excalidraw/index.css'
import {
  AppState,
  BinaryFileData,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import '@/assets/style/canvas.css'

type LastImagePosition = {
  x: number
  y: number
  width: number
  height: number
  col: number // col index
}

type CanvasExcaliProps = {
  canvasId: string
  initialData?: ExcalidrawInitialDataState
}

const CanvasExcali: React.FC<CanvasExcaliProps> = ({
  canvasId,
  initialData,
}) => {
  const { excalidrawAPI, setExcalidrawAPI } = useCanvas()

  const { i18n } = useTranslation()

  const handleChange = useDebounce(
    async (
      elements: Readonly<OrderedExcalidrawElement[]>,
      appState: AppState,
      files: BinaryFiles
    ) => {
      if (elements.length === 0 || !appState) {
        return
      }

      const data: CanvasData = {
        elements:elements.filter((element) => !element.isDeleted ),
        appState: {
          ...appState,
          collaborators: undefined!,
        },
        files,
      }
      const canvas = await exportToCanvas(data)

      let thumbnail = canvas.toDataURL()

      saveCanvas(canvasId, { data, thumbnail })
    },
    1000
  )

  const { theme } = useTheme()

  const addImageToExcalidraw = useCallback(
    async (imageElement: ExcalidrawImageElement, file: BinaryFileData) => {
      if (!excalidrawAPI) return

      //excalidrawAPI.resetScene()

      excalidrawAPI.addFiles([file])
      
      excalidrawAPI.updateScene({
        elements: [imageElement],
      })
    },
    [excalidrawAPI]
  )

  const handleImageGenerated = useCallback(
    (imageData: ISocket.SessionImageGeneratedEvent) => {
      console.log('👇image_generated', imageData)
      if (imageData.canvas_id !== canvasId) {
        return
      }

      addImageToExcalidraw(imageData.element, imageData.file)
    },
    [addImageToExcalidraw]
  )

  useEffect(() => {
    eventBus.on('Socket::Session::ImageGenerated', handleImageGenerated)
    return () =>
      eventBus.off('Socket::Session::ImageGenerated', handleImageGenerated)
  }, [handleImageGenerated])

  return (
    <Excalidraw
      theme={theme as Theme}
      langCode={i18n.language}
      excalidrawAPI={(api) => {
        setExcalidrawAPI(api)
      }}
      onChange={handleChange}
      initialData={() => {
        const data = initialData
        console.log('👇initialData', data)
        if (data?.appState) {
          data.appState = {
            ...data.appState,
            collaborators: undefined!,
          }
        }
        return data || null
      }}
    />
  )
}
export default CanvasExcali
