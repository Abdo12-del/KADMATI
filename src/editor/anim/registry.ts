/**
 * Shared DOM registry for animation wrapper nodes.
 * CanvasStage registers the per-element wrappers (design space) so the
 * AnimationDock can build an engine without reaching into React trees, and
 * PresentMode uses its own local registry instead.
 */
const registry = new Map<string, HTMLDivElement>()

export const animRegistry = {
  register(id: string, node: HTMLDivElement | null): void {
    if (node) registry.set(id, node)
    else registry.delete(id)
  },
  all(): Record<string, HTMLElement> {
    const out: Record<string, HTMLElement> = {}
    registry.forEach((node, id) => {
      out[id] = node
    })
    return out
  },
}
