import { createAsset, createImage, createPresentation, createShape, createText, createVideo } from '../../src/document/factory'
import { exportOpenSlideProject } from '../../src/services/openSlideProject'
export { importAurovaFile } from '../../src/services/importAurovaProject'

export async function createOpenSlideFixture() {
  const doc = createPresentation({ title: 'Aurova bridge fixture' })
  const slide = doc.slides[0]
  const image = createAsset({
    name: 'pixel.png',
    mime: 'image/png',
    kind: 'image',
    src: 'data:image/png;base64,AQID',
    w: 1,
    h: 1,
    bytes: 3,
  })
  doc.assets[image.id] = image
  const title = createText(doc.theme, { role: 'title', text: 'مرحبا Open Slide', x: 80, y: 60, w: 780, h: 110 })
  title.content = '<p onclick="alert(1)"><strong>مرحبا Open Slide</strong><script>alert(2)</script></p>'
  const shape = createShape(doc.theme, {
    shape: 'star',
    x: 900,
    y: 90,
    w: 160,
    h: 160,
    fill: { type: 'gradient', kind: 'linear', angle: 45, stops: [{ pos: 0, color: '#3e7cb1' }, { pos: 100, color: '#e8734a' }] },
  })
  const photo = createImage({ assetId: image.id, x: 120, y: 250, w: 240, h: 160, mask: { shape: 'circle', inset: 0 } })
  const video = createVideo({ src: 'data:video/webm;base64,AQIDBA==', x: 420, y: 250, w: 320, h: 180 })
  slide.elements = [title, shape, photo, video]
  slide.notes = 'ملاحظات المتحدث'
  doc.metadata.tags = ['bridge-test']
  return exportOpenSlideProject(doc)
}
