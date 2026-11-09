import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/Sheet'
import { SidebarContent } from '@/components/layout/Sidebar'
import { useUIStore } from '@/store/useUIStore'

export function MobileSidebar() {
  const open = useUIStore((state) => state.mobileNavOpen)
  const setOpen = useUIStore((state) => state.setMobileNavOpen)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        showClose={false}
        className="w-[300px] max-w-[86vw] border-r border-line-strong bg-canvas/95 backdrop-blur-xl"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          TraderCasa journal navigation
        </SheetDescription>
        <SidebarContent
          collapsed={false}
          mobile
          onNavigate={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
